#!/bin/bash
# ===========================================
# AMIS Medical System - Production Deploy Script
# ===========================================
# Author: MiniMax Agent
# Version: 2.0
#
# This script deploys BOTH frontend and backend
# without breaking existing running services.
#
# Usage:
#   ./deploy.sh              # Full deploy
#   ./deploy.sh --frontend   # Frontend only
#   ./deploy.sh --backend    # Backend only
#   ./deploy.sh --no-build   # Restart containers only
# ===========================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="/opt/amis/amis-platform"
BACKUP_DIR="/opt/amis/backups"
LOG_FILE="/var/log/amis-deploy.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Docker container names
CONTAINERS=("amis-nginx" "amis-api" "amis-postgres" "amis-redis")

# ===========================================
# Helper Functions
# ===========================================

log() {
    local level=$1
    shift
    local message="[$DATE] [$level] $*"
    echo -e "$message"
    echo "$message" >> "$LOG_FILE"
}

log_info() {
    log "INFO" "${GREEN}$*${NC}"
}

log_warn() {
    log "WARN" "${YELLOW}$*${NC}"
}

log_error() {
    log "ERROR" "${RED}$*${NC}"
}

log_success() {
    log "SUCCESS" "${GREEN}$*${NC}"
}

# ===========================================
# Pre-Deployment Checks
# ===========================================

pre_deploy_check() {
    log_info "==========================================="
    log_info "  AMIS Production Deploy v2.0"
    log_info "==========================================="

    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]] && ! groups | grep -q docker; then
        log_error "Please run as root or with docker privileges"
        exit 1
    fi

    # Check if deploy directory exists
    if [ ! -d "$DEPLOY_DIR" ]; then
        log_error "Deploy directory not found: $DEPLOY_DIR"
        log_info "Cloning repository..."
        git clone https://github.com/amismedical/amis-platform.git "$DEPLOY_DIR"
    fi

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    # Create log file
    touch "$LOG_FILE"

    log_info "Pre-deployment checks passed"
}

# ===========================================
# Backup Current State
# ===========================================

backup_current() {
    log_info "Creating backup..."

    local backup_name="amis_backup_$(date '+%Y%m%d_%H%M%S')"
    local backup_path="$BACKUP_DIR/$backup_name"

    mkdir -p "$backup_path"

    # Backup frontend dist
    if [ -d "$DEPLOY_DIR/frontend/dist" ]; then
        cp -r "$DEPLOY_DIR/frontend/dist" "$backup_path/"
        log_info "Frontend backed up"
    fi

    # Backup nginx config
    if [ -d "$DEPLOY_DIR/nginx" ]; then
        cp -r "$DEPLOY_DIR/nginx" "$backup_path/"
        log_info "Nginx config backed up"
    fi

    # Keep only last 5 backups
    cd "$BACKUP_DIR"
    ls -1t | tail -n +6 | xargs -r rm -rf

    log_success "Backup created: $backup_name"
}

# ===========================================
# Git Pull / Update Source
# ===========================================

git_update() {
    log_info "Updating source code from GitHub..."

    cd "$DEPLOY_DIR"

    # Stash any local changes
    git stash push -m "Auto-stash before deploy $DATE" 2>/dev/null || true

    # Pull latest
    if git pull origin master; then
        log_success "Git pull successful"
    else
        log_error "Git pull failed"
        log_info "Trying to fetch and reset..."
        git fetch origin
        git reset --hard origin/master
    fi

    # Restore stashed changes (except .env)
    git stash drop 2>/dev/null || true
}

# ===========================================
# Frontend Build
# ===========================================

build_frontend() {
    log_info "Building frontend..."

    cd "$DEPLOY_DIR/frontend"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm install
    fi

    # Build production
    log_info "Running npm build..."
    if npm run build; then
        log_success "Frontend build completed"
    else
        log_error "Frontend build failed!"
        exit 1
    fi

    # Verify build output
    if [ -f "dist/index.html" ]; then
        log_success "Frontend build verified"
    else
        log_error "Frontend build output not found!"
        exit 1
    fi
}

# ===========================================
# Backend Build
# ===========================================

build_backend() {
    log_info "Building backend..."

    cd "$DEPLOY_DIR/backend"

    # Check Go installation
    if ! command -v go &> /dev/null; then
        log_error "Go not installed!"
        exit 1
    fi

    # Tidy dependencies
    log_info "Running go mod tidy..."
    if go mod tidy; then
        log_success "Dependencies tidied"
    else
        log_error "go mod tidy failed!"
        exit 1
    fi

    # Build API binary
    log_info "Building API binary..."
    if go build -o amis-api ./cmd/api/main.go; then
        log_success "Backend build completed"
    else
        log_error "Backend build failed!"
        exit 1
    fi
}

# ===========================================
# Docker Build
# ===========================================

docker_build() {
    log_info "Building Docker containers..."

    cd "$DEPLOY_DIR"

    # Pull latest base images
    log_info "Pulling latest base images..."
    docker-compose pull

    # Build custom images
    log_info "Building custom images..."
    docker-compose build --no-cache

    log_success "Docker build completed"
}

