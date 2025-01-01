const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,  // Ensure tokens are not duplicated
    index: true    // Index for faster lookup
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// Automatically delete expired tokens
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('BlacklistedToken', tokenSchema);
