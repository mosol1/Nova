# 🚀 Simple Nova Development Workflow

## 🎯 **One File, Easy Switching**

You have **one `.env` file** in `Nova-web/backend/.env` that works for both development and production. Just change `NODE_ENV` and everything switches!

---

## 🏠 **FOR LOCAL DEVELOPMENT (No Production Impact)**

### **Setup (One Time):**
1. **Fill out your `.env` file** with both dev and production credentials
2. **Create two Discord apps**: 
   - "Nova Production" → Fill `DISCORD_PROD_*` variables
   - "Nova Development" → Fill `DISCORD_DEV_*` variables

### **Daily Development:**
```bash
# 1. Set development mode in .env file
NODE_ENV=development

# 2. Start coding locally
cd Nova-web/backend && npm run dev
cd Nova-web/frontend && npm run dev

# 3. Code, test, repeat...
# ✅ Uses dev Discord app, dev database, localhost URLs
```

### **Local Development Uses:**
- ✅ **DISCORD_DEV_CLIENT_ID** (your dev Discord app)
- ✅ **MONGODB_URI_DEV** (local database or dev cluster)
- ✅ **JWT_SECRET_DEV** (simple secret for testing)
- ✅ **Frontend:** http://localhost:5173
- ✅ **Backend:** http://localhost:5000

---

## 🚀 **PRODUCTION RELEASE CHECKLIST**

### **When Ready to Deploy:**

#### **1. Switch to Production Mode:**
```bash
# In Nova-web/backend/.env file, change:
NODE_ENV=production
```

#### **2. Test Production Build Locally (Optional):**
```bash
cd Nova-web/backend && npm start
cd Nova-web/frontend && npm run build
# ✅ Now uses prod Discord app, prod database, prod URLs
```

#### **3. Deploy to Production:**
```bash
# Commit and push
git add .
git commit -m "Release: your feature description"
git push origin main

# Copy .env file to Railway
# Railway Dashboard → Variables → Paste all variables from .env
```

#### **4. Switch Back to Development:**
```bash
# In Nova-web/backend/.env file, change back:
NODE_ENV=development
```

### **Production Release Uses:**
- ✅ **DISCORD_PROD_CLIENT_ID** (your production Discord app)
- ✅ **MONGODB_URI_PROD** (production database cluster)
- ✅ **JWT_SECRET_PROD** (super secure 256-char secret)
- ✅ **Frontend:** https://novaoptimizer.com
- ✅ **Backend:** https://api.novaoptimizer.com

---

## 🚨 **EMERGENCY ROLLBACK (If You Push Bad Code)**

### **Fastest Options (30 seconds):**

#### **Option 1: Platform Rollback**
- **Vercel:** Dashboard → Deployments → Previous → "Promote to Production"
- **Railway:** Dashboard → Deployments → Previous → "Redeploy"

#### **Option 2: Git Revert**
```bash
git revert HEAD --no-edit
git push origin main
# Both platforms auto-deploy the revert
```

---

## 🔄 **Super Simple Workflow**

### **Development (Daily):**
```bash
# .env file: NODE_ENV=development
npm run dev  # Code locally, test, repeat
```

### **Production Release:**
```bash
# .env file: NODE_ENV=production
git add . && git commit -m "Release v1.0" && git push origin main
# Copy .env to Railway variables
# .env file: NODE_ENV=development (switch back)
```

### **Emergency Rollback:**
```bash
git revert HEAD --no-edit && git push origin main
# Done in 30 seconds!
```

---

## 📋 **Environment Variables Quick Copy**

When deploying, copy these from your `.env` file to Railway:

```bash
NODE_ENV=production
PORT=5000
DISCORD_PROD_CLIENT_ID=your-value
DISCORD_PROD_CLIENT_SECRET=your-value
DISCORD_PROD_REDIRECT_URI=https://api.novaoptimizer.com/api/auth/discord/callback
DISCORD_DEV_CLIENT_ID=your-value
DISCORD_DEV_CLIENT_SECRET=your-value
DISCORD_DEV_REDIRECT_URI=http://localhost:5000/api/auth/discord/callback
MONGODB_URI_PROD=your-production-database
MONGODB_URI_DEV=your-development-database
JWT_SECRET_PROD=your-production-secret
JWT_SECRET_DEV=your-development-secret
FRONTEND_URL_PROD=https://novaoptimizer.com
FRONTEND_URL_DEV=http://localhost:5173
BACKEND_URL_PROD=https://api.novaoptimizer.com
BACKEND_URL_DEV=http://localhost:5000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=10
```

---

## 🎯 **Key Benefits**

✅ **One .env file** - no confusion  
✅ **One variable switch** - just change NODE_ENV  
✅ **Local testing** - test production settings locally  
✅ **Safe deployment** - copy exact same config to Railway  
✅ **Easy rollback** - platform or git revert  

---

## 🔧 **Feature Branch Workflow (Optional)**

For bigger features, use branches for extra safety:

```bash
# 1. Create feature branch
git checkout -b feature/new-dashboard

# 2. Develop (NODE_ENV=development)
# ... code changes ...

# 3. Test feature
git add . && git commit -m "Add new dashboard"

# 4. Merge to main when ready
git checkout main
git merge feature/new-dashboard

# 5. Release (NODE_ENV=production)
git push origin main
```

---

**This workflow is dead simple: change NODE_ENV, code/test/deploy, switch back. Perfect for solo development!** 🚀 