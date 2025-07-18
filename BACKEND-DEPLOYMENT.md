# Nova Backend Deployment Guide

## 🚀 Deploy to Railway (Recommended)

### **1. Create Railway Account**
- Go to [railway.app](https://railway.app)
- Sign up with your GitHub account
- Connect your Nova repository

### **2. Deploy Backend**
1. **Create New Project**: Click "New Project" → "Deploy from GitHub repo"
2. **Select Repository**: Choose `mosol1/Nova`
3. **Set Root Directory**: Set to `Nova-web/backend`
4. **Deploy**: Railway will auto-detect Node.js and deploy

### **3. Configure Environment Variables**
In Railway dashboard, add these environment variables:

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nova-db
JWT_SECRET=your-super-secret-jwt-key-256-characters-long
JWT_EXPIRES_IN=7d
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
FRONTEND_URL=https://novaoptimizer.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=10
```

### **4. Get Your Backend URL**
- Railway will provide a URL like: `https://nova-backend-production.up.railway.app`
- Copy this URL for the next step

---

## 🔧 Alternative: Deploy to Render

### **1. Create Render Account**
- Go to [render.com](https://render.com)
- Sign up with GitHub

### **2. Create Web Service**
1. **New Web Service** → Connect GitHub → Select `mosol1/Nova`
2. **Configuration**:
   - **Name**: `nova-backend`
   - **Root Directory**: `Nova-web/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### **3. Add Environment Variables** (same as above)

### **4. Deploy**
- Render will provide a URL like: `https://nova-backend.onrender.com`

---

## 📋 Required Environment Variables

You'll need to set up:

### **Database (MongoDB Atlas)**
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/nova-db`

### **Discord OAuth App**
1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Create new application
3. Add redirect URI: `https://your-backend-url/api/auth/discord/callback`
4. Get Client ID and Secret

### **JWT Secret**
Generate a secure random string (256+ characters):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ Next Steps After Backend Deployment

1. **Get your backend URL** (e.g., `https://nova-backend.railway.app`)
2. **Update Vercel environment variables** (see main instructions)
3. **Test the connection** by visiting `https://your-backend-url/api/health`

---

## 🔧 Troubleshooting

### **Common Issues:**
- **Build fails**: Check Node.js version (use >= 16)
- **Database connection**: Verify MongoDB URI and network access
- **CORS errors**: Ensure `FRONTEND_URL` is set correctly
- **Discord OAuth**: Check redirect URI matches exactly 