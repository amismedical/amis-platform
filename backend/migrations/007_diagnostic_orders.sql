-- Migration: 007_diagnostic_orders.sql
-- Phase 9: Diagnostika / Instrumental Diagnostics

-- Create diagnostic_orders table
CREATE TABLE IF NOT EXISTS diagnostic_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID,
    branch_id UUID,
    patient_id UUID NOT NULL,
    episode_id UUID NOT NULL,
    doctor_id UUID,
    diagnostic_name TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'pending',
    clinical_note TEXT,
    doctor_note TEXT,
    result_text TEXT,
    result_note TEXT,
    result_status TEXT,
    report_file_url TEXT,
    ordered_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_diagnostic_orders_patient_id ON diagnostic_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_orders_episode_id ON diagnostic_orders(episode_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_orders_status ON diagnostic_orders(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_orders_category ON diagnostic_orders(category);

-- Comments
COMMENT ON TABLE diagnostic_orders IS 'Diagnostic orders (UZI, Rentgen, EKG, KT, MRT, Endoskopiya)';
COMMENT ON COLUMN diagnostic_orders.category IS 'ultrasound, xray, ecg, ct, mri, endoscopy, other';
COMMENT ON COLUMN diagnostic_orders.priority IS 'normal, urgent, critical';
COMMENT ON COLUMN diagnostic_orders.status IS 'pending, in_progress, completed, cancelled';
COMMENT ON COLUMN diagnostic_orders.result_status IS 'normal, abnormal, critical';
