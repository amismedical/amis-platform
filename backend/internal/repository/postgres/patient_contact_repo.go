package postgres

/**
 * AMIS - Patient Contact Repository
 * TASK-001: Patient Profile Foundation
 */

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PatientContact struct {
	ID           uuid.UUID  `json:"id"`
	PatientID    uuid.UUID  `json:"patient_id"`
	ClinicID     *uuid.UUID `json:"clinic_id,omitempty"`
	ContactType  string     `json:"contact_type"` // emergency, additional, work, other
	Name         string     `json:"name"`
	Relationship string     `json:"relationship"`
	Phone        string     `json:"phone"`
	Email        string     `json:"email"`
	Address      string     `json:"address"`
	IsPrimary    bool       `json:"is_primary"`
	Notes        string     `json:"notes"`
	CreatedBy    *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedBy    *uuid.UUID `json:"updated_by,omitempty"`
	UpdatedAt    time.Time  `json:"updated_at"`

	// Joined data
	PatientName string `json:"patient_name,omitempty"`
}

type CreatePatientContactInput struct {
	PatientID    uuid.UUID
	ClinicID     *uuid.UUID
	ContactType  string
	Name         string
	Relationship string
	Phone        string
	Email        string
	Address      string
	IsPrimary    bool
	Notes        string
	CreatedBy    *uuid.UUID
}

type UpdatePatientContactInput struct {
	ContactType  *string
	Name         *string
	Relationship *string
	Phone        *string
	Email        *string
	Address      *string
	IsPrimary    *bool
	Notes        *string
	UpdatedBy    *uuid.UUID
}

type PatientContactRepository struct {
	db *pgxpool.Pool
}

func NewPatientContactRepository(db *pgxpool.Pool) *PatientContactRepository {
	return &PatientContactRepository{db: db}
}

