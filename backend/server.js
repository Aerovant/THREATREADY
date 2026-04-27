require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const crypto = require('crypto');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET;

// ── AI MODEL CONFIGURATION ──
const MODEL_EVALUATION = 'claude-sonnet-4-20250514'; // Deep evaluation - accurate scoring
const MODEL_QUESTIONS = 'claude-haiku-4-5-20251001'; // Question generation - fast & cheap

// ═══════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════════════
const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Login required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
  }
};

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '3.0.0' });
});

// ═══════════════════════════════════════════════════════════════
// AUTH: SIGNUP
// ═══════════════════════════════════════════════════════════════
app.post('/api/auth/signup', async (req, res) => {
  console.log('--- SIGNUP REQUEST ---');
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    console.log('Step 1: Checking existing user...');
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Account already exists with this email' });
    }

    console.log('Step 2: Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log('Step 3: Creating user...');
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, name, email, created_at',
      [name || email.split('@')[0], email, hashedPassword]
    );

    console.log('Step 4: Creating free trial...');
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);
    await pool.query(
      'INSERT INTO subscriptions (user_id, plan, status, trial_end, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [result.rows[0].id, 'free_trial', 'active', trialEnd]
    );

    console.log('Step 5: Creating token...');
    const token = jwt.sign({ id: result.rows[0].id, email }, JWT_SECRET, { expiresIn: '30d' });

    console.log('SIGNUP SUCCESS! User:', result.rows[0].email);
    res.status(201).json({ user: result.rows[0], token, trial_ends: trialEnd });
  } catch (e) {
    console.error('SIGNUP FAILED:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// AUTH: LOGIN
// ═══════════════════════════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  console.log('--- LOGIN REQUEST ---');
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT id, name, email, password_hash, user_type FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [result.rows[0].id]);

    const token = jwt.sign({ id: result.rows[0].id, email }, JWT_SECRET, { expiresIn: '30d' });
    console.log('LOGIN SUCCESS! User:', email);

    res.json({
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email,
        user_type: result.rows[0].user_type || 'b2c'
      },
      token
    });

  } catch (e) {
    console.error('LOGIN FAILED:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// AUTH: GET CURRENT USER
// ═══════════════════════════════════════════════════════════════
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    // Ensure HR subscription columns exist (safe migration)
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_subscription_active BOOLEAN DEFAULT false`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_company_name TEXT`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_team_size VARCHAR(20)`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_billing_period VARCHAR(20)`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_subscribed_at TIMESTAMP`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_subscription_end TIMESTAMP`);
    } catch (migErr) { /* columns already exist */ }

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.created_at,
              u.hr_subscription_active, u.hr_company_name, u.hr_team_size,
              u.hr_billing_period, u.hr_subscribed_at, u.hr_subscription_end,
              s.plan, s.status, s.trial_end, s.subscribed_roles,
              s.billing_period, s.end_date
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    // Ensure billing_period column exists (safe migration)
    try {
      await pool.query("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_period VARCHAR(10) DEFAULT 'monthly'");
      await pool.query("ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing_period VARCHAR(10) DEFAULT 'monthly'");
    } catch (migErr) { /* columns already exist */ }

    // Check HR subscription expiry
    const userRow = result.rows[0];
    if (userRow.hr_subscription_active && userRow.hr_subscription_end) {
      const endDate = new Date(userRow.hr_subscription_end);
      if (endDate < new Date()) {
        // Expired — deactivate
        await pool.query(`UPDATE users SET hr_subscription_active = false WHERE id = $1`, [req.user.id]);
        userRow.hr_subscription_active = false;
      }
    }

    const stats = await pool.query('SELECT * FROM user_stats WHERE user_id = $1', [req.user.id]);

    res.json({
      user: userRow,
      stats: stats.rows[0] || { total_xp: 0, streak: 0, completed_scenarios: '[]' }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// RAZORPAY PAYMENT
// ═══════════════════════════════════════════════════════════════
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const calculatePrice = (roleCount, billingPeriod = 'monthly') => {
  const base = roleCount * 1;
  let discounted;
  if (roleCount >= 3) discounted = Math.round(base * 0.7);
  else if (roleCount >= 2) discounted = Math.round(base * 0.82);
  else discounted = base;

  if (billingPeriod === 'yearly') {
    return Math.round(discounted * 12 * 0.8); // additional 20% off for yearly
  }
  return discounted;
};

// Create payment order
app.post('/api/payment/create-order', auth, async (req, res) => {
  console.log('--- PAYMENT ORDER ---');
  try {
    const { roles, billing_period = 'monthly', hr_subscription, company_name, team_size, amount_override } = req.body;

    // ═══════════════════════════════════════════════════════════════
    // HR SUBSCRIPTION FLOW (B2B) — separate from B2C role-based pricing
    // ═══════════════════════════════════════════════════════════════
    if (hr_subscription) {
      if (!company_name || !team_size) {
        return res.status(400).json({ error: 'Company name and team size are required' });
      }
      if (!amount_override || amount_override <= 0) {
        return res.status(400).json({ error: 'Invalid HR subscription amount' });
      }
      const hrAmount = amount_override * 100; // Razorpay uses paise

      const order = await razorpay.orders.create({
        amount: hrAmount,
        currency: 'INR',
        receipt: `hr_${req.user.id}_${Date.now()}`,
        notes: {
          user_id: String(req.user.id),
          hr_subscription: 'true',
          company_name: String(company_name).substring(0, 50),
          team_size: String(team_size),
          billing_period
        }
      });

      console.log('HR Order created:', order.id, 'Amount: INR', amount_override, 'Team:', team_size, 'Period:', billing_period);
      return res.json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        hr_subscription: true,
        company_name,
        team_size,
        billing_period
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // B2C ROLE-BASED FLOW (existing behavior, unchanged)
    // ═══════════════════════════════════════════════════════════════
    if (!roles || !roles.length) {
      return res.status(400).json({ error: 'Select at least one role' });
    }

    const amount = calculatePrice(roles.length, billing_period) * 100; // Razorpay uses paise

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `order_${req.user.id}_${Date.now()}`,
      notes: { user_id: String(req.user.id), roles: roles.join(','), billing_period }
    });

    console.log('Order created:', order.id, 'Amount: INR', amount / 100, 'Period:', billing_period);
    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      roles,
      billing_period
    });
  } catch (e) {
    console.error('Payment order error:', e.message);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify payment
app.post('/api/payment/verify', auth, async (req, res) => {
  console.log('--- PAYMENT VERIFY ---');
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, roles, billing_period = 'monthly', hr_subscription, company_name, team_size } = req.body;

    // ─── Basic input validation ───
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('Missing Razorpay fields:', { razorpay_order_id, razorpay_payment_id, razorpay_signature });
      return res.status(400).json({ error: 'Missing payment fields from gateway' });
    }
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('CRITICAL: RAZORPAY_KEY_SECRET env var missing on server!');
      return res.status(500).json({ error: 'Server misconfigured — contact support' });
    }

    // ═══════════════════════════════════════════════════════════════
    // HR SUBSCRIPTION VERIFICATION (B2B)
    // ═══════════════════════════════════════════════════════════════
    if (hr_subscription) {
      if (!company_name || !team_size) {
        return res.status(400).json({ error: 'Missing HR subscription data' });
      }

      const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      console.log('=== HR PAYMENT VERIFY ===');
      console.log('Company:', company_name, '· Team:', team_size, '· Period:', billing_period);
      console.log('Match?:', expectedSig === razorpay_signature);

      if (expectedSig !== razorpay_signature) {
        console.error('HR signature mismatch for user', req.user.id, 'order', razorpay_order_id);
        return res.status(400).json({
          error: 'Payment verification failed — signature mismatch. Your card was charged; contact support with order id ' + razorpay_order_id
        });
      }

      // Ensure HR subscription columns exist on users table
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_subscription_active BOOLEAN DEFAULT false`).catch(()=>{});
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_company_name TEXT`).catch(()=>{});
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_team_size VARCHAR(20)`).catch(()=>{});
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_billing_period VARCHAR(20)`).catch(()=>{});
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_subscribed_at TIMESTAMP`).catch(()=>{});
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_subscription_end TIMESTAMP`).catch(()=>{});

      // Compute end date based on billing period
      const endDate = new Date();
      if (billing_period === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Update user with HR subscription info
      await pool.query(
        `UPDATE users
         SET hr_subscription_active = true,
             hr_company_name = $1,
             hr_team_size = $2,
             hr_billing_period = $3,
             hr_subscribed_at = NOW(),
             hr_subscription_end = $4
         WHERE id = $5`,
        [company_name, team_size, billing_period, endDate, req.user.id]
      );

      // Log payment record
      try {
        await pool.query(
          `INSERT INTO payments (user_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, roles, billing_period, created_at)
           VALUES ($1, $2, $3, 0, 'INR', 'captured', $4, $5, NOW())`,
          [req.user.id, razorpay_order_id, razorpay_payment_id, JSON.stringify(['hr_subscription_' + team_size]), billing_period]
        );
      } catch (logErr) {
        console.error('Could not log HR payment row (non-fatal):', logErr.message);
      }

      console.log('HR SUBSCRIPTION ACTIVATED for user:', req.user.id, 'until', endDate.toISOString().split('T')[0]);
      return res.json({
        success: true,
        hr_subscription: true,
        company_name,
        team_size,
        billing_period,
        valid_until: endDate
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // B2C ROLE-BASED VERIFICATION (existing behavior, unchanged)
    // ═══════════════════════════════════════════════════════════════
    if (!roles || !roles.length) {
      return res.status(400).json({ error: 'No roles in verification request' });
    }

    // ─── Compute expected signature ───
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // ─── Debug logging (safe — shows prefixes only) ───
    console.log('=== PAYMENT VERIFY DEBUG ===');
    console.log('KEY_ID prefix:', process.env.RAZORPAY_KEY_ID?.substring(0, 12));
    console.log('SECRET length:', process.env.RAZORPAY_KEY_SECRET?.length);
    console.log('Order ID:', razorpay_order_id);
    console.log('Payment ID:', razorpay_payment_id);
    console.log('Received sig:', razorpay_signature?.substring(0, 16) + '...');
    console.log('Computed sig:', expectedSignature.substring(0, 16) + '...');
    console.log('Match?:', expectedSignature === razorpay_signature);

    const amountPaise = calculatePrice(roles.length, billing_period) * 100;

    // ─── Signature mismatch → log the attempt, reject ───
    if (expectedSignature !== razorpay_signature) {
      console.error('Signature mismatch for user', req.user.id, 'order', razorpay_order_id);
      try {
        await pool.query(
          `INSERT INTO payments (user_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, roles, billing_period, created_at)
           VALUES ($1, $2, $3, $4, 'INR', 'verification_failed', $5, $6, NOW())`,
          [req.user.id, razorpay_order_id, razorpay_payment_id, amountPaise, JSON.stringify(roles), billing_period]
        );
      } catch (logErr) {
        console.error('Could not log failed verification:', logErr.message);
      }
      return res.status(400).json({ error: 'Payment verification failed — signature mismatch. Your card was charged; contact support with order id ' + razorpay_order_id });
    }

    // ─── Signature OK. Record the payment FIRST (most critical — never lose a paid payment) ───
    let paymentRowId = null;
    try {
      const payRes = await pool.query(
        `INSERT INTO payments (user_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, payment_method, roles, billing_period, created_at)
         VALUES ($1, $2, $3, $4, 'INR', 'captured', 'razorpay', $5, $6, NOW())
         RETURNING id`,
        [req.user.id, razorpay_order_id, razorpay_payment_id, amountPaise, JSON.stringify(roles), billing_period]
      );
      paymentRowId = payRes.rows[0]?.id;
      console.log('Payment row saved, id:', paymentRowId);
    } catch (dbErr) {
      // DO NOT return error to user — they paid. Log loudly and keep going.
      console.error('⚠️ PAYMENT CAPTURED BUT DB INSERT FAILED:', dbErr.message);
      console.error('User:', req.user.id, 'Order:', razorpay_order_id, 'Payment:', razorpay_payment_id);
      // TODO: alert admin via email/slack so payment can be reconciled manually
    }

    // ─── Compute subscription end date ───
    const endDate = new Date();
    if (billing_period === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // ─── Activate / extend subscription ───
    try {
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan, status, subscribed_roles, payment_id, start_date, end_date, billing_period, created_at)
         VALUES ($1, 'paid', 'active', $2, $3, NOW(), $4, $5, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           plan = 'paid', status = 'active', subscribed_roles = $2,
           payment_id = $3, end_date = $4, billing_period = $5`,
        [req.user.id, JSON.stringify(roles), razorpay_payment_id, endDate, billing_period]
      );
    } catch (subErr) {
      console.error('⚠️ SUBSCRIPTION UPSERT FAILED (payment was captured):', subErr.message);
      return res.status(500).json({
        error: 'Payment received but subscription activation failed. Contact support with payment id ' + razorpay_payment_id,
        payment_id: razorpay_payment_id
      });
    }

    console.log('✅ PAYMENT VERIFIED! Subscription activated for user:', req.user.id, 'Period:', billing_period, 'Until:', endDate.toISOString().split('T')[0]);
    res.json({ success: true, subscribed_roles: roles, valid_until: endDate, billing_period });
  } catch (e) {
    console.error('Payment verify error:', e.message, e.stack);
    res.status(500).json({ error: 'Payment verification error: ' + e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// RESUME & JD UPLOAD
// ═══════════════════════════════════════════════════════════════

// Upload resume
app.post('/api/resume/upload', auth, async (req, res) => {
  console.log('--- RESUME UPLOAD ---');
  try {
    const { resume_text } = req.body;
    if (!resume_text) return res.status(400).json({ error: 'Resume text required' });

    await pool.query(
      'INSERT INTO resume_profiles (user_id, resume_text, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO UPDATE SET resume_text = $2, updated_at = NOW()',
      [req.user.id, resume_text]
    );

    console.log('Resume saved for user:', req.user.id);
    res.json({ message: 'Resume saved successfully' });
  } catch (e) {
    console.error('Resume error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Upload job description
app.post('/api/jd/upload', auth, async (req, res) => {
  console.log('--- JD UPLOAD ---');
  try {
    const { jd_text } = req.body;
    if (!jd_text) return res.status(400).json({ error: 'Job description text required' });

    const result = await pool.query(
      'INSERT INTO company_assessments (user_id, jd_text, created_at) VALUES ($1, $2, NOW()) RETURNING id',
      [req.user.id, jd_text]
    );

    console.log('JD saved, assessment ID:', result.rows[0].id);
    res.json({ assessment_id: result.rows[0].id, message: 'Job description saved' });
  } catch (e) {
    console.error('JD error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// SCENARIO SESSIONS & ANSWERS
// ═══════════════════════════════════════════════════════════════

// Start a scenario session
app.post('/api/session/start', auth, async (req, res) => {
  console.log('--- SESSION START ---');
  try {
    const { scenario_id, interview_mode } = req.body;
    const result = await pool.query(
      'INSERT INTO sessions (user_id, scenario_id, interview_mode, started_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
      [req.user.id, scenario_id, interview_mode || false]
    );
    console.log('Session started:', result.rows[0].id, 'Scenario:', scenario_id);
    res.json({ session_id: result.rows[0].id });
  } catch (e) {
    console.error('Session start error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Submit answer and get AI evaluation
app.post('/api/session/answer', auth, async (req, res) => {
  console.log('--- ANSWER RECEIVED ---');
  try {
    const { session_id, question_id, answer_text, input_mode, scenario_context } = req.body;

    // Save answer to database
    console.log('Step 1: Saving answer...');
    await pool.query(
      `INSERT INTO answers 
   (session_id, question_id, question_number, answer_text, input_mode, submitted_at) 
   VALUES ($1, $2, $3, $4, $5, NOW())`,
      [session_id, question_id, 1, answer_text, input_mode || 'text']
    );

    // Evaluate with Claude AI
    console.log('Step 2: Evaluating with AI...');

    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Get resume context if available
    const resumeResult = await pool.query('SELECT resume_text FROM resume_profiles WHERE user_id = $1', [req.user.id]);
    const resumeCtx = resumeResult.rows[0]?.resume_text || '';

    const msg = await anthropic.messages.create({
      model: MODEL_EVALUATION,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are an expert cybersecurity interview evaluator. Score this answer strictly on technical depth, reasoning quality, and communication clarity.

SCENARIO: ${scenario_context.title} - ${scenario_context.description}
ARCHITECTURE: ${scenario_context.architectures}
CATEGORY: ${scenario_context.category}
QUESTION: ${scenario_context.question}
CANDIDATE ANSWER: ${answer_text}
${resumeCtx ? 'CANDIDATE BACKGROUND: ' + resumeCtx.substring(0, 500) : ''}

Respond ONLY in valid JSON with no markdown:
{"score":7,"category":"${scenario_context.category}","strengths":"1-2 sentences on what was good","weaknesses":"1-2 sentences on gaps","improved_answer":"ideal answer in 3-4 sentences","communication_score":7,"depth_score":7,"follow_up_topic":"area to probe next"}`
      }]
    });

    const evalText = msg.content[0]?.text || '{}';
    const evalResult = JSON.parse(evalText.replace(/```json|```/g, '').trim());

    // Save evaluation to database
    console.log('Step 3: Saving evaluation...');
    await pool.query(
      `INSERT INTO evaluations (session_id, question_id, score, communication_score, depth_score, strengths, weaknesses, improved_answer, follow_up_topic, evaluated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [session_id, question_id, evalResult.score, evalResult.communication_score, evalResult.depth_score,
        evalResult.strengths, evalResult.weaknesses, evalResult.improved_answer, evalResult.follow_up_topic]
    );

    console.log('Answer evaluated! Score:', evalResult.score, '/10');
    res.json(evalResult);
  } catch (e) {
    console.error('Answer error:', e.message);
    // Return fallback score if AI fails
    res.json({
      score: 5,
      category: req.body.scenario_context?.category || 'General',
      strengths: 'Answer received but AI evaluation temporarily unavailable.',
      weaknesses: 'Unable to provide detailed feedback at this time.',
      improved_answer: 'Please retry for full AI evaluation.',
      communication_score: 5,
      depth_score: 5,
      follow_up_topic: ''
    });
  }
});

// Complete session and save scores
app.post('/api/session/complete', auth, async (req, res) => {
  console.log('--- SESSION COMPLETE ---');
  try {
    const { session_id, scenario_id, role_id, overall_score, skills_score, attack_score, badge, earned_xp } = req.body;

    // Update session
    console.log('Step 1: Updating session...');
    await pool.query(
      'UPDATE sessions SET completed_at = NOW(), overall_score = $1, skills_score = $2, attack_score = $3, badge = $4, earned_xp = $5 WHERE id = $6',
      [overall_score, skills_score, attack_score, badge, earned_xp, session_id]
    );

    // Update user stats (XP, streak, completed scenarios)
    console.log('Step 2: Updating user stats...');
    await pool.query(
      `INSERT INTO user_stats (user_id, total_xp, streak, completed_scenarios, last_activity)
       VALUES ($1, $2, 1, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         total_xp = user_stats.total_xp + $2,
         streak = CASE 
           WHEN user_stats.last_activity::date = CURRENT_DATE - 1 THEN user_stats.streak + 1
           WHEN user_stats.last_activity::date = CURRENT_DATE THEN user_stats.streak
           ELSE 1 END,
         completed_scenarios = user_stats.completed_scenarios || $3,
         last_activity = NOW()`,
      [req.user.id, earned_xp, JSON.stringify([scenario_id])]
    );

    // Update skill scores (keep best score)
    console.log('Step 3: Updating skill scores...');
    await pool.query(
      `INSERT INTO skill_scores (user_id, role_id, total_score, attack_thinking_score, percentile, badge_level, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, role_id) DO UPDATE SET
         total_score = GREATEST(skill_scores.total_score, $3),
         attack_thinking_score = GREATEST(skill_scores.attack_thinking_score, $4),
         percentile = $5, badge_level = $6, updated_at = NOW()`,
      [req.user.id, role_id, skills_score, attack_score, Math.min(99, Math.round(overall_score * 10)), badge]
    );

    // Create notification for user
    await createNotification(
      req.user.id,
      'Assessment Complete! 🎉',
      `You scored ${overall_score}/10 and earned the ${badge} badge. +${earned_xp} XP added.`,
      'success'
    );
    // Save to scenario history
    try {
      await pool.query(
        `INSERT INTO user_scenario_history (user_id, scenario_id, role_id, score, completed_at)
         VALUES ($1,$2,$3,$4,NOW())
         ON CONFLICT (user_id, scenario_id) DO UPDATE SET score=$4, completed_at=NOW()`,
        [req.user.id, scenario_id, role_id, overall_score]
      );
    } catch (histErr) { console.log('History save:', histErr.message); }

    console.log('SESSION COMPLETE! XP earned:', earned_xp, 'Badge:', badge);
    res.json({ success: true });
  } catch (e) {
    console.error('Session complete error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// SCORES & STATS
// ═══════════════════════════════════════════════════════════════

// Get user scores
app.get('/api/scores', auth, async (req, res) => {
  try {
    const scores = await pool.query('SELECT * FROM skill_scores WHERE user_id = $1 ORDER BY updated_at DESC', [req.user.id]);
    const stats = await pool.query('SELECT * FROM user_stats WHERE user_id = $1', [req.user.id]);
    const sessions = await pool.query(
      'SELECT scenario_id, overall_score, badge, earned_xp, completed_at FROM sessions WHERE user_id = $1 AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json({
      scores: scores.rows,
      stats: stats.rows[0] || { total_xp: 0, streak: 0, completed_scenarios: '[]' },
      recent_sessions: sessions.rows
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get session history for a specific scenario (for replay/improvement tracking)
app.get('/api/sessions/:scenarioId', auth, async (req, res) => {
  try {
    const sessions = await pool.query(
      'SELECT id, overall_score, skills_score, attack_score, badge, earned_xp, started_at, completed_at FROM sessions WHERE user_id = $1 AND scenario_id = $2 ORDER BY completed_at DESC',
      [req.user.id, req.params.scenarioId]
    );
    res.json({ sessions: sessions.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// DEMO EVALUATION (no auth required)
// ═══════════════════════════════════════════════════════════════
app.post('/api/demo/evaluate', async (req, res) => {
  console.log('--- DEMO EVALUATION ---');
  try {
    const { question, answer } = req.body;
    if (!answer?.trim()) return res.status(400).json({ error: 'Answer required' });

    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const msg = await anthropic.messages.create({
      model: MODEL_EVALUATION,
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Score this cybersecurity answer 1-10. Be strict and honest.\nQuestion: ${question}\nAnswer: ${answer}\nRespond ONLY valid JSON: {"score":7,"feedback":"1 sentence of specific feedback","level":"Beginner or Intermediate or Advanced or Expert"}`
      }]
    });

    const result = JSON.parse(msg.content[0]?.text?.replace(/```json|```/g, '').trim() || '{}');
    console.log('Demo score:', result.score);
    res.json(result);
  } catch (e) {
    console.error('Demo eval error:', e.message);
    res.json({ score: 5, feedback: e.message, level: 'Intermediate' });
  }
});

