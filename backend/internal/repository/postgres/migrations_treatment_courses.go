package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RunTreatmentCoursesMigrations creates treatment_courses table (TASK-011)
func RunTreatmentCoursesMigrations(pool *pgxpool.Pool) error {
	ctx := context.Background()

	// Create treatment_courses table
	query := `
	CREATE TABLE IF NOT EXISTS treatment_courses (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		clinic_id UUID,
		branch_id UUID,
		patient_id UUID NOT NULL,
		episode_id UUID NOT NULL,
		author_id UUID,

		-- Course fields
		course_name TEXT NOT NULL,
		course_type TEXT NOT NULL DEFAULT 'other',
		status TEXT NOT NULL DEFAULT 'planned',
		goal TEXT,
		start_date DATE,
		end_date DATE,
		instructions TEXT,
		notes TEXT,

		-- Timestamps
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		completed_at TIMESTAMPTZ,

		-- Constraints
		CONSTRAINT treatment_courses_type_check CHECK (course_type IN ('medication', 'procedure', 'physiotherapy', 'rehabilitation', 'observation', 'other')),
		CONSTRAINT treatment_courses_status_check CHECK (status IN ('planned', 'active', 'suspended', 'completed', 'cancelled'))
	);

	-- Indexes for treatment_courses
	CREATE INDEX IF NOT EXISTS idx_treatment_courses_patient_id ON treatment_courses(patient_id);
	CREATE INDEX IF NOT EXISTS idx_treatment_courses_episode_id ON treatment_courses(episode_id);
	CREATE INDEX IF NOT EXISTS idx_treatment_courses_author_id ON treatment_courses(author_id);
	CREATE INDEX IF NOT EXISTS idx_treatment_courses_status ON treatment_courses(status);
	CREATE INDEX IF NOT EXISTS idx_treatment_courses_type ON treatment_courses(course_type);
	CREATE INDEX IF NOT EXISTS idx_treatment_courses_created_at ON treatment_courses(created_at DESC);
	`

	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to create treatment_courses table: %w", err)
	}

	// Create updated_at trigger function
	triggerQuery := `
	CREATE OR REPLACE FUNCTION update_treatment_courses_updated_at()
	RETURNS TRIGGER AS $$
	BEGIN
		NEW.updated_at = NOW();
		RETURN NEW;
	END;
	$$ language 'plpgsql';

	DROP TRIGGER IF EXISTS update_treatment_courses_updated_at ON treatment_courses;
	CREATE TRIGGER update_treatment_courses_updated_at
		BEFORE UPDATE ON treatment_courses
		FOR EACH ROW
		EXECUTE FUNCTION update_treatment_courses_updated_at();
	`

	_, err = pool.Exec(ctx, triggerQuery)
	if err != nil {
		return fmt.Errorf("failed to create treatment_courses trigger: %w", err)
	}

	return nil
}
