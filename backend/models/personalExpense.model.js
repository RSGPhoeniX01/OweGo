import mongoose from 'mongoose';
import crypto from 'crypto';

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
    min: 0,
    get: v => (v != null ? v / 100 : v),
    set: v => (v != null ? Math.round(v * 100) : v),
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
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
  },
  signature: {
    type: String
  },
  isTampered: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Compound index for efficient chart range queries per user
personalExpenseSchema.index({ user: 1, createdAt: -1 });
// Index for fast cleanup when a group expense is deleted/updated
personalExpenseSchema.index({ groupExpenseRef: 1 });

personalExpenseSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isNew) {
    const payload = `${this.amount}-${this.user.toString()}`;
    const secret = process.env.DB_SECRET_KEY || 'default_secret';
    this.signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }
  next();
});

personalExpenseSchema.post(['find', 'findOne'], function(docs) {
  if (!docs) return;
  const docsArray = Array.isArray(docs) ? docs : [docs];
  const secret = process.env.DB_SECRET_KEY || 'default_secret';
  for (let doc of docsArray) {
    if (doc.amount !== undefined && doc.signature && doc.user) {
      const userStr = doc.user._id ? doc.user._id.toString() : doc.user.toString();
      const payload = `${doc.amount}-${userStr}`;
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      if (doc.signature !== expectedSignature) {
        doc.isTampered = true;
      }
    }
  }
});

const PersonalExpense = mongoose.model('PersonalExpense', personalExpenseSchema);

export default PersonalExpense;