// Create - Create new patient contact
func (r *PatientContactRepository) Create(ctx context.Context, input CreatePatientContactInput) (*PatientContact, error) {
	contact := &PatientContact{
		ID:           uuid.New(),
		PatientID:    input.PatientID,
		ClinicID:     input.ClinicID,
		ContactType:  input.ContactType,
		Name:         input.Name,
		Relationship: input.Relationship,
		Phone:        input.Phone,
		Email:        input.Email,
		Address:      input.Address,
		IsPrimary:    input.IsPrimary,
		Notes:        input.Notes,
		CreatedBy:    input.CreatedBy,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	query := `
		INSERT INTO patient_contacts (
			id, patient_id, clinic_id, contact_type, name, relationship,
			phone, email, address, is_primary, notes, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id
	`

	err := r.db.QueryRow(ctx, query,
		contact.ID, contact.PatientID, contact.ClinicID, contact.ContactType,
		contact.Name, contact.Relationship, contact.Phone, contact.Email,
		contact.Address, contact.IsPrimary, contact.Notes, contact.CreatedBy,
		contact.CreatedAt, contact.UpdatedAt,
	).Scan(&contact.ID)

	if err != nil {
		return nil, fmt.Errorf("ошибка создания контакта: %w", err)
	}

	return contact, nil
}

// GetByID - Get contact by ID
func (r *PatientContactRepository) GetByID(ctx context.Context, id uuid.UUID) (*PatientContact, error) {
	query := `
		SELECT pc.id, pc.patient_id, pc.clinic_id, pc.contact_type, pc.name,
			pc.relationship, pc.phone, pc.email, pc.address, pc.is_primary,
			pc.notes, pc.created_by, pc.created_at, pc.updated_by, pc.updated_at,
			p.first_name || ' ' || p.last_name as patient_name
		FROM patient_contacts pc
		LEFT JOIN patients p ON pc.patient_id = p.id
		WHERE pc.id = $1
	`

	contact := &PatientContact{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&contact.ID, &contact.PatientID, &contact.ClinicID, &contact.ContactType,
		&contact.Name, &contact.Relationship, &contact.Phone, &contact.Email,
		&contact.Address, &contact.IsPrimary, &contact.Notes, &contact.CreatedBy,
		&contact.CreatedAt, &contact.UpdatedBy, &contact.UpdatedAt, &contact.PatientName,
	)
	if err != nil {
		return nil, err
	}

	return contact, nil
}

// GetByPatientID - Get all contacts for a patient
func (r *PatientContactRepository) GetByPatientID(ctx context.Context, patientID uuid.UUID) ([]PatientContact, error) {
	query := `
		SELECT pc.id, pc.patient_id, pc.clinic_id, pc.contact_type, pc.name,
			pc.relationship, pc.phone, pc.email, pc.address, pc.is_primary,
			pc.notes, pc.created_by, pc.created_at, pc.updated_by, pc.updated_at,
			p.first_name || ' ' || p.last_name as patient_name
		FROM patient_contacts pc
		LEFT JOIN patients p ON pc.patient_id = p.id
		WHERE pc.patient_id = $1
		ORDER BY pc.is_primary DESC, pc.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contacts []PatientContact
	for rows.Next() {
		c := PatientContact{}
		err := rows.Scan(
			&c.ID, &c.PatientID, &c.ClinicID, &c.ContactType,
			&c.Name, &c.Relationship, &c.Phone, &c.Email,
			&c.Address, &c.IsPrimary, &c.Notes, &c.CreatedBy,
			&c.CreatedAt, &c.UpdatedBy, &c.UpdatedAt, &c.PatientName,
		)
		if err != nil {
			return nil, err
		}
		contacts = append(contacts, c)
	}

	return contacts, nil
}

// GetEmergencyContacts - Get emergency contacts for a patient
func (r *PatientContactRepository) GetEmergencyContacts(ctx context.Context, patientID uuid.UUID) ([]PatientContact, error) {
	query := `
		SELECT pc.id, pc.patient_id, pc.clinic_id, pc.contact_type, pc.name,
			pc.relationship, pc.phone, pc.email, pc.address, pc.is_primary,
			pc.notes, pc.created_by, pc.created_at, pc.updated_by, pc.updated_at,
			p.first_name || ' ' || p.last_name as patient_name
		FROM patient_contacts pc
		LEFT JOIN patients p ON pc.patient_id = p.id
		WHERE pc.patient_id = $1 AND pc.contact_type = 'emergency'
		ORDER BY pc.is_primary DESC, pc.created_at ASC
	`

	rows, err := r.db.Query(ctx, query, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contacts []PatientContact
	for rows.Next() {
		c := PatientContact{}
		err := rows.Scan(
			&c.ID, &c.PatientID, &c.ClinicID, &c.ContactType,
			&c.Name, &c.Relationship, &c.Phone, &c.Email,
			&c.Address, &c.IsPrimary, &c.Notes, &c.CreatedBy,
			&c.CreatedAt, &c.UpdatedBy, &c.UpdatedAt, &c.PatientName,
		)
		if err != nil {
			return nil, err
		}
		contacts = append(contacts, c)
	}

	return contacts, nil
}

// Update - Update patient contact
func (r *PatientContactRepository) Update(ctx context.Context, id uuid.UUID, input UpdatePatientContactInput) error {
	query := `
		UPDATE patient_contacts SET
			contact_type = COALESCE($2, contact_type),
			name = COALESCE($3, name),
			relationship = COALESCE($4, relationship),
			phone = COALESCE($5, phone),
			email = COALESCE($6, email),
			address = COALESCE($7, address),
			is_primary = COALESCE($8, is_primary),
			notes = COALESCE($9, notes),
			updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(ctx, query,
		id, input.ContactType, input.Name, input.Relationship,
		input.Phone, input.Email, input.Address, input.IsPrimary, input.Notes,
	)

	return err
}

// Delete - Delete patient contact
func (r *PatientContactRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM patient_contacts WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}
