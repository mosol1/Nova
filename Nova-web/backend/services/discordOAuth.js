// services/discordOAuth.js - Discord OAuth Service
const axios = require('axios');

class DiscordOAuthService {
  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Smart environment switching - use dev or prod credentials based on NODE_ENV
    this.clientId = isProduction 
      ? process.env.DISCORD_PROD_CLIENT_ID 
      : process.env.DISCORD_DEV_CLIENT_ID;
    
    this.clientSecret = isProduction 
      ? process.env.DISCORD_PROD_CLIENT_SECRET 
      : process.env.DISCORD_DEV_CLIENT_SECRET;
    
    this.redirectUri = isProduction 
      ? process.env.DISCORD_PROD_REDIRECT_URI || 'https://api.novaoptimizer.com/api/auth/discord/callback'
      : process.env.DISCORD_DEV_REDIRECT_URI || 'http://localhost:5000/api/auth/discord/callback';
    
    // Optional: Bot credentials (if you have different bots for dev/prod)
    this.botToken = isProduction 
      ? process.env.DISCORD_PROD_BOT_TOKEN 
      : process.env.DISCORD_DEV_BOT_TOKEN;
    
    this.guildId = isProduction 
      ? process.env.DISCORD_PROD_GUILD_ID 
      : process.env.DISCORD_DEV_GUILD_ID;
    
    this.verifiedRoleId = isProduction 
      ? process.env.DISCORD_PROD_VERIFIED_ROLE_ID 
      : process.env.DISCORD_DEV_VERIFIED_ROLE_ID;

    // Log which environment we're using
    console.log(`🔗 Discord OAuth configured for: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`📱 Client ID: ${this.clientId?.substring(0, 8)}...`);
    console.log(`🔗 Redirect URI: ${this.redirectUri}`);
  }

  // Generate Discord OAuth URL
  generateAuthUrl(state = null) {
    const baseUrl = 'https://discord.com/api/oauth2/authorize';
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'identify email guilds' // Added email scope to get user's email
    });

    if (state) {
      params.append('state', state);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  // Exchange code for access token
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://discord.com/api/oauth2/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
        scope: 'identify email guilds' // Added email scope
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for token');
    }
  }

  // Get user information
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get('https://discord.com/api/users/@me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error.response?.data || error.message);
      throw new Error('Failed to fetch user information');
    }
  }

  // Get user's guilds
  async getUserGuilds(accessToken) {
    try {
      const response = await axios.get('https://discord.com/api/users/@me/guilds', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching user guilds:', error.response?.data || error.message);
      throw new Error('Failed to fetch user guilds');
    }
  }

  // Add user to guild
  async addUserToGuild(accessToken, userId) {
    if (!this.guildId || !this.botToken) {
      console.log('Guild ID or bot token not configured, skipping guild addition');
      return { success: false, reason: 'Not configured' };
    }

    try {
      const response = await axios.put(
        `https://discord.com/api/guilds/${this.guildId}/members/${userId}`,
        {
          access_token: accessToken
        },
        {
          headers: {
            'Authorization': `Bot ${this.botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding user to guild:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  // Assign role to user
  async assignRoleToUser(userId) {
    if (!this.guildId || !this.verifiedRoleId || !this.botToken) {
      console.log('Guild ID, role ID, or bot token not configured, skipping role assignment');
      return { success: false, reason: 'Not configured' };
    }

    try {
      const response = await axios.put(
        `https://discord.com/api/guilds/${this.guildId}/members/${userId}/roles/${this.verifiedRoleId}`,
        {},
        {
          headers: {
            'Authorization': `Bot ${this.botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error assigning role to user:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  // Get user's profile picture URL
  getProfilePictureUrl(userId, avatarHash) {
    if (!avatarHash) {
      return null;
    }
    
    const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=256`;
  }

  // Convert profile picture to base64
  async getProfilePictureBase64(userId, avatarHash) {
    try {
      const imageUrl = this.getProfilePictureUrl(userId, avatarHash);
      if (!imageUrl) {
        return null;
      }

      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });

      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      const mimeType = response.headers['content-type'] || 'image/png';
      
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Error converting profile picture to base64:', error.message);
      return null;
    }
  }

  // Complete OAuth flow
  async completeOAuthFlow(code, state) {
    try {
      // Exchange code for access token
      const tokenData = await this.exchangeCodeForToken(code);
      
      // Get user information
      const userInfo = await this.getUserInfo(tokenData.access_token);
      
      // Get user's guilds (optional - don't fail if this fails)
      let guilds = [];
      try {
        guilds = await this.getUserGuilds(tokenData.access_token);
      } catch (guildError) {
        console.log('⚠️  Failed to fetch user guilds (continuing anyway):', guildError.message);
      }
      
      // Add user to guild (if configured)
      const guildResult = await this.addUserToGuild(tokenData.access_token, userInfo.id);
      
      // Assign role to user (if configured)
      const roleResult = await this.assignRoleToUser(userInfo.id);
      
      // Get profile picture as base64
      const profilePicture = await this.getProfilePictureBase64(userInfo.id, userInfo.avatar);
      
      console.log('✅ Discord OAuth completed for user:', userInfo.username);
      console.log('📧 Email from Discord:', userInfo.email);
      console.log('👤 Global name:', userInfo.global_name);
      console.log('🎭 Username:', userInfo.username);
      
      return {
        success: true,
        user_data: {
          id: userInfo.id,
          username: userInfo.username,
          global_name: userInfo.global_name || userInfo.display_name || userInfo.username,
          discriminator: userInfo.discriminator,
          avatar: userInfo.avatar,
          email: userInfo.email, // This should now be available with email scope
          verified: userInfo.verified,
          profile_picture: profilePicture,
          accent_color: userInfo.accent_color,
          banner: userInfo.banner,
          banner_color: userInfo.banner_color,
          locale: userInfo.locale,
          mfa_enabled: userInfo.mfa_enabled,
          premium_type: userInfo.premium_type,
          public_flags: userInfo.public_flags,
          elite_email: userInfo.email // Store email as elite_email too for consistency
        },
        guilds: guilds,
        guild_addition: guildResult,
        role_assignment: roleResult,
        tokens: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in
        }
      };
    } catch (error) {
      console.error('Error completing OAuth flow:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DiscordOAuthService; 