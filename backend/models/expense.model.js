import mongoose from 'mongoose';
import crypto from 'crypto';

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
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
    min: 0,
    get: v => (v != null ? v / 100 : v),
    set: v => (v != null ? Math.round(v * 100) : v),
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  type: {
    type: String,
    required: true,
    enum: ['food', 'travel', 'entertainment', 'utilities', 'shopping', 'health', 'education', 'other'],
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
        min: 0,
        get: v => (v != null ? v / 100 : v),
        set: v => (v != null ? Math.round(v * 100) : v),
        validate: {
          validator: Number.isInteger,
          message: '{VALUE} is not an integer value'
        }
      }
    }
  ],
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

// Index for efficient queries
expenseSchema.index({ user: 1, group: 1 });
expenseSchema.index({ group: 1 });

expenseSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('splits') || this.isNew) {
    const payload = `${this.amount}-${this.user.toString()}-${this.group.toString()}`;
    const secret = process.env.DB_SECRET_KEY || 'default_secret';
    this.signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }
  next();
});

expenseSchema.post(['find', 'findOne'], function(docs) {
  if (!docs) return;
  const docsArray = Array.isArray(docs) ? docs : [docs];
  const secret = process.env.DB_SECRET_KEY || 'default_secret';
  for (let doc of docsArray) {
    if (doc.amount !== undefined && doc.signature && doc.user && doc.group) {
      const userStr = doc.user._id ? doc.user._id.toString() : doc.user.toString();
      const groupStr = doc.group._id ? doc.group._id.toString() : doc.group.toString();
      const payload = `${doc.amount}-${userStr}-${groupStr}`;
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      if (doc.signature !== expectedSignature) {
        doc.isTampered = true;
      }
    }
  }
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
