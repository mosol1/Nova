# 🚀 Super Simple Nova Workflow

## 🏠 **FOR LOCAL DEVELOPMENT (No Production Impact):**

### **1. Create .env File**
Create `Nova-web/backend/.env`:
```bash
NODE_ENV=development

# Dev Discord App
DISCORD_DEV_CLIENT_ID=your-dev-discord-client-id
DISCORD_DEV_CLIENT_SECRET=your-dev-discord-client-secret
DISCORD_DEV_REDIRECT_URI=http://localhost:5000/api/auth/discord/callback

# Dev Database  
MONGODB_URI_DEV=mongodb://localhost:27017/nova-dev

# Dev Security (simple)
JWT_SECRET_DEV=dev-jwt-secret

# Dev URLs
FRONTEND_URL_DEV=http://localhost:5173
BACKEND_URL_DEV=http://localhost:5000

# Prod Discord App
DISCORD_PROD_CLIENT_ID=your-prod-discord-client-id
DISCORD_PROD_CLIENT_SECRET=your-prod-discord-client-secret
DISCORD_PROD_REDIRECT_URI=https://api.novaoptimizer.com/api/auth/discord/callback

# Prod Database
MONGODB_URI_PROD=mongodb+srv://user:pass@cluster.mongodb.net/nova-prod

# Prod Security (strong)
JWT_SECRET_PROD=your-super-secure-production-jwt-secret-256-chars

# Prod URLs
FRONTEND_URL_PROD=https://novaoptimizer.com
BACKEND_URL_PROD=https://api.novaoptimizer.com

# Shared Settings
PORT=5000
JWT_EXPIRES_IN=7d
```

### **2. Create Frontend .env.local**
Create `Nova-web/frontend/.env.local`:
```bash
VITE_API_URL=http://localhost:5000/api
```

### **3. Start Development**
```bash
# Terminal 1 - Backend
cd Nova-web/backend
npm run dev

# Terminal 2 - Frontend  
cd Nova-web/frontend
npm run dev
```

**✅ Uses dev Discord app, dev database, localhost URLs**

---

## 🚀 **PRODUCTION RELEASE CHECKLIST:**

### **Super Simple Release Process:**

1. **Change .env to Production Mode:**
   ```bash
   # In your .env file, change:
   NODE_ENV=production
   ```

2. **Test Locally (Optional):**
   ```bash
   npm run dev  # Will now use prod credentials locally
   ```

3. **Push to Git:**
   ```bash
   git add .
   git commit -m "Release: ready for production"
   git push origin main
   ```

4. **Update Railway:**
   - **Copy entire `.env` file content**
   - **Go to Railway Dashboard → Variables**
   - **Paste all variables**
   - **Make sure:** `NODE_ENV=production`
   - **Save**

5. **Done!** 🎉
   - Railway auto-deploys with production settings
   - Uses prod Discord app, prod database, prod URLs

---

## 🚨 **EMERGENCY ROLLBACK (If You Push Bad Code):**

### **Fastest Options (30 seconds):**

#### **Option 1: Platform Rollback**
- **Vercel:** Dashboard → Deployments → Previous → "Promote to Production"
- **Railway:** Dashboard → Deployments → Previous → "Redeploy"

#### **Option 2: Git Revert**
```bash
git revert HEAD --no-edit
git push origin main
```

#### **Option 3: Force Rollback (Emergency Only)**
```bash
git reset --hard LAST_GOOD_COMMIT
git push --force-with-lease origin main
```

---

## 🔄 **Daily Workflow:**

### **Continue Developing:**
```bash
# 1. Change .env back to development
NODE_ENV=development

# 2. Start coding
npm run dev

# 3. Make changes, test locally
# ... code code code ...

# 4. Ready to release? Change .env
NODE_ENV=production

# 5. Push to production
git add .
git commit -m "Add new feature"
git push origin main

# 6. Copy .env to Railway (if new variables added)
```

### **Environment Switching:**
- **Development:** `NODE_ENV=development` in `.env`
- **Production:** `NODE_ENV=production` in `.env` + Railway

---

## 🎯 **Key Benefits:**

✅ **One .env file** - Contains both dev and prod credentials  
✅ **Just change NODE_ENV** - Everything switches automatically  
✅ **Simple release** - Change NODE_ENV → Push → Copy to Railway  
✅ **Safe development** - Separate Discord apps, databases, URLs  
✅ **Instant rollback** - Platform dashboards or git revert  

---

## 📋 **Setup Checklist (One Time):**

### **Discord Apps:**
- [ ] Create "Nova Development" Discord app
- [ ] Create "Nova Production" Discord app
- [ ] Set redirect URIs correctly for each

### **Environment File:**
- [ ] Create `.env` with both dev and prod credentials
- [ ] Create `.env.local` for frontend
- [ ] Add `.env` to .gitignore (never commit secrets)

### **Production Setup:**
- [ ] Copy `.env` content to Railway
- [ ] Set `NODE_ENV=production` in Railway
- [ ] Verify deployment works

---

## 🔧 **What Gets Logged:**

### **Development Mode:**
```bash
🔗 Discord OAuth configured for: DEVELOPMENT
📱 Client ID: dev12345...
🔗 Redirect URI: http://localhost:5000/api/auth/discord/callback
✅ MongoDB connected successfully (DEVELOPMENT)
```

### **Production Mode:**
```bash
🔗 Discord OAuth configured for: PRODUCTION  
📱 Client ID: prod98765...
🔗 Redirect URI: https://api.novaoptimizer.com/api/auth/discord/callback
✅ MongoDB connected successfully (PRODUCTION)
```

---

## 🚨 **Important Notes:**

⚠️ **Never commit .env file** - Contains secrets  
⚠️ **Always test before production** - Check locally first  
⚠️ **Use different databases** - Keep dev and prod separate  
⚠️ **Copy full .env to Railway** - Don't miss any variables  

**This workflow is bulletproof and super simple!** 🎯 