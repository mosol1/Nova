# Nova Project - Git Workflow Guide

## 🚀 Quick Start Commands

### Essential Git Commands for Nova Project

#### **Initial Setup (Already Done)**
```bash
# Repository is already initialized and connected to GitHub
git remote -v  # Verify connection to https://github.com/mosol1/Nova.git
```

#### **Daily Development Workflow**

1. **Start Working (Switch to Development)**
   ```bash
   git checkout development
   git pull origin development
   ```
   *Or use our helper:*
   ```bash
   git-workflow.bat dev
   ```

2. **Make Changes & Commit**
   ```bash
   git add .
   git commit -m "Your descriptive commit message"
   git push origin development
   ```
   *Or use our helper:*
   ```bash
   git-workflow.bat commit "Your descriptive commit message"
   git-workflow.bat push
   ```

3. **Check Status Anytime**
   ```bash
   git status
   git branch --all
   ```
   *Or use our helper:*
   ```bash
   git-workflow.bat status
   ```

## 🌿 Branch Strategy

### **Branch Structure**
- **`main`** - Production-ready code (for novaoptimizer.com)
- **`development`** - Active development (your daily work)
- **`release/v1.0`** - Release preparation and testing

### **Branch Switching**
```bash
# Switch to different branches
git checkout main           # Production branch
git checkout development    # Development branch  
git checkout release/v1.0   # Release branch

# Or use our helper script
git-workflow.bat main       # Switch to main
git-workflow.bat dev        # Switch to development
git-workflow.bat release    # Switch to release
```

## 📝 Commit Best Practices

### **Good Commit Messages**
```bash
git commit -m "Add user authentication to Nova Hub frontend"
git commit -m "Fix database connection issue in Nova.Service"
git commit -m "Update .gitignore to exclude build artifacts"
git commit -m "Implement dark theme for Nova Hub UI"
```

### **Bad Commit Messages**
```bash
git commit -m "fix stuff"
git commit -m "update"
git commit -m "changes"
```

## 🚢 Release Process

### **Creating a New Release**
1. **Finish Development**
   ```bash
   git checkout development
   git add .
   git commit -m "Complete feature development"
   git push origin development
   ```

2. **Create Release Branch**
   ```bash
   git checkout -b release/v1.1
   # Test and fix any issues
   git commit -m "Release v1.1 ready"
   git push origin release/v1.1
   ```

3. **Merge to Main (Production)**
   ```bash
   git checkout main
   git merge release/v1.1
   git push origin main
   ```

## 🌐 Vercel Deployment

### **Automatic Deployment**
- **Main Branch** → Deploys to `novaoptimizer.com` (Production)
- **Development Branch** → Deploys to preview URL (Testing)

### **Manual Deployment Commands**
```bash
# Deploy to production (from main branch)
git checkout main
git push origin main  # Triggers Vercel deployment

# Deploy preview (from development)
git checkout development  
git push origin development  # Triggers preview deployment
```

## 🛠️ Helper Script Usage

Use the included `git-workflow.bat` script for easier Git operations:

```bash
# Show help
git-workflow.bat help

# Common operations
git-workflow.bat status                    # Check Git status
git-workflow.bat dev                       # Switch to development
git-workflow.bat commit "Add new feature"  # Commit changes
git-workflow.bat push                      # Push to remote
git-workflow.bat pull                      # Pull latest changes
```

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **"Your branch is behind 'origin/main'"**
```bash
git pull origin main  # Pull latest changes
```

#### **"Please commit your changes or stash them"**
```bash
git add .
git commit -m "Save current work"
# Then switch branches
```

#### **"fatal: The current branch has no upstream branch"**
```bash
git push -u origin branch-name  # Set upstream
```

#### **Merge Conflicts**
1. Open conflicted files in your editor
2. Resolve conflicts manually
3. Add and commit:
   ```bash
   git add .
   git commit -m "Resolve merge conflicts"
   ```

## 📁 Files Ignored by Git

Our `.gitignore` automatically excludes:
- **C# Build Artifacts**: `bin/`, `obj/`, `.vs/`
- **Node.js**: `node_modules/`, `npm-debug.log`
- **Tauri**: `src-tauri/target/`
- **Environment Files**: `.env*`
- **Logs & Temp**: `*.log`, `temp/`, `logs/`
- **IDE Files**: `.vscode/`, `.idea/`
- **OS Files**: `Thumbs.db`, `.DS_Store`

## 🎯 Tips for Success

1. **Commit Often**: Small, frequent commits are better than large ones
2. **Use Descriptive Messages**: Help future you understand what changed
3. **Pull Before Push**: Always pull latest changes before pushing
4. **Test Before Merge**: Test in development before merging to main
5. **Use Branches**: Keep main stable, work in development

## 🔗 Useful Links

- **GitHub Repository**: https://github.com/mosol1/Nova
- **Production Site**: http://novaoptimizer.com
- **Vercel Dashboard**: https://vercel.com/dashboard

---

*This workflow is designed for the Nova project's dual C#/React architecture and Vercel deployment strategy.* 