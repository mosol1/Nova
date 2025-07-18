// routes/downloads.js - Download management routes
const express = require('express');
const Download = require('../models/Download');
const { Analytics } = require('../models/Analytics');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validatePayload } = require('../utils/validation');
const { logUserActivity } = require('../utils/logger');

const router = express.Router();

// GET /api/downloads - Get all available downloads
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      product, 
      version, 
      beta = false, 
      limit = 10, 
      offset = 0 
    } = req.query;
    
    const query = { is_active: true };
    
    if (product) query.product_name = product;
    if (version) query.version = version;
    if (beta !== 'true') query.is_beta = false;
    
    const downloads = await Download.find(query)
      .sort({ release_date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-download_history');
    
    // Add user-specific information if authenticated
    if (req.user) {
      for (let download of downloads) {
        const userDownloads = download.download_history.filter(
          h => h.user_id && h.user_id.toString() === req.user._id.toString()
        );
        download._doc.user_download_count = userDownloads.length;
        download._doc.last_downloaded = userDownloads[userDownloads.length - 1]?.timestamp;
      }
    }
    
    res.json({
      downloads,
      total: await Download.countDocuments(query),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get downloads failed:', error);
    res.status(500).json({ error: 'Failed to fetch downloads' });
  }
});

// GET /api/downloads/:product - Get specific product downloads
router.get('/:product', optionalAuth, async (req, res) => {
  try {
    const { product } = req.params;
    const { beta = false } = req.query;
    
    const validProducts = ['Nova Cleaner', 'Nova Tweaker', 'Nova Gaming', 'Nova Monitor', 'Nova Suite'];
    if (!validProducts.includes(product)) {
      return res.status(400).json({ error: 'Invalid product name' });
    }
    
    const query = { 
      product_name: product, 
      is_active: true 
    };
    
    if (beta !== 'true') query.is_beta = false;
    
    const downloads = await Download.find(query)
      .sort({ release_date: -1 })
      .select('-download_history');
    
    if (downloads.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ product, downloads });
  } catch (error) {
    console.error('Get product downloads failed:', error);
    res.status(500).json({ error: 'Failed to fetch product downloads' });
  }
});

// POST /api/downloads/:id/download - Track download
router.post('/:id/download', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      download_source = 'website',
      user_agent,
      file_size 
    } = req.body;
    
    const download = await Download.findById(id);
    if (!download || !download.is_active) {
      return res.status(404).json({ error: 'Download not found or inactive' });
    }
    
    // Prepare download info
    const downloadInfo = {
      user_id: req.user?._id,
      ip_address: req.ip,
      user_agent: user_agent || req.get('User-Agent'),
      download_source,
      file_size: file_size || download.file_info?.file_size,
      timestamp: new Date()
    };
    
    // Increment download count
    await download.incrementDownload(downloadInfo);
    
    // Log analytics
    if (req.user) {
      const analytics = new Analytics({
        user_id: req.user._id,
        event_type: 'app_launch',
        product: download.product_name,
        version: download.version,
        data: {
          download_source,
          file_size: downloadInfo.file_size
        },
        timestamp: new Date(),
        ip_address: req.ip,
        user_agent: downloadInfo.user_agent
      });
      
      await analytics.save();
      logUserActivity(req.user, 'download', { product: download.product_name, version: download.version });
    }
    
    res.json({ 
      success: true, 
      download_url: download.file_info?.download_url,
      file_info: download.file_info,
      checksum: download.file_info?.checksum
    });
  } catch (error) {
    console.error('Download tracking failed:', error);
    res.status(500).json({ error: 'Failed to process download' });
  }
});

// GET /api/downloads/stats - Get download statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(days));
    
    // Total downloads by product
    const productStats = await Download.aggregate([
      { $match: { is_active: true } },
      {
        $group: {
          _id: '$product_name',
          total_downloads: { $sum: '$download_count' },
          latest_version: { $max: '$version' },
          release_count: { $sum: 1 }
        }
      },
      { $sort: { total_downloads: -1 } }
    ]);
    
    // Recent download activity
    const recentActivity = await Download.aggregate([
      { $unwind: '$download_history' },
      { $match: { 'download_history.timestamp': { $gte: dateFrom } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$download_history.timestamp' } },
            product: '$product_name'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    // Total statistics
    const totalStats = await Download.aggregate([
      { $match: { is_active: true } },
      {
        $group: {
          _id: null,
          total_downloads: { $sum: '$download_count' },
          total_products: { $sum: 1 },
          avg_downloads_per_product: { $avg: '$download_count' }
        }
      }
    ]);
    
    res.json({
      period_days: parseInt(days),
      product_stats: productStats,
      recent_activity: recentActivity,
      total_stats: totalStats[0] || {
        total_downloads: 0,
        total_products: 0,
        avg_downloads_per_product: 0
      }
    });
  } catch (error) {
    console.error('Download stats failed:', error);
    res.status(500).json({ error: 'Failed to fetch download statistics' });
  }
});

// POST /api/downloads/upload - Upload new version (admin only)
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    // Check admin permissions (implement based on your admin system)
    if (req.user.status !== 'Enterprise') { // Temporary admin check
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const validation = validatePayload(req.body, {
      product_name: { required: true, type: 'string' },
      version: { required: true, type: 'string' },
      file_info: { required: true, type: 'object' },
      release_notes: { type: 'string' },
      compatibility: { type: 'object' },
      is_beta: { type: 'boolean' }
    });
    
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }
    
    const {
      product_name,
      version,
      file_info,
      release_notes,
      compatibility,
      is_beta = false
    } = req.body;
    
    // Check if version already exists
    const existingDownload = await Download.findOne({ product_name, version });
    if (existingDownload) {
      return res.status(409).json({ error: 'Version already exists' });
    }
    
    const newDownload = new Download({
      product_name,
      version,
      file_info,
      release_notes,
      compatibility,
      is_beta,
      release_date: new Date()
    });
    
    await newDownload.save();
    
    logUserActivity(req.user, 'upload_version', { 
      product: product_name, 
      version, 
      is_beta 
    });
    
    res.status(201).json({ 
      success: true, 
      download: newDownload 
    });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: 'Failed to upload new version' });
  }
});

module.exports = router;