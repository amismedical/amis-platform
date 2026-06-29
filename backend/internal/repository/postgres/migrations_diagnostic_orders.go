package postgres

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

/**
 * AMIS - Diagnostic Orders Migrations
 * TASK-009: Diagnostika / Instrumental Diagnostics
 *
 * Additive migrations only - DO NOT modify existing tables
 * All tables use CREATE TABLE IF NOT EXISTS
 */

func RunDiagnosticOrdersMigrations(pool *pgxpool.Pool) error {
	ctx := context.Background()

	migrations := []string{
		// diagnostic_orders - Instrumental diagnostic orders for medical card
		`CREATE TABLE IF NOT EXISTS diagnostic_orders (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
			branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
			patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
			doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,

			-- Diagnostic order fields
			diagnostic_name VARCHAR(500) NOT NULL,
			category VARCHAR(50) NOT NULL DEFAULT 'other', -- ultrasound, xray, ecg, ct, mri, endoscopy, other
			priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- normal, urgent, critical

			-- Status tracking
			status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, cancelled

			-- Notes
			clinical_note TEXT,
			doctor_note TEXT,

			-- Results
			result_text TEXT,
			result_note TEXT,
			result_status VARCHAR(20), -- normal, abnormal, critical
			report_file_url TEXT,

			-- Timestamps
			ordered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			completed_at TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			created_by UUID REFERENCES users(id),
			updated_by UUID REFERENCES users(id)
		)`,

		// Indexes for fast queries
		`CREATE INDEX IF NOT EXISTS idx_diagnostic_orders_patient ON diagnostic_orders(patient_id)`,
		`CREATE INDEX IF NOT EXISTS idx_diagnostic_orders_episode ON diagnostic_orders(episode_id)`,
		`CREATE INDEX IF NOT EXISTS idx_diagnostic_orders_clinic ON diagnostic_orders(clinic_id)`,
		`CREATE INDEX IF NOT EXISTS idx_diagnostic_orders_doctor ON diagnostic_orders(doctor_id)`,
		`CREATE INDEX IF NOT EXISTS idx_diagnostic_orders_status ON diagnostic_orders(status)`,
		`CREATE INDEX IF NOT EXISTS idx_diagnostic_orders_category ON diagnostic_orders(category)`,
		`CREATE INDEX IF NOT EXISTS idx_diagnostic_orders_ordered_at ON diagnostic_orders(ordered_at DESC)`,

		// Update timestamp trigger
		`CREATE OR REPLACE FUNCTION update_diagnostic_orders_updated_at()
		RETURNS TRIGGER AS $$
		BEGIN
			NEW.updated_at = CURRENT_TIMESTAMP;
			RETURN NEW;
		END;
		$$ language 'plpgsql'`,

		`DROP TRIGGER IF EXISTS update_diagnostic_orders_updated_at ON diagnostic_orders`,
		`CREATE TRIGGER update_diagnostic_orders_updated_at BEFORE UPDATE ON diagnostic_orders FOR EACH ROW EXECUTE FUNCTION update_diagnostic_orders_updated_at()`,
	}

	for i, migration := range migrations {
		_, err := pool.Exec(ctx, migration)
		if err != nil {
			return err
		}
		_ = i // silence unused variable
	}

	return nil
}
