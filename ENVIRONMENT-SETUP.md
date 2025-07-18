# 🌍 Nova Environment Configuration Guide

## 🔧 **Environment Switching Setup**

### **Frontend Environment Variables (Vercel)**

#### **Development Settings:**
```bash
VITE_API_URL=http://localhost:5000/api
VITE_ENVIRONMENT=development
```

#### **Production Settings:**
```bash
VITE_API_URL=https://api.novaoptimizer.com/api  
VITE_ENVIRONMENT=production
```

---

### **Backend Environment Variables (Railway)**

#### **Core Configuration:**
```bash
# ENVIRONMENT
NODE_ENV=production

# URLS
FRONTEND_URL=https://novaoptimizer.com
BACKEND_URL=https://api.novaoptimizer.com

# DATABASE
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nova-prod

# SECURITY
JWT_SECRET=your-256-char-jwt-secret
JWT_EXPIRES_IN=7d

# DISCORD OAUTH - PRODUCTION
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_REDIRECT_URI=https://api.novaoptimizer.com/api/auth/discord/callback

# RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=10
```

---

## 🔗 **Discord OAuth App Configuration**

### **1. Go to Discord Developer Portal**
👉 [https://discord.com/developers/applications](https://discord.com/developers/applications)

### **2. Select Your Nova App**

### **3. OAuth2 → General Settings**

#### **Redirect URIs - Add Both:**
```
http://localhost:5000/api/auth/discord/callback
https://api.novaoptimizer.com/api/auth/discord/callback
```

#### **Scopes:**
- `identify`
- `email`
- `guilds`

---

## 🚀 **Development vs Production**

### **Development Mode (Local):**
```bash
# Backend runs on: http://localhost:5000
# Frontend runs on: http://localhost:5173
# Discord redirects to: http://localhost:5000/api/auth/discord/callback
```

### **Production Mode (Live):**
```bash
# Backend runs on: https://api.novaoptimizer.com
# Frontend runs on: https://novaoptimizer.com  
# Discord redirects to: https://api.novaoptimizer.com/api/auth/discord/callback
```

---

## 📋 **Setup Checklist**

### **✅ Discord App Setup:**
- [ ] Add both redirect URIs (localhost + production)
- [ ] Set scopes: `identify`, `email`, `guilds`
- [ ] Copy Client ID and Secret

### **✅ Railway Backend:**
- [ ] Set `NODE_ENV=production`
- [ ] Set `DISCORD_REDIRECT_URI=https://api.novaoptimizer.com/api/auth/discord/callback`
- [ ] Set `FRONTEND_URL=https://novaoptimizer.com`

### **✅ Vercel Frontend:**
- [ ] Set `VITE_API_URL=https://api.novaoptimizer.com/api`
- [ ] Redeploy after changes

---

## 🔧 **Quick Environment Switch**

### **For Local Development:**
1. Update Discord app redirect URIs
2. Set frontend: `VITE_API_URL=http://localhost:5000/api`
3. Run backend locally with development settings

### **For Production:**
1. Ensure Discord app has production redirect URI
2. Set Railway: `DISCORD_REDIRECT_URI=https://api.novaoptimizer.com/api/auth/discord/callback`
3. Set Vercel: `VITE_API_URL=https://api.novaoptimizer.com/api`

---

## 🐛 **Troubleshooting**

### **"Invalid Redirect URI" Error:**
- Check Discord app has correct redirect URI
- Verify environment variables match exactly

### **CORS Errors:**
- Ensure `FRONTEND_URL` is set correctly in backend
- Check frontend `VITE_API_URL` points to correct backend

### **Authentication Loops:**
- Clear browser cookies and localStorage
- Check JWT_SECRET is set in production 