// routes/auth.js - Enhanced authentication routes with Discord OAuth
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const DiscordOAuthService = require('../services/discordOAuth');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const axios = require('axios');

// Auth-specific rate limiter for login/register endpoints
const authLimiter = process.env.NODE_ENV === 'production' ? rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
}) : (req, res, next) => next(); // Skip rate limiting in development

const router = express.Router();
const discordOAuth = new DiscordOAuthService();

// Smart environment switching for frontend URL
const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = isProduction 
  ? process.env.FRONTEND_URL_PROD || 'https://novaoptimizer.com'
  : process.env.FRONTEND_URL_DEV || 'http://localhost:5173';

// Smart JWT secret switching
const JWT_SECRET = isProduction 
  ? process.env.JWT_SECRET_PROD || process.env.JWT_SECRET || '12f88242285772379b9f315b0cd4965aedbca375fe85e33e10ba2a1acd383c96435390fb'
  : process.env.JWT_SECRET_DEV || process.env.JWT_SECRET || 'dev-jwt-secret-not-for-production';

console.log(`🌐 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
console.log(`🔑 Using JWT secret: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// Helper function to create session token
const createSessionToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email,
      discord_id: user.discord_id 
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Helper function to set user session cookies
const setUserSession = (res, user, token) => {
  // Set auth token cookie (make it readable by frontend for OAuth redirects)
  res.cookie('auth_token', token, {
    ...cookieOptions,
    httpOnly: false // Allow frontend access for OAuth flows
  });
  
  // Set user data cookie (non-sensitive data for frontend)
  const userDataCookie = {
    _id: user._id,
    email: user.email,
    discord_id: user.discord_id,
    user_data: user.user_data,
    status: user.status,
  };
  
  res.cookie('user_data', JSON.stringify(userDataCookie), {
    ...cookieOptions,
    httpOnly: false // Allow frontend access
  });
};

// Helper function to clear user session
const clearUserSession = (res) => {
  res.clearCookie('auth_token');
  res.clearCookie('user_data');
};

// POST /api/auth/discord - Start Discord OAuth flow
router.post('/discord', authLimiter, async (req, res) => {
  try {
    console.log('📱 Starting Discord OAuth flow...');
    const { state } = req.body;
    console.log('🔍 Received state parameter:', state);

    // Generate OAuth URL with state
    const authUrl = discordOAuth.generateAuthUrl(state);
    
    res.json({
      success: true,
      auth_url: authUrl,
      message: 'Discord OAuth URL generated successfully'
    });
  } catch (error) {
    console.error('❌ Discord OAuth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Discord OAuth URL'
    });
  }
});

// POST /api/auth/discord/callback - Handle Discord OAuth callback
router.post('/discord/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }

    console.log('📱 Processing Discord OAuth callback...');

    // Exchange code for user data using the correct method
    const result = await discordOAuth.completeOAuthFlow(code, state);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to fetch user data from Discord'
      });
    }

    const { user_data } = result;

    // Check if user exists by Discord ID
    const existingUser = await User.findOne({ discord_id: user_data.id });

    if (existingUser) {
      // User exists, log them in
      const token = createSessionToken(existingUser);
      setUserSession(res, existingUser, token);

      // Update last login
      existingUser.last_login = new Date();
      await existingUser.save();

      console.log('✅ User signed in with Discord:', existingUser.email);

      return res.json({
        success: true,
        user: {
          _id: existingUser._id,
          email: existingUser.email,
          discord_id: existingUser.discord_id,
          user_data: existingUser.user_data,
          status: existingUser.status,
        },
        token: token,
        message: 'Discord login successful'
      });
    } else {
      // Return user data for registration
      return res.json({
        success: true,
        discord_data: user_data,
        requires_registration: true,
        message: 'Discord authentication successful, registration required'
      });
    }
  } catch (error) {
    console.error('❌ Discord callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Discord authentication failed'
    });
  }
});

