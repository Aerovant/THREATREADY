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
    const token = jwt.sign({ id: result.rows[0].id, email }, JWT_SECRET, { expiresIn: '7d' });

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

    const token = jwt.sign({ id: result.rows[0].id, email }, JWT_SECRET, { expiresIn: '7d' });
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
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.created_at,
              s.plan, s.status, s.trial_end, s.subscribed_roles
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const stats = await pool.query('SELECT * FROM user_stats WHERE user_id = $1', [req.user.id]);

    res.json({
      user: result.rows[0],
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

const calculatePrice = (roleCount) => {
  const base = roleCount * 399;
  if (roleCount >= 3) return Math.round(base * 0.7);
  if (roleCount >= 2) return Math.round(base * 0.82);
  return base;
};

// Create payment order
app.post('/api/payment/create-order', auth, async (req, res) => {
  console.log('--- PAYMENT ORDER ---');
  try {
    const { roles } = req.body;
    if (!roles || !roles.length) {
      return res.status(400).json({ error: 'Select at least one role' });
    }

    const amount = calculatePrice(roles.length) * 100; // Razorpay uses paise

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `order_${req.user.id}_${Date.now()}`,
      notes: { user_id: String(req.user.id), roles: roles.join(',') }
    });

    console.log('Order created:', order.id, 'Amount: INR', amount / 100);
    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      roles
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, roles } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.log('Signature mismatch!');
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Activate subscription
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await pool.query(
      `INSERT INTO subscriptions (user_id, plan, status, subscribed_roles, payment_id, start_date, end_date, created_at)
       VALUES ($1, 'paid', 'active', $2, $3, NOW(), $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         plan = 'paid', status = 'active', subscribed_roles = $2,
         payment_id = $3, end_date = $4`,
      [req.user.id, JSON.stringify(roles), razorpay_payment_id, endDate]
    );

    // Save payment record
    await pool.query(
      'INSERT INTO payments (user_id, razorpay_order_id, razorpay_payment_id, amount, status, roles, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [req.user.id, razorpay_order_id, razorpay_payment_id, calculatePrice(roles.length) * 100, 'captured', JSON.stringify(roles)]
    );

    console.log('PAYMENT VERIFIED! Subscription activated for user:', req.user.id);
    res.json({ success: true, subscribed_roles: roles, valid_until: endDate });
  } catch (e) {
    console.error('Payment verify error:', e.message);
    res.status(500).json({ error: 'Payment verification error' });
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
      model: 'claude-sonnet-4-20250514',
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
      model: 'claude-sonnet-4-20250514',
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
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  console.log('--- SEND OTP ---');
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Check user exists
    const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save OTP to DB
    await pool.query(
      'UPDATE users SET verify_code = $1, verify_expiry = $2 WHERE email = $3',
      [otp, expiry, email]
    );

    // Send email
    await transporter.sendMail({
      from: `"Threatready" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Threatready — Your Verification Code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0e1a;color:#e8eaf6;padding:32px;border-radius:12px">
          <h2 style="color:#00e5ff;margin-bottom:8px">Threatready  Verification</h2>
          <p style="color:#8890b0">Use the code below to verify your account.</p>
          <div style="background:#1a1f2e;border:1px solid #1e2536;border-radius:10px;padding:24px;text-align:center;margin:24px 0">
            <div style="font-size:36px;font-weight:900;letter-spacing:12px;color:#00e5ff;font-family:monospace">${otp}</div>
          </div>
          <p style="color:#5a6380;font-size:12px">Expires in 15 minutes. Do not share this code.</p>
        </div>
      `
    });

    console.log('OTP sent to:', email);
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

    console.log('User verified:', email);
    res.json({ success: true, message: 'Email verified successfully' });
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
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`http://localhost:5173/auth/callback?token=${token}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);

  } catch (e) {
    console.error('Google OAuth error:', e.message);
    res.redirect('http://localhost:5173/auth/callback?error=google_failed');
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
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`http://localhost:5173/auth/callback?token=${token}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(primaryEmail)}&provider=github`);

  } catch (e) {
    console.error('GitHub OAuth error:', e.message);
    res.redirect('http://localhost:5173/auth/callback?error=github_failed');
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
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.name, u.email,
              us.total_xp, us.streak,
              COUNT(s.id) as total_sessions,
              ROUND(AVG(s.overall_score)::numeric, 1) as avg_score
       FROM users u
       JOIN user_stats us ON us.user_id = u.id
       LEFT JOIN sessions s ON s.user_id = u.id AND s.completed_at IS NOT NULL
       GROUP BY u.id, u.name, u.email, us.total_xp, us.streak
       ORDER BY us.total_xp DESC
       LIMIT 20`
    );
    res.json({ leaderboard: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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
        model: 'claude-sonnet-4-20250514',
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
app.post('/api/evaluate', auth, async (req, res) => {
  console.log('--- AI EVALUATE ---');
  try {
    const { question, answer, scenario_context, difficulty } = req.body;
    if (!answer?.trim()) return res.status(400).json({ error: 'Answer required' });

    const diffRubric = difficulty === "beginner"
      ? "Be encouraging. Give credit for partial understanding. Highlight what they got right first."
      : difficulty === "intermediate"
      ? "Be balanced. Credit correct reasoning but penalize technical gaps."
      : difficulty === "advanced"
      ? "Be strict. Apply interview-grade standards. Challenge incomplete thinking."
      : "Be rigorous. Expert-level expectations. Challenge assumptions and require defensive reasoning.";

    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Get resume context if available
    let resumeCtx = '';
    try {
      const resumeResult = await pool.query('SELECT resume_text FROM resume_profiles WHERE user_id = $1', [req.user.id]);
      resumeCtx = resumeResult.rows[0]?.resume_text || '';
    } catch (e) {}

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are an expert cybersecurity interview evaluator. ${diffRubric}

SCENARIO: ${scenario_context?.title} - ${scenario_context?.description}
DIFFICULTY: ${difficulty?.toUpperCase()}
CATEGORY: ${scenario_context?.category}
QUESTION: ${question}
CANDIDATE ANSWER: ${answer}
${resumeCtx ? 'CANDIDATE BACKGROUND: ' + resumeCtx.substring(0, 500) : ''}

Also generate the NEXT adaptive follow-up question based on their answer.

Respond ONLY in valid JSON with no markdown:
{"score":7,"category":"${scenario_context?.category}","strengths":"1-2 sentences on what was good","weaknesses":"1-2 sentences on gaps","improved_answer":"ideal answer in 3-4 sentences","communication_score":7,"depth_score":7,"decision_score":7,"follow_up_topic":"next adaptive question based on their answer","follow_up_category":"category for follow-up"}`
      }]
    });

    const evalText = msg.content[0]?.text || '{}';
    const evalResult = JSON.parse(evalText.replace(/```json|```/g, '').trim());

    // Save to DB in background if session exists
    const { session_id, question_id } = req.body;
    if (session_id && question_id) {
      pool.query(
        `INSERT INTO answers (session_id, question_id, question_number, answer_text, input_mode, submitted_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [session_id, question_id, 1, answer, 'text']
      ).catch(e => console.log('DB save skipped:', e.message));

      pool.query(
        `INSERT INTO evaluations (session_id, question_id, score, communication_score, depth_score, strengths, weaknesses, improved_answer, follow_up_topic, evaluated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [session_id, question_id, evalResult.score, evalResult.communication_score,
         evalResult.depth_score, evalResult.strengths, evalResult.weaknesses,
         evalResult.improved_answer, evalResult.follow_up_topic]
      ).catch(e => console.log('Eval DB save skipped:', e.message));
    }

    console.log('Evaluated! Score:', evalResult.score, '/10');
    res.json(evalResult);

  } catch (e) {
    console.error('Evaluate error:', e.message);
    res.status(500).json({ error: e.message });
  }
});




const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
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
  console.log('');
});
