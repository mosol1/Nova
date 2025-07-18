// models/ProtocolSession.js - Protocol handler sessions
const mongoose = require('mongoose');

const protocolSessionSchema = new mongoose.Schema({
    session_id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Can be null for unauthenticated sessions
    },
    action: {
      type: String,
      required: true,
      enum: ['login', 'download', 'activate', 'sync', 'update']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'expired'],
      default: 'pending'
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    expires_at: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }
    },
    created_at: { type: Date, default: Date.now },
    completed_at: Date,
    client_info: {
      app_version: String,
      os_version: String,
      hardware_id: String
    }
  });
  
  protocolSessionSchema.index({ expires_at: 1 });
  protocolSessionSchema.index({ status: 1 });
  
  const ProtocolSession = mongoose.model('ProtocolSession', protocolSessionSchema);
  
  module.exports = ProtocolSession;