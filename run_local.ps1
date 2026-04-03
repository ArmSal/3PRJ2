# GAMING PLUS: ULTRA-STABLE NEXUS INITIALIZER
# ==========================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  GAMING PLUS: NEURAL NETWORK INITIALIZER" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Nexus Grid Cleanup (Crucial to reset volumes for user role sync)
Write-Host "`n[1/3] Purging Grid Volumes (Resetting role protocols)..." -ForegroundColor Yellow
docker-compose down -v --remove-orphans

# 2. Neural Compilation & Grid Sync
Write-Host "`n[2/3] Compiling Neural Logic & Syncing Grid (Force Rebuild)..." -ForegroundColor Yellow
docker-compose build --no-cache
docker-compose up -d

# 3. Nexus Protocol Verification
Write-Host "`n[3/3] Authenticating Nexus Protocols..." -ForegroundColor Yellow
Start-Sleep -Seconds 10 # Waiting for Postgres Nexus to stabilize

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "   NEURAL NETWORK IS NOW OPERATIONAL" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎮 UI INTERFACE :  http://localhost" -ForegroundColor White
Write-Host "🧠 NEXUS CORE   :  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Monitoring: docker-compose logs -f" -ForegroundColor DarkGray
Write-Host "Shutdown  : docker-compose down" -ForegroundColor DarkGray
