// routes/protocol.js - Protocol handler routes
const express = require('express');
const protocolRouter = express.Router();
const ProtocolSession = require('../models/ProtocolSession');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');

// POST /api/protocol/init - Initialize protocol session
protocolRouter.post('/init', async (req, res) => {
  try {
    const { action, client_info } = req.body;
    
    const validActions = ['login', 'download', 'activate', 'sync', 'update'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry
    
    const session = new ProtocolSession({
      session_id: sessionId,
      action,
      client_info,
      expires_at: expiresAt,
      status: 'pending'
    });
    
    await session.save();
    
    res.json({ 
      session_id: sessionId,
      expires_at: expiresAt,
      protocol_url: `nova://${action}/${sessionId}`,
      web_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/protocol/${sessionId}`
    });
  } catch (error) {
    console.error('Protocol init failed:', error);
    res.status(500).json({ error: 'Failed to initialize protocol session' });
  }
});

// GET /api/protocol/:sessionId - Get protocol session status
protocolRouter.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ProtocolSession.findOne({ session_id: sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.expires_at < new Date()) {
      session.status = 'expired';
      await session.save();
      return res.status(410).json({ error: 'Session expired' });
    }
    
    res.json({
      session_id: session.session_id,
      action: session.action,
      status: session.status,
      data: session.data,
      expires_at: session.expires_at
    });
  } catch (error) {
    console.error('Protocol session get failed:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
});

// POST /api/protocol/:sessionId/complete - Complete protocol session
protocolRouter.post('/:sessionId/complete', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { data } = req.body;
    
    const session = await ProtocolSession.findOne({ session_id: sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status !== 'pending') {
      return res.status(400).json({ error: 'Session already completed or failed' });
    }
    
    if (session.expires_at < new Date()) {
      session.status = 'expired';
      await session.save();
      return res.status(410).json({ error: 'Session expired' });
    }
    
    // Update session with completion data
    session.status = 'completed';
    session.user_id = req.user._id;
    session.data = data || {};
    session.completed_at = new Date();
    
    await session.save();
    
    // Handle different action types
    let responseData = {};
    switch (session.action) {
      case 'login':
        responseData = {
          user: {
            id: req.user._id,
            email: req.user.email,
            username: req.user.user_data?.username,
            avatar: req.user.user_data?.avatar,
            status: req.user.status
          }
        };
        break;
      case 'download':
        // Provide download links or data
        responseData = { download_authorized: true };
        break;
      case 'activate':
        // Handle activation logic
        responseData = { activation_status: 'success' };
        break;
    }
    
    logUserActivity(req.user, 'protocol_complete', { 
      action: session.action, 
      session_id: sessionId 
    });
    
    res.json({ 
      success: true, 
      session_id: sessionId,
      action: session.action,
      data: responseData
    });
  } catch (error) {
    console.error('Protocol complete failed:', error);
    res.status(500).json({ error: 'Failed to complete protocol session' });
  }
});

// POST /api/protocol/:sessionId/fail - Mark session as failed
protocolRouter.post('/:sessionId/fail', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { error_message } = req.body;
    
    const session = await ProtocolSession.findOne({ session_id: sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    session.status = 'failed';
    session.data = { error_message };
    session.completed_at = new Date();
    
    await session.save();
    
    res.json({ success: true, status: 'failed' });
  } catch (error) {
    console.error('Protocol fail failed:', error);
    res.status(500).json({ error: 'Failed to mark session as failed' });
  }
});

module.exports = protocolRouter;