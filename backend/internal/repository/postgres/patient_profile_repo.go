package postgres

/**
 * AMIS - Patient Profile Repository
 * TASK-001: Patient Profile Foundation
 */

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PatientProfile struct {
	ID             uuid.UUID              `json:"id"`
	PatientID      uuid.UUID              `json:"patient_id"`
	ClinicID       *uuid.UUID             `json:"clinic_id,omitempty"`
	BloodType      string                 `json:"blood_type"`
	RhFactor       string                 `json:"rh_factor"`
	Height         float64                `json:"height"`
	Weight         float64                `json:"weight"`
	Allergies      []string               `json:"allergies"`
	ChronicDiseases []string              `json:"chronic_diseases"`
	Disabilities   string                 `json:"disabilities"`
	Notes          string                 `json:"notes"`
	IsActive       bool                   `json:"is_active"`
	CreatedBy      *uuid.UUID             `json:"created_by,omitempty"`
	CreatedAt      time.Time              `json:"created_at"`
	UpdatedBy      *uuid.UUID             `json:"updated_by,omitempty"`
	UpdatedAt      time.Time              `json:"updated_at"`

	// Joined data
	PatientName string `json:"patient_name,omitempty"`
}

type CreatePatientProfileInput struct {
	PatientID       uuid.UUID
	ClinicID        *uuid.UUID
	BloodType       string
	RhFactor        string
	Height          float64
	Weight          float64
	Allergies       []string
	ChronicDiseases []string
	Disabilities    string
	Notes           string
	CreatedBy       *uuid.UUID
}

type UpdatePatientProfileInput struct {
	BloodType       *string
	RhFactor        *string
	Height          *float64
	Weight          *float64
	Allergies       *[]string
	ChronicDiseases *[]string
	Disabilities    *string
	Notes           *string
	IsActive        *bool
	UpdatedBy       *uuid.UUID
}

type PatientProfileRepository struct {
	db *pgxpool.Pool
}

func NewPatientProfileRepository(db *pgxpool.Pool) *PatientProfileRepository {
	return &PatientProfileRepository{db: db}
}

// Create - Create new patient profile
func (r *PatientProfileRepository) Create(ctx context.Context, input CreatePatientProfileInput) (*PatientProfile, error) {
	profile := &PatientProfile{
		ID:              uuid.New(),
		PatientID:       input.PatientID,
		ClinicID:        input.ClinicID,
		BloodType:       input.BloodType,
		RhFactor:        input.RhFactor,
		Height:          input.Height,
		Weight:          input.Weight,
		Allergies:       input.Allergies,
		ChronicDiseases: input.ChronicDiseases,
		Disabilities:    input.Disabilities,
		Notes:           input.Notes,
		IsActive:        true,
		CreatedBy:       input.CreatedBy,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	query := `
		INSERT INTO patient_profiles (
			id, patient_id, clinic_id, blood_type, rh_factor, height, weight,
			allergies, chronic_diseases, disabilities, notes, is_active,
			created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		RETURNING id
	`

	err := r.db.QueryRow(ctx, query,
		profile.ID, profile.PatientID, profile.ClinicID,
		profile.BloodType, profile.RhFactor, profile.Height, profile.Weight,
		profile.Allergies, profile.ChronicDiseases, profile.Disabilities,
		profile.Notes, profile.IsActive, profile.CreatedBy, profile.CreatedAt, profile.UpdatedAt,
	).Scan(&profile.ID)

	if err != nil {
		return nil, fmt.Errorf("ошибка создания профиля пациента: %w", err)
	}

	return profile, nil
}

// GetByPatientID - Get patient profile by patient ID
func (r *PatientProfileRepository) GetByPatientID(ctx context.Context, patientID uuid.UUID) (*PatientProfile, error) {
	query := `
		SELECT pp.id, pp.patient_id, pp.clinic_id, pp.blood_type, pp.rh_factor,
			pp.height, pp.weight, pp.allergies, pp.chronic_diseases, pp.disabilities,
			pp.notes, pp.is_active, pp.created_by, pp.created_at, pp.updated_by, pp.updated_at,
			p.first_name || ' ' || p.last_name as patient_name
		FROM patient_profiles pp
		LEFT JOIN patients p ON pp.patient_id = p.id
		WHERE pp.patient_id = $1 AND pp.is_active = true
	`

	profile := &PatientProfile{}
	err := r.db.QueryRow(ctx, query, patientID).Scan(
		&profile.ID, &profile.PatientID, &profile.ClinicID,
		&profile.BloodType, &profile.RhFactor, &profile.Height, &profile.Weight,
		&profile.Allergies, &profile.ChronicDiseases, &profile.Disabilities,
		&profile.Notes, &profile.IsActive, &profile.CreatedBy, &profile.CreatedAt,
		&profile.UpdatedBy, &profile.UpdatedAt, &profile.PatientName,
	)
	if err != nil {
		return nil, err
	}

	return profile, nil
}

// Update - Update patient profile
func (r *PatientProfileRepository) Update(ctx context.Context, patientID uuid.UUID, input UpdatePatientProfileInput) error {
	query := `
		UPDATE patient_profiles SET
			blood_type = COALESCE($2, blood_type),
			rh_factor = COALESCE($3, rh_factor),
			height = COALESCE($4, height),
			weight = COALESCE($5, weight),
			allergies = COALESCE($6, allergies),
			chronic_diseases = COALESCE($7, chronic_diseases),
			disabilities = COALESCE($8, disabilities),
			notes = COALESCE($9, notes),
			is_active = COALESCE($10, is_active),
			updated_at = NOW()
		WHERE patient_id = $1 AND is_active = true
	`

	_, err := r.db.Exec(ctx, query,
		patientID, input.BloodType, input.RhFactor, input.Height, input.Weight,
		input.Allergies, input.ChronicDiseases, input.Disabilities, input.Notes, input.IsActive,
	)

	return err
}

// ListByClinic - List all patient profiles for a clinic
func (r *PatientProfileRepository) ListByClinic(ctx context.Context, clinicID uuid.UUID, limit, offset int) ([]PatientProfile, int, error) {
	countQuery := `SELECT COUNT(*) FROM patient_profiles WHERE clinic_id = $1 AND is_active = true`
	var total int
	if err := r.db.QueryRow(ctx, countQuery, clinicID).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `
		SELECT pp.id, pp.patient_id, pp.clinic_id, pp.blood_type, pp.rh_factor,
			pp.height, pp.weight, pp.allergies, pp.chronic_diseases, pp.disabilities,
			pp.notes, pp.is_active, pp.created_by, pp.created_at, pp.updated_by, pp.updated_at,
			p.first_name || ' ' || p.last_name as patient_name
		FROM patient_profiles pp
		LEFT JOIN patients p ON pp.patient_id = p.id
		WHERE pp.clinic_id = $1 AND pp.is_active = true
		ORDER BY pp.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(ctx, query, clinicID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var profiles []PatientProfile
	for rows.Next() {
		p := PatientProfile{}
		err := rows.Scan(
			&p.ID, &p.PatientID, &p.ClinicID,
			&p.BloodType, &p.RhFactor, &p.Height, &p.Weight,
			&p.Allergies, &p.ChronicDiseases, &p.Disabilities,
			&p.Notes, &p.IsActive, &p.CreatedBy, &p.CreatedAt,
			&p.UpdatedBy, &p.UpdatedAt, &p.PatientName,
		)
		if err != nil {
			return nil, 0, err
		}
		profiles = append(profiles, p)
	}

	return profiles, total, nil
}