.PHONY: help build run dev clean test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the application
	@echo "Building application..."
	go build -o bin/petamini-backend main.go
	@echo "✅ Build complete: bin/petamini-backend"

run: build ## Build and run the application
	@echo "Starting server..."
	./bin/petamini-backend

dev: ## Run in development mode with hot reload
	@echo "Starting development server..."
	go run main.go

clean: ## Clean build artifacts
	@echo "Cleaning..."
	rm -rf bin/
	rm -rf dist/
	@echo "✅ Clean complete"

deps: ## Download dependencies
	@echo "Downloading dependencies..."
	go mod download
	@echo "✅ Dependencies downloaded"

tidy: ## Tidy dependencies
	@echo "Tidying dependencies..."
	go mod tidy
	@echo "✅ Dependencies tidied"

test: ## Run tests
	@echo "Running tests..."
	go test -v ./...

fmt: ## Format code
	@echo "Formatting code..."
	go fmt ./...
	@echo "✅ Code formatted"

vet: ## Run go vet
	@echo "Running go vet..."
	go vet ./...
	@echo "✅ Vet complete"

lint: fmt vet ## Run linters

db-init: ## Initialize database (create collections and indexes)
	@echo "Initializing database..."
	go run scripts/init_db.go
	@echo "✅ Database initialized"

db-test: ## Test database connection
	@echo "Testing database connection..."
	go run scripts/test_connection.go

db-seed: db-init ## Seed database with sample data
	@echo "✅ Database seeded"

docker-build: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t petamini-backend:latest .
	@echo "✅ Docker image built"

docker-run: ## Run Docker container
	@echo "Running Docker container..."
	docker run -p 8080:8080 --env-file .env petamini-backend:latest

install-tools: ## Install development tools
	@echo "Installing development tools..."
	go install github.com/cosmtrek/air@latest
	@echo "✅ Tools installed"
