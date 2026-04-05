require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const TestExecution = require('./models/TestExecution');
const Metric = require('./models/Metrics');
const User = require('./models/User');

const app = express();

app.use(cors({
  origin: ['http://localhost:4000', 'https://cloudsentinal.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());


// Static Files

// Static Files

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



/* =========================
   AUTHENTICATION
========================= */

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ success: false, message: "User already exists" });

    const newUser = new User({ username, email, password });
    await newUser.save();
    res.json({ success: true, message: "Registered successfully" });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      token: "cloudsentinel-token-" + Date.now(),
      user: { username: user.username, email: user.email }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});






/* =========================
   METRICS
========================= */

app.get('/api/metrics', async (req, res) => {

try {

let metric = await Metric.findOne({ id: "global" });

if (!metric) {
metric = await Metric.create({ id: "global" });
}

res.json({
success: true,
data: metric
});

} catch (e) {

res.status(500).json({
error: e.message
});

}

});



/* =========================
   TRIGGER TEST
========================= */

app.post('/api/tests/trigger', async (req, res) => {

try {

const status = Math.random() > 0.3 ? "PASSED" : "FAILED";

const test = await TestExecution.create({

runId: "RUN-" + Math.floor(Math.random() * 9999),

runner: "cloud-runner",

environmentOs: "Ubuntu",

status,

duration: Math.floor(Math.random() * 2000) + "ms",

coverage: Math.floor(Math.random() * 100) + "%"

});

let metric = await Metric.findOne({ id: "global" });

if (!metric) {

metric = await Metric.create({ id: "global" });

}

metric.totalRequests += 1;

if (status === "PASSED") {
metric.testPassRate += 5;
}

await metric.save();

res.json({
success: true,
data: test
});

} catch (e) {

res.status(500).json({
error: e.message
});

}

});



/* =========================
   RECENT TESTS
========================= */

app.get('/api/tests/recent', async (req, res) => {

try {

const tests = await TestExecution
.find()
.sort({ completedAt: -1 })
.limit(10);

res.json({
success: true,
data: tests
});

} catch (e) {

res.status(500).json({
error: e.message
});

}

});



/* =========================
   MONGODB
========================= */

mongoose
.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));



/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {

console.log("Server running on port " + PORT);

});