# 🧠 Smart Environment Configuration

## 🎯 **One Config, Two Environments**

This setup lets you have **both development and production credentials** in the same environment file. Just change `NODE_ENV` and everything switches automatically!

---

## ⚙️ **Railway Environment Variables (Set Once, Use Forever)**

Add **all** these variables to Railway. The system will automatically pick dev or prod based on `NODE_ENV`:

```bash
# ===== ENVIRONMENT CONTROL =====
NODE_ENV=production  # Change this to 'development' for dev mode

# ===== FRONTEND URLS =====
FRONTEND_URL_PROD=https://novaoptimizer.com
FRONTEND_URL_DEV=http://localhost:5173

# ===== BACKEND URLS =====
BACKEND_URL_PROD=https://api.novaoptimizer.com
BACKEND_URL_DEV=http://localhost:5000

# ===== DATABASE =====
MONGODB_URI_PROD=mongodb+srv://user:pass@cluster.mongodb.net/nova-prod
MONGODB_URI_DEV=mongodb://localhost:27017/nova-dev

# ===== DISCORD OAUTH - PRODUCTION =====
DISCORD_PROD_CLIENT_ID=your-production-discord-client-id
DISCORD_PROD_CLIENT_SECRET=your-production-discord-client-secret
DISCORD_PROD_REDIRECT_URI=https://api.novaoptimizer.com/api/auth/discord/callback

# ===== DISCORD OAUTH - DEVELOPMENT =====
DISCORD_DEV_CLIENT_ID=your-development-discord-client-id
DISCORD_DEV_CLIENT_SECRET=your-development-discord-client-secret
DISCORD_DEV_REDIRECT_URI=http://localhost:5000/api/auth/discord/callback

# ===== DISCORD BOT (Optional) =====
DISCORD_PROD_BOT_TOKEN=your-production-bot-token
DISCORD_DEV_BOT_TOKEN=your-development-bot-token
DISCORD_PROD_GUILD_ID=your-production-guild-id
DISCORD_DEV_GUILD_ID=your-development-guild-id

# ===== SECURITY =====
JWT_SECRET_PROD=your-super-secure-production-jwt-secret-256-chars
JWT_SECRET_DEV=dev-jwt-secret-can-be-simpler

# ===== SHARED SETTINGS =====
JWT_EXPIRES_IN=7d
PORT=5000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=10
```

---

## 🔄 **How Environment Switching Works**

### **Production Mode (Default):**
```bash
NODE_ENV=production
# Uses: DISCORD_PROD_*, MONGODB_URI_PROD, JWT_SECRET_PROD, etc.
```

### **Development Mode:**
```bash
NODE_ENV=development  
# Uses: DISCORD_DEV_*, MONGODB_URI_DEV, JWT_SECRET_DEV, etc.
```

---

## 🚀 **Usage Examples**

### **Deploy to Production:**
```bash
# In Railway, set:
NODE_ENV=production

# System automatically uses:
# - DISCORD_PROD_CLIENT_ID
# - MONGODB_URI_PROD
# - https://api.novaoptimizer.com redirect URI
```

### **Test Locally:**
```bash
# In Railway, set:
NODE_ENV=development

# System automatically uses:
# - DISCORD_DEV_CLIENT_ID  
# - MONGODB_URI_DEV
# - http://localhost:5000 redirect URI
```

### **Quick Environment Switch:**
1. **Railway Dashboard** → **Variables**
2. **Change:** `NODE_ENV=development` or `NODE_ENV=production`
3. **Save** → Railway auto-restarts with new environment
4. **Done!** 🎉

---

## 🔧 **Frontend Smart Switching**

### **Vercel Environment Variables:**
```bash
# Production (always keep this)
VITE_API_URL=https://api.novaoptimizer.com/api

# For local development, create .env.local:
VITE_API_URL=http://localhost:5000/api
```

---

## 🎯 **Benefits**

✅ **No more token swapping** - both sets always available  
✅ **One-click environment switching** - just change NODE_ENV  
✅ **No accidental production usage** - clear separation  
✅ **Easy debugging** - logs show which environment is active  
✅ **Safe development** - never affect production by mistake  

---

## 📋 **Setup Checklist**

### **1. Discord Apps:**
- [ ] Create "Nova Production" Discord app
- [ ] Create "Nova Development" Discord app  
- [ ] Get both sets of Client ID/Secret

### **2. Railway Setup:**
- [ ] Add all environment variables above
- [ ] Set `NODE_ENV=production` for live site
- [ ] Test switching to `development` mode

### **3. Local Development:**
- [ ] Create `.env.local` with localhost API URL
- [ ] Test that dev Discord app works locally

### **4. Verification:**
- [ ] Check Railway logs show correct environment
- [ ] Verify Discord redirects work for both modes
- [ ] Confirm database connections are separate

---

## 🚨 **Important Notes**

⚠️ **Database Separation:** Always use different databases for dev/prod  
⚠️ **Discord Apps:** Must be separate apps with different redirect URIs  
⚠️ **JWT Secrets:** Use strong secrets for production, simpler for dev  
⚠️ **Git Safety:** Never commit `.env.local` files  

---

## 🔍 **Debugging**

### **Check Active Environment:**
Backend logs will show:
```bash
🔗 Discord OAuth configured for: PRODUCTION
📱 Client ID: 12345678...
🔗 Redirect URI: https://api.novaoptimizer.com/api/auth/discord/callback
```

### **Common Issues:**
- **Wrong environment active:** Check `NODE_ENV` value
- **Missing credentials:** Verify all PROD/DEV variables are set
- **Redirect mismatch:** Ensure Discord apps have correct URIs 