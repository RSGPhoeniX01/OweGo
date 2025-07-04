import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['food', 'transport', 'entertainment', 'utilities', 'shopping', 'health', 'education', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  splits: [
    {
      member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      share: {
        type: Number,
        required: true,
        min: 0
      }
    }
  ]
}, {
  timestamps: true
});

// Index for efficient queries
expenseSchema.index({ user: 1, group: 1 });
expenseSchema.index({ group: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
