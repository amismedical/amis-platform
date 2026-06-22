-- ===========================================
-- AMIS Database Migration
-- Version: 003 - Fix patients schema
-- Description: Add med_id and other missing columns to patients table
-- This migration is idempotent and safe to run multiple times
-- ===========================================

-- Add med_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'med_id'
    ) THEN
        ALTER TABLE patients ADD COLUMN med_id VARCHAR(50);
        RAISE NOTICE 'Added med_id column to patients table';
    ELSE
        RAISE NOTICE 'med_id column already exists in patients table';
    END IF;
END $$;

-- Add clinic_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'clinic_id'
    ) THEN
        ALTER TABLE patients ADD COLUMN clinic_id UUID;
        RAISE NOTICE 'Added clinic_id column to patients table';
    ELSE
        RAISE NOTICE 'clinic_id column already exists';
    END IF;
END $$;

-- Add branch_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE patients ADD COLUMN branch_id UUID;
        RAISE NOTICE 'Added branch_id column to patients table';
    ELSE
        RAISE NOTICE 'branch_id column already exists';
    END IF;
END $$;

-- Add created_by column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE patients ADD COLUMN created_by UUID;
        RAISE NOTICE 'Added created_by column to patients table';
    ELSE
        RAISE NOTICE 'created_by column already exists';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE patients ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to patients table';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Set default clinic_id for existing patients that have NULL
UPDATE patients SET clinic_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' WHERE clinic_id IS NULL;

-- Generate med_id for existing patients that don't have one
-- med_id format: AMIS-P-YYYY-NNNNNN (e.g., AMIS-P-2026-000001)
DO $$
DECLARE
    counter INTEGER;
    new_med_id VARCHAR(50);
    patient_rec RECORD;
BEGIN
    -- Count patients without med_id
    FOR patient_rec IN SELECT id FROM patients WHERE med_id IS NULL OR med_id = '' LOOP
        -- Get next sequence number
        counter := COALESCE((
            SELECT MAX(CAST(SUBSTRING(med_id FROM 'AMIS-P-[0-9]{4}-([0-9]+)') AS INTEGER))
            FROM patients
            WHERE med_id ~ 'AMIS-P-[0-9]{4}-[0-9]+'
        ), 0) + 1;

        new_med_id := 'AMIS-P-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::TEXT, 6, '0');

        UPDATE patients SET med_id = new_med_id WHERE id = patient_rec.id;
    END LOOP;

    RAISE NOTICE 'Generated med_id for patients without one';
END $$;

-- Make med_id unique if not already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'patients_med_id_unique'
    ) THEN
        -- Drop existing unique constraint if it exists with different name
        ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_med_id_key;
        ALTER TABLE patients ADD CONSTRAINT patients_med_id_unique UNIQUE (med_id);
        RAISE NOTICE 'Added unique constraint on med_id';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Unique constraint may already exist: %', SQLERRM;
END $$;

-- Make med_id NOT NULL after populating (if it has values)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM patients WHERE med_id IS NOT NULL AND med_id != ''
    ) THEN
        ALTER TABLE patients ALTER COLUMN med_id SET NOT NULL;
        RAISE NOTICE 'Set med_id as NOT NULL';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not set NOT NULL: %', SQLERRM;
END $$;

-- Create index on med_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_patients_med_id ON patients(med_id);

SELECT 'Migration 003 (patients schema fix) completed successfully!' as status;
