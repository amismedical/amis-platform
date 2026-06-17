-- AMIS Medical Card Foundation Migration
-- TASK-005: Medical Card Foundation
-- Version: 2.0
-- Description: Medical card tables and columns

-- ===== MEDICAL CARDS TABLE =====
-- Single medical card per patient per clinic
CREATE TABLE IF NOT EXISTS medical_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    blood_type VARCHAR(5),
    rh_factor VARCHAR(5),
    allergies TEXT,
    chronic_conditions TEXT,
    family_history TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(clinic_id, patient_id)
);

CREATE INDEX idx_medical_cards_clinic ON medical_cards(clinic_id);
CREATE INDEX idx_medical_cards_patient ON medical_cards(patient_id);

-- ===== ADD MISSING COLUMNS TO EPISODES =====
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episodes' AND column_name = 'branch_id') THEN
        ALTER TABLE episodes ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episodes' AND column_name = 'appointment_id') THEN
        ALTER TABLE episodes ADD COLUMN appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episodes' AND column_name = 'created_by') THEN
        ALTER TABLE episodes ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episodes' AND column_name = 'updated_by') THEN
        ALTER TABLE episodes ADD COLUMN updated_by UUID REFERENCES users(id);
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_episodes_branch_id ON episodes(branch_id);
CREATE INDEX IF NOT EXISTS idx_episodes_appointment_id ON episodes(appointment_id);

-- ===== ADD MISSING COLUMNS TO ENCOUNTERS =====
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'branch_id') THEN
        ALTER TABLE encounters ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'created_by') THEN
        ALTER TABLE encounters ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'updated_by') THEN
        ALTER TABLE encounters ADD COLUMN updated_by UUID REFERENCES users(id);
    END IF;
END$$;

-- ===== ADD MISSING COLUMNS TO VITALS =====
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vitals' AND column_name = 'branch_id') THEN
        ALTER TABLE vitals ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vitals' AND column_name = 'created_by') THEN
        ALTER TABLE vitals ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vitals' AND column_name = 'updated_by') THEN
        ALTER TABLE vitals ADD COLUMN updated_by UUID REFERENCES users(id);
    END IF;
END$$;

-- ===== ADD MISSING COLUMNS TO DIAGNOSES =====
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnoses' AND column_name = 'branch_id') THEN
        ALTER TABLE diagnoses ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnoses' AND column_name = 'created_by') THEN
        ALTER TABLE diagnoses ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diagnoses' AND column_name = 'updated_by') THEN
        ALTER TABLE diagnoses ADD COLUMN updated_by UUID REFERENCES users(id);
    END IF;
END$$;

-- ===== ADD MISSING COLUMNS TO RECOMMENDATIONS =====
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recommendations' AND column_name = 'branch_id') THEN
        ALTER TABLE recommendations ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recommendations' AND column_name = 'created_by') THEN
        ALTER TABLE recommendations ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recommendations' AND column_name = 'updated_by') THEN
        ALTER TABLE recommendations ADD COLUMN updated_by UUID REFERENCES users(id);
    END IF;
END$$;

-- ===== ADD MISSING COLUMNS TO EPISODE_FILES =====
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episode_files' AND column_name = 'branch_id') THEN
        ALTER TABLE episode_files ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episode_files' AND column_name = 'updated_by') THEN
        ALTER TABLE episode_files ADD COLUMN updated_by UUID REFERENCES users(id);
    END IF;
END$$;

-- ===== CREATE UPDATED_AT TRIGGER FOR MEDICAL_CARDS =====
CREATE OR REPLACE FUNCTION update_medical_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_medical_cards_updated_at ON medical_cards;
CREATE TRIGGER update_medical_cards_updated_at BEFORE UPDATE ON medical_cards FOR EACH ROW EXECUTE FUNCTION update_medical_cards_updated_at();

-- ===== ICD-10 SEARCH INDEX =====
CREATE INDEX IF NOT EXISTS idx_icd10_name ON icd10 USING gin(to_tsvector('russian', name));
CREATE INDEX IF NOT EXISTS idx_icd10_code_search ON icd10(code);

-- ===== EPISODE STATUS VALUES =====
-- active, completed, cancelled

-- ===== DIAGNOSIS TYPES =====
-- main, сопутствующий (comorbid), осложнение (complication)

-- ===== RECOMMENDATION TYPES =====
-- анализы (labs), процедуры (procedures), консультации (referrals), медикаменты (medications), образ_жизни (lifestyle)