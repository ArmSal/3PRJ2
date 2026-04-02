@echo off
REM Docker helper script for Windows

echo === Discord Gaming Platform - Docker Helper ===
echo.

if "%1"=="up" (
    echo Starting services...
    docker-compose up --build -d
    goto :end
)

if "%1"=="down" (
    echo Stopping services...
    docker-compose down
    goto :end
)

if "%1"=="logs" (
    echo Showing logs (Ctrl+C to exit)...
    docker-compose logs -f
    goto :end
)

if "%1"=="test" (
    echo Testing services...
    curl -s http://localhost > nul
    if %errorlevel%==0 (
        echo [OK] Frontend running on http://localhost
    ) else (
        echo [FAIL] Frontend not responding
    )
    
    curl -s http://localhost:3000 > nul
    if %errorlevel%==0 (
        echo [OK] Backend running on http://localhost:3000
    ) else (
        echo [FAIL] Backend not responding
    )
    goto :end
)

if "%1"=="clean" (
    echo Cleaning up...
    docker-compose down -v
    docker system prune -f
    goto :end
)

if "%1"=="shell-be" (
    docker-compose exec backend sh
    goto :end
)

if "%1"=="shell-db" (
    docker-compose exec mysql mysql -u root -p
    goto :end
)

echo Usage: docker-cmd [command]
echo.
echo Commands:
echo   up        - Build and start all services
echo   down      - Stop all services
echo   logs      - View logs
echo   test      - Test if services are running
echo   clean     - Clean up containers and volumes
echo   shell-be  - Open shell in backend container
echo   shell-db  - Open MySQL shell

:end
