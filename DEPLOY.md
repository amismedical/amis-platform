# ===========================================
# AMIS Medical System - VPS Deployment Guide
# Ubuntu 24.04
# ===========================================

## Server Information

- **IP Address:** 89.39.94.159
- **Domain:** amismedical.uz (configure later)
- **Server Port:** 8080 (internal)
- **Frontend URL:** http://89.39.94.159

---

## Quick Start (5 Minutes)

### 1. Upload Files to Server

```bash
# On your local machine, upload the deployment package
scp amis-deploy.tar.gz root@89.39.94.159:/root/

# Or use rsync for better progress
rsync -avz --progress amis-deploy.tar.gz root@89.39.94.159:/root/
```

### 2. SSH to Server

```bash
ssh root@89.39.94.159
```

### 3. Extract and Setup

```bash
# Extract the deployment package
cd /root
tar -xzf amis-deploy.tar.gz
cd amis-deploy

# Copy environment template
cp backend/.env.example backend/.env

# Edit the .env file with your settings
nano backend/.env
```

### 4. Configure Environment

Edit `backend/.env` with secure values:

```bash
# Required: Generate secure JWT secret
# Run this command to generate:
openssl rand -base64 64

# Edit .env
nano backend/.env
```

Set these values:
```env
DB_PASSWORD=YourSecurePassword123!
JWT_SECRET=<paste the generated secret here>
APP_URL=http://89.39.94.159
API_URL=http://89.39.94.159
```

### 5. Build and Start

```bash
# Build Docker images (first time takes 5-10 minutes)
docker compose build

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### 6. Verify Deployment

```bash
# Check health endpoint
curl http://localhost/health

# Check if containers are running
docker compose ps

# View container logs
docker compose logs api
```

---

## Complete Deployment Steps

### Prerequisites Check

```bash
# Verify Docker is installed
docker --version
# Expected: Docker version 26.x.x or higher

# Verify Docker Compose
docker compose version
# Expected: Docker Compose version v2.x.x or higher

# Check available ports
ss -tlnp | grep -E '80|443|8080|5432|6379'
```

### Directory Structure

```
/root/amis-deploy/
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── domain/
│   │   ├── handler/
│   │   ├── middleware/
│   │   └── repository/
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── dist/              # Build this before deployment
│   ├── .env.example
│   └── Dockerfile
├── nginx/
│   └── nginx.conf
└── docker-compose.yml
```

### Step 1: Prepare Frontend Build

On your local machine:

```bash
cd amis/frontend

# Configure environment
cp .env.example .env
nano .env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Install dependencies
npm install  # or pnpm install

# Build for production
npm run build
```

The built files will be in `frontend/dist/`. Include this folder in your deployment package.

### Step 2: Transfer to Server

```bash
# Create archive including built frontend
tar -czf amis-deploy.tar.gz amis-deploy/

# Upload to server
scp amis-deploy.tar.gz root@89.39.94.159:/root/

# Or upload folder directly
scp -r amis-deploy root@89.39.94.159:/root/
```

### Step 3: Server Setup

```bash
ssh root@89.39.94.159

# Create deployment directory
mkdir -p /opt/amis
cd /opt/amis

