// models/Download.js - Download tracking model
const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
    product_name: {
      type: String,
      required: true,
      enum: ['Nova Cleaner', 'Nova Tweaker', 'Nova Gaming', 'Nova Monitor', 'Nova Suite']
    },
    version: {
      type: String,
      required: true
    },
    download_count: {
      type: Number,
      default: 0
    },
    download_history: [{
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      ip_address: String,
      user_agent: String,
      timestamp: { type: Date, default: Date.now },
      download_source: String, // 'website', 'api', 'auto-update'
      file_size: Number,
      download_completed: { type: Boolean, default: false }
    }],
    release_notes: String,
    file_info: {
      filename: String,
      file_size: Number,
      checksum: String,
      download_url: String,
      mirrors: [String]
    },
    compatibility: {
      min_windows_version: String,
      max_windows_version: String,
      architecture: [String], // ['x64', 'x86', 'arm64']
      requirements: [String]
    },
    is_active: { type: Boolean, default: true },
    is_beta: { type: Boolean, default: false },
    release_date: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }
  }, {
    timestamps: true
  });
  
  downloadSchema.index({ product_name: 1, version: -1 });
  downloadSchema.index({ release_date: -1 });
  downloadSchema.index({ is_active: 1, is_beta: 1 });
  
  downloadSchema.methods.incrementDownload = function(downloadInfo = {}) {
    this.download_count += 1;
    this.download_history.push({
      ...downloadInfo,
      timestamp: new Date()
    });
    return this.save();
  };
  
  const Download = mongoose.model('Download', downloadSchema);
  
  module.exports = Download;