-- Phase 8: Lab Orders / Analizlar Migration
-- Laboratory orders for Medical Card

-- ===== LAB_ORDERS TABLE =====
CREATE TABLE IF NOT EXISTS lab_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Lab order fields
    analysis_name VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'other', -- blood, urine, biochemistry, other
    priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- normal, urgent

    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, collected, processing, completed, cancelled

    -- Notes
    clinical_note TEXT,
    doctor_note TEXT,

    -- Results
    result_text TEXT,
    result_file_url TEXT,

    -- Timestamps
    ordered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_episode ON lab_orders(episode_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_clinic ON lab_orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_doctor ON lab_orders(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_category ON lab_orders(category);
CREATE INDEX IF NOT EXISTS idx_lab_orders_ordered_at ON lab_orders(ordered_at DESC);

-- ===== LAB_ORDER CATEGORY CONSTRAINT =====
-- Valid categories: blood, urine, biochemistry, other

-- ===== LAB_ORDER PRIORITY CONSTRAINT =====
-- Valid priorities: normal, urgent

-- ===== LAB_ORDER STATUS CONSTRAINT =====
-- Valid statuses: pending, collected, processing, completed, cancelled

-- ===== UPDATE TIMESTAMP TRIGGER =====
CREATE OR REPLACE FUNCTION update_lab_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_lab_orders_updated_at ON lab_orders;
CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON lab_orders FOR EACH ROW EXECUTE FUNCTION update_lab_orders_updated_at();
