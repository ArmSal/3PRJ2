# GAMING PLUS: NEXUS SHUTDOWN PROTOCOL
# ==========================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  GAMING PLUS: INITIATING SHUTDOWN" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "`n[1/1] Terminating Neural Grid Containers..." -ForegroundColor Yellow
docker-compose down

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "   NEXUS CORE IS NOW OFFLINE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To reboot the Nexus, run: .\run_local.ps1" -ForegroundColor DarkGray
