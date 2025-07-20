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
      // Create URL-encoded form data (Discord requires this format)
      const formData = new URLSearchParams();
      formData.append('client_id', this.clientId);
      formData.append('client_secret', this.clientSecret);
      formData.append('grant_type', 'authorization_code');
      formData.append('code', code);
      formData.append('redirect_uri', this.redirectUri);
      formData.append('scope', 'identify email guilds');

      const response = await axios.post('https://discord.com/api/oauth2/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Nova-Backend/1.0'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('✅ Successfully exchanged Discord code for token');
      return response.data;
    } catch (error) {
      console.error('❌ Discord token exchange failed:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      
      // More specific error handling
      if (error.response?.status === 400) {
        throw new Error('Invalid Discord authorization code or redirect URI mismatch');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid Discord client credentials');
      } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        throw new Error('Network timeout connecting to Discord API');
      } else {
        throw new Error('Failed to exchange code for token');
      }
    }
  }

  // Get user information
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get('https://discord.com/api/users/@me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Nova-Backend/1.0'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('✅ Successfully fetched Discord user info for:', response.data.username);
      return response.data;
    } catch (error) {
      console.error('❌ Discord user info fetch failed:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      
      // More specific error handling
      if (error.response?.status === 401) {
        throw new Error('Invalid or expired Discord access token');
      } else if (error.response?.status === 429) {
        throw new Error('Discord API rate limit exceeded');
      } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        throw new Error('Network timeout connecting to Discord API');
      } else {
        throw new Error('Failed to fetch user information');
      }
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
      console.log('⚠️  Discord role assignment skipped: Missing configuration');
      console.log('   - Guild ID:', this.guildId ? '✅ Set' : '❌ Missing');
      console.log('   - Role ID:', this.verifiedRoleId ? '✅ Set' : '❌ Missing');
      console.log('   - Bot Token:', this.botToken ? '✅ Set' : '❌ Missing');
      return { success: false, reason: 'Bot not configured for role assignment' };
    }

    try {
      console.log(`🤖 Attempting to assign role ${this.verifiedRoleId} to user ${userId} in guild ${this.guildId}`);
      
      const response = await axios.put(
        `https://discord.com/api/guilds/${this.guildId}/members/${userId}/roles/${this.verifiedRoleId}`,
        {},
        {
          headers: {
            'Authorization': `Bot ${this.botToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Nova-Backend/1.0'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('✅ Discord role assigned successfully');
      return { success: true, data: response.data };
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      
      console.error('❌ Discord role assignment failed:');
      console.error('   Status:', status);
      console.error('   Error:', errorData);
      
      // Handle specific Discord API errors
      if (status === 403) {
        if (errorData?.code === 50001) {
          console.error('   → Bot missing "Manage Roles" permission');
          return { success: false, error: 'Bot lacks Manage Roles permission' };
        } else if (errorData?.code === 50013) {
          console.error('   → Bot role hierarchy too low (role is higher than bot)');
          return { success: false, error: 'Bot role hierarchy insufficient' };
        } else {
          console.error('   → Bot lacks necessary permissions');
          return { success: false, error: 'Bot permissions insufficient' };
        }
      } else if (status === 404) {
        if (errorData?.code === 10007) {
          console.error('   → User not found in guild (user must join server first)');
          return { success: false, error: 'User not in guild' };
        } else if (errorData?.code === 10011) {
          console.error('   → Role not found in guild');
          return { success: false, error: 'Role not found' };
        } else {
          console.error('   → Guild or user not found');
          return { success: false, error: 'Guild or user not found' };
        }
      } else if (status === 401) {
        console.error('   → Invalid bot token');
        return { success: false, error: 'Invalid bot token' };
      } else {
        console.error('   → Unknown error:', error.message);
        return { success: false, error: errorData?.message || error.message };
      }
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