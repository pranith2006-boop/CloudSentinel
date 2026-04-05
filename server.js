require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: true, // Allow all origins for Vercel preview deployments
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Robust MongoDB connection for Vercel Serverless
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}

// Middleware: ensure DB is connected before any API request
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    res.status(503).json({ success: false, message: 'Database unavailable. Please try again.' });
  }
});

// Lazy-load models (avoids issues if Mongoose not connected yet)
function getModels() {
  // Require inside function to ensure models load after Mongoose is ready
  const TestExecution = require('./models/TestExecution');
  const Metric = require('./models/Metrics');
  const User = require('./models/User');
  return { TestExecution, Metric, User };
}

/* =========================
   ROUTES
========================= */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* =========================
   AUTHENTICATION
========================= */
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  try {
    const { User } = getModels();
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ success: false, message: 'Username already taken.' });
    const newUser = new User({ username, email, password });
    await newUser.save();
    res.json({ success: true, message: 'Account created! Please login.' });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ success: false, message: 'Server error. Please try again.', error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required.' });
  }
  try {
    const { User } = getModels();
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }
    res.json({
      success: true,
      token: 'cloudsentinel-token-' + Date.now(),
      user: { username: user.username, email: user.email }
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

/* =========================
   METRICS
========================= */
app.get('/api/metrics', async (req, res) => {
  try {
    const { Metric } = getModels();
    let metric = await Metric.findOne({ id: 'global' });
    if (!metric) metric = await Metric.create({ id: 'global' });
    res.json({ success: true, data: metric });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/* =========================
   TRIGGER TEST
========================= */
app.post('/api/tests/trigger', async (req, res) => {
  try {
    const { TestExecution, Metric } = getModels();
    const status = Math.random() > 0.3 ? 'PASSED' : 'FAILED';
    const test = await TestExecution.create({
      runId: 'RUN-' + Math.floor(Math.random() * 9999),
      runner: 'cloud-runner',
      environmentOs: 'Ubuntu',
      status,
      duration: Math.floor(Math.random() * 2000) + 'ms',
      coverage: Math.floor(Math.random() * 100) + '%'
    });
    let metric = await Metric.findOne({ id: 'global' });
    if (!metric) metric = await Metric.create({ id: 'global' });
    metric.totalRequests += 1;
    if (status === 'PASSED') metric.testPassRate = Math.min(100, metric.testPassRate + 5);
    await metric.save();
    res.json({ success: true, data: test });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/* =========================
   RECENT TESTS
========================= */
app.get('/api/tests/recent', async (req, res) => {
  try {
    const { TestExecution } = getModels();
    const tests = await TestExecution.find().sort({ completedAt: -1 }).limit(10);
    res.json({ success: true, data: tests });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/* =========================
   SERVER (local only)
========================= */
const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log('Server running on port ' + PORT));
}

module.exports = app;