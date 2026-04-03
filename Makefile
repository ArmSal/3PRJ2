# Docker Gaming Platform - DevOps Scripts

.PHONY: build up down logs shell-be shell-fe shell-db test clean

# Build all services
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Start with build
up-build:
	docker-compose up --build -d

# Stop all services
down:
	docker-compose down

# Stop and remove volumes
down-volumes:
	docker-compose down -v

# View logs
logs:
	docker-compose logs -f

# Backend shell
shell-be:
	docker-compose exec backend sh

# Frontend shell
shell-fe:
	docker-compose exec frontend sh

# Database shell
shell-db:
	docker-compose exec db psql -U admin -d gaming_platform

# Test if services are running
test:
	@echo "Testing services..."
	@curl -s http://localhost > /dev/null && echo "✓ Frontend OK" || echo "✗ Frontend failed"
	@curl -s http://localhost:3004 > /dev/null && echo "✓ Backend OK" || echo "✗ Backend failed"

# Clean everything
clean:
	docker-compose down -v
	docker system prune -f

# Development mode (with logs)
dev:
	docker-compose up --build
