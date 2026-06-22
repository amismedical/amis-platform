#!/bin/bash
# ===========================================
# AMIS Database Migration Script
# Run on VPS to create all required tables
# ===========================================

set -e

# Configuration - Update these if your settings differ
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-amis}"
DB_PASSWORD="${DB_PASSWORD:-postgres_secure_password}"

echo "==========================================="
echo "AMIS Database Migration"
echo "==========================================="
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"
echo ""

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Wait for PostgreSQL to be ready
echo "Checking PostgreSQL connection..."
for i in {1..30}; do
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c '\q' 2>/dev/null; then
        echo "PostgreSQL is ready!"
        break
    fi
    echo "Waiting for PostgreSQL... ($i/30)"
    sleep 1
done

# Create database if not exists
echo ""
echo "Creating database if not exists..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME"

# Run migrations
# CRITICAL: Run schema compatibility FIRST to add missing columns
echo ""
echo "Running migration: 000_schema_compatibility.sql (adds missing columns)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/migrations/000_schema_compatibility.sql || true

echo ""
echo "Running migration: 001_initial_schema.sql..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/migrations/001_initial_schema.sql || true

echo ""
echo "Running migration: 002_medical_card.sql..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/migrations/002_medical_card.sql || true

echo ""
echo "Running migration: 003_fix_patients_schema.sql (med_id fix)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/migrations/003_fix_patients_schema.sql || true

echo ""
echo "Running migration: 004_fix_admin_password.sql (password hash fix)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/migrations/004_fix_admin_password.sql || true

# Create seed data (clinic, branch, admin user)
echo ""
echo "Creating seed data..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SEED_SQL'
-- Create default clinic
INSERT INTO clinics (id, name, legal_name, inn, address, phone, email, is_active)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'AMIS Medical Clinic',
    'AMIS Medical Clinic LLC',
    '12345678901234',
    'Tashkent, Uzbekistan',
    '+998901234567',
    'admin@amismedical.uz',
    true
) ON CONFLICT DO NOTHING;

-- Create main branch
INSERT INTO branches (id, clinic_id, name, address, phone, is_main, is_active)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Main Branch',
    'Tashkent, Yunusobod district',
    '+998901234568',
    true,
    true
) ON CONFLICT DO NOTHING;

-- Create admin user (password: admin123)
INSERT INTO users (id, clinic_id, branch_id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'admin@amismedical.uz',
    '$2a$10$pTyV08HN.UpI3mLFxRPuwegHZ8DYrrIH1D9Q8jzQlChjXRmsC0O.u',
    'System',
    'Administrator',
    'super_admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Create price category
INSERT INTO price_categories (id, clinic_id, name, priority, discount, is_active)
VALUES (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Standard',
    1,
    0,
    true
) ON CONFLICT DO NOTHING;

SELECT 'Seed data created successfully!' as status;
SEED_SQL

echo ""
echo "==========================================="
echo "Migration completed successfully!"
echo "==========================================="
echo ""
echo "Default admin credentials:"
echo "  Email: admin@amismedical.uz"
echo "  Password: admin123"
echo ""
echo "Clinic ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
echo "Branch ID: b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"
