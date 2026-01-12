
import mongoose from 'mongoose';

const GoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  dailyTarget: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Fitness', 'Mindset', 'Learning', 'Work', 'Personal', 'Other'],
    default: 'Other' 
  },
  currentLevel: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  lastCompleted: { type: Date, default: null },
  completionHistory: [{ type: Date }],
  reminderTime: { type: String },
  reminderFrequency: { type: String, enum: ['Daily', 'Weekly', 'None'], default: 'None' },
  reminderDays: [{ type: Number }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Goal', GoalSchema);
