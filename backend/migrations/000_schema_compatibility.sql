-- ===========================================
-- AMIS Database Compatibility Migration
-- Version: 000 - MUST RUN FIRST before any other migrations
-- Description: Add all columns required by Go backend that are missing from older schemas
-- This migration is COMPLETELY IDEMPOTENT and safe to run multiple times
-- ===========================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Running AMIS Schema Compatibility Migration';
    RAISE NOTICE '============================================';
END $$;

-- ===========================================
-- PATIENTS TABLE FIXES
-- ===========================================

-- Add med_id column (UNIQUE medical ID for patients)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'med_id'
    ) THEN
        ALTER TABLE patients ADD COLUMN med_id VARCHAR(50);
        RAISE NOTICE 'Added med_id column to patients';
    ELSE
        RAISE NOTICE 'patients.med_id already exists';
    END IF;
END $$;

-- Add branch_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE patients ADD COLUMN branch_id UUID;
        RAISE NOTICE 'Added branch_id column to patients';
    ELSE
        RAISE NOTICE 'patients.branch_id already exists';
    END IF;
END $$;

-- Add created_by column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE patients ADD COLUMN created_by UUID;
        RAISE NOTICE 'Added created_by column to patients';
    ELSE
        RAISE NOTICE 'patients.created_by already exists';
    END IF;
END $$;

-- Set default clinic_id for existing patients
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'clinic_id'
    ) THEN
        UPDATE patients SET clinic_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
        WHERE clinic_id IS NULL;
        RAISE NOTICE 'Set default clinic_id for patients';
    END IF;
END $$;

-- Generate med_id for existing patients
DO $$
DECLARE
    counter INTEGER;
    new_med_id VARCHAR(50);
    rec RECORD;
BEGIN
    FOR rec IN SELECT id FROM patients WHERE med_id IS NULL OR med_id = '' LOOP
        counter := COALESCE((
            SELECT MAX(CAST(SUBSTRING(med_id FROM 'AMIS-P-[0-9]{4}-([0-9]+)') AS INTEGER))
            FROM patients
            WHERE med_id ~ 'AMIS-P-[0-9]{4}-[0-9]+'
        ), 0) + 1;

        new_med_id := 'AMIS-P-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::TEXT, 6, '0');
        UPDATE patients SET med_id = new_med_id WHERE id = rec.id;
        counter := counter + 1;
    END LOOP;
    RAISE NOTICE 'Generated med_id for patients without one';
END $$;

-- Add unique constraint on med_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'patients_med_id_key'
    ) THEN
        ALTER TABLE patients ADD CONSTRAINT patients_med_id_key UNIQUE (med_id);
        RAISE NOTICE 'Added unique constraint on patients.med_id';
    ELSE
        RAISE NOTICE 'patients.med_id unique constraint already exists';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Unique constraint may exist: %', SQLERRM;
END $$;

-- Create index on med_id
CREATE INDEX IF NOT EXISTS idx_patients_med_id ON patients(med_id);

-- ===========================================
-- APPOINTMENTS TABLE FIXES
-- ===========================================

-- Add appointment_number column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'appointments' AND column_name = 'appointment_number'
    ) THEN
        ALTER TABLE appointments ADD COLUMN appointment_number VARCHAR(50);
        RAISE NOTICE 'Added appointment_number column to appointments';
    ELSE
        RAISE NOTICE 'appointments.appointment_number already exists';
    END IF;
END $$;

-- Generate appointment_number for existing appointments
DO $$
DECLARE
    counter INTEGER;
    new_appt_num VARCHAR(50);
    rec RECORD;
BEGIN
    FOR rec IN SELECT id, appointment_date FROM appointments WHERE appointment_number IS NULL OR appointment_number = '' LOOP
        counter := COALESCE((
            SELECT MAX(CAST(SUBSTRING(appointment_number FROM '[0-9]+$') AS INTEGER))
            FROM appointments
            WHERE appointment_number ~ '[0-9]+$'
        ), 0) + 1;

        new_appt_num := 'APPT-' || TO_CHAR(rec.appointment_date, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
        UPDATE appointments SET appointment_number = new_appt_num WHERE id = rec.id;
        counter := counter + 1;
    END LOOP;
    RAISE NOTICE 'Generated appointment_number for appointments without one';
END $$;

-- Create index on appointment_number
CREATE INDEX IF NOT EXISTS idx_appointments_number ON appointments(appointment_number);

-- ===========================================
-- STAFF TABLE - ensure all columns exist
-- ===========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff' AND column_name = 'specialty'
    ) THEN
        ALTER TABLE staff ADD COLUMN specialty VARCHAR(100);
        RAISE NOTICE 'Added specialty column to staff';
    ELSE
        RAISE NOTICE 'staff.specialty already exists';
    END IF;
END $$;

-- ===========================================
-- QUEUES TABLE - ensure columns exist
-- ===========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'queues' AND column_name = 'queue_type'
    ) THEN
        ALTER TABLE queues ADD COLUMN queue_type VARCHAR(50) DEFAULT 'appointment';
        RAISE NOTICE 'Added queue_type column to queues';
    ELSE
        RAISE NOTICE 'queues.queue_type already exists';
    END IF;
END $$;

-- ===========================================
-- ENSURE DEFAULT CLINIC EXISTS
-- ===========================================

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
) ON CONFLICT (id) DO NOTHING;

INSERT INTO branches (id, clinic_id, name, address, phone, is_main, is_active)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Main Branch',
    'Tashkent, Yunusobod district',
    '+998901234568',
    true,
    true
) ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- FIX ADMIN PASSWORD HASH
-- ===========================================
-- Update admin user password with valid bcrypt hash for 'admin123'
UPDATE users
SET password_hash = '$2a$10$pTyV08HN.UpI3mLFxRPuwegHZ8DYrrIH1D9Q8jzQlChjXRmsC0O.u',
    updated_at = NOW()
WHERE email = 'admin@amismedical.uz'
AND (password_hash IS NULL OR password_hash = '' OR password_hash LIKE '%Z8Z8%');

-- ===========================================
-- SUMMARY
-- ===========================================

SELECT 'Schema Compatibility Migration Complete!' as status;
