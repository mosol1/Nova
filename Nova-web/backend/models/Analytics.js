// models/Analytics.js - Analytics and telemetry
const mongoose = require('mongoose');

// Analytics schema
const analyticsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  event_type: {
    type: String,
    required: true,
    enum: [
      'app_launch', 'app_close', 'feature_used', 'optimization_run',
      'error_occurred', 'crash_report', 'performance_metric', 'user_action'
    ]
  },
  product: {
    type: String,
    required: true,
    enum: ['Nova Cleaner', 'Nova Tweaker', 'Nova Gaming', 'Nova Monitor']
  },
  version: String,
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  performance_metrics: {
    cpu_usage: Number,
    memory_usage: Number,
    disk_usage: Number,
    execution_time: Number,
    files_processed: Number,
    optimization_score: Number
  },
  system_info: {
    os_version: String,
    cpu_model: String,
    total_memory: Number,
    disk_space: Number,
    gpu_model: String
  },
  session_id: String,
  timestamp: { type: Date, default: Date.now },
  ip_address: String,
  user_agent: String
}, {
  timestamps: true
});

// Indexes for performance
analyticsSchema.index({ user_id: 1, timestamp: -1 });
analyticsSchema.index({ event_type: 1, product: 1 });
analyticsSchema.index({ timestamp: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

// System Optimization schema
const systemOptimizationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  optimization_type: {
    type: String,
    required: true,
    enum: ['cleanup', 'registry', 'startup', 'gaming', 'privacy', 'performance']
  },
  results: {
    files_removed: { type: Number, default: 0 },
    space_freed: { type: Number, default: 0 }, // in bytes
    registry_entries_fixed: { type: Number, default: 0 },
    startup_items_disabled: { type: Number, default: 0 },
    performance_improvement: { type: Number, default: 0 }, // percentage
    time_taken: { type: Number, default: 0 } // in seconds
  },
  before_state: {
    cpu_usage: Number,
    memory_usage: Number,
    disk_usage: Number,
    startup_time: Number,
    available_space: Number
  },
  after_state: {
    cpu_usage: Number,
    memory_usage: Number,
    disk_usage: Number,
    startup_time: Number,
    available_space: Number
  },
  settings_applied: [{
    setting_name: String,
    old_value: mongoose.Schema.Types.Mixed,
    new_value: mongoose.Schema.Types.Mixed,
    category: String
  }],
  success: { type: Boolean, default: true },
  error_message: String,
  product_version: String,
  system_info: {
    os_version: String,
    cpu_cores: Number,
    total_memory: Number,
    disk_type: String
  },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
systemOptimizationSchema.index({ user_id: 1, created_at: -1 });
systemOptimizationSchema.index({ optimization_type: 1 });

const SystemOptimization = mongoose.model('SystemOptimization', systemOptimizationSchema);

module.exports = {
  Analytics,
  SystemOptimization
};