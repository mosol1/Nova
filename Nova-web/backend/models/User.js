// models/User.js - User model
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  discord_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_data: {
    id: String,
    username: String,
    global_name: String,
    discriminator: String,
    avatar: String,
    avatar_decoration: String,
    banner: String,
    banner_color: String,
    accent_color: Number,
    locale: String,
    mfa_enabled: Boolean,
    premium_type: Number,
    public_flags: Number,
    elite_email: String
  },
  status: {
    type: String,
    enum: ['Free', 'Premium', 'Pro', 'Enterprise'],
    default: 'Free'
  },
  tweak_ratings: [{
    tweak_id: String,
    rating: Number,
    comment: String,
    date: { type: Date, default: Date.now }
  }],
  launch_history: [{
    product: String,
    version: String,
    timestamp: { type: Date, default: Date.now },
    session_duration: Number,
    features_used: [String]
  }],
  subscription: {
    type: {
      type: String,
      enum: ['free', 'premium', 'pro', 'enterprise']
    },
    start_date: Date,
    end_date: Date,
    auto_renew: { type: Boolean, default: false },
    payment_method: String
  },
  preferences: {
    theme: { type: String, default: 'dark' },
    notifications: { type: Boolean, default: true },
    auto_updates: { type: Boolean, default: true },
    telemetry: { type: Boolean, default: true },
    language: { type: String, default: 'en' }
  },
  api_usage: {
    requests_today: { type: Number, default: 0 },
    last_request: Date,
    rate_limit_reset: Date
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  last_login: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true },
  email_verified: { type: Boolean, default: false },
  discord_verified: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1, discord_id: 1 });
userSchema.index({ created_at: -1 });
userSchema.index({ last_login: -1 });
userSchema.index({ status: 1 });

// Pre-save middleware to update updated_at
userSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Instance methods
userSchema.methods.isPremium = function() {
  return ['Premium', 'Pro', 'Enterprise'].includes(this.status);
};

userSchema.methods.canAccessFeature = function(feature) {
  const featureMap = {
    'basic_optimization': ['Free', 'Premium', 'Pro', 'Enterprise'],
    'advanced_tweaks': ['Premium', 'Pro', 'Enterprise'],
    'gaming_optimization': ['Pro', 'Enterprise'],
    'enterprise_features': ['Enterprise']
  };
  
  return featureMap[feature]?.includes(this.status) || false;
};

userSchema.methods.updateLastLogin = function() {
  this.last_login = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);