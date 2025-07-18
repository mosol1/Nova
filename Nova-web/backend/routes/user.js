// routes/user.js - User management routes
const express = require('express');
const User = require('../models/User');
const { Analytics, SystemOptimization } = require('../models/Analytics');
const { authenticateToken, requirePremium } = require('../middleware/auth');
const { validatePayload, sanitizeInput } = require('../utils/validation');
const { logUserActivity } = require('../utils/logger');

const router = express.Router();

// GET /api/user/profile - Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'launch_history',
        options: { sort: { timestamp: -1 }, limit: 10 }
      });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Calculate usage statistics
    const totalOptimizations = await SystemOptimization.countDocuments({ user_id: user._id });
    const thisMonthOptimizations = await SystemOptimization.countDocuments({
      user_id: user._id,
      created_at: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    
    // Calculate total space saved
    const spaceStats = await SystemOptimization.aggregate([
      { $match: { user_id: user._id, success: true } },
      {
        $group: {
          _id: null,
          total_space_freed: { $sum: '$results.space_freed' },
          total_files_removed: { $sum: '$results.files_removed' },
          avg_performance_improvement: { $avg: '$results.performance_improvement' }
        }
      }
    ]);
    
    const stats = spaceStats[0] || {
      total_space_freed: 0,
      total_files_removed: 0,
      avg_performance_improvement: 0
    };
    
    res.json({
      user: {
        ...user.toObject(),
        stats: {
          total_optimizations: totalOptimizations,
          this_month_optimizations: thisMonthOptimizations,
          total_space_freed: stats.total_space_freed,
          total_files_removed: stats.total_files_removed,
          avg_performance_improvement: Math.round(stats.avg_performance_improvement || 0)
        }
      }
    });
  } catch (error) {
    console.error('Get profile failed:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = ['preferences', 'user_data'];
    const updates = {};
    
    for (const field of allowedUpdates) {
      if (req.body[field]) {
        updates[field] = req.body[field];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    logUserActivity(req.user, 'profile_update', updates);
    
    res.json({ user });
  } catch (error) {
    console.error('Update profile failed:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/user/dashboard - Get dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Recent optimizations
    const recentOptimizations = await SystemOptimization.find({
      user_id: req.user._id,
      created_at: { $gte: startDate }
    })
    .sort({ created_at: -1 })
    .limit(10);
    
    // Performance trends
    const performanceTrends = await SystemOptimization.aggregate([
      {
        $match: {
          user_id: req.user._id,
          created_at: { $gte: startDate },
          success: true
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
            type: '$optimization_type'
          },
          count: { $sum: 1 },
          avg_improvement: { $avg: '$results.performance_improvement' },
          total_space_freed: { $sum: '$results.space_freed' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    // System health overview
    const latestOptimization = await SystemOptimization.findOne({
      user_id: req.user._id
    }).sort({ created_at: -1 });
    
    const systemHealth = {
      last_optimization: latestOptimization?.created_at,
      current_performance: latestOptimization?.after_state || null,
      optimization_score: latestOptimization?.results?.performance_improvement || 0
    };
    
    // Product usage statistics
    const productUsage = await Analytics.aggregate([
      {
        $match: {
          user_id: req.user._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$product',
          usage_count: { $sum: 1 },
          last_used: { $max: '$timestamp' }
        }
      },
      { $sort: { usage_count: -1 } }
    ]);
    
    res.json({
      period_days: days,
      recent_optimizations: recentOptimizations,
      performance_trends: performanceTrends,
      system_health: systemHealth,
      product_usage: productUsage
    });
  } catch (error) {
    console.error('Dashboard data failed:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// POST /api/user/optimization - Record optimization results
router.post('/optimization', authenticateToken, async (req, res) => {
  try {
    const validation = validatePayload(req.body, {
      optimization_type: { 
        required: true, 
        type: 'string',
        custom: (value) => ['cleanup', 'registry', 'startup', 'gaming', 'privacy', 'performance'].includes(value)
      },
      results: { required: true, type: 'object' },
      before_state: { type: 'object' },
      after_state: { type: 'object' },
      settings_applied: { type: 'object' },
      product_version: { type: 'string' },
      system_info: { type: 'object' }
    });
    
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }
    
    const optimization = new SystemOptimization({
      user_id: req.user._id,
      ...req.body,
      created_at: new Date()
    });
    
    await optimization.save();
    
    // Update user's last activity
    await User.findByIdAndUpdate(req.user._id, { 
      $push: { 
        launch_history: {
          product: req.body.product_version?.split(' ')[0] || 'Nova',
          version: req.body.product_version,
          timestamp: new Date(),
          features_used: [req.body.optimization_type]
        }
      }
    });
    
    logUserActivity(req.user, 'optimization_completed', {
      type: req.body.optimization_type,
      space_freed: req.body.results?.space_freed,
      performance_improvement: req.body.results?.performance_improvement
    });
    
    res.status(201).json({ 
      success: true, 
      optimization_id: optimization._id,
      results: optimization.results
    });
  } catch (error) {
    console.error('Record optimization failed:', error);
    res.status(500).json({ error: 'Failed to record optimization' });
  }
});

// GET /api/user/optimizations - Get user's optimization history
router.get('/optimizations', authenticateToken, async (req, res) => {
  try {
    const { 
      type, 
      limit = 20, 
      offset = 0, 
      sort = 'created_at',
      order = 'desc'
    } = req.query;
    
    const query = { user_id: req.user._id };
    if (type) query.optimization_type = type;
    
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    const optimizations = await SystemOptimization.find(query)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await SystemOptimization.countDocuments(query);
    
    res.json({
      optimizations,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get optimizations failed:', error);
    res.status(500).json({ error: 'Failed to fetch optimization history' });
  }
});

// POST /api/user/feedback - Submit user feedback
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const { rating, comment, category, product } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const user = await User.findById(req.user._id);
    user.tweak_ratings.push({
      tweak_id: product || 'general',
      rating,
      comment: sanitizeInput(comment),
      date: new Date()
    });
    
    await user.save();
    
    // Record analytics event
    const analytics = new Analytics({
      user_id: req.user._id,
      event_type: 'user_action',
      product: product || 'Nova Suite',
      data: {
        action: 'feedback_submitted',
        rating,
        category,
        has_comment: !!comment
      },
      timestamp: new Date()
    });
    
    await analytics.save();
    
    logUserActivity(req.user, 'feedback_submitted', { rating, category, product });
    
    res.json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Submit feedback failed:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// GET /api/user/subscription - Get subscription info
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('status subscription preferences');
    
    const subscriptionInfo = {
      current_plan: user.status,
      subscription: user.subscription,
      features_available: [],
      usage_limits: {}
    };
    
    // Define features based on plan
    const featureMap = {
      'Free': ['basic_optimization', 'cleanup'],
      'Premium': ['basic_optimization', 'cleanup', 'advanced_tweaks', 'privacy'],
      'Pro': ['basic_optimization', 'cleanup', 'advanced_tweaks', 'privacy', 'gaming_optimization'],
      'Enterprise': ['all_features', 'priority_support', 'custom_settings']
    };
    
    subscriptionInfo.features_available = featureMap[user.status] || featureMap['Free'];
    
    // Usage limits based on plan
    const usageLimits = {
      'Free': { optimizations_per_day: 3, products_access: 2 },
      'Premium': { optimizations_per_day: 10, products_access: 3 },
      'Pro': { optimizations_per_day: 50, products_access: 4 },
      'Enterprise': { optimizations_per_day: -1, products_access: -1 } // unlimited
    };
    
    subscriptionInfo.usage_limits = usageLimits[user.status] || usageLimits['Free'];
    
    // Current usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOptimizations = await SystemOptimization.countDocuments({
      user_id: req.user._id,
      created_at: { $gte: today }
    });
    
    subscriptionInfo.current_usage = {
      optimizations_today: todayOptimizations
    };
    
    res.json(subscriptionInfo);
  } catch (error) {
    console.error('Get subscription failed:', error);
    res.status(500).json({ error: 'Failed to fetch subscription info' });
  }
});

// DELETE /api/user/account - Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { confirm_password } = req.body;
    
    if (!confirm_password) {
      return res.status(400).json({ error: 'Password confirmation required' });
    }
    
    const bcrypt = require('bcryptjs');
    const user = await User.findById(req.user._id);
    const isValidPassword = await bcrypt.compare(confirm_password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Mark user as inactive instead of deleting (for data retention)
    user.is_active = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    user.discord_id = `deleted_${Date.now()}_${user.discord_id}`;
    await user.save();
    
    // Clean up sessions
    res.clearCookie('auth_token');
    
    logUserActivity(req.user, 'account_deleted', {});
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account failed:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// GET /api/user/export - Export user data
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const optimizations = await SystemOptimization.find({ user_id: req.user._id });
    const analytics = await Analytics.find({ user_id: req.user._id }).limit(1000);
    
    const exportData = {
      user_profile: user,
      optimization_history: optimizations,
      analytics_data: analytics,
      export_date: new Date().toISOString(),
      data_retention_info: {
        retention_period: '2 years',
        deletion_policy: 'Data is automatically deleted after account deletion'
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="nova_data_export_${Date.now()}.json"`);
    res.json(exportData);
    
    logUserActivity(req.user, 'data_export', {});
  } catch (error) {
    console.error('Export data failed:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
});

module.exports = router;