Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Starting Gaming+ Hackathon Project" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "`nStopping any existing containers and cleaning up..." -ForegroundColor Yellow
docker-compose down

Write-Host "`nBuilding and starting containers (Frontend, Backend, PostgreSQL)..." -ForegroundColor Yellow
docker-compose up --build -d

Write-Host "`nWaiting for services to spin up..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "Services are up and running!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎮 Frontend UI :  http://localhost" -ForegroundColor White
Write-Host "⚙️  Backend API :  http://localhost:3004" -ForegroundColor White
Write-Host ""
Write-Host "To view real-time logs, run: docker-compose logs -f" -ForegroundColor DarkGray
Write-Host "To stop the project, run:   docker-compose down" -ForegroundColor DarkGray
