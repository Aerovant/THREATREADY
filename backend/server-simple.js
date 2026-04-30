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

// Optional auth — sets req.user if a valid token exists, but allows guests through
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    req.user = null;
  }
  next();
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

    const result = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
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
    res.json({ user: { id: result.rows[0].id, name: result.rows[0].name, email }, token });
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
app.post('/api/session/start', optionalAuth, async (req, res) => {
  console.log('--- SESSION START ---', req.user ? `user=${req.user.id}` : 'guest/trial');
  try {
    const { scenario_id, interview_mode } = req.body;
    const userId = req.user?.id || null;
    const result = await pool.query(
      'INSERT INTO sessions (user_id, scenario_id, interview_mode, started_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
      [userId, scenario_id, interview_mode || false]
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
      'INSERT INTO answers (session_id, question_id, answer_text, input_mode, submitted_at) VALUES ($1, $2, $3, $4, NOW())',
      [session_id, question_id, answer_text, input_mode || 'text']
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
// AI Evaluation (called by frontend)
app.post('/api/evaluate', async (req, res) => {
  console.log('--- AI EVALUATION ---');
  try {
    const { prompt } = req.body;
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });
    
    console.log('Evaluation complete');
    res.json({ content: msg.content });
  } catch (e) {
    console.error('Evaluation error:', e.message);
    res.status(500).json({ error: e.message });
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

// ═══ GOOGLE OAUTH ═══
// ═══ GOOGLE LOGIN (redirect method) ═══
app.get('/api/auth/google', (req, res) => {
  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' +
    'client_id=' + process.env.GOOGLE_CLIENT_ID +
    '&redirect_uri=' + encodeURIComponent('http://localhost:4000/api/auth/google/callback') +
    '&response_type=code' +
    '&scope=email%20profile' +
    '&prompt=select_account';
  res.json({ url });
});

app.get('/api/auth/google/callback', async (req, res) => {
  console.log('--- GOOGLE CALLBACK ---');
  try {
    const { code } = req.query;
    const axios = require('axios');

    // Exchange code for tokens
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code: code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'http://localhost:4000/api/auth/google/callback',
      grant_type: 'authorization_code'
    });

    // Get user info
    const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': 'Bearer ' + tokenRes.data.access_token }
    });

    const email = userRes.data.email;
    const name = userRes.data.name;
    console.log('Google user:', name, email);

    // Check if user exists
    let result = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO users (name, email, password_hash, auth_provider, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, name, email',
        [name, email, 'google-oauth', 'google']
      );
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);
      await pool.query(
        'INSERT INTO subscriptions (user_id, plan, status, trial_end, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [result.rows[0].id, 'free_trial', 'active', trialEnd]
      );
      console.log('New Google user created!');
    }

    const token = jwt.sign({ id: result.rows[0].id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.redirect('http://localhost:5173?token=' + token + '&name=' + encodeURIComponent(name));
  } catch (e) {
    console.error('Google error:', e.message);
    res.redirect('http://localhost:5173?error=google_failed');
  }
});
// ═══ GITHUB OAUTH ═══
const axios = require('axios');

// Step 1: Redirect to GitHub
app.get('/api/auth/github', (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user:email`;
  res.json({ url });
});

// Step 2: GitHub callback
app.get('/api/auth/github/callback', async (req, res) => {
  console.log('--- GITHUB LOGIN ---');
  try {
    const { code } = req.query;
    
    // Exchange code for access token
    const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code
    }, {
      headers: { 'Accept': 'application/json' }
    });
    
    const accessToken = tokenRes.data.access_token;
    
    // Get user info from GitHub
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    
    // Get email (might be private)
    const emailRes = await axios.get('https://api.github.com/user/emails', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    
    const email = emailRes.data.find(e => e.primary)?.email || userRes.data.email || userRes.data.login + '@github.com';
    const name = userRes.data.name || userRes.data.login;
    
    console.log('GitHub user:', email);
    
    // Check if user exists
    let result = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO users (name, email, password_hash, auth_provider, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, name, email',
        [name, email, 'github-oauth', 'github']
      );
      
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);
      await pool.query(
        'INSERT INTO subscriptions (user_id, plan, status, trial_end, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [result.rows[0].id, 'free_trial', 'active', trialEnd]
      );
      console.log('New GitHub user created:', email);
    }
    
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    // Redirect to frontend with token
    res.redirect(process.env.FRONTEND_URL + '?token=' + token + '&name=' + encodeURIComponent(user.name));
  } catch (e) {
    console.error('GitHub auth error:', e.message);
    res.redirect(process.env.FRONTEND_URL + '?error=github_failed');
  }
});
// ═══════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════
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