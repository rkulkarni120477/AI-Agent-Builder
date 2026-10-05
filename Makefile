.PHONY: help dev test lint format seed bedrock-check docker-up docker-down clean

help:
	@echo "Agent Studio — available commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Start both backend and frontend in development mode"
	@echo "  make backend-dev      Start backend only (uvicorn with reload)"
	@echo "  make frontend-dev     Start frontend only (Next.js dev server)"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test             Run all tests (backend + frontend)"
	@echo "  make test-backend     Run backend tests"
	@echo "  make test-frontend    Run frontend tests"
	@echo "  make test-coverage    Run tests with coverage report"
	@echo "  make lint             Lint backend (ruff) and frontend (ESLint)"
	@echo "  make format           Format code (ruff + Prettier)"
	@echo "  make type-check       Type check backend (mypy) and frontend (tsc)"
	@echo ""
	@echo "Setup & Database:"
	@echo "  make seed             Seed the database with mockup data"
	@echo "  make migrate          Run database migrations"
	@echo "  make bedrock-check    Verify Bedrock access and model availability"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up        Start all services with Docker Compose"
	@echo "  make docker-down      Stop all services"
	@echo "  make docker-logs      View Docker logs"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            Remove temporary files and caches"

dev:
	@echo "Starting Agent Studio in development mode..."
	@if command -v tmux >/dev/null 2>&1; then \
		tmux new-session -d -s agent-studio -x 220 -y 50; \
		tmux send-keys -t agent-studio "make backend-dev" Enter; \
		tmux split-window -t agent-studio -h; \
		tmux send-keys -t agent-studio "sleep 2 && make frontend-dev" Enter; \
		tmux attach -t agent-studio; \
	else \
		echo "Install tmux to run multiple processes. Running backend only..."; \
		make backend-dev; \
	fi

backend-dev:
	cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

frontend-dev:
	cd frontend && npm run dev

test:
	@echo "Running all tests..."
	make test-backend
	make test-frontend

test-backend:
	cd backend && python -m pytest tests/ -v

test-frontend:
	cd frontend && npm run test

test-coverage:
	cd backend && python -m pytest tests/ --cov=app --cov-report=html
	@echo "Coverage report: backend/htmlcov/index.html"

lint:
	@echo "Linting backend..."
	cd backend && ruff check app tests
	@echo "Linting frontend..."
	cd frontend && npm run lint

format:
	@echo "Formatting backend..."
	cd backend && ruff format app tests
	@echo "Formatting frontend..."
	cd frontend && npx prettier --write "app/**/*.{ts,tsx}" "lib/**/*.{ts,tsx}" "components/**/*.{ts,tsx}"

type-check:
	@echo "Type checking backend..."
	cd backend && mypy app
	@echo "Type checking frontend..."
	cd frontend && npm run type-check

seed:
	@echo "Seeding database with mockup data..."
	cd backend && python seed.py

migrate:
	@echo "Running Alembic migrations..."
	cd backend && alembic upgrade head

bedrock-check:
	@echo "Checking Bedrock connection and model availability..."
	cd backend && python -c "from app.llm.catalog import check_bedrock_access; check_bedrock_access()"

docker-up:
	@echo "Starting services with Docker Compose..."
	docker-compose up -d
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@echo "API docs: http://localhost:8000/docs"

docker-down:
	@echo "Stopping services..."
	docker-compose down

docker-logs:
	docker-compose logs -f

clean:
	@echo "Cleaning temporary files..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleanup complete."