# Extract
tar -xzf /root/amis-deploy.tar.gz
mv amis-deploy/* .
rm -rf amis-deploy amis-deploy.tar.gz

# Copy and configure environment
cp backend/.env.example backend/.env
```

### Step 4: Configure Environment Variables

```bash
nano /opt/amis/backend/.env
```

**Required Variables:**

| Variable | Example | Description |
|----------|---------|-------------|
| `DB_PASSWORD` | `SecurePass123!` | PostgreSQL password |
| `JWT_SECRET` | `openssl rand -base64 64` | JWT signing secret (32+ chars) |
| `APP_URL` | `http://89.39.94.159` | Frontend URL |
| `API_URL` | `http://89.39.94.159:8080` | Backend API URL |

### Step 5: Generate JWT Secret

```bash
# Generate secure JWT secret
openssl rand -base64 64

# Copy the output and paste into JWT_SECRET in .env
```

### Step 6: Start Services

```bash
cd /opt/amis

# Build Docker images
docker compose build --no-cache

# Start services in detached mode
docker compose up -d

# Wait for services to start (30-60 seconds)
sleep 30

# Check status
docker compose ps

# View logs
docker compose logs -f --tail=50
```

### Step 7: Firewall Configuration

```bash
# Check UFW status
ufw status

# Allow SSH (if not already)
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Verify rules
ufw status numbered
```

---

## Health Check Endpoints

| Service | URL | Expected Response |
|---------|-----|-------------------|
| Nginx | `http://89.39.94.159/health` | `OK` |
| API | `http://89.39.94.159/api/v1/health` | `{"status":"ok"}` |

```bash
# Test all endpoints
curl http://localhost/health
curl http://localhost/api/v1/health
```

---

## Common Commands

### Start/Stop Services

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Restart
docker compose restart

# Restart specific service
docker compose restart api
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f nginx

# Last 100 lines
docker compose logs --tail=100
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it amis-postgres psql -U postgres -d amis

# Backup database
docker exec amis-postgres pg_dump -U postgres amis > backup.sql

# Restore database
cat backup.sql | docker exec -i amis-postgres psql -U postgres -d amis
```

### Update Application

```bash
cd /opt/amis

# Pull latest code (if using git)
git pull

# Rebuild
docker compose build
docker compose up -d
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs api

# Common issues:
# - Port already in use: Change port mapping
# - Database connection failed: Check DB credentials
# - Volume permissions: Run 'sudo chown -R 1000:1000 ./data'
```

### API Returns 502

```bash
# Check if API is running
docker compose ps api

# Check API logs
docker compose logs api

# Test API directly
curl http://localhost:8080/health
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Test database connection
docker exec -it amis-postgres psql -U postgres -d amis -c "SELECT 1;"

# Check database logs
docker compose logs postgres
```

### Frontend Shows Blank Page

```bash
# Check if frontend is built
ls -la frontend/dist/

# Check nginx logs
docker compose logs nginx

# Verify nginx config
docker exec amis-nginx nginx -t
```

### Reset Everything

```bash
# Stop all services
docker compose down

# Remove volumes (WARNING: Deletes all data)
docker compose down -v

# Remove images
docker compose down --rmi all

# Start fresh
docker compose up -d
```

---

## SSL/HTTPS Setup (Optional)

### Using Let's Encrypt

```bash
# Install Certbot
apt update
apt install -y certbot python3-certbot-nginx

# Stop nginx temporarily
docker compose stop nginx

# Get certificate
certbot certonly --standalone -d amismedical.uz

# Copy certificates
mkdir -p /opt/amis/nginx/ssl
cp /etc/letsencrypt/live/amismedical.uz/fullchain.pem /opt/amis/nginx/ssl/
cp /etc/letsencrypt/live/amismedical.uz/privkey.pem /opt/amis/nginx/ssl/

# Start nginx
docker compose start nginx

# Auto-renewal cron
crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

---

## Maintenance

### Backup Database (Daily)

```bash
# Create backup script
nano /opt/amis/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/amis/backups
mkdir -p $BACKUP_DIR
docker exec amis-postgres pg_dump -U postgres amis > $BACKUP_DIR/amis_$DATE.sql
find $BACKUP_DIR -name "amis_*.sql" -mtime +7 -delete
```

```bash
# Make executable and schedule
chmod +x /opt/amis/backup.sh
crontab -e
# Add: 0 2 * * * /opt/amis/backup.sh
```

### Update Procedure

```bash
cd /opt/amis

# Pull new code
git pull

# Rebuild images
docker compose build

# Zero-downtime restart
docker compose up -d --remove-orphans

# Check health
curl http://localhost/health
```

---

## File Locations

| Purpose | Path |
|---------|------|
| Application | `/opt/amis/` |
| Database | Docker volume |
| Logs | `docker compose logs` |
| Backups | `/opt/amis/backups/` |

---

## Support

For issues, check:
1. `docker compose logs` for error messages
2. Container health: `docker compose ps`
3. Port availability: `ss -tlnp`
4. Firewall rules: `ufw status`

---

**Last Updated:** 2026-06-18
