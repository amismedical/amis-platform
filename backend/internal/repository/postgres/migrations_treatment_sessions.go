package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RunTreatmentSessionsMigrations creates treatment_course_sessions table (TASK-012)
func RunTreatmentSessionsMigrations(pool *pgxpool.Pool) error {
	ctx := context.Background()

	// Create treatment_course_sessions table
	query := `
	CREATE TABLE IF NOT EXISTS treatment_course_sessions (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		clinic_id UUID,
		branch_id UUID,
		treatment_course_id UUID NOT NULL,
		patient_id UUID NOT NULL,
		episode_id UUID NOT NULL,
		author_id UUID,
		responsible_user_id UUID,

		-- Session fields
		session_date DATE NOT NULL,
		planned_time TEXT,
		session_type TEXT NOT NULL DEFAULT 'procedure',
		procedure_name TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'planned',
		instructions TEXT,
		result_note TEXT,
		notes TEXT,

		-- Timestamps
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		completed_at TIMESTAMPTZ,

		-- Constraints
		CONSTRAINT tcs_type_check CHECK (session_type IN ('medication', 'injection', 'physiotherapy', 'rehabilitation', 'dressing', 'observation', 'procedure', 'other')),
		CONSTRAINT tcs_status_check CHECK (status IN ('planned', 'in_progress', 'done', 'skipped', 'cancelled')),
		CONSTRAINT tcs_course_fk FOREIGN KEY (treatment_course_id) REFERENCES treatment_courses(id) ON DELETE CASCADE
	);

	-- Indexes for treatment_course_sessions
	CREATE INDEX IF NOT EXISTS idx_tcs_treatment_course_id ON treatment_course_sessions(treatment_course_id);
	CREATE INDEX IF NOT EXISTS idx_tcs_patient_id ON treatment_course_sessions(patient_id);
	CREATE INDEX IF NOT EXISTS idx_tcs_episode_id ON treatment_course_sessions(episode_id);
	CREATE INDEX IF NOT EXISTS idx_tcs_session_date ON treatment_course_sessions(session_date);
	CREATE INDEX IF NOT EXISTS idx_tcs_status ON treatment_course_sessions(status);
	CREATE INDEX IF NOT EXISTS idx_tcs_created_at ON treatment_course_sessions(created_at DESC);
	`

	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to create treatment_course_sessions table: %w", err)
	}

	// Create updated_at trigger function
	triggerQuery := `
	CREATE OR REPLACE FUNCTION update_tcs_updated_at()
	RETURNS TRIGGER AS $$
	BEGIN
		NEW.updated_at = NOW();
		RETURN NEW;
	END;
	$$ language 'plpgsql';

	DROP TRIGGER IF EXISTS update_tcs_updated_at ON treatment_course_sessions;
	CREATE TRIGGER update_tcs_updated_at
		BEFORE UPDATE ON treatment_course_sessions
		FOR EACH ROW
		EXECUTE FUNCTION update_tcs_updated_at();
	`

	_, err = pool.Exec(ctx, triggerQuery)
	if err != nil {
		return fmt.Errorf("failed to create treatment_course_sessions trigger: %w", err)
	}

	return nil
}
