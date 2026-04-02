# Render.com Deployment Guide

## Option 1: Deploy via Render Dashboard (Easiest)

### 1. Create Account
- Go to https://render.com
- Sign up with GitHub

### 2. Deploy PostgreSQL (Free Alternative to MySQL)
```yaml
# render.yaml - Add to your repo root
services:
  - type: postgres
    name: gaming-db
    plan: free
    ipAllowList: []

  - type: web
    name: gaming-backend
    plan: free
    runtime: docker
    dockerfilePath: ./backend/Dockerfile
    envVars:
      - key: DB_HOST
        fromDatabase:
          name: gaming-db
          property: host
      - key: DB_USER
        fromDatabase:
          name: gaming-db
          property: user
      - key: DB_PASSWORD
        fromDatabase:
          name: gaming-db
          property: password
      - key: DB_NAME
        fromDatabase:
          name: gaming-db
          property: database
      - key: JWT_SECRET
        generateValue: true
      - key: PORT
        value: 3000
    healthCheckPath: /

  - type: web
    name: gaming-frontend
    plan: free
    runtime: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: ./frontend/dist
    envVars:
      - key: VITE_API_URL
        value: https://gaming-backend.onrender.com
```

### 3. Steps
1. Push `render.yaml` to GitHub
2. In Render Dashboard → "Blueprints" → "New Blueprint Instance"
3. Select your repo
4. Render deploys everything automatically

## Option 2: Manual Docker Deploy

1. **Create Web Service for Backend**
   - New → Web Service
   - Connect GitHub repo
   - Runtime: Docker
   - Dockerfile Path: `./backend/Dockerfile`
   - Plan: Free

2. **Create Static Site for Frontend**
   - New → Static Site
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`
   - Plan: Free

3. **Create PostgreSQL**
   - New → PostgreSQL
   - Plan: Free

## URLs After Deploy
- Frontend: `https://gaming-frontend.onrender.com`
- Backend: `https://gaming-backend.onrender.com`
- Database: Internal (only backend can access)

## Limitations (Free Tier)
- Services sleep after 15 min inactivity (cold start ~30s)
- 512 MB RAM per service
- 100 GB bandwidth/month

## Auto-Deploy
Render auto-deploys on every push to `main` branch.
