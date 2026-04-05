require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const TestExecution = require('./models/TestExecution');
const Metric = require('./models/Metrics');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Basic route to index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Mock Authentication route
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if(username && password) {
    res.json({ success: true, message: 'Authenticated successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid credentials' });
  }
});

// Dashboard metrics API
app.get('/api/metrics', async (req, res) => {
  try {
    let metric = await Metric.findOne({ id: 'global' });
    if (!metric) {
      metric = await Metric.create({
        id: 'global',
        totalRequests: 0,
        vmDeployments: 0,
        storageAllocations: 0,
        testPassRate: 0
      });
    }
    
    // Calculate passing test rate from TestExecutions
    const totalTests = await TestExecution.countDocuments();
    const passedTests = await TestExecution.countDocuments({ status: 'PASSED' });
    if(totalTests > 0) {
      metric.testPassRate = Math.round((passedTests / totalTests) * 100);
      await metric.save();
    }
    
    res.json({ success: true, data: metric });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger tests API
app.post('/api/tests/trigger', async (req, res) => {
  try {
    // Determine random pass/fail for dummy data
    const isPass = Math.random() > 0.3;
    const status = isPass ? 'PASSED' : 'FAILED';
    const coverage = Math.floor(Math.random() * (100 - 60 + 1)) + 60; // 60-100%
    const durationMs = Math.floor(Math.random() * 2000) + 1500; // 1.5s - 3.5s
    const runId = 'RUN-' + Math.floor(1000 + Math.random() * 9000);

    const newTest = await TestExecution.create({
      runId: runId,
      runner: 'cloud-sentinel-runner',
      environmentOs: 'Ubuntu 22.04 LTS',
      status: status,
      duration: `${durationMs}ms`,
      coverage: `${coverage}%`,
      completedAt: new Date()
    });

    // Update global metrics
    let metric = await Metric.findOne({ id: 'global' });
    if (metric) {
      metric.totalRequests += 1;
      metric.vmDeployments += Math.floor(Math.random() * 5);
      metric.storageAllocations += Math.floor(Math.random() * 3);
      await metric.save();
    }

    res.json({ success: true, data: newTest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent tests API
app.get('/api/tests/recent', async (req, res) => {
  try {
    const tests = await TestExecution.find().sort({ completedAt: -1 }).limit(10);
    res.json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Connect DB & start server
const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
