import mongoose from 'mongoose';

const personalExpenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 'manual' = user-entered; 'group' = auto-derived from a group expense
  source: {
    type: String,
    enum: ['manual', 'group'],
    default: 'manual'
  },
  // Reference to the originating group expense for sync on update/delete
  groupExpenseRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    default: null
  },
  type: {
    type: String,
    enum: ['spent', 'lent'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['food', 'travel', 'entertainment', 'utilities', 'shopping', 'health', 'education', 'other'],
    default: 'other'
  },
  description: {
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  note: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index for efficient chart range queries per user
personalExpenseSchema.index({ user: 1, createdAt: -1 });
// Index for fast cleanup when a group expense is deleted/updated
personalExpenseSchema.index({ groupExpenseRef: 1 });

const PersonalExpense = mongoose.model('PersonalExpense', personalExpenseSchema);

export default PersonalExpense;
