-- Migration 004: Add MED-ID region fields and sequences
-- Run this against the PostgreSQL database

-- 1. Add new columns to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS passport_region_code TEXT,
ADD COLUMN IF NOT EXISTS passport_region_name TEXT;

-- 2. Create sequences for MED-ID per region (one per region code)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT unnest(ARRAY['QRQ','AND','BUX','FAR','JIZ','XOR','NAM','NAV','QAS','SAM','SIR','SUR','TAS','TSH','FRN']) AS code
    LOOP
        EXECUTE format(
            'CREATE SEQUENCE IF NOT EXISTS medid_seq_%s START 1',
            r.code
        );
    END LOOP;
END;
$$;

-- 3. Create function to generate MED-ID from sequence
CREATE OR REPLACE FUNCTION generate_med_id(p_region_code TEXT)
RETURNS TEXT AS $$
DECLARE
    seq_name TEXT;
    seq_val BIGINT;
    year_val TEXT;
BEGIN
    year_val := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

    -- Handle foreign nationals
    IF p_region_code IS NULL OR p_region_code = '' THEN
        p_region_code := 'FRN';
    END IF;

    seq_name := 'medid_seq_' || p_region_code;

    -- Get and increment sequence
    EXECUTE format('SELECT nextval(%L)', seq_name) INTO seq_val;

    RETURN format('MED-%s-%s-%s',
        p_region_code,
        year_val,
        lpad(seq_val::TEXT, 6, '0')
    );
END;
$$ LANGUAGE plpgsql;

-- 4. Create unique index on med_id (after existing patients get updated)
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_med_id ON patients(med_id) WHERE med_id IS NOT NULL;

COMMENT ON COLUMN patients.passport_region_code IS 'Passport/ID region code (e.g. FAR, AND, FRN)';
COMMENT ON COLUMN patients.passport_region_name IS 'Passport/ID region name (e.g. Fargona, Chet el)';