# ===========================================
# Docker Restart
# ===========================================

docker_restart() {
    log_info "Restarting Docker containers..."

    cd "$DEPLOY_DIR"

    # Stop containers gracefully
    log_info "Stopping containers..."
    docker-compose down --remove-orphans 2>/dev/null || true

    # Start containers
    log_info "Starting containers..."
    docker-compose up -d

    # Wait for startup
    sleep 5

    log_success "Containers started"
}

# ===========================================
# Health Checks
# ===========================================

health_check() {
    log_info "Running health checks..."

    local max_attempts=30
    local attempt=1
    local api_ok=false
    local nginx_ok=false

    # Check API health
    log_info "Checking API health..."
    while [ $attempt -le $max_attempts ]; do
        if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
            api_ok=true
            log_success "API health check passed"
            break
        fi
        log_info "API not ready, attempt $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done

    if [ "$api_ok" = false ]; then
        log_error "API health check failed after $max_attempts attempts"
        log_info "Checking API logs..."
        docker-compose logs api --tail=20
        exit 1
    fi

    # Check Nginx health
    log_info "Checking Nginx health..."
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -sf http://localhost/health > /dev/null 2>&1; then
            nginx_ok=true
            log_success "Nginx health check passed"
            break
        fi
        log_info "Nginx not ready, attempt $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done

    if [ "$nginx_ok" = false ]; then
        log_error "Nginx health check failed after $max_attempts attempts"
        log_info "Checking Nginx logs..."
        docker-compose logs nginx --tail=20
        exit 1
    fi

    # Check PostgreSQL health
    log_info "Checking PostgreSQL health..."
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        log_success "PostgreSQL health check passed"
    else
        log_warn "PostgreSQL health check failed"
    fi

    # Verify frontend serves correctly
    log_info "Checking frontend..."
    local http_code=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost/)
    if [ "$http_code" = "200" ]; then
        log_success "Frontend serves correctly (HTTP $http_code)"
    else
        log_warn "Frontend returned HTTP $http_code"
    fi
}

# ===========================================
# Container Status
# ===========================================

show_status() {
    log_info "==========================================="
    log_info "  Container Status"
    log_info "==========================================="

    cd "$DEPLOY_DIR"

    echo ""
    echo -e "${BLUE}Container Name${NC}          ${BLUE}Status${NC}       ${BLUE}Health${NC}"
    echo "----------------------------------------"

    for container in "${CONTAINERS[@]}"; do
        local status=$(docker-compose ps "$container" 2>/dev/null | grep "$container" | awk '{print $3}' || echo "unknown")
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "N/A")

        if [ "$status" = "Up" ]; then
            status="${GREEN}$status${NC}"
        else
            status="${RED}$status${NC}"
        fi

        if [ "$health" = "healthy" ]; then
            health="${GREEN}$health${NC}"
        elif [ "$health" = "unhealthy" ]; then
            health="${RED}$health${NC}"
        else
            health="${YELLOW}$health${NC}"
        fi

        printf "%-22s %-14s %s\n" "$container" "$status" "$health"
    done

    echo ""
}

# ===========================================
# Rollback
# ===========================================

rollback() {
    log_error "Deployment failed! Rolling back..."

    cd "$BACKUP_DIR"
    local latest_backup=$(ls -1t | head -1)

    if [ -n "$latest_backup" ]; then
        log_info "Restoring from backup: $latest_backup"

        # Restore frontend
        if [ -d "$BACKUP_DIR/$latest_backup/dist" ]; then
            cp -r "$BACKUP_DIR/$latest_backup/dist" "$DEPLOY_DIR/frontend/"
        fi

        # Restore nginx config
        if [ -d "$BACKUP_DIR/$latest_backup/nginx" ]; then
            cp -r "$BACKUP_DIR/$latest_backup/nginx" "$DEPLOY_DIR/"
        fi

        # Restart nginx only
        docker-compose restart nginx

        log_success "Rollback completed"
    else
        log_error "No backup found!"
    fi

    exit 1
}

# ===========================================
# Main Deploy Flow
# ===========================================

main() {
    # Parse arguments
    local deploy_frontend=true
    local deploy_backend=true
    local docker_only=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --frontend)
                deploy_backend=false
                shift
                ;;
            --backend)
                deploy_frontend=false
                shift
                ;;
            --no-build)
                docker_only=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    # Run deployment
    pre_deploy_check
    backup_current
    git_update

    if [ "$docker_only" = false ]; then
        if [ "$deploy_frontend" = true ]; then
            build_frontend
        fi

        if [ "$deploy_backend" = true ]; then
            build_backend
        fi

        docker_build
    fi

    docker_restart
    health_check
    show_status

    log_success "==========================================="
    log_success "  Deployment Completed Successfully!"
    log_success "==========================================="
    log_info "API: http://89.39.94.159:8080"
    log_info "Frontend: http://89.39.94.159"
    log_info "Logs: $LOG_FILE"
}

# ===========================================
# Trap for errors
# ===========================================

trap 'rollback' ERR

# Run main
main "$@"
