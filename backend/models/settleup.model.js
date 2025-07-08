import mongoose from 'mongoose';

const settleUpSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  settledBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  isSettled: {
    type: Boolean,
    default: false
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

const SettleUp = mongoose.model('SettleUp', settleUpSchema);
export default SettleUp;
