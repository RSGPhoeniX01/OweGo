import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Ensure creator is always included in members array
groupSchema.pre('save', function(next) {
  if (this.isNew && !this.members.includes(this.creator)) {
    this.members.push(this.creator);
  }
  next();

});

const Group = mongoose.model('Group', groupSchema);

export default Group;
