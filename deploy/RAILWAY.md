# Railway.app Deployment Guide

## Option 1: Via Railway Dashboard

### 1. Create Account
- Go to https://railway.app
- Sign up with GitHub

### 2. Deploy Steps
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repo
4. Railway auto-detects Dockerfiles

### 3. Add MySQL Database
1. Click "New" → Database → Add MySQL
2. Railway auto-generates connection string
3. Go to your backend service → Variables → Add:
   - `DB_HOST` = ${{MySQL.MYSQLHOST}}
   - `DB_USER` = ${MySQL.MYSQLUSER}
   - `DB_PASSWORD` = ${MySQL.MYSQLPASSWORD}
   - `DB_NAME` = ${MySQL.MYSQLDATABASE}

### 4. Add Frontend Service
1. Click "New" → GitHub Repo
2. Select same repo
3. Set root directory: `frontend/`
4. Add environment variable:
   - `VITE_API_URL` = URL of your backend service

## Option 2: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

## Pricing (Free Tier)
- $5 credit/month (enough for 24/7 small app)
- 512 MB RAM
- Shared CPU
- 1 GB Disk

## Auto-Deploy
Railway auto-deploys on every push to `main`.

## Custom Domain
Railway provides free `.railway.app` subdomain.
