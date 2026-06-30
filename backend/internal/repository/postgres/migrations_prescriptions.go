package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RunPrescriptionsMigrations creates prescriptions table
func RunPrescriptionsMigrations(pool *pgxpool.Pool) error {
	ctx := context.Background()
	// Create prescriptions table
	query := `
	CREATE TABLE IF NOT EXISTS prescriptions (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		clinic_id UUID,
		branch_id UUID,
		patient_id UUID NOT NULL,
		episode_id UUID,
		doctor_id UUID,

		-- Prescription fields
		medicine_name VARCHAR(500) NOT NULL,
		dosage VARCHAR(100),
		frequency VARCHAR(100),
		duration VARCHAR(100),
		route VARCHAR(100),
		instructions TEXT,
		quantity VARCHAR(50),

		-- Status
		status VARCHAR(20) NOT NULL DEFAULT 'active',

		-- Timestamps
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		created_by UUID,
		updated_by UUID,

		-- Constraints
		CONSTRAINT prescriptions_status_check CHECK (status IN ('active', 'completed', 'cancelled'))
	);

	-- Indexes for prescriptions
	CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
	CREATE INDEX IF NOT EXISTS idx_prescriptions_episode_id ON prescriptions(episode_id);
	CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
	CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
	CREATE INDEX IF NOT EXISTS idx_prescriptions_created_at ON prescriptions(created_at DESC);
	`

	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to create prescriptions table: %w", err)
	}

	// Create updated_at trigger function
	triggerQuery := `
	CREATE OR REPLACE FUNCTION update_updated_at_column()
	RETURNS TRIGGER AS $$
	BEGIN
		NEW.updated_at = NOW();
		RETURN NEW;
	END;
	$$ language 'plpgsql';

	-- Drop trigger if exists and recreate
	DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON prescriptions;
	CREATE TRIGGER update_prescriptions_updated_at
		BEFORE UPDATE ON prescriptions
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();
	`

	_, err = pool.Exec(ctx, triggerQuery)
	if err != nil {
		return fmt.Errorf("failed to create prescriptions trigger: %w", err)
	}

	return nil
}