// ═══════════════════════════════════════════════════════════════
// COOKIE CONSENT
// ═══════════════════════════════════════════════════════════════
app.post('/api/consent/cookie', async (req, res) => {
  const { consent, categories } = req.body;
  console.log('Cookie consent:', consent);
  res.json({ status: 'ok' });
});




// ═══════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════
// EMAIL OTP VERIFICATION
// ═══════════════════════════════════════════════════════════════
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  }
});

// Send OTP
const { Resend } = require('resend');
app.post('/api/auth/send-otp', async (req, res) => {
  console.log('--- SEND OTP ---');
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'UPDATE users SET verify_code = $1, verify_expiry = $2 WHERE email = $3',
      [otp, expiry, email]
    );

    console.log('OTP saved to DB:', otp, 'for:', email);

    const resendClient = new Resend(process.env.RESEND_API_KEY);
    resendClient.emails.send({
      from: 'ThreatReady <noreply@threatready.io>',
      to: email,
      subject: 'ThreatReady — Your Verification Code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0e1a;color:#e8eaf6;padding:32px;border-radius:12px">
          <h2 style="color:#00e5ff;margin-bottom:8px">ThreatReady Verification</h2>
          <p style="color:#8890b0">Use the code below to verify your account. Expires in 15 minutes.</p>
          <div style="background:#1a1f2e;border:1px solid #1e2536;border-radius:10px;padding:24px;text-align:center;margin:24px 0">
            <div style="font-size:40px;font-weight:900;letter-spacing:14px;color:#00e5ff;font-family:monospace">${otp}</div>
          </div>
          <p style="color:#5a6380;font-size:12px">Do not share this code with anyone.</p>
        </div>
      `
    }).then(() => {
      console.log('OTP email sent to:', email);
    }).catch(emailErr => {
      console.error('OTP email failed:', emailErr.message);
    });

    res.json({ message: 'OTP sent successfully' });

  } catch (e) {
    console.error('OTP send error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  console.log('--- VERIFY OTP ---');
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const result = await pool.query(
      'SELECT id, verify_code, verify_expiry FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Check expiry
    if (new Date() > new Date(user.verify_expiry)) {
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    // Check OTP match
    if (user.verify_code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    // Mark as verified
    await pool.query(
      'UPDATE users SET is_verified = true, verify_code = NULL, verify_expiry = NULL WHERE id = $1',
      [user.id]
    );

    // Get full user data
    const fullUser = await pool.query(
      'SELECT id, name, email, user_type FROM users WHERE id = $1',
      [user.id]
    );

    // Generate JWT token for auto-login
    const token = jwt.sign(
      { id: user.id, email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('User verified and auto-logged in:', email);
    res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: fullUser.rows[0]
    });
  } catch (e) {
    console.error('OTP verify error:', e.message);
    res.status(500).json({ error: e.message });
  }
});


// ═══════════════════════════════════════════════════════════════
// GOOGLE OAUTH
// ═══════════════════════════════════════════════════════════════
const axios = require('axios');

// Step 1 — Redirect to Google
app.get('/auth/google', (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}` +
    `&response_type=code` +
    `&scope=openid email profile` +
    `&access_type=offline` +
    `&prompt=select_account`;
  res.redirect(url);
});

// Step 2 — Google callback
app.get('/auth/google/callback', async (req, res) => {
  console.log('--- GOOGLE CALLBACK ---');
  try {
    const { code } = req.query;

    // Exchange code for token
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    // Get user info
    const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
    });

    const { email, name, picture } = userRes.data;
    console.log('Google user:', email);

    // Check if user exists, if not create
    let user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      // Create new user
      user = await pool.query(
        `INSERT INTO users (name, email, password_hash, is_verified, created_at)
         VALUES ($1, $2, $3, true, NOW()) RETURNING *`,
        [name, email, 'google_oauth']
      );

      // Create free trial
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);
      await pool.query(
        'INSERT INTO subscriptions (user_id, plan, status, trial_end, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [user.rows[0].id, 'free_trial', 'active', trialEnd]
      );
    } else {
      user = { rows: [user.rows[0]] };
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.rows[0].id, email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/callback?token=${token}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);

  } catch (e) {
    console.error('Google OAuth error:', e.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?error=google_failed`);
  }
});

// ═══════════════════════════════════════════════════════════════
// GITHUB OAUTH
// ═══════════════════════════════════════════════════════════════

// Step 1 — Redirect to GitHub
app.get('/auth/github', (req, res) => {
  const url = `https://github.com/login/oauth/authorize?` +
    `client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&redirect_uri=${process.env.GITHUB_REDIRECT_URI}` +
    `&scope=user:email` +
    `&allow_signup=true`;
  res.redirect(url);
});

// Step 2 — GitHub callback
app.get('/auth/github/callback', async (req, res) => {
  console.log('--- GITHUB CALLBACK ---');
  try {
    const { code } = req.query;

    // Exchange code for token
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenRes.data.access_token;

    // Get user info
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // Get user email (may be private)
    const emailRes = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const primaryEmail = emailRes.data.find(e => e.primary)?.email || userRes.data.email;
    const name = userRes.data.name || userRes.data.login;

    console.log('GitHub user:', primaryEmail);

    // Check if user exists, if not create
    let user = await pool.query('SELECT * FROM users WHERE email = $1', [primaryEmail]);

    if (user.rows.length === 0) {
      user = await pool.query(
        `INSERT INTO users (name, email, password_hash, is_verified, created_at)
         VALUES ($1, $2, $3, true, NOW()) RETURNING *`,
        [name, primaryEmail, 'github_oauth']
      );

      // Create free trial
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);
      await pool.query(
        'INSERT INTO subscriptions (user_id, plan, status, trial_end, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [user.rows[0].id, 'free_trial', 'active', trialEnd]
      );
    } else {
      user = { rows: [user.rows[0]] };
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.rows[0].id, email: primaryEmail },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/callback?token=${token}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(primaryEmail)}&provider=github`);

  } catch (e) {
    console.error('GitHub OAuth error:', e.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?error=github_failed`);
  }
});

// ═══════════════════════════════════════════════════════════════
// BADGES
// ═══════════════════════════════════════════════════════════════

