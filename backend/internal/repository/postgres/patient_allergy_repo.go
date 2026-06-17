package postgres

/**
 * AMIS - Patient Allergy Repository
 * TASK-001: Patient Profile Foundation
 */

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PatientAllergy struct {
	ID            uuid.UUID  `json:"id"`
	PatientID     uuid.UUID  `json:"patient_id"`
	ClinicID      *uuid.UUID `json:"clinic_id,omitempty"`
	Allergen      string     `json:"allergen"`
	AllergyType   string     `json:"allergy_type"` // drug, food, environmental, other
	Severity      string     `json:"severity"`     // mild, moderate, severe, life_threatening
	Reactions     string     `json:"reactions"`
	OnsetDate     *time.Time `json:"onset_date,omitempty"`
	IsVerified    bool       `json:"is_verified"`
	VerifiedBy    *uuid.UUID `json:"verified_by,omitempty"`
	VerifiedAt    *time.Time `json:"verified_at,omitempty"`
	Notes         string     `json:"notes"`
	IsActive      bool       `json:"is_active"`
	CreatedBy     *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedBy     *uuid.UUID `json:"updated_by,omitempty"`
	UpdatedAt     time.Time  `json:"updated_at"`

	// Joined data
	PatientName string `json:"patient_name,omitempty"`
}

type CreatePatientAllergyInput struct {
	PatientID   uuid.UUID
	ClinicID    *uuid.UUID
	Allergen    string
	AllergyType string
	Severity    string
	Reactions   string
	OnsetDate   *time.Time
	IsVerified  bool
	VerifiedBy  *uuid.UUID
	VerifiedAt  *time.Time
	Notes       string
	CreatedBy   *uuid.UUID
}

type UpdatePatientAllergyInput struct {
	Allergen    *string
	AllergyType *string
	Severity    *string
	Reactions   *string
	OnsetDate   *time.Time
	IsVerified  *bool
	VerifiedBy  *uuid.UUID
	VerifiedAt  *time.Time
	Notes       *string
	IsActive    *bool
	UpdatedBy   *uuid.UUID
}

type PatientAllergyRepository struct {
	db *pgxpool.Pool
}

func NewPatientAllergyRepository(db *pgxpool.Pool) *PatientAllergyRepository {
	return &PatientAllergyRepository{db: db}
}

