.PHONY: up down build logs restart migrate seed clean test shell db-shell db-studio help

help:
	@echo "Available commands:"
	@echo "  make up         - Start all services in detached mode"
	@echo "  make down       - Stop and remove containers"
	@echo "  make build      - Build/rebuild the API image"
	@echo "  make logs       - View logs (follow mode)"
	@echo "  make restart    - Restart all services"
	@echo "  make migrate    - Run Prisma migrations"
	@echo "  make seed       - Seed the database"
	@echo "  make test       - Run tests inside container"
	@echo "  make shell      - Enter API container shell"
	@echo "  make db-shell   - Enter PostgreSQL shell"
	@echo "  make db-studio  - Run Prisma Studio"
	@echo "  make clean      - Remove all containers, volumes, and images"

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build --no-cache

logs:
	docker compose logs -f

restart: down up

migrate:
	docker compose exec api pnpm prisma migrate deploy

seed:
	docker compose exec api pnpm prisma db seed

test:
	docker compose exec api pnpm run test

shell:
	docker compose exec api sh

db-shell:
	docker compose exec db psql -U postgres -d vanguard_defense

db-studio:
	docker compose exec api pnpm prisma studio

clean:
	docker compose down -v --rmi all --remove-orphans
	docker system prune -f
