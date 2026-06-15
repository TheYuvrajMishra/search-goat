const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'New Investigation'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

SessionSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Session', SessionSchema);
