# 🏠 Local Development Workflow

## 🔧 **Local Development Setup (No Production Impact)**

### **1. Backend Local Environment (Nova-web/backend/.env.local)**
Create this file for local development:
```bash
# LOCAL DEVELOPMENT ONLY
NODE_ENV=development
PORT=5000

# LOCAL URLS
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# LOCAL DATABASE (Use different DB than production)
MONGODB_URI=mongodb://localhost:27017/nova-dev-local
# OR use a different Atlas cluster for dev

# DISCORD OAUTH - DEVELOPMENT APP (Different from production)
DISCORD_CLIENT_ID=your-dev-discord-client-id
DISCORD_CLIENT_SECRET=your-dev-discord-client-secret
DISCORD_REDIRECT_URI=http://localhost:5000/api/auth/discord/callback

# SECURITY (Use different secrets for dev)
JWT_SECRET=dev-jwt-secret-different-from-production
JWT_EXPIRES_IN=7d

# RATE LIMITING (Relaxed for development)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
AUTH_RATE_LIMIT_MAX=100
```

### **2. Frontend Local Environment (Nova-web/frontend/.env.local)**
```bash
# LOCAL DEVELOPMENT
VITE_API_URL=http://localhost:5000/api
VITE_ENVIRONMENT=development
VITE_DISCORD_CLIENT_ID=your-dev-discord-client-id
```

---

## 🚀 **Local Development Commands**

### **Start Backend (Terminal 1):**
```bash
cd Nova-web/backend
npm run dev
# Uses .env.local automatically
```

### **Start Frontend (Terminal 2):**
```bash
cd Nova-web/frontend
npm run dev
# Uses .env.local automatically, runs on http://localhost:5173
```

---

## 🔒 **Git Safety Rules**

### **Files to NEVER commit:**
```bash
# Add to .gitignore
.env.local
.env.development.local
.env.production.local
*.local.env
```

### **Safe Development Workflow:**
1. **Work on feature branches** (never push directly to main)
2. **Test locally first**
3. **Use separate development database**
4. **Use development Discord app**

---

## 📱 **Development vs Production Separation**

### **Development (Local):**
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000
- **Database:** Local MongoDB or dev Atlas cluster
- **Discord App:** Nova Development (separate app)

### **Production (Live):**
- **Frontend:** https://novaoptimizer.com
- **Backend:** https://api.novaoptimizer.com
- **Database:** Production Atlas cluster
- **Discord App:** Nova Production (main app)

---

## 🔄 **Switching Between Environments**

### **Local Development:**
```bash
# Just run npm run dev - uses .env.local automatically
cd Nova-web/backend && npm run dev
cd Nova-web/frontend && npm run dev
```

### **Test Production Build Locally:**
```bash
# Build frontend for production testing
cd Nova-web/frontend
npm run build
npm run preview  # Test production build locally
```

---

## 🧪 **Testing Before Production**

### **Pre-Push Checklist:**
- [ ] Test login/signup locally
- [ ] Test API endpoints locally
- [ ] Build frontend successfully
- [ ] No console errors
- [ ] Environment variables documented
- [ ] Database migrations work

### **Staging Environment (Optional):**
Consider creating a staging deployment for testing:
- **Staging Frontend:** https://staging.novaoptimizer.com
- **Staging Backend:** https://api-staging.novaoptimizer.com 