// POST /api/auth/register - Register new user
router.post('/register', authLimiter, [
  body('email').isEmail(), // Removed normalizeEmail() to preserve dots
  body('password').isLength({ min: 8 }),
  body('discord_id').notEmpty(),
  body('user_data').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, discord_id, user_data } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { discord_id }] 
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: existingUser.email === email ? 'Email already registered' : 'Discord account already linked'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user with properly preserved email and global_name
    const newUser = new User({
      email: email.trim(), // Preserve exact email format
      password: hashedPassword,
      discord_id,
      user_data: {
        ...user_data,
        elite_email: email.trim(), // Use the exact email entered
        global_name: user_data.global_name || user_data.username // Ensure global_name is preserved
      },
      status: 'Free',
      created_at: new Date(),
      last_login: new Date()
    });

    await newUser.save();

    // Assign Discord verified role after successful registration
    try {
      const roleResult = await discordOAuth.assignRoleToUser(discord_id);
      if (roleResult.success) {
        console.log('✅ Discord verified role assigned to user:', email);
      } else {
        console.log('⚠️  Failed to assign Discord role:', roleResult.reason || roleResult.error);
      }
    } catch (roleError) {
      console.log('⚠️  Error assigning Discord role:', roleError.message);
    }

    // Create session token
    const token = createSessionToken(newUser);
    setUserSession(res, newUser, token);

    console.log('✅ User registered successfully:', email);

    res.status(201).json({
      success: true,
      user: {
        _id: newUser._id,
        email: newUser.email,
        discord_id: newUser.discord_id,
        user_data: newUser.user_data,
        status: newUser.status,
      },
      token: token,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// POST /api/auth/login - Login with email and password
router.post('/login', authLimiter, [
  body('email').isEmail(), // Removed normalizeEmail() to preserve dots
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Create session token
    const token = createSessionToken(user);
    setUserSession(res, user, token);

    console.log('✅ User logged in successfully:', email);

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        discord_id: user.discord_id,
        user_data: user.user_data,
        status: user.status,
        last_login: user.last_login
      },
      token: token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', (req, res) => {
  try {
    clearUserSession(res);
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        discord_id: user.discord_id,
        user_data: user.user_data,
        status: user.status,
        created_at: user.created_at,
        last_login: user.last_login,
      }
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

// GET /api/auth/user_info - Get user info with Discord profile picture
router.get('/user_info', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = user.user_data;
    let profilePictureBase64 = '';

    // Get Discord profile picture
    if (userData.avatar && userData.id) {
      try {
        const profilePictureUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
        const response = await axios.get(profilePictureUrl, { responseType: 'arraybuffer' });
        profilePictureBase64 = Buffer.from(response.data).toString('base64');
      } catch (error) {
        console.log('⚠️  Failed to load profile picture, using default');
        // Use default Discord avatar if user avatar fails
        const defaultAvatarUrl = `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator) % 5}.png`;
        try {
          const defaultResponse = await axios.get(defaultAvatarUrl, { responseType: 'arraybuffer' });
          profilePictureBase64 = Buffer.from(defaultResponse.data).toString('base64');
        } catch (defaultError) {
          console.log('⚠️  Failed to load default avatar');
        }
      }
    }

    res.json({
      success: true,
      display_name: userData.global_name || userData.username,
      image: profilePictureBase64,
      join_date: userData.join_date,
      email: userData.elite_email || user.email,
      discord: userData.username,
      locale: userData.locale,
      is_mod: false, // TODO: Implement mod role check
      status: user.status,
    });
  } catch (error) {
    console.error('❌ Get user info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

// POST /api/auth/refresh - Refresh authentication token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const newToken = createSessionToken(user);
    setUserSession(res, user, newToken);

    res.json({
      success: true,
      token: newToken,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

// GET /api/auth/discord/start - Start Discord OAuth flow
router.get('/discord/start', (req, res) => {
  try {
    const state = Math.random().toString(36).substring(2, 15);
    const authUrl = discordOAuth.generateAuthUrl(state);
    
    res.json({
      success: true,
      auth_url: authUrl,
      state: state
    });
  } catch (error) {
    console.error('❌ Discord OAuth start error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start Discord OAuth'
    });
  }
});

// GET /api/auth/discord/callback - Handle Discord OAuth callback
router.get('/discord/callback', authLimiter, async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(error)}`);
    }
    
    if (!code) {
      return res.redirect(`${FRONTEND_URL}/login?error=missing_code`);
    }
    
    console.log('🔍 Discord OAuth callback - processing code:', code.substring(0, 10) + '...');
    console.log('🔍 State parameter received:', state);
    console.log('🔍 Referrer header:', req.get('Referer') || 'None');
    
    // Complete OAuth flow
    const result = await discordOAuth.completeOAuthFlow(code, state);
    
    if (!result.success) {
      console.log('❌ Discord OAuth flow failed:', result.error);
      return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(result.error)}`);
    }
    
    const { user_data } = result;
    console.log('🔍 Looking for user with Discord ID:', user_data.id);
    console.log('🔍 Discord user data keys:', Object.keys(user_data));
    
    // Check if user already exists
    let user = await User.findOne({ discord_id: user_data.id });
    
    if (user) {
      console.log('✅ User found in database:', user.email);
      console.log('🔍 User discord_id in DB:', user.discord_id);
      console.log('🔍 Discord ID from OAuth:', user_data.id);
      
      // User exists, log them in
      const token = createSessionToken(user);
      console.log('🔑 Created session token:', token.substring(0, 20) + '...');
      
      setUserSession(res, user, token);
      console.log('🍪 Session cookies set for user:', user.email);
      
      // Update last login
      user.last_login = new Date();
      await user.save();
      
      // Check if this is a Nova Hub authentication request
      // For Nova Hub, the state parameter is a simple GUID, not base64 JSON
      let isNovaHubAuth = false;
      let novaState = state;
      
      // Check if we have a referrer that indicates Nova Hub auth
      const referrer = req.get('Referer') || '';
      if (referrer.includes('return=nova%3A%2F%2F') || referrer.includes('return=nova://')) {
        isNovaHubAuth = true;
        console.log('🚀 Nova Hub authentication detected via referrer:', referrer);
      }
      
      // Also check if state looks like a Nova Hub GUID (32 hex characters)
      if (state && /^[a-f0-9]{32}$/i.test(state)) {
        isNovaHubAuth = true;
        console.log('🚀 Nova Hub authentication detected via state format:', state);
      }
      
              if (isNovaHubAuth && novaState) {
          // Create the callback URL with authentication data for Nova Hub
          const callbackUrl = `nova://auth/callback?state=${novaState}&token=${token}&userId=${user._id}`;
          console.log('🚀 Redirecting to Nova Hub:', callbackUrl);
          return res.redirect(callbackUrl);
      } else {
        console.log('🚀 Redirecting to dashboard for user:', user.email);
        
        // Check if this might have been a Nova Hub auth attempt that we failed to detect
        let dashboardUrl = `${FRONTEND_URL}/dashboard`;
        if (state && /^[a-f0-9]{32}$/i.test(state)) {
          // Add nova_auth parameter to indicate this might be from Nova Hub
          dashboardUrl += `?nova_auth=${state}&token=${token}&userId=${user._id}`;
          console.log('🔍 Adding Nova Hub auth parameters to dashboard redirect');
        }
        
        return res.redirect(dashboardUrl);
      }
    } else {
      console.log('❌ No user found with Discord ID:', user_data.id);
      console.log('🔍 Checking all users with discord_id field...');
      
      // Debug: Check what discord_ids exist in the database
      const allUsersWithDiscord = await User.find({ discord_id: { $exists: true, $ne: null } }).select('email discord_id');
      console.log('📋 Users with discord_id in DB:', allUsersWithDiscord.map(u => ({ email: u.email, discord_id: u.discord_id })));
      
      // Check if this is a Nova Hub authentication request
      // For Nova Hub, the state parameter is a simple GUID, not base64 JSON
      let isNovaHubAuth = false;
      let novaState = state;
      
      // Check if we have a referrer that indicates Nova Hub auth
      const referrer = req.get('Referer') || '';
      if (referrer.includes('return=nova%3A%2F%2F') || referrer.includes('return=nova://')) {
        isNovaHubAuth = true;
        console.log('🚀 Nova Hub authentication detected (new user) via referrer:', referrer);
      }
      
      // Also check if state looks like a Nova Hub GUID (32 hex characters)
      if (state && /^[a-f0-9]{32}$/i.test(state)) {
        isNovaHubAuth = true;
        console.log('🚀 Nova Hub authentication detected (new user) via state format:', state);
      }
      
      if (isNovaHubAuth) {
        // For Nova Hub, we'll auto-register the user with Discord data
        console.log('🚀 Auto-registering user for Nova Hub authentication');
        
        const newUser = new User({
          email: user_data.email || `${user_data.username}@discord.temp`,
          discord_id: user_data.id,
          user_data: {
            ...user_data,
            global_name: user_data.global_name || user_data.username
          },
          status: 'Free',
          created_at: new Date(),
          last_login: new Date()
        });

        await newUser.save();
        console.log('✅ User auto-registered for Nova Hub:', newUser.email);

        // Create session token and redirect to Nova Hub
        const token = createSessionToken(newUser);
        setUserSession(res, newUser, token);
        
        const callbackUrl = `nova://auth/callback?state=${novaState}&token=${token}&userId=${newUser._id}`;
        console.log('🚀 Redirecting new user to Nova Hub:', callbackUrl);
        return res.redirect(callbackUrl);
      } else {
        // User doesn't exist, redirect to signup with Discord data
        // Remove large profile_picture to avoid URL length limits
        const signupData = {
          ...user_data,
          profile_picture: undefined // Will be fetched again when needed
        };
        const encodedData = encodeURIComponent(JSON.stringify(signupData));
        console.log('🔄 Redirecting to signup with Discord data');
        return res.redirect(`${FRONTEND_URL}/signup?discord_data=${encodedData}`);
      }
    }
  } catch (error) {
    console.error('❌ Discord OAuth callback error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
});

// In-memory store for pending authentications (in production, use Redis or database)
const pendingAuthentications = new Map();

// Store pending authentication for Nova Hub
router.post('/pending', async (req, res) => {
  try {
    const { state, token, user } = req.body;
    
    if (!state || !token || !user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: state, token, user' 
      });
    }

    // Store the pending authentication (expires after 5 minutes)
    pendingAuthentications.set(state, {
      token,
      user,
      timestamp: Date.now()
    });

    // Clean up expired entries (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    for (const [key, value] of pendingAuthentications.entries()) {
      if (value.timestamp < fiveMinutesAgo) {
        pendingAuthentications.delete(key);
      }
    }

    console.log('✅ Stored pending authentication for state:', state);
    res.json({ success: true, message: 'Pending authentication stored' });
    
  } catch (error) {
    console.error('❌ Error storing pending authentication:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Retrieve pending authentication for Nova Hub
router.get('/pending/:state', async (req, res) => {
  try {
    const { state } = req.params;
    
    const pendingAuth = pendingAuthentications.get(state);
    if (!pendingAuth) {
      return res.json({ success: false, message: 'No pending authentication found' });
    }

    // Remove the pending authentication once retrieved
    pendingAuthentications.delete(state);

    console.log('✅ Retrieved pending authentication for state:', state);
    res.json({ 
      success: true, 
      data: {
        token: pendingAuth.token,
        user: pendingAuth.user
      }
    });
    
  } catch (error) {
    console.error('❌ Error retrieving pending authentication:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});



module.exports = router;