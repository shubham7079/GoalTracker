
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

import User from './models/User.js';
import Goal from './models/Goal.js';
import auth from './middleware/auth.js';

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;

if (!mongoURI || mongoURI.includes('<db_password>')) {
  console.warn('⚠️ WARNING: MONGO_URI is not configured correctly in .env');
}

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected to Atlas'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
  });

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id } };
    const secret = process.env.JWT_SECRET || 'secret';
    jwt.sign(payload, secret, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } });
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: 'Server Error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const payload = { user: { id: user.id } };
    const secret = process.env.JWT_SECRET || 'secret';
    jwt.sign(payload, secret, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

// GOAL ROUTES
app.get('/api/goals', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(goals.map(g => ({ ...g._doc, id: g._id }))); 
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch goals' });
  }
});

app.post('/api/goals', auth, async (req, res) => {
  try {
    const newGoal = new Goal({ ...req.body, userId: req.user.id });
    const goal = await newGoal.save();
    res.json({ ...goal._doc, id: goal._id });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to create goal' });
  }
});

app.put('/api/goals/:id', auth, async (req, res) => {
  try {
    let goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ msg: 'Goal not found' });
    if (goal.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    goal = await Goal.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json({ ...goal._doc, id: goal._id });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to update goal' });
  }
});

app.post('/api/goals/:id/complete', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ msg: 'Goal not found' });

    const now = new Date();
    const lastWin = goal.lastCompleted ? new Date(goal.lastCompleted) : null;
    const isSameDay = lastWin && 
                      lastWin.getDate() === now.getDate() && 
                      lastWin.getMonth() === now.getMonth() && 
                      lastWin.getFullYear() === now.getFullYear();

    if (isSameDay) {
      return res.status(400).json({ msg: 'Goal already completed today!' });
    }

    goal.streak += 1;
    if (goal.streak > 0 && goal.streak % 7 === 0) goal.currentLevel += 1;
    goal.lastCompleted = now;
    goal.completionHistory.push(now);
    
    await goal.save();
    res.json({ ...goal._doc, id: goal._id });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to complete goal' });
  }
});

app.delete('/api/goals/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ msg: 'Goal not found' });
    if (goal.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
    
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Goal removed' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to delete goal' });
  }
});

// Global error handler for unexpected issues
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
