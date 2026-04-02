# Fly.io Deployment Guide

## 1. Install Fly CLI
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Mac/Linux
curl -L https://fly.io/install.sh | sh
```

## 2. Sign Up & Login
```bash
fly auth signup  # or fly auth login
```

## 3. Create App
```bash
# Backend
fly apps create gaming-backend

# Frontend
fly apps create gaming-frontend
```

## 4. Deploy Backend with Fly Launch
```bash
cd backend
fly launch --name gaming-backend --dockerfile Dockerfile

# Set secrets
fly secrets set DB_HOST=your-db-host
fly secrets set DB_USER=root
fly secrets set DB_PASSWORD=your-password
fly secrets set DB_NAME=gaming_platform
fly secrets set JWT_SECRET=your-secret
```

## 5. Deploy Frontend
```bash
cd frontend
fly launch --name gaming-frontend --dockerfile Dockerfile
```

## 6. Create MySQL (or use external)
```bash
# Option 1: Fly Postgres (easier)
fly postgres create --name gaming-db
fly postgres attach gaming-db --app gaming-backend

# Option 2: MySQL on Fly (more complex, use Docker)
```

## 7. fly.toml Example
```toml
# backend/fly.toml
app = "gaming-backend"
primary_region = "cdg"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]
```

## Pricing (Free Tier)
- $5 credit/month
- 256 MB RAM per machine
- 3 shared-cpu-1 machines
- 1 GB persistent storage

## Deploy Command
```bash
fly deploy
```

## Auto-Deploy with GitHub Actions
Use `superfly/flyctl-actions` in your workflow.