// Get all badges for user
app.get('/api/badges', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM badges WHERE user_id = $1 ORDER BY earned_at DESC',
      [req.user.id]
    );
    res.json({ badges: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Award badge to user
app.post('/api/badges/award', auth, async (req, res) => {
  console.log('--- AWARD BADGE ---');
  try {
    const { role_id, tier, name } = req.body;

    // Check if badge already exists
    const existing = await pool.query(
      'SELECT id FROM badges WHERE user_id = $1 AND role_id = $2 AND tier = $3',
      [req.user.id, role_id, tier]
    );
    if (existing.rows.length > 0) {
      return res.json({ message: 'Badge already earned', badge: existing.rows[0] });
    }

    const result = await pool.query(
      `INSERT INTO badges (user_id, role_id, tier, name, earned_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [req.user.id, role_id, tier, name]
    );

    console.log('Badge awarded:', name, 'to user:', req.user.id);
    res.json({ badge: result.rows[0], message: 'Badge earned!' });
  } catch (e) {
    console.error('Badge award error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// USER STATS — Full Dashboard Data
// ═══════════════════════════════════════════════════════════════

// Get complete dashboard data
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    // User stats
    const stats = await pool.query(
      'SELECT * FROM user_stats WHERE user_id = $1',
      [req.user.id]
    );

    // Skill scores per role
    const scores = await pool.query(
      'SELECT * FROM skill_scores WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );

    // Recent sessions (last 10)
    const sessions = await pool.query(
      `SELECT s.id, s.scenario_id, s.overall_score, s.skills_score, 
              s.attack_score, s.badge, s.earned_xp, s.completed_at,
              s.role_id
       FROM sessions s
       WHERE s.user_id = $1 AND s.completed_at IS NOT NULL
       ORDER BY s.completed_at DESC LIMIT 10`,
      [req.user.id]
    );

    // Badges
    const badges = await pool.query(
      'SELECT * FROM badges WHERE user_id = $1 ORDER BY earned_at DESC',
      [req.user.id]
    );

    // Score history (weekly trend - last 5 weeks)
    const history = await pool.query(
      `SELECT 
         DATE_TRUNC('week', completed_at) as week,
         role_id,
         ROUND(AVG(overall_score)::numeric, 1) as avg_score
       FROM sessions
       WHERE user_id = $1 AND completed_at IS NOT NULL
       GROUP BY DATE_TRUNC('week', completed_at), role_id
       ORDER BY week DESC LIMIT 20`,
      [req.user.id]
    );

    // Subscription status
    const subscription = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      stats: stats.rows[0] || { total_xp: 0, streak: 0, completed_scenarios: '[]' },
      scores: scores.rows,
      recent_sessions: sessions.rows,
      badges: badges.rows,
      score_history: history.rows,
      subscription: subscription.rows[0] || { plan: 'free_trial', status: 'active' }
    });
  } catch (e) {
    console.error('Dashboard error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Update user stats manually
app.post('/api/stats/update', auth, async (req, res) => {
  try {
    const { total_xp, streak, completed_scenarios } = req.body;
    await pool.query(
      `INSERT INTO user_stats (user_id, total_xp, streak, completed_scenarios, last_activity)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         total_xp = $2,
         streak = $3,
         completed_scenarios = $4,
         last_activity = NOW()`,
      [req.user.id, total_xp, streak, JSON.stringify(completed_scenarios)]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════

// Get global leaderboard
// (Old duplicate /api/leaderboard endpoint removed — see line ~2735 for the active one)

// Get leaderboard by role
app.get('/api/leaderboard/:roleId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.name, ss.total_score, ss.badge_level, ss.percentile, ss.updated_at
       FROM skill_scores ss
       JOIN users u ON u.id = ss.user_id
       WHERE ss.role_id = $1
       ORDER BY ss.total_score DESC
       LIMIT 20`,
      [req.params.roleId]
    );
    res.json({ leaderboard: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// SKILL SCORES — Extra Routes
// ═══════════════════════════════════════════════════════════════

// Get skill score for specific role
app.get('/api/scores/:roleId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM skill_scores WHERE user_id = $1 AND role_id = $2',
      [req.user.id, req.params.roleId]
    );
    res.json({ score: result.rows[0] || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get full session details with all answers and evaluations
app.get('/api/session/:sessionId/details', auth, async (req, res) => {
  try {
    const session = await pool.query(
      'SELECT * FROM sessions WHERE id = $1 AND user_id = $2',
      [req.params.sessionId, req.user.id]
    );
    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const answers = await pool.query(
      'SELECT * FROM answers WHERE session_id = $1 ORDER BY submitted_at',
      [req.params.sessionId]
    );

    const evaluations = await pool.query(
      'SELECT * FROM evaluations WHERE session_id = $1 ORDER BY evaluated_at',
      [req.params.sessionId]
    );

    res.json({
      session: session.rows[0],
      answers: answers.rows,
      evaluations: evaluations.rows
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// RESUME UPLOAD & AI KEY POINTS EXTRACTION
// ═══════════════════════════════════════════════════════════════
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/api/resume/parse', auth, upload.single('resume'), async (req, res) => {
  console.log('--- RESUME PARSE ---');
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    let extractedText = '';

    // Extract text based on file type
    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      extractedText = data.text;
    } else if (
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
    } else {
      // Plain text
      extractedText = file.buffer.toString('utf-8');
    }

    /// Try AI extraction, fall back to raw text if no credits
    let keyPoints = extractedText.substring(0, 1000);
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await anthropic.messages.create({
        model: MODEL_QUESTIONS,
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Extract key points from this cybersecurity resume. Focus on: skills, certifications, years of experience, tools. Format as 5-8 clean lines.\n\nRESUME:\n${extractedText.substring(0, 3000)}\n\nReturn ONLY the summary.`
        }]
      });
      keyPoints = msg.content[0]?.text || keyPoints;
    } catch (aiError) {
      console.log('AI extraction skipped (no credits), using raw text');
      keyPoints = extractedText.substring(0, 1000);
    }
    // Save to database
    await pool.query(
      `INSERT INTO resume_profiles (user_id, resume_text, updated_at) 
       VALUES ($1, $2, NOW()) 
       ON CONFLICT (user_id) DO UPDATE SET resume_text = $2, updated_at = NOW()`,
      [req.user.id, keyPoints]
    );

    console.log('Resume parsed for user:', req.user.id);
    res.json({
      full_text: extractedText,
      key_points: keyPoints,
      message: 'Resume parsed successfully'
    });

  } catch (e) {
    console.error('Resume parse error:', e.message);
    // If AI fails, still return extracted text
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// PROFILE GOALS
// ═══════════════════════════════════════════════════════════════
app.post('/api/profile/goals', auth, async (req, res) => {
  console.log('--- SAVE GOALS ---');
  try {
    const { target_role, experience_level } = req.body;
    await pool.query(
      'UPDATE users SET target_role = $1, experience_level = $2 WHERE id = $3',
      [target_role, experience_level, req.user.id]
    );
    console.log('Goals saved for user:', req.user.id);
    res.json({ success: true, message: 'Goals saved' });
  } catch (e) {
    console.error('Goals save error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Get profile
app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT name, email, target_role, experience_level FROM users WHERE id = $1',
      [req.user.id]
    );
    const resume = await pool.query(
      'SELECT resume_text FROM resume_profiles WHERE user_id = $1',
      [req.user.id]
    );
    res.json({
      user: user.rows[0],
      resume_text: resume.rows[0]?.resume_text || ''
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Text extraction only - no AI
app.post('/api/resume/extract', auth, upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file' });
    let text = '';
    if (file.mimetype === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(file.buffer);
      text = data.text;
    } else if (file.mimetype.includes('word')) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value;
    } else {
      text = file.buffer.toString('utf-8');
    }
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ═══════════════════════════════════════════════════════════════
// PURE AI EVALUATION — No DB required
// ═══════════════════════════════════════════════════════════════
app.post('/api/evaluate', async (req, res) => {
  console.log('--- AI EVALUATE ---');
  try {
    const { question, answer, scenario_context, difficulty, session_id, question_id, resume_context, jd_context } = req.body;
    if (!answer?.trim()) return res.status(400).json({ error: 'Answer required' });

    // ═══════════════════════════════════════════════════════════════
    // GARBAGE ANSWER DETECTION — score 0 without calling AI
    // ═══════════════════════════════════════════════════════════════
    const trimmedAnswer = answer.trim();
    const wordCount = trimmedAnswer.split(/\s+/).filter(w => w.length > 0).length;
    const cleanedAnswer = trimmedAnswer.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    // Rule 1: Too short (less than 3 words)
    const isTooShort = wordCount < 3;

    // Rule 2: Single character or very short junk (a, x, asdf, test, etc.)
    const isJunk = trimmedAnswer.length < 5;

    // Rule 3: Common "I don't know" responses
    // Note: idkPatterns test against cleanedAnswer (lowercase, no punctuation/apostrophes)
    // So "I don't know" becomes "i dont know" — patterns must reflect that
    const idkPatterns = [
      /^(i\s*)?(dont|do not)\s*know/,           // "I don't know", "i dont know", "dont know", "do not know"
      /^(i\s*)?(dont|do not)\s*(understand|get\s*it)/, // "I don't understand", "dont get it"
      /^(i\s*)?(have\s*)?(no\s*idea)/,           // "no idea", "I have no idea"
      /^(idk|dunno|nope|no)$/,                    // single-word
      /^(n\/?a|na|none|nothing|skip|pass|null)$/, // "N/A" → "na" after cleaning
      /^(i\s*am\s*not\s*sure|not\s*sure|unsure|im\s*not\s*sure)$/,
      /^(cant\s*answer|can\s*not\s*answer)/,      // "can't answer"
      /^(dont\s*know)/,                            // starts with "dont know"
      /^sorry/,                                    // "sorry..."
      /^(tbh|honestly)\s*(i\s*)?(dont|do not)/    // "tbh I don't..."
    ];
    const isIDK = idkPatterns.some(p => p.test(cleanedAnswer));

    // Rule 4: Random characters / keyboard mashing (asdf, qwerty, aaaaa)
    const isRandomChars = /^([a-z])\1{2,}$/.test(cleanedAnswer) || // aaaa, bbbb
                          /^(asdf|qwerty|test|abcd|1234|xyz|hello|hi|haha|lol)+$/i.test(cleanedAnswer);

    if (isTooShort || isJunk || isIDK || isRandomChars) {
      console.log('GARBAGE ANSWER DETECTED — auto-scoring 0, generating model answer');
      console.log('  Answer:', trimmedAnswer.substring(0, 50));
      console.log('  Reasons:', { isTooShort, isJunk, isIDK, isRandomChars });

      // Generate a varied follow-up question so we don't loop the same one
      const category = scenario_context?.category || 'Security';
      const fallbackQuestions = [
        `What security controls would you put in place for ${category.toLowerCase()}?`,
        `How would you detect a breach in a ${category.toLowerCase()} environment?`,
        `What are the top 3 risks in ${category.toLowerCase()} and how do you mitigate them?`,
        `Describe an incident response process for a ${category.toLowerCase()} attack.`,
        `What logging and monitoring would you set up for ${category.toLowerCase()}?`,
        `How would you harden a ${category.toLowerCase()} system against common attacks?`,
        `Walk through a threat model for a ${category.toLowerCase()} scenario.`
      ];
      // Pick a random one from the pool
      const randomFollowUp = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];

      // ═══════════════════════════════════════════════════════════════
      // Generate a REAL model answer using cheap Haiku model
      // (so users still learn the correct answer even if they typed garbage)
      // ═══════════════════════════════════════════════════════════════
      let realModelAnswer = 'A proper answer would explain the key concepts, provide technical details relevant to the question, and demonstrate understanding of the scenario.';
      try {
        const Anthropic = require('@anthropic-ai/sdk');
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const modelMsg = await anthropic.messages.create({
          model: MODEL_QUESTIONS, // Use cheap Haiku for model answer generation
          max_tokens: 250,
          messages: [{
            role: 'user',
            content: `You are a cybersecurity expert. Give a concise, correct model answer (3-4 sentences) to this interview question. Be specific and technical.

SCENARIO: ${scenario_context?.title || 'Security scenario'}
CATEGORY: ${category}
QUESTION: ${question}

Respond with ONLY the model answer text — no preamble, no markdown, no quotes.`
          }]
        });
        const generated = modelMsg.content[0]?.text?.trim();
        if (generated && generated.length > 20) {
          realModelAnswer = generated;
          console.log('Real model answer generated:', generated.substring(0, 80) + '...');
        }
      } catch (modelErr) {
        console.error('Model answer generation failed (using fallback):', modelErr.message);
      }

      const zeroResult = {
        score: 0,
        category: category,
        strengths: 'None — no meaningful attempt was made.',
        weaknesses: isIDK
          ? 'Answer indicates no knowledge of the topic. No technical content provided to evaluate.'
          : isTooShort || isJunk
            ? 'Response is too brief to demonstrate any understanding of the topic.'
            : 'Answer appears to be random characters and does not address the question.',
        improved_answer: realModelAnswer,
        communication_score: 0,
        depth_score: 0,
        decision_score: 0,
        iam_score: 0,
        detection_score: 0,
        remediation_score: 0,
        architecture_score: 0,
        communication_skill_score: 0,
        follow_up_topic: randomFollowUp,
        follow_up_category: category,
        auto_scored: true
      };

      // Save zero to DB
      if (session_id && question_id) {
        try {
          await pool.query(
            `INSERT INTO answers (session_id, question_id, question_number, answer_text, input_mode, submitted_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT DO NOTHING`,
            [session_id, String(question_id), 1, answer, 'text']
          );
          await pool.query(
            `INSERT INTO evaluations (session_id, question_id, score, communication_score, depth_score, strengths, weaknesses, improved_answer, follow_up_topic, evaluated_at)
             VALUES ($1, $2, 0, 0, 0, $3, $4, $5, $6, NOW())`,
            [session_id, String(question_id), zeroResult.strengths, zeroResult.weaknesses, zeroResult.improved_answer, zeroResult.follow_up_topic]
          );
        } catch (dbErr) {
          console.error('DB SAVE FAILED (zero score):', dbErr.message);
        }
      }

      return res.json(zeroResult);
    }

    // ═══════════════════════════════════════════════════════════════
    // NORMAL AI EVALUATION (for real attempts)
    // ═══════════════════════════════════════════════════════════════
    const diffRubric = difficulty === "beginner"
      ? "Beginner level. Give credit for partial understanding on the right topic. But: wrong answers, vague answers, or off-topic answers must get 1-3. Only give 4+ if they show actual relevant knowledge."
      : difficulty === "intermediate"
        ? "Intermediate level. Balanced scoring. Credit correct reasoning, penalize technical gaps. Wrong/vague = 1-3."
        : difficulty === "advanced"
          ? "Advanced level. Strict interview-grade standards. Wrong or incomplete = 1-3. Only give 6+ for solid technical answers."
          : "Expert level. Rigorous. Wrong or surface-level = 1-3. Only give 7+ for defensive-reasoning-level answers.";

    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Get resume context if available
    let resumeCtx = '';
    try {
      if (req.user?.id) {
        const resumeResult = await pool.query('SELECT resume_text FROM resume_profiles WHERE user_id = $1', [req.user.id]);
        resumeCtx = resumeResult.rows[0]?.resume_text || '';
      }
    } catch (e) { }

    const msg = await anthropic.messages.create({
      model: MODEL_EVALUATION,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a strict cybersecurity interview evaluator. ${diffRubric}

SCENARIO: ${scenario_context?.title} - ${scenario_context?.description}
DIFFICULTY: ${difficulty?.toUpperCase()}
CATEGORY: ${scenario_context?.category}
QUESTION: ${question}
CANDIDATE ANSWER: ${answer}
${(resume_context || resumeCtx) ? 'CANDIDATE BACKGROUND: ' + (resume_context || resumeCtx).substring(0, 300) : ''}
${jd_context ? 'JOB REQUIREMENTS FROM JD: ' + jd_context.substring(0, 300) : ''}

STRICT SCORING RUBRIC (0-10):
- 0: No answer, blank, single character, random chars (e.g., "a", "asdf", "xyz")
- 1-2: "I don't know" / admits no knowledge / completely off-topic
- 3-4: Attempts the topic but shows major misunderstanding
- 5-6: Partially correct, missing key details
- 7-8: Good answer with minor gaps
- 9-10: Excellent, comprehensive, technically sound

CRITICAL RULES:
- DO NOT give credit for just "being honest about not knowing" — that's a 1-2 at best.
- DO NOT give encouragement points. Score based on technical content only.
- If the answer does not address the specific question asked, max score is 3.
- If answer is very short (<10 words) and lacks substance, max score is 2.

5-SKILL ASSESSMENT (score each 0-10 based on how well the answer demonstrates each skill — use 0 if the skill isn't relevant to the question):
- iam_score: Identity & Access Management knowledge (authentication, authorization, least privilege, IAM policies, SSO, MFA)
- detection_score: Threat detection & monitoring (logging, SIEM, anomaly detection, IDS/IPS, observability)
- remediation_score: Incident response & remediation (containment, recovery, patching, mitigation, root cause analysis)
- architecture_score: Security architecture & design (zero-trust, defense-in-depth, secure design patterns, network segmentation)
- communication_skill_score: Communication clarity (explaining technical concepts, structure, precision of language)

Respond ONLY in valid JSON with no markdown:
{"score":7,"category":"${scenario_context?.category || 'Security'}","strengths":"specific strength based on their answer - or 'None' if no real strengths","weaknesses":"specific gap based on their answer","improved_answer":"ideal answer in 3-4 sentences","communication_score":7,"depth_score":7,"decision_score":7,"iam_score":5,"detection_score":7,"remediation_score":6,"architecture_score":7,"communication_skill_score":7,"follow_up_topic":"skill-specific follow-up question based on their answer","follow_up_category":"category"}`
      }]
    });

    const evalText = msg.content[0]?.text || '{}';

    // Log what AI actually returned (for debugging)
    console.log('AI raw response length:', evalText.length);

    // Safely parse AI response — if it fails, log the raw text and return error
    let evalResult;
    try {
      evalResult = JSON.parse(evalText.replace(/```json|```/g, '').trim());
    } catch (parseErr) {
      console.error('AI JSON parse failed. Raw response:', evalText.substring(0, 500));
      return res.status(500).json({
        error: 'AI returned invalid response. Please try again.',
        score: null,
        ai_failed: true
      });
    }

    // Helper: validate score is a real number 0-10 (treats 0 as valid, not falsy)
    const validateScore = (val) => {
      const n = Number(val);
      if (isNaN(n) || n < 0 || n > 10) return null;
      return n;
    };

    // Clean the result with proper validation (no more "|| 5" bug)
    const validatedScore = validateScore(evalResult.score);
    const validatedCommScore = validateScore(evalResult.communication_score);
    const validatedDepthScore = validateScore(evalResult.depth_score);

    // Validate 5 new skill scores (null if invalid, will default to overall score later)
    const validatedIamScore = validateScore(evalResult.iam_score);
    const validatedDetectionScore = validateScore(evalResult.detection_score);
    const validatedRemediationScore = validateScore(evalResult.remediation_score);
    const validatedArchitectureScore = validateScore(evalResult.architecture_score);
    const validatedCommSkillScore = validateScore(evalResult.communication_skill_score);

    // If AI didn't return a valid score, log it and flag the response
    if (validatedScore === null) {
      console.error('AI returned invalid score:', evalResult.score, '— full response:', JSON.stringify(evalResult).substring(0, 300));
    }

    // Build final result with validated values (null if AI failed, not fake 5)
    const finalResult = {
      ...evalResult,
      score: validatedScore !== null ? validatedScore : null,
      communication_score: validatedCommScore !== null ? validatedCommScore : validatedScore,
      depth_score: validatedDepthScore !== null ? validatedDepthScore : validatedScore,
      // 5 skill scores for radar chart (fall back to overall score if AI didn't provide them)
      iam_score: validatedIamScore !== null ? validatedIamScore : validatedScore,
      detection_score: validatedDetectionScore !== null ? validatedDetectionScore : validatedScore,
      remediation_score: validatedRemediationScore !== null ? validatedRemediationScore : validatedScore,
      architecture_score: validatedArchitectureScore !== null ? validatedArchitectureScore : validatedScore,
      communication_skill_score: validatedCommSkillScore !== null ? validatedCommSkillScore : validatedScore,
      ai_failed: validatedScore === null
    };

    // Save to DB only if we got a valid score from AI
    if (session_id && question_id && validatedScore !== null) {
      console.log('Saving to DB: session', session_id, 'question', question_id, 'score', validatedScore);
      try {
        await pool.query(
          `INSERT INTO answers (session_id, question_id, question_number, answer_text, input_mode, submitted_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT DO NOTHING`,
          [session_id, String(question_id), 1, answer, 'text']
        );
        await pool.query(
          `INSERT INTO evaluations (session_id, question_id, score, communication_score, depth_score, strengths, weaknesses, improved_answer, follow_up_topic, evaluated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [session_id, String(question_id), validatedScore,
            validatedCommScore !== null ? validatedCommScore : validatedScore,
            validatedDepthScore !== null ? validatedDepthScore : validatedScore,
            evalResult.strengths || '', evalResult.weaknesses || '',
            evalResult.improved_answer || '', evalResult.follow_up_topic || '']
        );
        console.log('DB save SUCCESS: score', validatedScore);
      } catch (dbErr) {
        console.error('DB SAVE FAILED:', dbErr.message);
      }
    } else if (validatedScore === null) {
      console.log('DB save SKIPPED: AI returned invalid score');
    } else {
      console.log('DB save SKIPPED: session_id=' + session_id + ' question_id=' + question_id);
    }

    console.log('Evaluated! Score:', validatedScore, '/10');
    res.json(finalResult);

  } catch (e) {
    console.error('Evaluate error:', e.message, e.stack?.split('\n').slice(0, 3).join(' | '));
    res.status(500).json({ error: e.message, ai_failed: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// FEEDBACK
// ═══════════════════════════════════════════════════════════════
app.post('/api/feedback', async (req, res) => {
  console.log('--- FEEDBACK RECEIVED ---');
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

    // Optional auth — try to decode token if present, otherwise treat as free trial user
    let userId = null;
    let userLabel = 'Free Trial User (anonymous)';
    let userType = 'Free Trial';
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
        userLabel = decoded.email || `User #${decoded.id}`;
        userType = 'Logged-in User';
      } catch (e) {
        // Invalid token → treat as anonymous, don't reject
      }
    }

    await pool.query(
      'INSERT INTO feedback (user_id, message, created_at) VALUES ($1, $2, NOW())',
      [userId, message]
    );

    console.log('Feedback saved from:', userLabel);

    // Send email notification to admin (fire-and-forget, doesn't block response)
    try {
      const resendClient = new Resend(process.env.RESEND_API_KEY);
      const submittedAt = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
      const safeMessage = String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      resendClient.emails.send({
        from: 'ThreatReady <noreply@threatready.io>',
        to: 'aerovanttechnologies@gmail.com',
        subject: `📬 New Feedback — ${userType}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0e1a;color:#e8eaf6;padding:32px;border-radius:12px">
            <h2 style="color:#00e5ff;margin:0 0 8px 0">📬 New Feedback Received</h2>
            <p style="color:#8890b0;margin:0 0 20px 0">Someone just submitted feedback on ThreatReady.</p>

            <div style="background:#1a1f2e;border:1px solid #1e2536;border-radius:10px;padding:20px;margin-bottom:16px">
              <div style="display:flex;margin-bottom:10px"><span style="color:#5a6380;width:110px;font-size:13px">From:</span><span style="color:#e8eaf6;font-size:13px;font-weight:600">${userLabel}</span></div>
              <div style="display:flex;margin-bottom:10px"><span style="color:#5a6380;width:110px;font-size:13px">Type:</span><span style="color:#00e5ff;font-size:13px;font-weight:600">${userType}</span></div>
              <div style="display:flex;margin-bottom:10px"><span style="color:#5a6380;width:110px;font-size:13px">User ID:</span><span style="color:#e8eaf6;font-size:13px">${userId || 'N/A (free trial)'}</span></div>
              <div style="display:flex"><span style="color:#5a6380;width:110px;font-size:13px">Submitted:</span><span style="color:#e8eaf6;font-size:13px">${submittedAt} IST</span></div>
            </div>

            <div style="background:#1a1f2e;border:1px solid #1e2536;border-radius:10px;padding:20px">
              <div style="color:#5a6380;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Message</div>
              <div style="color:#e8eaf6;font-size:14px;line-height:1.7;white-space:pre-wrap">${safeMessage}</div>
            </div>

            <p style="color:#5a6380;font-size:11px;margin-top:20px;text-align:center">This is an automated notification from ThreatReady feedback system.</p>
          </div>
        `
      }).then(() => {
        console.log('Feedback email sent to admin');
      }).catch(emailErr => {
        console.error('Feedback email failed:', emailErr.message);
      });
    } catch (emailSetupErr) {
      console.error('Feedback email setup error:', emailSetupErr.message);
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Feedback error:', e.message);
    res.status(500).json({ error: e.message });
  }
});



// ═══════════════════════════════════════════════════════════════
// RESUME PARSE TEXT - Extract skills + generate recommendations
// ═══════════════════════════════════════════════════════════════
app.post('/api/resume/parse-text', auth, async (req, res) => {
  console.log('--- RESUME PARSE TEXT ---');
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text required' });

    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const msg = await anthropic.messages.create({
      model: MODEL_QUESTIONS,
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Analyze this cybersecurity resume and extract structured information.

RESUME:
${text.substring(0, 3000)}

Respond ONLY in valid JSON with no markdown:
{
  "key_points": "3-5 line summary of experience, skills, certifications",
  "skills": ["skill1", "skill2", "skill3"],
  "experience_years": 3,
  "top_role": "Cloud Security",
  "weak_areas": ["area1", "area2"],
  "recommended_roles": ["role_id1", "role_id2"],
  "recommended_difficulty": "beginner"
}

For recommended_roles use only these IDs: cloud, devsecops, appsec, netsec, prodsec, secarch, dfir, grc, soc, threat, red, blue
For recommended_difficulty use: beginner, intermediate, advanced, expert`
      }]
    });

    const raw = msg.content[0]?.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/\`\`\`json|\`\`\`/g, '').trim());
    } catch (e) {
      parsed = { key_points: text.substring(0, 500) };
    }

    // Save key points to DB
    await pool.query(
      `INSERT INTO resume_profiles (user_id, resume_text, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET resume_text = $2, updated_at = NOW()`,
      [req.user.id, parsed.key_points || text.substring(0, 500)]
    ).catch(e => console.log('Resume DB save skipped:', e.message));

    console.log('Resume parsed for user:', req.user.id);
    res.json(parsed);

  } catch (e) {
    console.error('Resume parse-text error:', e.message);
    // Fallback - return raw text if AI fails
    res.json({ key_points: req.body.text?.substring(0, 500) || '' });
  }
});


// ═══════════════════════════════════════════════════════════
// B2B ENDPOINTS
// ═══════════════════════════════════════════════════════════

// B2B Stats
app.get('/api/b2b/stats', auth, async (req, res) => {
  try {
    const c = await pool.query(
      `SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM candidate_assessments WHERE company_user_id = $1`,
      [req.user.id]
    );
    const a = await pool.query(
      `SELECT COUNT(*) as total FROM b2b_assessments WHERE company_user_id = $1`,
      [req.user.id]
    );
    const avg = await pool.query(
      `SELECT ROUND(AVG(s.overall_score)::numeric, 1) as avg_score
       FROM candidate_assessments ca
       JOIN sessions s ON s.id = ca.session_id
       WHERE ca.company_user_id = $1 AND ca.status = 'completed'`,
      [req.user.id]
    );
    res.json({
      total_candidates: parseInt(c.rows[0].total) || 0,
      assessed: parseInt(c.rows[0].completed) || 0,
      total_assessments: parseInt(a.rows[0].total) || 0,
      avg_score: avg.rows[0].avg_score || 0
    });
  } catch (e) {
    console.error('B2B stats error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// B2B Get Candidates
app.get('/api/b2b/candidates', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ca.id, ca.candidate_email, ca.candidate_name,
        ca.role_id, ca.difficulty, ca.status,
        ca.invited_at, ca.completed_at,
        ca.overall_score,
        CASE
          WHEN ca.overall_score >= 8 THEN 'Platinum'
          WHEN ca.overall_score >= 7 THEN 'Gold'
          WHEN ca.overall_score >= 6 THEN 'Silver'
          WHEN ca.overall_score >= 4 THEN 'Bronze'
          WHEN ca.overall_score IS NOT NULL THEN 'Not Ready'
          ELSE NULL
        END as badge,
        ca.hiring_decision
       FROM candidate_assessments ca
       WHERE ca.company_user_id = $1
       ORDER BY ca.invited_at DESC`,
      [req.user.id]
    );
    res.json({ candidates: result.rows });
  } catch (e) {
    console.error('B2B candidates error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// B2B Get Assessments
app.get('/api/b2b/assessments', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ba.*,
        COUNT(ca.id) as total_candidates,
        SUM(CASE WHEN ca.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        ROUND(AVG(CASE WHEN ca.status = 'completed' THEN ca.overall_score END)::numeric, 1) as avg_score
       FROM b2b_assessments ba
       LEFT JOIN candidate_assessments ca ON ca.assessment_id = ba.id
       WHERE ba.company_user_id = $1
       GROUP BY ba.id
       ORDER BY ba.created_at DESC`,
      [req.user.id]
    );
    res.json({ assessments: result.rows });
  } catch (e) {
    console.error('B2B assessments error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// B2B Create Assessment
app.post('/api/b2b/assessments', auth, async (req, res) => {
  console.log('--- CREATE B2B ASSESSMENT ---');
  try {
    const { name, role_id, difficulty, assessment_type, jd_text, question_count = 5 } = req.body;
    if (!name || !role_id || !difficulty) {
      return res.status(400).json({ error: 'Name, role and difficulty required' });
    }

    const result = await pool.query(
      `INSERT INTO b2b_assessments
        (company_user_id, name, role_id, difficulty, assessment_type, jd_text, question_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [req.user.id, name, role_id, difficulty, assessment_type || 'standard', jd_text || '', question_count]
    ).catch(async () => {
      // question_count column may not exist yet — add it and retry
      await pool.query(`ALTER TABLE b2b_assessments ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 5`).catch(()=>{});
      return pool.query(
        `INSERT INTO b2b_assessments (company_user_id, name, role_id, difficulty, assessment_type, jd_text, created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`,
        [req.user.id, name, role_id, difficulty, assessment_type || 'standard', jd_text || '']
      );
    });
    const assessment = result.rows[0];

    // Step 2: Auto-generate questions using AI
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const roleNames = {
        cloud: 'Cloud Security', devsecops: 'DevSecOps', appsec: 'Application Security',
        netsec: 'Network Security', prodsec: 'Product Security', secarch: 'Security Architect',
        dfir: 'DFIR & Incident Response', grc: 'GRC & Compliance', soc: 'SOC Analyst',
        threat: 'Threat Hunter', red: 'Red Team', blue: 'Blue Team'
      };
      const roleName = roleNames[role_id] || role_id;
      const qCount = parseInt(question_count) || 5;

      const prompt = `You are a senior cybersecurity hiring manager. Generate exactly ${qCount} interview questions for a ${difficulty} level ${roleName} candidate.
${jd_text ? `Job Description context:\n${jd_text.substring(0, 800)}` : ''}
Rules: practical scenario-based questions, each testing a different skill area, difficulty: ${difficulty}.
Respond ONLY valid JSON no markdown:
{"questions":[${Array.from({length: qCount}, (_, i) => `{"id":${i+1},"question":"...","category":"skill area","hint":"short hint"}`).join(',')}]}`;

      const msg = await anthropic.messages.create({
        model: MODEL_QUESTIONS,
        max_tokens: 200 * qCount,
        messages: [{ role: 'user', content: prompt }]
      });
      const raw = msg.content[0].text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw);

      await pool.query(`ALTER TABLE b2b_assessments ADD COLUMN IF NOT EXISTS questions JSONB`).catch(()=>{});
      await pool.query(`UPDATE b2b_assessments SET questions = $1 WHERE id = $2`, [JSON.stringify(parsed.questions), assessment.id]);
      assessment.questions = parsed.questions;
      console.log(`Generated ${parsed.questions.length} questions for: ${name}`);
    } catch (aiErr) {
      console.error('Question generation failed:', aiErr.message);
    }

    res.json({ assessment });
  } catch (e) {
    console.error('Create assessment error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// B2B Invite Candidate (single or bulk)
app.post('/api/b2b/invite', auth, async (req, res) => {
  console.log('--- B2B INVITE ---');
  try {
    const { candidate_email, candidate_emails, candidate_name, assessment_id, role_id, difficulty } = req.body;

    // Support both single email and array of emails
    const emails = candidate_emails?.length
      ? candidate_emails.map(e => e.trim()).filter(Boolean)
      : [candidate_email?.trim()].filter(Boolean);

    if (!emails.length) return res.status(400).json({ error: 'At least one candidate email required' });

    const roleNames = {
      cloud: 'Cloud Security', devsecops: 'DevSecOps', appsec: 'Application Security',
      netsec: 'Network Security', prodsec: 'Product Security', secarch: 'Security Architect',
      dfir: 'DFIR & Incident Response', grc: 'GRC & Compliance', soc: 'SOC Analyst',
      threat: 'Threat Hunter', red: 'Red Team', blue: 'Blue Team'
    };
    const roleName = roleNames[role_id] || role_id;
    const diffName = difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : '';

    // Get assessment questions if assessment_id provided
    let assessmentQuestions = null;
    if (assessment_id) {
      const aq = await pool.query('SELECT questions FROM b2b_assessments WHERE id = $1', [assessment_id]);
      if (aq.rows[0]?.questions) assessmentQuestions = aq.rows[0].questions;
    }

    const results = [];
    const { Resend } = require('resend');
    const resendClient = new Resend(process.env.RESEND_API_KEY);

    for (const email of emails) {
      const token = require('crypto').randomBytes(32).toString('hex');
      const name = email.split('@')[0];

      const inserted = await pool.query(
        `INSERT INTO candidate_assessments
          (company_user_id, assessment_id, candidate_email, candidate_name,
           role_id, difficulty, invite_token, status, invited_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'not_started', NOW())
         RETURNING *`,
        [req.user.id, assessment_id || null, email, candidate_name || name, role_id, difficulty, token]
      );

      const inviteLink = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/?assess_token=' + token;

      // Send invite email
      resendClient.emails.send({
        from: 'ThreatReady <noreply@threatready.io>',
        to: email,
        subject: `You've been invited to a ${roleName} Assessment — ThreatReady`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0e1a;color:#e8eaf6;padding:36px;border-radius:14px">
            <div style="text-align:center;margin-bottom:24px">
              <div style="font-size:28px;font-weight:900;color:#00e5ff;letter-spacing:2px">⚡ THREATREADY</div>
              <div style="font-size:12px;color:#8890b0;margin-top:4px">Cybersecurity Assessment Platform</div>
            </div>
            <h2 style="color:#e8eaf6;font-size:20px;margin-bottom:8px">You've been invited!</h2>
            <p style="color:#8890b0;margin-bottom:20px">Hello <strong style="color:#e8eaf6">${candidate_name || name}</strong>, you have been invited to complete a cybersecurity skills assessment.</p>
            <div style="background:#1a1f2e;border:1px solid #1e2536;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
              <div style="font-size:13px;color:#8890b0;margin-bottom:8px">Assessment Details</div>
              <div style="font-size:20px;font-weight:800;color:#00e5ff;margin-bottom:4px">${roleName}</div>
              <div style="font-size:12px;color:#8890b0;margin-bottom:20px">Difficulty: <strong style="color:#ffab40">${diffName}</strong> · 5 questions · AI evaluated</div>
              <a href="${inviteLink}" style="background:#00e5ff;color:#000;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;display:inline-block">
                Start Assessment →
              </a>
            </div>
            <p style="color:#5a6380;font-size:11px;text-align:center">This link is personal and valid for 7 days. Your results will be shared with the hiring team.</p>
          </div>
        `
      }).then(() => console.log('Invite sent to:', email))
        .catch(e => console.log('Email failed:', e.message));

      results.push(inserted.rows[0]);
    }

    res.json({ candidates: results, candidate: results[0], count: results.length });
  } catch (e) {
    console.error('Invite error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────
// CANDIDATE-FACING: Get assessment by token
// ─────────────────────────────────────────────────────
app.get('/api/candidate/assessment', async (req, res) => {
  console.log('--- CANDIDATE ASSESSMENT LOAD ---');
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const ca = await pool.query(
      `SELECT ca.*, ba.questions, ba.name as assessment_name, ba.jd_text
       FROM candidate_assessments ca
       LEFT JOIN b2b_assessments ba ON ba.id = ca.assessment_id
       WHERE ca.invite_token = $1`,
      [token]
    );

    if (!ca.rows[0]) return res.status(404).json({ error: 'Invalid or expired link' });
    if (ca.rows[0].status === 'completed') return res.status(400).json({ error: 'already_completed', candidate: ca.rows[0] });

    // Mark as in_progress
    await pool.query(`UPDATE candidate_assessments SET status = 'in_progress' WHERE invite_token = $1`, [token]);

    // Use pre-generated questions or generate now based on assessment's question_count
    let questions = ca.rows[0].questions;
    if (!questions || !questions.length) {
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const roleNames = {
        cloud: 'Cloud Security', devsecops: 'DevSecOps', appsec: 'Application Security',
        netsec: 'Network Security', prodsec: 'Product Security', secarch: 'Security Architect',
        dfir: 'DFIR & Incident Response', grc: 'GRC & Compliance', soc: 'SOC Analyst',
        threat: 'Threat Hunter', red: 'Red Team', blue: 'Blue Team'
      };
      const roleName = roleNames[ca.rows[0].role_id] || ca.rows[0].role_id;

      // Fetch assessment's question_count
      const aRes = await pool.query('SELECT question_count FROM b2b_assessments WHERE id = $1', [ca.rows[0].assessment_id]).catch(() => ({ rows: [] }));
      const qCount = (aRes.rows[0]?.question_count) || 5;

      const msg = await anthropic.messages.create({
        model: MODEL_QUESTIONS, max_tokens: Math.max(1500, qCount * 300),
        messages: [{ role: 'user', content: `Generate exactly ${qCount} ${ca.rows[0].difficulty} level ${roleName} interview questions. Respond ONLY valid JSON: {"questions":[{"id":1,"question":"...","category":"...","hint":"..."}]}. Provide all ${qCount} questions in the questions array.` }]
      });
      questions = JSON.parse(msg.content[0].text.replace(/```json|```/g,'').trim()).questions;
    }

    res.json({
      candidate: {
        id: ca.rows[0].id,
        name: ca.rows[0].candidate_name,
        email: ca.rows[0].candidate_email,
        role_id: ca.rows[0].role_id,
        difficulty: ca.rows[0].difficulty,
        assessment_name: ca.rows[0].assessment_name
      },
      questions
    });
  } catch (e) {
    console.error('Candidate assessment load error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────
// CANDIDATE-FACING: Submit answers + AI evaluate + email report
// ─────────────────────────────────────────────────────
app.post('/api/candidate/submit', async (req, res) => {
  console.log('--- CANDIDATE SUBMIT ---');
  try {
    const { token, answers, candidate_name, role_id, difficulty } = req.body;
    if (!token || !answers) return res.status(400).json({ error: 'Token and answers required' });

    const ca = await pool.query(
      `SELECT ca.*, ba.name as assessment_name
       FROM candidate_assessments ca
       LEFT JOIN b2b_assessments ba ON ba.id = ca.assessment_id
       WHERE ca.invite_token = $1`,
      [token]
    );
    if (!ca.rows[0]) return res.status(404).json({ error: 'Invalid token' });

    const roleId = ca.rows[0].role_id || role_id;
    const diff = ca.rows[0].difficulty || difficulty;
    const candName = ca.rows[0].candidate_name;
    const candEmail = ca.rows[0].candidate_email;

    const roleNames = {
      cloud: 'Cloud Security', devsecops: 'DevSecOps', appsec: 'Application Security',
      netsec: 'Network Security', prodsec: 'Product Security', secarch: 'Security Architect',
      dfir: 'DFIR & Incident Response', grc: 'GRC & Compliance', soc: 'SOC Analyst',
      threat: 'Threat Hunter', red: 'Red Team', blue: 'Blue Team'
    };
    const roleName = roleNames[roleId] || roleId;

    // AI Evaluate all answers
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const evaluations = [];
    for (let i = 0; i < answers.length; i++) {
      const ans = answers[i];
      try {
        const msg = await anthropic.messages.create({
          model: MODEL_EVALUATION, max_tokens: 800,
          messages: [{ role: 'user', content: `You are an expert cybersecurity evaluator. Score this ${diff} level ${roleName} answer strictly.\nQuestion: ${ans.question}\nAnswer: ${ans.answer}\nRespond ONLY valid JSON: {"score":7,"strengths":"what was good in 1 sentence","weaknesses":"what was missing in 1 sentence","improved_answer":"ideal answer in 2-3 sentences"}` }]
        });
        const rawText = msg.content[0].text.replace(/```json|```/g,'').trim();
        const ev = JSON.parse(rawText);
        // Ensure score is a valid number between 0-10
        const rawScore = parseFloat(ev.score);
        ev.score = (!isNaN(rawScore) && rawScore >= 0 && rawScore <= 10) ? rawScore : 5;
        console.log(`Q${i+1} evaluated: score=${ev.score}`);
        evaluations.push({ question: ans.question, answer: ans.answer, category: ans.category || 'General', ...ev });
      } catch (e) {
        console.error(`Q${i+1} eval failed:`, e.message);
        evaluations.push({ question: ans.question, answer: ans.answer, category: ans.category || 'General', score: 5, strengths: 'Answer received', weaknesses: 'Evaluation unavailable', improved_answer: '-' });
      }
    }

    const avgScore = evaluations.reduce((s, e) => s + (parseFloat(e.score) || 5), 0) / evaluations.length;
    const finalScore = Math.max(0, Math.min(10, Math.round(avgScore * 10) / 10));
    const badge = finalScore >= 8 ? 'Platinum' : finalScore >= 7 ? 'Gold' : finalScore >= 6 ? 'Silver' : finalScore >= 4 ? 'Bronze' : 'Not Ready';
    console.log('Final score:', finalScore, '| Badge:', badge, '| Evaluations count:', evaluations.length);

    // Ensure required columns exist before UPDATE
    await pool.query(`ALTER TABLE candidate_assessments ADD COLUMN IF NOT EXISTS overall_score NUMERIC(4,2)`).catch(()=>{});
    await pool.query(`ALTER TABLE candidate_assessments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`).catch(()=>{});
    await pool.query(`ALTER TABLE candidate_assessments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'not_started'`).catch(()=>{});
    await pool.query(`ALTER TABLE candidate_assessments ADD COLUMN IF NOT EXISTS evaluations JSONB`).catch(()=>{});
    await pool.query(`ALTER TABLE candidate_assessments ADD COLUMN IF NOT EXISTS badge VARCHAR(20)`).catch(()=>{});

    // Update candidate_assessments with full report data
    const updateResult = await pool.query(
      `UPDATE candidate_assessments
       SET status = 'completed', overall_score = $1, badge = $2, evaluations = $3::jsonb, completed_at = NOW()
       WHERE invite_token = $4 RETURNING id`,
      [finalScore, badge, JSON.stringify(evaluations), token]
    );
    console.log('Updated candidate_assessments:', updateResult.rowCount, 'rows. Score:', finalScore, 'Badge:', badge);

    // Send HR notification
    try {
      const companyUserId = ca.rows[0].company_user_id;
      if (companyUserId) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
           VALUES ($1, 'candidate_completed', $2, $3, false, NOW())`,
          [
            companyUserId,
            `${candName} completed ${roleName} assessment`,
            `Score: ${finalScore}/10 (${badge}) · ${diff} difficulty`
          ]
        ).catch(async () => {
          await pool.query(`CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, user_id INTEGER, type VARCHAR(50), title TEXT, message TEXT, is_read BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW())`);
          await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, is_read, created_at) VALUES ($1, 'candidate_completed', $2, $3, false, NOW())`,
            [companyUserId, `${candName} completed ${roleName} assessment`, `Score: ${finalScore}/10 (${badge}) · ${diff} difficulty`]
          );
        });
        console.log('HR notification created for user:', companyUserId);
      }
    } catch (notifErr) {
      console.error('Notification failed:', notifErr.message);
    }

    // Send email report to candidate
    try {
      const { Resend } = require('resend');
      const resendClient = new Resend(process.env.RESEND_API_KEY);
      const badgeColor = finalScore >= 8 ? '#e2e8f0' : finalScore >= 7 ? '#f59e0b' : finalScore >= 6 ? '#94a3b8' : finalScore >= 4 ? '#cd7f32' : '#ff5252';
      const evalRows = evaluations.map((e, i) => `
        <div style="background:#1a1f2e;border-radius:10px;padding:16px;margin-bottom:12px;border-left:3px solid ${e.score >= 7 ? '#00e096' : e.score >= 5 ? '#ffab40' : '#ff5252'}">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span style="font-size:11px;color:#8890b0">Q${i+1} · ${e.category}</span>
            <span style="font-size:16px;font-weight:800;color:${e.score >= 7 ? '#00e096' : e.score >= 5 ? '#ffab40' : '#ff5252'}">${e.score}/10</span>
          </div>
          <div style="font-size:11px;color:#e8eaf6;margin-bottom:4px">✓ ${e.strengths}</div>
          <div style="font-size:11px;color:#8890b0">✗ ${e.weaknesses}</div>
          <div style="font-size:10px;color:#5a6380;margin-top:8px;padding:8px;background:#111827;border-radius:6px"><strong style="color:#00e5ff">Model answer:</strong> ${e.improved_answer}</div>
        </div>`).join('');

      // Build enhanced email report
      const topStrength = evaluations.reduce((best, e) => e.score > best.score ? e : best, evaluations[0]);
      const topWeakness = evaluations.reduce((worst, e) => e.score < worst.score ? e : worst, evaluations[0]);
      const verdict = finalScore >= 7 ? 'Strong performer — ready for industry roles' : finalScore >= 5 ? 'Developing — needs more hands-on practice' : 'Needs significant improvement — focus on fundamentals';
      const nextSteps = finalScore >= 7
        ? ['Apply to senior security roles', 'Consider OSCP or CISSP certification', 'Contribute to open source security projects', 'Build a portfolio of CTF writeups', 'Explore bug bounty programs']
        : finalScore >= 5
        ? ['Practice on ThreatReady at harder difficulty', 'Complete TryHackMe or HackTheBox labs', 'Study OWASP Top 10 and MITRE ATT&CK', 'Get CompTIA Security+ or CEH certification', 'Work on real-world security projects']
        : ['Start with CompTIA Security+ fundamentals', 'Complete beginner labs on TryHackMe', 'Study networking and OS security basics', 'Read NIST Cybersecurity Framework', 'Retry this assessment in 30 days'];

      await resendClient.emails.send({
        from: 'ThreatReady <noreply@threatready.io>',
        to: candEmail,
        subject: `Your ${roleName} Assessment Results — ThreatReady`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0e1a;color:#e8eaf6;padding:36px;border-radius:14px">

            <!-- Header -->
            <div style="text-align:center;margin-bottom:28px">
              <div style="font-size:28px;font-weight:900;color:#00e5ff;letter-spacing:2px">⚡ THREATREADY</div>
              <div style="font-size:12px;color:#8890b0;margin-top:4px">Cybersecurity Assessment Report</div>
            </div>

            <!-- Score Card -->
            <div style="text-align:center;background:#111827;border-radius:14px;padding:28px;margin-bottom:20px">
              <div style="font-size:13px;color:#8890b0;margin-bottom:8px">Hello <strong style="color:#e8eaf6">${candName}</strong>,</div>
              <div style="font-size:64px;font-weight:900;color:${finalScore >= 7 ? '#00e096' : finalScore >= 5 ? '#ffab40' : '#ff5252'};line-height:1">${finalScore}</div>
              <div style="font-size:13px;color:#8890b0;margin:8px 0 14px">out of 10 · ${roleName} · ${diff}</div>
              <div style="display:inline-block;border:2px solid ${badgeColor};color:${badgeColor};padding:6px 20px;border-radius:20px;font-size:12px;font-weight:800;letter-spacing:2px">${badge.toUpperCase()}</div>
            </div>

            <!-- 1. Overall Verdict -->
            <div style="background:#1a1f2e;border-radius:12px;padding:18px;margin-bottom:16px;border-left:4px solid ${finalScore >= 7 ? '#00e096' : finalScore >= 5 ? '#ffab40' : '#ff5252'}">
              <div style="font-size:11px;color:#00e5ff;font-weight:700;letter-spacing:1px;margin-bottom:6px">1. OVERALL VERDICT</div>
              <div style="font-size:14px;font-weight:700;color:#e8eaf6">${verdict}</div>
            </div>

            <!-- 2. Top Strength -->
            <div style="background:#1a1f2e;border-radius:12px;padding:18px;margin-bottom:16px;border-left:4px solid #00e096">
              <div style="font-size:11px;color:#00e5ff;font-weight:700;letter-spacing:1px;margin-bottom:6px">2. YOUR TOP STRENGTH</div>
              <div style="font-size:12px;color:#8890b0;margin-bottom:4px">${topStrength.category} — Q${evaluations.indexOf(topStrength)+1} (${topStrength.score}/10)</div>
              <div style="font-size:13px;color:#e8eaf6">${topStrength.strengths}</div>
            </div>

            <!-- 3. Key Weakness -->
            <div style="background:#1a1f2e;border-radius:12px;padding:18px;margin-bottom:16px;border-left:4px solid #ff5252">
              <div style="font-size:11px;color:#00e5ff;font-weight:700;letter-spacing:1px;margin-bottom:6px">3. KEY AREA TO IMPROVE</div>
              <div style="font-size:12px;color:#8890b0;margin-bottom:4px">${topWeakness.category} — Q${evaluations.indexOf(topWeakness)+1} (${topWeakness.score}/10)</div>
              <div style="font-size:13px;color:#e8eaf6">${topWeakness.weaknesses}</div>
            </div>

            <!-- 4. Next Steps -->
            <div style="background:#1a1f2e;border-radius:12px;padding:18px;margin-bottom:16px;border-left:4px solid #ffab40">
              <div style="font-size:11px;color:#00e5ff;font-weight:700;letter-spacing:1px;margin-bottom:10px">4. RECOMMENDED NEXT STEPS</div>
              ${nextSteps.map((s, i) => `<div style="display:flex;gap:10px;margin-bottom:8px"><span style="color:#00e5ff;font-weight:700;min-width:18px">${i+1}.</span><span style="font-size:13px;color:#e8eaf6">${s}</span></div>`).join('')}
            </div>

            <!-- 5. Question Breakdown -->
            <div style="background:#1a1f2e;border-radius:12px;padding:18px;margin-bottom:16px;border-left:4px solid #8b5cf6">
              <div style="font-size:11px;color:#00e5ff;font-weight:700;letter-spacing:1px;margin-bottom:12px">5. QUESTION-BY-QUESTION BREAKDOWN</div>
              ${evalRows}
            </div>

            <!-- Footer -->
            <div style="text-align:center;padding-top:16px;border-top:1px solid #1e2536;font-size:11px;color:#5a6380">
              Assessment completed on ${new Date().toLocaleDateString()} · ThreatReady Cybersecurity Platform<br/>
              <span style="color:#8890b0">Keep practicing to improve your score and unlock better opportunities.</span>
            </div>
          </div>
        `
      });
      console.log('Enhanced email report sent to:', candEmail);
    } catch (emailErr) {
      console.error('Email report failed:', emailErr.message);
    }

    res.json({ success: true, score: finalScore, badge, evaluations });
  } catch (e) {
    console.error('Candidate submit error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────
// HIRING DECISION: Selected / Not Selected
// ─────────────────────────────────────────────────────
app.post('/api/b2b/candidate/decision', auth, async (req, res) => {
  console.log('--- HIRING DECISION ---');
  try {
    const { candidate_id, decision, candidate_email, candidate_name, role_id, score } = req.body;
    if (!candidate_id || !decision) return res.status(400).json({ error: 'candidate_id and decision required' });

    // Add column if missing
    await pool.query(`ALTER TABLE candidate_assessments ADD COLUMN IF NOT EXISTS hiring_decision VARCHAR(20)`).catch(()=>{});

    // Save decision to DB
    await pool.query(
      `UPDATE candidate_assessments SET hiring_decision = $1 WHERE id = $2`,
      [decision, candidate_id]
    );

    const roleNames = {
      cloud: 'Cloud Security', devsecops: 'DevSecOps', appsec: 'Application Security',
      netsec: 'Network Security', prodsec: 'Product Security', secarch: 'Security Architect',
      dfir: 'DFIR & Incident Response', grc: 'GRC & Compliance', soc: 'SOC Analyst',
      threat: 'Threat Hunter', red: 'Red Team', blue: 'Blue Team'
    };
    const roleName = roleNames[role_id] || role_id;
    const isSelected = decision === 'selected';

    // Send decision email to candidate
    try {
      const { Resend } = require('resend');
      const resendClient = new Resend(process.env.RESEND_API_KEY);
      await resendClient.emails.send({
        from: 'ThreatReady <noreply@threatready.io>',
        to: candidate_email,
        subject: isSelected
          ? `🎉 Congratulations! You've been selected — ${roleName} — ThreatReady`
          : `Your ${roleName} Assessment Result — ThreatReady`,
        html: isSelected ? `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0e1a;color:#e8eaf6;padding:36px;border-radius:14px">
            <div style="text-align:center;margin-bottom:28px">
              <div style="font-size:28px;font-weight:900;color:#00e5ff;letter-spacing:2px">⚡ THREATREADY</div>
            </div>
            <div style="text-align:center;background:#111827;border-radius:14px;padding:32px;margin-bottom:24px">
              <div style="font-size:56px;margin-bottom:12px">🎉</div>
              <h2 style="color:#00e096;font-size:24px;font-weight:900;margin-bottom:8px">Congratulations!</h2>
              <p style="color:#8890b0;font-size:14px;margin-bottom:0">You have been <strong style="color:#00e096">SELECTED</strong> for the ${roleName} role.</p>
            </div>
            <div style="background:#1a1f2e;border-radius:12px;padding:20px;margin-bottom:20px">
              <table style="width:100%">
                <tr><td style="color:#8890b0;font-size:12px;padding:6px 0">Candidate</td><td style="color:#e8eaf6;font-size:12px;text-align:right;font-weight:700">${candidate_name}</td></tr>
                <tr><td style="color:#8890b0;font-size:12px;padding:6px 0">Role Applied</td><td style="color:#00e5ff;font-size:12px;text-align:right;font-weight:700">${roleName}</td></tr>
                <tr><td style="color:#8890b0;font-size:12px;padding:6px 0">Assessment Score</td><td style="color:#00e096;font-size:14px;text-align:right;font-weight:900">${score}/10</td></tr>
                <tr><td style="color:#8890b0;font-size:12px;padding:6px 0">Decision</td><td style="color:#00e096;font-size:12px;text-align:right;font-weight:700">✅ Selected</td></tr>
              </table>
            </div>
            <div style="background:#0d2137;border:1px solid rgba(0,229,255,.2);border-radius:12px;padding:20px;margin-bottom:20px">
              <p style="color:#8890b0;font-size:13px;line-height:1.8;margin:0">
                Dear <strong style="color:#e8eaf6">${candidate_name}</strong>,<br><br>
                We are pleased to inform you that based on your cybersecurity assessment performance, you have been <strong style="color:#00e096">selected</strong> to move forward in the hiring process.<br><br>
                Our team will be in touch shortly with the next steps. Please keep an eye on your inbox.
              </p>
            </div>
            <p style="color:#5a6380;font-size:11px;text-align:center;margin:0">ThreatReady Cybersecurity Assessment Platform · ${new Date().toLocaleDateString()}</p>
          </div>
        ` : `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0e1a;color:#e8eaf6;padding:36px;border-radius:14px">
            <div style="text-align:center;margin-bottom:28px">
              <div style="font-size:28px;font-weight:900;color:#00e5ff;letter-spacing:2px">⚡ THREATREADY</div>
            </div>
            <div style="text-align:center;background:#111827;border-radius:14px;padding:32px;margin-bottom:24px">
              <div style="font-size:56px;margin-bottom:12px">📋</div>
              <h2 style="color:#e8eaf6;font-size:22px;font-weight:900;margin-bottom:8px">Assessment Update</h2>
              <p style="color:#8890b0;font-size:14px;margin-bottom:0">${roleName} · Assessment Complete</p>
            </div>
            <div style="background:#1a1f2e;border-radius:12px;padding:20px;margin-bottom:20px">
              <table style="width:100%">
                <tr><td style="color:#8890b0;font-size:12px;padding:6px 0">Candidate</td><td style="color:#e8eaf6;font-size:12px;text-align:right;font-weight:700">${candidate_name}</td></tr>
                <tr><td style="color:#8890b0;font-size:12px;padding:6px 0">Role</td><td style="color:#00e5ff;font-size:12px;text-align:right;font-weight:700">${roleName}</td></tr>
                <tr><td style="color:#8890b0;font-size:12px;padding:6px 0">Assessment Score</td><td style="color:#ffab40;font-size:14px;text-align:right;font-weight:900">${score}/10</td></tr>
                <tr><td style="color:#8890b0;font-size:12px;padding:6px 0">Decision</td><td style="color:#ff5252;font-size:12px;text-align:right;font-weight:700">Not Selected</td></tr>
              </table>
            </div>
            <div style="background:#1a1f2e;border-radius:12px;padding:20px;margin-bottom:20px">
              <p style="color:#8890b0;font-size:13px;line-height:1.8;margin:0">
                Dear <strong style="color:#e8eaf6">${candidate_name}</strong>,<br><br>
                Thank you for completing the ${roleName} assessment on ThreatReady. After careful review, we regret to inform you that you have <strong style="color:#ff5252">not been selected</strong> for this position at this time.<br><br>
                We encourage you to continue building your skills and apply again in the future. Your score of <strong style="color:#ffab40">${score}/10</strong> shows you have foundational knowledge — keep practicing!
              </p>
            </div>
            <div style="background:#0d2a1a;border:1px solid rgba(0,224,150,.2);border-radius:12px;padding:16px;margin-bottom:20px">
              <p style="color:#00e096;font-size:12px;font-weight:700;margin:0 0 6px">💡 Tips to improve:</p>
              <ul style="color:#8890b0;font-size:12px;margin:0;padding-left:16px;line-height:1.8">
                <li>Practice more scenario-based questions on ThreatReady</li>
                <li>Focus on hands-on labs and CTF challenges</li>
                <li>Review OWASP, MITRE ATT&CK, and NIST frameworks</li>
                <li>Consider certifications like CompTIA Security+, CEH, or OSCP</li>
                <li>Reapply after 3 months of continued practice</li>
              </ul>
            </div>
            <p style="color:#5a6380;font-size:11px;text-align:center;margin:0">ThreatReady Cybersecurity Assessment Platform · ${new Date().toLocaleDateString()}</p>
          </div>
        `
      });
      console.log(`Decision email (${decision}) sent to:`, candidate_email);
    } catch (emailErr) {
      console.error('Decision email failed:', emailErr.message);
    }

    res.json({ success: true, decision });
  } catch (e) {
    console.error('Decision error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// B2B Get Candidate Report
app.get('/api/b2b/candidate-report/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const ca = await pool.query(
      'SELECT * FROM candidate_assessments WHERE id = $1 AND company_user_id = $2',
      [id, req.user.id]
    );
    if (!ca.rows[0]) return res.status(404).json({ error: 'Not found' });
    const c = ca.rows[0];
    if (c.status !== 'completed') return res.json({ report: null });

    const roleNames = {
      cloud:'Cloud Security',devsecops:'DevSecOps',appsec:'Application Security',
      netsec:'Network Security',prodsec:'Product Security',secarch:'Security Architect',
      dfir:'DFIR & Incident Response',grc:'GRC & Compliance',soc:'SOC Analyst',
      threat:'Threat Hunter',red:'Red Team',blue:'Blue Team'
    };
    const roleName = roleNames[c.role_id] || c.role_id;
    const finalScore = c.overall_score || 0;
    const badge = finalScore >= 9 ? 'Platinum' : finalScore >= 7 ? 'Gold' : finalScore >= 6 ? 'Silver' : finalScore >= 4 ? 'Bronze' : 'Not Ready';
    const badgeColor = finalScore >= 9 ? '#e2e8f0' : finalScore >= 7 ? '#f59e0b' : finalScore >= 6 ? '#94a3b8' : finalScore >= 4 ? '#b45309' : '#ff5252';
    const verdict = finalScore >= 7 ? 'Strong performer — ready for industry roles' : finalScore >= 5 ? 'Developing — needs more hands-on practice' : 'Needs significant improvement — focus on fundamentals';

    // Get evaluations
    const evals = await pool.query(
      `SELECT e.* FROM evaluations e
       JOIN b2b_answers a ON a.id = e.answer_id
       WHERE a.candidate_assessment_id = $1 ORDER BY e.id`,
      [id]
    ).catch(() => ({ rows: [] }));

    const topStrength = evals.rows.length > 0 ? evals.rows.reduce((best, e) => e.score > best.score ? e : best, evals.rows[0]) : null;
    const topWeakness = evals.rows.length > 0 ? evals.rows.reduce((worst, e) => e.score < worst.score ? e : worst, evals.rows[0]) : null;
    const nextSteps = finalScore >= 7
      ? ['Apply to senior security roles', 'Consider OSCP or CISSP certification', 'Contribute to open source security projects', 'Build a portfolio of CTF writeups', 'Explore bug bounty programs']
      : finalScore >= 5
      ? ['Practice on ThreatReady at harder difficulty', 'Complete TryHackMe or HackTheBox labs', 'Study OWASP Top 10 and MITRE ATT&CK', 'Get CompTIA Security+ or CEH certification', 'Work on real-world security projects']
      : ['Start with CompTIA Security+ fundamentals', 'Complete beginner labs on TryHackMe', 'Study networking and OS security basics', 'Read NIST Cybersecurity Framework', 'Retry this assessment in 30 days'];

    const evalRows = evals.rows.length > 0 ? evals.rows.map((e, i) => `
      <div style="margin-bottom:14px;padding:16px;background:#111827;border-radius:10px;border-left:3px solid ${e.score >= 7 ? '#00e096' : e.score >= 5 ? '#ffab40' : '#ff5252'}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:13px;font-weight:700;color:#00e5ff">Q${i+1} · ${e.category || ''}</span>
          <span style="font-size:18px;font-weight:900;color:${e.score >= 7 ? '#00e096' : e.score >= 5 ? '#ffab40' : '#ff5252'}">${e.score}/10</span>
        </div>
        <div style="font-size:12px;color:#22c55e;margin-bottom:4px">✓ ${e.strengths || ''}</div>
        <div style="font-size:12px;color:#ef4444;margin-bottom:8px">✗ ${e.weaknesses || ''}</div>
        <div style="font-size:12px;color:#a78bfa"><strong>Model answer:</strong> ${e.improved_answer || ''}</div>
      </div>`).join('') : '<div style="color:#8890b0;font-size:12px">No detailed evaluations available</div>';

    const report = `
      <div style="font-family:sans-serif;color:#e8eaf6;background:#0a0e1a;padding:20px;border-radius:14px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:26px;font-weight:900;color:#00e5ff;letter-spacing:2px">⚡ THREATREADY</div>
          <div style="font-size:12px;color:#8890b0;margin-top:4px">Cybersecurity Assessment Report</div>
        </div>
        <div style="text-align:center;background:#111827;border-radius:14px;padding:28px;margin-bottom:16px">
          <div style="font-size:13px;color:#8890b0;margin-bottom:8px">Hello <strong style="color:#e8eaf6">${c.candidate_name}</strong>,</div>
          <div style="font-size:64px;font-weight:900;color:${finalScore >= 7 ? '#00e096' : finalScore >= 5 ? '#ffab40' : '#ff5252'};line-height:1">${finalScore}</div>
          <div style="font-size:13px;color:#8890b0;margin:8px 0 14px">out of 10 · ${roleName} · ${c.difficulty}</div>
          <div style="display:inline-block;border:2px solid ${badgeColor};color:${badgeColor};padding:6px 20px;border-radius:20px;font-size:12px;font-weight:800;letter-spacing:2px">${badge.toUpperCase()}</div>
        </div>
        <div style="background:#1a1f2e;border-radius:12px;padding:18px;margin-bottom:14px;border-left:4px solid ${finalScore >= 7 ? '#00e096' : finalScore >= 5 ? '#ffab40' : '#ff5252'}">
          <div style="font-size:11px;color:#00e5ff;font-weight:700;letter-spacing:1px;margin-bottom:6px">1. OVERALL VERDICT</div>
          <div style="font-size:14px;font-weight:700;color:#e8eaf6">${verdict}</div>
        </div>
        ${topStrength ? `<div style="background:#1a1f2e;border-radius:12px;padding:18px;margin-bottom:14px;border-left:4px solid #00e096">
          <div style="font-size:11px;color:#00e5ff;font-weight:700;letter-spacing:1px;margin-bottom:6px">2. YOUR TOP STRENGTH</div>
          <div style="font-size:12px;color:#8890b0;margin-bottom:4px">${topStrength.category} — Q${evals.rows.indexOf(topStrength)+1} (${topStrength.score}/10)</div>
          <div style="font-size:13px;color:#e8eaf6">${topStrength.strengths}</div>
        </div>` : ''}
        ${topWeakness ? `<div style="background:#1a1f2e;border-radius:12px;padding:18px;margin-bottom:14px;border-left:4px solid #ff5252">
          <div style="font-size:11px;color:#00e5ff;font-weight:700;letter-spacing:1px;margin-bottom:6px">3. KEY AREA TO IMPROVE</div>
          <div style="font-size:12px;color:#8890b0;margin-bottom:4px">${topWeakness.category} — Q${evals.rows.indexOf(topWeakness)+1} (${topWeakness.score}/10)</div>
          <div style="font-size:13px;color:#e8eaf6">${topWeakness.weaknesses}</div>
        </div>` : ''}
        <div style="background:#1a1f2e;border-radius:12px;padding:18px;margin-bottom:14px;border-left:4px solid #ffab40">
          <div style="font-size:11px;color:#00e5ff;font-weight:700;letter-spacing:1px;margin-bottom:10px">4. RECOMMENDED NEXT STEPS</div>
          ${nextSteps.map((s, i) => `<div style="display:flex;gap:10px;margin-bottom:8px"><span style="color:#00e5ff;font-weight:700;min-width:18px">${i+1}.</span><span style="font-size:13px;color:#e8eaf6">${s}</span></div>`).join('')}
        </div>
        <div style="background:#1a1f2e;border-radius:12px;padding:18px;margin-bottom:14px;border-left:4px solid #8b5cf6">
          <div style="font-size:11px;color:#00e5ff;font-weight:700;letter-spacing:1px;margin-bottom:12px">5. QUESTION-BY-QUESTION BREAKDOWN</div>
          ${evalRows}
        </div>
        <div style="text-align:center;padding-top:14px;border-top:1px solid #1e2536;font-size:11px;color:#5a6380">
          Assessment completed on ${new Date(c.completed_at || Date.now()).toLocaleDateString()} · ThreatReady Cybersecurity Platform
        </div>
      </div>`;

    res.json({ report });
  } catch(e) {
    console.error('Report error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// B2B Get Candidate Report (full report with all evaluations)
app.get('/api/b2b/candidates/:id/report', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ca.*, ba.name as assessment_name, ba.jd_text
       FROM candidate_assessments ca
       LEFT JOIN b2b_assessments ba ON ba.id = ca.assessment_id
       WHERE ca.id = $1 AND ca.company_user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Candidate not found' });
    const c = result.rows[0];
    if (c.status !== 'completed') return res.status(400).json({ error: 'Candidate has not completed the assessment yet' });

    res.json({
      candidate: {
        id: c.id,
        name: c.candidate_name,
        email: c.candidate_email,
        role_id: c.role_id,
        difficulty: c.difficulty,
        overall_score: c.overall_score,
        badge: c.badge,
        status: c.status,
        invited_at: c.invited_at,
        completed_at: c.completed_at,
        assessment_name: c.assessment_name,
        evaluations: c.evaluations || []
      }
    });
  } catch (e) {
    console.error('Report error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// B2B Delete Candidate
app.delete('/api/b2b/candidates/:id', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM candidate_assessments WHERE id = $1 AND company_user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// B2B Delete Assessment
app.delete('/api/b2b/assessments/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM b2b_assessments WHERE id = $1 AND company_user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Assessment not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('Delete assessment error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// B2B Duplicate Assessment
app.post('/api/b2b/assessments/:id/duplicate', auth, async (req, res) => {
  console.log('--- DUPLICATE ASSESSMENT ---', req.params.id);
  try {
    const orig = await pool.query(
      `SELECT * FROM b2b_assessments WHERE id = $1 AND company_user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!orig.rows[0]) {
      console.log('Duplicate: assessment not found');
      return res.status(404).json({ error: 'Assessment not found' });
    }
    const a = orig.rows[0];

    // Ensure columns exist
    await pool.query(`ALTER TABLE b2b_assessments ADD COLUMN IF NOT EXISTS questions JSONB`).catch(()=>{});
    await pool.query(`ALTER TABLE b2b_assessments ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 5`).catch(()=>{});

    // Stringify questions if they're an object (PostgreSQL JSONB parameter)
    const questionsParam = a.questions ? JSON.stringify(a.questions) : null;

    const result = await pool.query(
      `INSERT INTO b2b_assessments
        (company_user_id, name, role_id, difficulty, assessment_type, jd_text, questions, question_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, NOW()) RETURNING *`,
      [
        req.user.id,
        (a.name || 'Assessment') + ' (Copy)',
        a.role_id,
        a.difficulty,
        a.assessment_type || 'standard',
        a.jd_text || '',
        questionsParam,
        a.question_count || 5
      ]
    );
    console.log('Duplicate created: id', result.rows[0].id);
    res.json({ assessment: result.rows[0] });
  } catch (e) {
    console.error('Duplicate error:', e.message);
    res.status(500).json({ error: e.message });
  }
});


// B2B Analyze Job Description with AI
app.post('/api/b2b/analyze-jd', auth, async (req, res) => {
  console.log('--- JD ANALYSIS ---');
  try {
    const { jd_text } = req.body;
    if (!jd_text?.trim()) return res.status(400).json({ error: 'JD text required' });

    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const msg = await anthropic.messages.create({
      model: MODEL_QUESTIONS,
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Analyze this job description for a cybersecurity role and extract structured information.

JOB DESCRIPTION:
${jd_text.substring(0, 3000)}

Respond ONLY in valid JSON with no markdown:
{
  "suggested_name": "short assessment name based on job title",
  "recommended_role": "one of: cloud|devsecops|appsec|netsec|prodsec|secarch|dfir|grc|soc|threat|red|blue",
  "recommended_difficulty": "one of: beginner|intermediate|advanced|expert",
  "key_skills": ["skill1", "skill2", "skill3", "skill4"],
  "focus_areas": ["area1", "area2", "area3"],
  "experience_years": 3,
  "assessment_context": "2-3 sentence summary of what to test this candidate on based on the JD"
}`
      }]
    });

    const raw = msg.content[0]?.text || '{}';
    let analysis;
    try {
      analysis = JSON.parse(raw.replace(/\`\`\`json|\`\`\`/g, '').trim());
    } catch (e) {
      return res.status(500).json({ error: 'AI could not parse JD' });
    }

    console.log('JD analyzed - recommended role:', analysis.recommended_role);
    res.json({ analysis });
  } catch (e) {
    console.error('JD analysis error:', e.message);
    res.status(500).json({ error: e.message });
  }
});


// ═══════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════
app.get('/api/leaderboard', auth, async (req, res) => {
  try {
    // Get top 10 users by best score this week from user_scenario_history
    // (actual completed assessments, not the legacy sessions table)
    const result = await pool.query(`
      SELECT u.name, u.id,
        MAX(h.score) as best_score,
        COUNT(h.id) as total_sessions
      FROM users u
      JOIN user_scenario_history h ON h.user_id = u.id
      WHERE h.completed_at > NOW() - INTERVAL '7 days'
        AND h.score IS NOT NULL
      GROUP BY u.id, u.name
      ORDER BY best_score DESC NULLS LAST
      LIMIT 10
    `);

    // Find current user's rank
    const userRank = await pool.query(`
      SELECT rank FROM (
        SELECT u.id, RANK() OVER (ORDER BY MAX(h.score) DESC) as rank
        FROM users u
        JOIN user_scenario_history h ON h.user_id = u.id
        WHERE h.completed_at > NOW() - INTERVAL '7 days'
          AND h.score IS NOT NULL
        GROUP BY u.id
      ) ranked WHERE id = $1
    `, [req.user.id]);

    res.json({
      leaderboard: result.rows,
      my_rank: userRank.rows[0]?.rank || null
    });
  } catch (e) {
    console.error('Leaderboard error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// DAILY CHALLENGE
// ═══════════════════════════════════════════════════════════════
app.get('/api/daily-challenge', auth, async (req, res) => {
  try {
    // Safe migration — ensure required columns exist
    await pool.query(`ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS question TEXT`).catch(()=>{});
    await pool.query(`ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS role_id VARCHAR(50)`).catch(()=>{});
    await pool.query(`ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS hint TEXT`).catch(()=>{});
    await pool.query(`ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 50`).catch(()=>{});
    await pool.query(`ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`).catch(()=>{});
    await pool.query(`ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS challenge_date DATE`).catch(()=>{});
    // Drop NOT NULL constraint on legacy question_text column (so inserts into "question" don't fail)
    await pool.query(`ALTER TABLE daily_challenges ALTER COLUMN question_text DROP NOT NULL`).catch(()=>{});

    // Get today's challenge
    const today = new Date().toISOString().split('T')[0];

    let challenge = await pool.query(
      `SELECT * FROM daily_challenges WHERE challenge_date = $1 AND is_active = true LIMIT 1`,
      [today]
    );

    // If no challenge for today, create one using AI
    if (challenge.rows.length === 0) {
      const roles = ['cloud', 'devsecops', 'appsec', 'netsec', 'soc'];
      const role = roles[new Date().getDay() % roles.length];

      // Fallback question (used if AI call or JSON parse fails)
      const fallbackByRole = {
        cloud: { question: 'What is the principle of least privilege in cloud IAM and why is it critical?', hint: 'Think about blast radius and over-permissioned roles.' },
        devsecops: { question: 'Explain the purpose of SAST vs DAST in a CI/CD pipeline.', hint: 'One inspects code, the other runs it.' },
        appsec: { question: 'What is OWASP A01: Broken Access Control and how would you prevent it?', hint: 'Think about authorization checks on every request.' },
        netsec: { question: 'Describe how network segmentation reduces the impact of a breach.', hint: 'Think about lateral movement.' },
        soc: { question: 'What is the MITRE ATT&CK framework and how does it help a SOC analyst?', hint: 'Think about tactics, techniques, and procedures.' }
      };

      let q = { ...fallbackByRole[role], role, difficulty: 'beginner', points: 50 };

      // Try AI generation — fall back to hardcoded if anything fails
      try {
        const Anthropic = require('@anthropic-ai/sdk');
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const msg = await anthropic.messages.create({
          model: MODEL_QUESTIONS,
          max_tokens: 400,
          messages: [{ role: 'user', content: `Generate a quick 2-minute cybersecurity daily challenge question for ${role} role. Respond ONLY in JSON: {"question":"the question text","role":"${role}","difficulty":"beginner","points":50,"hint":"one short hint"}` }]
        });
        const raw = msg.content[0]?.text || '';
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.question && parsed.question.length > 10) {
          q = {
            question: parsed.question,
            role: parsed.role || role,
            difficulty: parsed.difficulty || 'beginner',
            points: parsed.points || 50,
            hint: parsed.hint || ''
          };
        }
      } catch (aiErr) {
        console.error('Daily challenge AI generation failed (using fallback):', aiErr.message);
      }

      const inserted = await pool.query(
        `INSERT INTO daily_challenges (question, question_text, role_id, difficulty, points, hint, challenge_date, is_active, created_at)
         VALUES ($1,$1,$2,$3,$4,$5,$6,true,NOW()) RETURNING *`,
        [q.question, q.role || role, q.difficulty || 'beginner', q.points || 50, q.hint || '', today]
      );
      challenge = { rows: [inserted.rows[0]] };
    }

    // Check if user already answered today
    const answered = await pool.query(
      `SELECT * FROM daily_challenge_responses WHERE user_id=$1 AND challenge_id=$2`,
      [req.user.id, challenge.rows[0].id]
    );

    res.json({
      challenge: challenge.rows[0],
      already_answered: answered.rows.length > 0,
      response: answered.rows[0] || null
    });
  } catch (e) {
    console.error('Daily challenge error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/daily-challenge/submit', auth, async (req, res) => {
  try {
    const { challenge_id, answer } = req.body;
    if (!challenge_id || !answer?.trim()) return res.status(400).json({ error: 'Missing fields' });

    // Drop CHECK constraint if it's too strict (allow any score 0-100 stored as int)
    await pool.query(`ALTER TABLE daily_challenge_responses DROP CONSTRAINT IF EXISTS daily_challenge_responses_score_check`).catch(()=>{});

    // Check not already answered
    const existing = await pool.query(
      `SELECT id FROM daily_challenge_responses WHERE user_id=$1 AND challenge_id=$2`,
      [req.user.id, challenge_id]
    );
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Already answered today' });

    // Get challenge
    const ch = await pool.query(`SELECT * FROM daily_challenges WHERE id=$1`, [challenge_id]);
    if (!ch.rows[0]) return res.status(404).json({ error: 'Challenge not found' });

    // AI evaluate — with safe fallback
    let result = { score: 0, correct: false, feedback: 'Unable to evaluate', points_earned: 0 };
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await anthropic.messages.create({
        model: MODEL_QUESTIONS, max_tokens: 300,
        messages: [{
          role: 'user', content: `Daily challenge: "${ch.rows[0].question}"
Answer: "${answer}"
Score 0-100 and give brief feedback. JSON only: {"score":75,"correct":true,"feedback":"brief feedback","points_earned":50}` }]
      });
      const raw = msg.content[0]?.text || '';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      result = {
        score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),  // clamp 0-100
        correct: !!parsed.correct,
        feedback: String(parsed.feedback || '').substring(0, 500),
        points_earned: Math.max(0, Math.min(100, Math.round(Number(parsed.points_earned) || 0)))
      };
    } catch (aiErr) {
      console.error('Daily challenge AI eval failed (using safe defaults):', aiErr.message);
    }

    // Save response (score is now guaranteed 0-100, safe for any check constraint)
    await pool.query(
      `INSERT INTO daily_challenge_responses (user_id, challenge_id, answer, score, points_earned, submitted_at)
       VALUES ($1,$2,$3,$4,$5,NOW())`,
      [req.user.id, challenge_id, answer, result.score, result.points_earned]
    );

    // Add XP to user_stats
    if (result.points_earned > 0) {
      await pool.query(
        `INSERT INTO user_stats (user_id, total_xp, streak, completed_scenarios, last_activity)
         VALUES ($1,$2,1,'[]',NOW())
         ON CONFLICT (user_id) DO UPDATE SET total_xp = user_stats.total_xp + $2, last_activity = NOW()`,
        [req.user.id, result.points_earned]
      );
    }

    res.json({ result, challenge: ch.rows[0] });
  } catch (e) {
    console.error('Daily challenge submit error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    const unread = result.rows.filter(n => !n.is_read).length;
    res.json({ notifications: result.rows, unread_count: unread });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/notifications/read', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read=true WHERE user_id=$1`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper to create notification (used internally)
async function createNotification(userId, title, message, type = 'info') {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
       VALUES ($1,$2,$3,$4,false,NOW())`,
      [userId, title, message, type]
    );
  } catch (e) {
    console.log('Notification create error:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// SCENARIO HISTORY (prevent repeat questions)
// ═══════════════════════════════════════════════════════════════
app.get('/api/scenario-history', auth, async (req, res) => {
  try {
    // Ensure table exists with all required columns (safe migration)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_scenario_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        scenario_id VARCHAR(100),
        role_id VARCHAR(100),
        score NUMERIC(5,2),
        completed_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, scenario_id)
      )
    `).catch(() => {});

    // Add missing columns if they don't exist (idempotent)
    await pool.query(`ALTER TABLE user_scenario_history ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY`).catch(() => {});
    await pool.query(`ALTER TABLE user_scenario_history ADD COLUMN IF NOT EXISTS scenario_id VARCHAR(100)`).catch(() => {});
    await pool.query(`ALTER TABLE user_scenario_history ADD COLUMN IF NOT EXISTS role_id VARCHAR(100)`).catch(() => {});
    await pool.query(`ALTER TABLE user_scenario_history ADD COLUMN IF NOT EXISTS score NUMERIC(5,2)`).catch(() => {});
    await pool.query(`ALTER TABLE user_scenario_history ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP DEFAULT NOW()`).catch(() => {});

    const result = await pool.query(
      `SELECT scenario_id, role_id, score, completed_at FROM user_scenario_history
       WHERE user_id=$1 ORDER BY completed_at DESC`,
      [req.user.id]
    );
    res.json({ history: result.rows });
  } catch (e) {
    console.error('Scenario history GET error:', e.message);
    // Return empty array instead of 500 so frontend doesn't break
    res.json({ history: [], error: e.message });
  }
});

app.post('/api/scenario-history', auth, async (req, res) => {
  try {
    const { scenario_id, role_id, score } = req.body;

    // Ensure table exists (safe migration)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_scenario_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        scenario_id VARCHAR(100),
        role_id VARCHAR(100),
        score NUMERIC(5,2),
        completed_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, scenario_id)
      )
    `).catch(() => {});

    await pool.query(
      `INSERT INTO user_scenario_history (user_id, scenario_id, role_id, score, completed_at)
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (user_id, scenario_id) DO UPDATE SET score=$4, completed_at=NOW()`,
      [req.user.id, scenario_id, role_id, score]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('Scenario history POST error:', e.message);
    res.status(500).json({ error: e.message });
  }
});


// ═══════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ═══════════════════════════════════════════════════════════════

// Step 1: Send reset code to email
app.post('/api/auth/forgot-password', async (req, res) => {
  console.log('--- FORGOT PASSWORD ---');
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);

    // Always return success to not reveal if email exists
    if (!user.rows[0]) {
      return res.json({ success: true });
    }

    // Generate 6-digit code valid for 15 minutes
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'UPDATE users SET verify_code = $1, verify_expiry = $2 WHERE email = $3',
      [code, expiry, email]
    );

    console.log('Reset code for', email, ':', code);

    // Send email
    try {
      const { Resend } = require('resend');
      const resendClient = new Resend(process.env.RESEND_API_KEY);
      resendClient.emails.send({
        from: 'ThreatReady <noreply@threatready.io>',
        to: email,
        subject: 'ThreatReady — Password Reset Code',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0e1a;color:#e8eaf6;padding:32px;border-radius:12px">
            <h2 style="color:#00e5ff;margin-bottom:8px">ThreatReady — Password Reset</h2>
            <p style="color:#8890b0">Hello ${user.rows[0].name || email},</p>
            <p style="color:#8890b0">Use this 6-digit code to reset your password. It expires in <strong style="color:#e8eaf6">15 minutes</strong>.</p>
            <div style="background:#1a1f2e;border:1px solid #00e5ff33;border-radius:12px;padding:24px;margin:20px 0;text-align:center">
              <div style="font-size:40px;font-weight:900;letter-spacing:14px;color:#00e5ff;font-family:monospace">${code}</div>
            </div>
            <p style="color:#5a6380;font-size:12px">If you did not request this, you can safely ignore this email.</p>
          </div>
        `
      }).then(() => console.log('Reset email sent to:', email))
        .catch(e => console.error('Reset email failed:', e.message));

    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
      // Code is still saved in DB even if email fails
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Forgot password error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Step 2: Verify code and set new password
app.post('/api/auth/reset-password', async (req, res) => {
  console.log('--- RESET PASSWORD ---');
  try {
    const { email, code, new_password } = req.body;
    if (!email || !code || !new_password) return res.status(400).json({ error: 'All fields required' });
    if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const user = await pool.query(
      'SELECT id, verify_code, verify_expiry FROM users WHERE email = $1',
      [email]
    );
    if (!user.rows[0]) return res.status(400).json({ error: 'Email not found' });
    if (!user.rows[0].verify_code) return res.status(400).json({ error: 'No reset code found. Please request a new one.' });
    if (user.rows[0].verify_code !== code) return res.status(400).json({ error: 'Invalid code. Please check and try again.' });
    if (new Date() > new Date(user.rows[0].verify_expiry)) return res.status(400).json({ error: 'Code expired. Please request a new one.' });

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(new_password, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1, verify_code = NULL, verify_expiry = NULL WHERE email = $2',
      [hash, email]
    );

    console.log('Password reset success for:', email);
    res.json({ success: true });
  } catch (e) {
    console.error('Reset password error:', e.message);
    res.status(500).json({ error: e.message });
  }
});


// ═══════════════════════════════════════════════════════════════
// SETTINGS ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// 1. Save profile name
app.post('/api/settings/profile', auth, async (req, res) => {
  console.log('--- SETTINGS: PROFILE UPDATE ---');
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });

    await pool.query(
      'UPDATE users SET name = $1 WHERE id = $2',
      [name.trim(), req.user.id]
    );

    const updated = await pool.query(
      'SELECT id, name, email, user_type FROM users WHERE id = $1',
      [req.user.id]
    );

    console.log('Profile updated for user:', req.user.id);
    res.json({ success: true, user: updated.rows[0] });
  } catch (e) {
    console.error('Settings profile error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 2. Save privacy settings
app.post('/api/settings/privacy', auth, async (req, res) => {
  console.log('--- SETTINGS: PRIVACY UPDATE ---');
  try {
    const { profile_public, in_leaderboard, allow_benchmarking } = req.body;

    // Add columns if they don't exist (safe migration)
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_public BOOLEAN DEFAULT true');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS in_leaderboard BOOLEAN DEFAULT true');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_benchmarking BOOLEAN DEFAULT false');
    } catch (migErr) {
      // Columns already exist - ignore
    }

    await pool.query(
      'UPDATE users SET profile_public = $1, in_leaderboard = $2, allow_benchmarking = $3 WHERE id = $4',
      [profile_public ?? true, in_leaderboard ?? true, allow_benchmarking ?? false, req.user.id]
    );

    console.log('Privacy updated for user:', req.user.id);
    res.json({ success: true });
  } catch (e) {
    console.error('Settings privacy error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 3. Export all user data
app.get('/api/settings/export', auth, async (req, res) => {
  console.log('--- SETTINGS: DATA EXPORT ---');
  try {
    const [user, stats, scores, sessions, badges, answers, evaluations] = await Promise.all([
      pool.query('SELECT id, name, email, user_type, created_at FROM users WHERE id = $1', [req.user.id]),
      pool.query('SELECT * FROM user_stats WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT * FROM skill_scores WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT * FROM sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 50', [req.user.id]),
      pool.query('SELECT * FROM badges WHERE user_id = $1', [req.user.id]),
      pool.query(`SELECT a.* FROM answers a
        JOIN sessions s ON s.id = a.session_id
        WHERE s.user_id = $1
        ORDER BY a.submitted_at DESC LIMIT 100`, [req.user.id]),
      pool.query(`SELECT e.* FROM evaluations e
        JOIN sessions s ON s.id = e.session_id
        WHERE s.user_id = $1
        ORDER BY e.evaluated_at DESC LIMIT 100`, [req.user.id])
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: user.rows[0],
      stats: stats.rows[0] || {},
      skill_scores: scores.rows,
      sessions: sessions.rows,
      badges: badges.rows,
      answers: answers.rows,
      evaluations: evaluations.rows
    };

    console.log('Data exported for user:', req.user.id);
    res.json(exportData);
  } catch (e) {
    console.error('Settings export error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 4. Delete account
app.delete('/api/settings/delete-account', auth, async (req, res) => {
  console.log('--- SETTINGS: DELETE ACCOUNT ---');
  try {
    const userId = req.user.id;

    // Delete in correct order (foreign key constraints)
    await pool.query('DELETE FROM evaluations WHERE session_id IN (SELECT id FROM sessions WHERE user_id = $1)', [userId]);
    await pool.query('DELETE FROM answers WHERE session_id IN (SELECT id FROM sessions WHERE user_id = $1)', [userId]);
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM skill_scores WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM user_stats WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM badges WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM resume_profiles WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM payments WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM feedback WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM candidate_assessments WHERE company_user_id = $1', [userId]);
    await pool.query('DELETE FROM b2b_assessments WHERE company_user_id = $1', [userId]);
    await pool.query('DELETE FROM daily_challenge_responses WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM user_scenario_history WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    console.log('Account deleted for user:', userId);
    res.json({ success: true });
  } catch (e) {
    console.error('Delete account error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 5. Load user settings (privacy preferences)
app.get('/api/settings', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name, email, profile_public, in_leaderboard, allow_benchmarking, target_role, experience_level FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ settings: result.rows[0] || {} });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ═══════════════════════════════════════════════════════════════
// B2B COMPANY SETTINGS
// ═══════════════════════════════════════════════════════════════

// GET company settings
app.get('/api/b2b/settings', auth, async (req, res) => {
  try {
    // Add columns if they don't exist
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS team_size VARCHAR(20)');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS slack_webhook TEXT');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS zapier_webhook TEXT');
    } catch (e) { }

    const result = await pool.query(
      'SELECT company_name, team_size, slack_webhook, zapier_webhook FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ settings: result.rows[0] || {} });
  } catch (e) {
    console.error('B2B settings GET error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// SAVE company settings
app.post('/api/b2b/settings', auth, async (req, res) => {
  console.log('--- B2B SETTINGS SAVE ---');
  try {
    const { company_name, team_size, slack_webhook, zapier_webhook } = req.body;

    // Add columns if they don't exist
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS team_size VARCHAR(20)');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS slack_webhook TEXT');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS zapier_webhook TEXT');
    } catch (e) { }

    // Build dynamic update
    const updates = [];
    const values = [];
    let idx = 1;

    if (company_name !== undefined) { updates.push(`company_name = $${idx++}`); values.push(company_name); }
    if (team_size !== undefined) { updates.push(`team_size = $${idx++}`); values.push(team_size); }
    if (slack_webhook !== undefined) { updates.push(`slack_webhook = $${idx++}`); values.push(slack_webhook); }
    if (zapier_webhook !== undefined) { updates.push(`zapier_webhook = $${idx++}`); values.push(zapier_webhook); }

    if (updates.length === 0) return res.json({ success: true });

    values.push(req.user.id);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );

    console.log('B2B settings saved for user:', req.user.id);
    res.json({ success: true });
  } catch (e) {
    console.error('B2B settings POST error:', e.message);
    res.status(500).json({ error: e.message });
  }
});


const PORT = process.env.PORT || 4000;

// ── STARTUP DB MIGRATIONS ──
async function runMigrations() {
  try {
    await pool.query(`ALTER TABLE b2b_assessments ADD COLUMN IF NOT EXISTS questions JSONB`);
    await pool.query(`ALTER TABLE b2b_assessments ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 5`);
    await pool.query(`ALTER TABLE candidate_assessments ADD COLUMN IF NOT EXISTS overall_score NUMERIC(4,2)`);
    await pool.query(`ALTER TABLE candidate_assessments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`);
    await pool.query(`ALTER TABLE candidate_assessments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'not_started'`);
    await pool.query(`ALTER TABLE candidate_assessments ADD COLUMN IF NOT EXISTS hiring_decision VARCHAR(20)`);
    await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_period VARCHAR(10) DEFAULT 'monthly'`);
    await pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing_period VARCHAR(10) DEFAULT 'monthly'`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_public BOOLEAN DEFAULT true`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS in_leaderboard BOOLEAN DEFAULT true`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_benchmarking BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS team_size VARCHAR(20)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS slack_webhook TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS zapier_webhook TEXT`);
    await pool.query(`ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS question TEXT`);
    await pool.query(`ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS role_id VARCHAR(50)`);
    await pool.query(`ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS hint TEXT`);
    await pool.query(`ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 50`);
    await pool.query(`ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`);
    await pool.query(`ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS challenge_date DATE`);
    console.log('✅ DB migrations complete');
  } catch(e) {
    console.log('Migration note:', e.message);
  }
}

app.listen(PORT, async () => {
  await runMigrations();
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  CyberPrep API running on port ' + PORT);
  console.log('  Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('Endpoints:');
  console.log('  GET  /api/health');
  console.log('  POST /api/auth/signup');
  console.log('  POST /api/auth/login');
  console.log('  GET  /api/auth/me');
  console.log('  POST /api/payment/create-order');
  console.log('  POST /api/payment/verify');
  console.log('  POST /api/resume/upload');
  console.log('  POST /api/jd/upload');
  console.log('  POST /api/session/start');
  console.log('  POST /api/session/answer');
  console.log('  POST /api/session/complete');
  console.log('  GET  /api/scores');
  console.log('  GET  /api/sessions/:scenarioId');
  console.log('  POST /api/demo/evaluate');
  console.log('  GET  /api/candidate/assessment');
  console.log('  POST /api/candidate/submit');
  console.log('');
});

// Keep Render awake - ping every 10 minutes
setInterval(() => {
  fetch('https://threatready-db.onrender.com/health').catch(() => { });
}, 10 * 60 * 1000);