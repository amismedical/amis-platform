package postgres

/**
 * AMIS - Patient Relative Repository
 * TASK-001: Patient Profile Foundation
 */

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PatientRelative struct {
	ID           uuid.UUID  `json:"id"`
	PatientID    uuid.UUID  `json:"patient_id"`
	ClinicID     *uuid.UUID `json:"clinic_id,omitempty"`
	FullName     string     `json:"full_name"`
	Relationship string     `json:"relationship"` // parent, spouse, child, sibling, guardian, other
	DateOfBirth  *time.Time `json:"date_of_birth,omitempty"`
	Gender       string     `json:"gender"` // male, female
	Phone        string     `json:"phone"`
	Email        string     `json:"email"`
	Address      string     `json:"address"`
	Occupation   string     `json:"occupation"`
	Workplace    string     `json:"workplace"`
	IsNextOfKin  bool       `json:"is_next_of_kin"`
	IsEmergency  bool       `json:"is_emergency"`
	IsInformed   bool       `json:"is_informed"`
	ConsentDate  *time.Time `json:"consent_date,omitempty"`
	Notes        string     `json:"notes"`
	CreatedBy    *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedBy    *uuid.UUID `json:"updated_by,omitempty"`
	UpdatedAt    time.Time  `json:"updated_at"`

	// Joined data
	PatientName string `json:"patient_name,omitempty"`
}

type CreatePatientRelativeInput struct {
	PatientID    uuid.UUID
	ClinicID     *uuid.UUID
	FullName     string
	Relationship string
	DateOfBirth  *time.Time
	Gender       string
	Phone        string
	Email        string
	Address      string
	Occupation   string
	Workplace    string
	IsNextOfKin  bool
	IsEmergency  bool
	IsInformed   bool
	ConsentDate  *time.Time
	Notes        string
	CreatedBy    *uuid.UUID
}

type UpdatePatientRelativeInput struct {
	FullName     *string
	Relationship *string
	DateOfBirth  *time.Time
	Gender       *string
	Phone        *string
	Email        *string
	Address      *string
	Occupation   *string
	Workplace    *string
	IsNextOfKin  *bool
	IsEmergency  *bool
	IsInformed   *bool
	ConsentDate  *time.Time
	Notes        *string
	UpdatedBy    *uuid.UUID
}

type PatientRelativeRepository struct {
	db *pgxpool.Pool
}

func NewPatientRelativeRepository(db *pgxpool.Pool) *PatientRelativeRepository {
	return &PatientRelativeRepository{db: db}
}