// Create - Create new patient allergy
func (r *PatientAllergyRepository) Create(ctx context.Context, input CreatePatientAllergyInput) (*PatientAllergy, error) {
	allergy := &PatientAllergy{
		ID:           uuid.New(),
		PatientID:    input.PatientID,
		ClinicID:     input.ClinicID,
		Allergen:     input.Allergen,
		AllergyType:  input.AllergyType,
		Severity:     input.Severity,
		Reactions:    input.Reactions,
		OnsetDate:    input.OnsetDate,
		IsVerified:   input.IsVerified,
		VerifiedBy:   input.VerifiedBy,
		VerifiedAt:   input.VerifiedAt,
		Notes:        input.Notes,
		IsActive:     true,
		CreatedBy:    input.CreatedBy,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	query := `
		INSERT INTO patient_allergies (
			id, patient_id, clinic_id, allergen, allergy_type, severity,
			reactions, onset_date, is_verified, verified_by, verified_at,
			notes, is_active, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		RETURNING id
	`

	err := r.db.QueryRow(ctx, query,
		allergy.ID, allergy.PatientID, allergy.ClinicID, allergy.Allergen,
		allergy.AllergyType, allergy.Severity, allergy.Reactions, allergy.OnsetDate,
		allergy.IsVerified, allergy.VerifiedBy, allergy.VerifiedAt, allergy.Notes,
		allergy.IsActive, allergy.CreatedBy, allergy.CreatedAt, allergy.UpdatedAt,
	).Scan(&allergy.ID)

	if err != nil {
		return nil, fmt.Errorf("ошибка создания аллергии: %w", err)
	}

	return allergy, nil
}

// GetByID - Get allergy by ID
func (r *PatientAllergyRepository) GetByID(ctx context.Context, id uuid.UUID) (*PatientAllergy, error) {
	query := `
		SELECT pa.id, pa.patient_id, pa.clinic_id, pa.allergen, pa.allergy_type,
			pa.severity, pa.reactions, pa.onset_date, pa.is_verified, pa.verified_by,
			pa.verified_at, pa.notes, pa.is_active, pa.created_by, pa.created_at,
			pa.updated_by, pa.updated_at, p.first_name || ' ' || p.last_name as patient_name
		FROM patient_allergies pa
		LEFT JOIN patients p ON pa.patient_id = p.id
		WHERE pa.id = $1
	`

	allergy := &PatientAllergy{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&allergy.ID, &allergy.PatientID, &allergy.ClinicID, &allergy.Allergen,
		&allergy.AllergyType, &allergy.Severity, &allergy.Reactions, &allergy.OnsetDate,
		&allergy.IsVerified, &allergy.VerifiedBy, &allergy.VerifiedAt, &allergy.Notes,
		&allergy.IsActive, &allergy.CreatedBy, &allergy.CreatedAt,
		&allergy.UpdatedBy, &allergy.UpdatedAt, &allergy.PatientName,
	)
	if err != nil {
		return nil, err
	}

	return allergy, nil
}

// GetByPatientID - Get all allergies for a patient
func (r *PatientAllergyRepository) GetByPatientID(ctx context.Context, patientID uuid.UUID) ([]PatientAllergy, error) {
	query := `
		SELECT pa.id, pa.patient_id, pa.clinic_id, pa.allergen, pa.allergy_type,
			pa.severity, pa.reactions, pa.onset_date, pa.is_verified, pa.verified_by,
			pa.verified_at, pa.notes, pa.is_active, pa.created_by, pa.created_at,
			pa.updated_by, pa.updated_at, p.first_name || ' ' || p.last_name as patient_name
		FROM patient_allergies pa
		LEFT JOIN patients p ON pa.patient_id = p.id
		WHERE pa.patient_id = $1 AND pa.is_active = true
		ORDER BY
			CASE pa.severity
				WHEN 'life_threatening' THEN 1
				WHEN 'severe' THEN 2
				WHEN 'moderate' THEN 3
				ELSE 4
			END,
			pa.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var allergies []PatientAllergy
	for rows.Next() {
		a := PatientAllergy{}
		err := rows.Scan(
			&a.ID, &a.PatientID, &a.ClinicID, &a.Allergen,
			&a.AllergyType, &a.Severity, &a.Reactions, &a.OnsetDate,
			&a.IsVerified, &a.VerifiedBy, &a.VerifiedAt, &a.Notes,
			&a.IsActive, &a.CreatedBy, &a.CreatedAt,
			&a.UpdatedBy, &a.UpdatedAt, &a.PatientName,
		)
		if err != nil {
			return nil, err
		}
		allergies = append(allergies, a)
	}

	return allergies, nil
}

// GetSevereAllergies - Get severe/life-threatening allergies for a patient
func (r *PatientAllergyRepository) GetSevereAllergies(ctx context.Context, patientID uuid.UUID) ([]PatientAllergy, error) {
	query := `
		SELECT pa.id, pa.patient_id, pa.clinic_id, pa.allergen, pa.allergy_type,
			pa.severity, pa.reactions, pa.onset_date, pa.is_verified, pa.verified_by,
			pa.verified_at, pa.notes, pa.is_active, pa.created_by, pa.created_at,
			pa.updated_by, pa.updated_at, p.first_name || ' ' || p.last_name as patient_name
		FROM patient_allergies pa
		LEFT JOIN patients p ON pa.patient_id = p.id
		WHERE pa.patient_id = $1 AND pa.is_active = true
			AND pa.severity IN ('severe', 'life_threatening')
		ORDER BY pa.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var allergies []PatientAllergy
	for rows.Next() {
		a := PatientAllergy{}
		err := rows.Scan(
			&a.ID, &a.PatientID, &a.ClinicID, &a.Allergen,
			&a.AllergyType, &a.Severity, &a.Reactions, &a.OnsetDate,
			&a.IsVerified, &a.VerifiedBy, &a.VerifiedAt, &a.Notes,
			&a.IsActive, &a.CreatedBy, &a.CreatedAt,
			&a.UpdatedBy, &a.UpdatedAt, &a.PatientName,
		)
		if err != nil {
			return nil, err
		}
		allergies = append(allergies, a)
	}

	return allergies, nil
}

// Update - Update patient allergy
func (r *PatientAllergyRepository) Update(ctx context.Context, id uuid.UUID, input UpdatePatientAllergyInput) error {
	query := `
		UPDATE patient_allergies SET
			allergen = COALESCE($2, allergen),
			allergy_type = COALESCE($3, allergy_type),
			severity = COALESCE($4, severity),
			reactions = COALESCE($5, reactions),
			onset_date = COALESCE($6, onset_date),
			is_verified = COALESCE($7, is_verified),
			verified_by = COALESCE($8, verified_by),
			verified_at = COALESCE($9, verified_at),
			notes = COALESCE($10, notes),
			is_active = COALESCE($11, is_active),
			updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(ctx, query,
		id, input.Allergen, input.AllergyType, input.Severity, input.Reactions,
		input.OnsetDate, input.IsVerified, input.VerifiedBy, input.VerifiedAt,
		input.Notes, input.IsActive,
	)

	return err
}

// Delete - Soft delete patient allergy
func (r *PatientAllergyRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE patient_allergies SET is_active = false, updated_at = NOW() WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}