// Create - Create new patient relative
func (r *PatientRelativeRepository) Create(ctx context.Context, input CreatePatientRelativeInput) (*PatientRelative, error) {
	relative := &PatientRelative{
		ID:           uuid.New(),
		PatientID:    input.PatientID,
		ClinicID:     input.ClinicID,
		FullName:     input.FullName,
		Relationship: input.Relationship,
		DateOfBirth:  input.DateOfBirth,
		Gender:       input.Gender,
		Phone:        input.Phone,
		Email:        input.Email,
		Address:      input.Address,
		Occupation:   input.Occupation,
		Workplace:    input.Workplace,
		IsNextOfKin:  input.IsNextOfKin,
		IsEmergency:  input.IsEmergency,
		IsInformed:   input.IsInformed,
		ConsentDate:  input.ConsentDate,
		Notes:        input.Notes,
		CreatedBy:    input.CreatedBy,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	query := `
		INSERT INTO patient_relatives (
			id, patient_id, clinic_id, full_name, relationship, date_of_birth,
			gender, phone, email, address, occupation, workplace,
			is_next_of_kin, is_emergency, is_informed, consent_date,
			notes, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
		RETURNING id
	`

	err := r.db.QueryRow(ctx, query,
		relative.ID, relative.PatientID, relative.ClinicID, relative.FullName,
		relative.Relationship, relative.DateOfBirth, relative.Gender, relative.Phone,
		relative.Email, relative.Address, relative.Occupation, relative.Workplace,
		relative.IsNextOfKin, relative.IsEmergency, relative.IsInformed,
		relative.ConsentDate, relative.Notes, relative.CreatedBy, relative.CreatedAt,
		relative.UpdatedAt,
	).Scan(&relative.ID)

	if err != nil {
		return nil, fmt.Errorf("ошибка создания родственника: %w", err)
	}

	return relative, nil
}

// GetByID - Get relative by ID
func (r *PatientRelativeRepository) GetByID(ctx context.Context, id uuid.UUID) (*PatientRelative, error) {
	query := `
		SELECT pr.id, pr.patient_id, pr.clinic_id, pr.full_name, pr.relationship,
			pr.date_of_birth, pr.gender, pr.phone, pr.email, pr.address,
			pr.occupation, pr.workplace, pr.is_next_of_kin, pr.is_emergency,
			pr.is_informed, pr.consent_date, pr.notes, pr.created_by, pr.created_at,
			pr.updated_by, pr.updated_at, p.first_name || ' ' || p.last_name as patient_name
		FROM patient_relatives pr
		LEFT JOIN patients p ON pr.patient_id = p.id
		WHERE pr.id = $1
	`

	relative := &PatientRelative{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&relative.ID, &relative.PatientID, &relative.ClinicID, &relative.FullName,
		&relative.Relationship, &relative.DateOfBirth, &relative.Gender, &relative.Phone,
		&relative.Email, &relative.Address, &relative.Occupation, &relative.Workplace,
		&relative.IsNextOfKin, &relative.IsEmergency, &relative.IsInformed,
		&relative.ConsentDate, &relative.Notes, &relative.CreatedBy, &relative.CreatedAt,
		&relative.UpdatedBy, &relative.UpdatedAt, &relative.PatientName,
	)
	if err != nil {
		return nil, err
	}

	return relative, nil
}

// GetByPatientID - Get all relatives for a patient
func (r *PatientRelativeRepository) GetByPatientID(ctx context.Context, patientID uuid.UUID) ([]PatientRelative, error) {
	query := `
		SELECT pr.id, pr.patient_id, pr.clinic_id, pr.full_name, pr.relationship,
			pr.date_of_birth, pr.gender, pr.phone, pr.email, pr.address,
			pr.occupation, pr.workplace, pr.is_next_of_kin, pr.is_emergency,
			pr.is_informed, pr.consent_date, pr.notes, pr.created_by, pr.created_at,
			pr.updated_by, pr.updated_at, p.first_name || ' ' || p.last_name as patient_name
		FROM patient_relatives pr
		LEFT JOIN patients p ON pr.patient_id = p.id
		WHERE pr.patient_id = $1
		ORDER BY pr.is_next_of_kin DESC, pr.is_emergency DESC, pr.created_at ASC
	`

	rows, err := r.db.Query(ctx, query, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var relatives []PatientRelative
	for rows.Next() {
		rel := PatientRelative{}
		err := rows.Scan(
			&rel.ID, &rel.PatientID, &rel.ClinicID, &rel.FullName,
			&rel.Relationship, &rel.DateOfBirth, &rel.Gender, &rel.Phone,
			&rel.Email, &rel.Address, &rel.Occupation, &rel.Workplace,
			&rel.IsNextOfKin, &rel.IsEmergency, &rel.IsInformed,
			&rel.ConsentDate, &rel.Notes, &rel.CreatedBy, &rel.CreatedAt,
			&rel.UpdatedBy, &rel.UpdatedAt, &rel.PatientName,
		)
		if err != nil {
			return nil, err
		}
		relatives = append(relatives, rel)
	}

	return relatives, nil
}

// GetNextOfKin - Get next of kin for a patient
func (r *PatientRelativeRepository) GetNextOfKin(ctx context.Context, patientID uuid.UUID) (*PatientRelative, error) {
	query := `
		SELECT pr.id, pr.patient_id, pr.clinic_id, pr.full_name, pr.relationship,
			pr.date_of_birth, pr.gender, pr.phone, pr.email, pr.address,
			pr.occupation, pr.workplace, pr.is_next_of_kin, pr.is_emergency,
			pr.is_informed, pr.consent_date, pr.notes, pr.created_by, pr.created_at,
			pr.updated_by, pr.updated_at, p.first_name || ' ' || p.last_name as patient_name
		FROM patient_relatives pr
		LEFT JOIN patients p ON pr.patient_id = p.id
		WHERE pr.patient_id = $1 AND pr.is_next_of_kin = true
	`

	relative := &PatientRelative{}
	err := r.db.QueryRow(ctx, query, patientID).Scan(
		&relative.ID, &relative.PatientID, &relative.ClinicID, &relative.FullName,
		&relative.Relationship, &relative.DateOfBirth, &relative.Gender, &relative.Phone,
		&relative.Email, &relative.Address, &relative.Occupation, &relative.Workplace,
		&relative.IsNextOfKin, &relative.IsEmergency, &relative.IsInformed,
		&relative.ConsentDate, &relative.Notes, &relative.CreatedBy, &relative.CreatedAt,
		&relative.UpdatedBy, &relative.UpdatedAt, &relative.PatientName,
	)
	if err != nil {
		return nil, err
	}

	return relative, nil
}

// Update - Update patient relative
func (r *PatientRelativeRepository) Update(ctx context.Context, id uuid.UUID, input UpdatePatientRelativeInput) error {
	query := `
		UPDATE patient_relatives SET
			full_name = COALESCE($2, full_name),
			relationship = COALESCE($3, relationship),
			date_of_birth = COALESCE($4, date_of_birth),
			gender = COALESCE($5, gender),
			phone = COALESCE($6, phone),
			email = COALESCE($7, email),
			address = COALESCE($8, address),
			occupation = COALESCE($9, occupation),
			workplace = COALESCE($10, workplace),
			is_next_of_kin = COALESCE($11, is_next_of_kin),
			is_emergency = COALESCE($12, is_emergency),
			is_informed = COALESCE($13, is_informed),
			consent_date = COALESCE($14, consent_date),
			notes = COALESCE($15, notes),
			updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(ctx, query,
		id, input.FullName, input.Relationship, input.DateOfBirth, input.Gender,
		input.Phone, input.Email, input.Address, input.Occupation, input.Workplace,
		input.IsNextOfKin, input.IsEmergency, input.IsInformed, input.ConsentDate,
		input.Notes,
	)

	return err
}

// Delete - Delete patient relative
func (r *PatientRelativeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM patient_relatives WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}
