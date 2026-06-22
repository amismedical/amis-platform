package postgres

/**
 * AMIS - Patient Document Repository
 * TASK-001: Patient Profile Foundation
 */

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PatientDocument struct {
	ID             uuid.UUID  `json:"id"`
	PatientID      uuid.UUID  `json:"patient_id"`
	ClinicID       *uuid.UUID `json:"clinic_id,omitempty"`
	DocumentType   string     `json:"document_type"` // passport, birth_certificate, insurance, medical_certificate, other
	DocumentNumber string     `json:"document_number"`
	IssuedBy       string     `json:"issued_by"`
	IssueDate      *time.Time `json:"issue_date,omitempty"`
	ExpiryDate     *time.Time `json:"expiry_date,omitempty"`
	FilePath       string     `json:"file_path"`
	Notes          string     `json:"notes"`
	IsPrimary      bool       `json:"is_primary"`
	IsVerified     bool       `json:"is_verified"`
	VerifiedBy     *uuid.UUID `json:"verified_by,omitempty"`
	VerifiedAt     *time.Time `json:"verified_at,omitempty"`
	CreatedBy      *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedBy      *uuid.UUID `json:"updated_by,omitempty"`
	UpdatedAt      time.Time  `json:"updated_at"`

	// Joined data
	PatientName string `json:"patient_name,omitempty"`
}

type CreatePatientDocumentInput struct {
	PatientID      uuid.UUID
	ClinicID       *uuid.UUID
	DocumentType   string
	DocumentNumber string
	IssuedBy       string
	IssueDate      *time.Time
	ExpiryDate     *time.Time
	FilePath       string
	Notes          string
	IsPrimary      bool
	CreatedBy      *uuid.UUID
}

type UpdatePatientDocumentInput struct {
	DocumentNumber *string
	IssuedBy       *string
	IssueDate      *time.Time
	ExpiryDate     *time.Time
	FilePath       *string
	Notes          *string
	IsPrimary      *bool
	IsVerified     *bool
	VerifiedBy     *uuid.UUID
	VerifiedAt     *time.Time
	UpdatedBy      *uuid.UUID
}

type PatientDocumentRepository struct {
	db *pgxpool.Pool
}

func NewPatientDocumentRepository(db *pgxpool.Pool) *PatientDocumentRepository {
	return &PatientDocumentRepository{db: db}
}

// Create - Create new patient document
func (r *PatientDocumentRepository) Create(ctx context.Context, input CreatePatientDocumentInput) (*PatientDocument, error) {
	doc := &PatientDocument{
		ID:             uuid.New(),
		PatientID:      input.PatientID,
		ClinicID:       input.ClinicID,
		DocumentType:   input.DocumentType,
		DocumentNumber: input.DocumentNumber,
		IssuedBy:       input.IssuedBy,
		IssueDate:      input.IssueDate,
		ExpiryDate:     input.ExpiryDate,
		FilePath:       input.FilePath,
		Notes:          input.Notes,
		IsPrimary:      input.IsPrimary,
		IsVerified:     false,
		CreatedBy:      input.CreatedBy,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	query := `
		INSERT INTO patient_documents (
			id, patient_id, clinic_id, document_type, document_number,
			issued_by, issue_date, expiry_date, file_path, notes,
			is_primary, is_verified, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		RETURNING id
	`

	err := r.db.QueryRow(ctx, query,
		doc.ID, doc.PatientID, doc.ClinicID, doc.DocumentType, doc.DocumentNumber,
		doc.IssuedBy, doc.IssueDate, doc.ExpiryDate, doc.FilePath, doc.Notes,
		doc.IsPrimary, doc.IsVerified, doc.CreatedBy, doc.CreatedAt, doc.UpdatedAt,
	).Scan(&doc.ID)

	if err != nil {
		return nil, fmt.Errorf("ошибка создания документа: %w", err)
	}

	return doc, nil
}

// GetByID - Get document by ID
func (r *PatientDocumentRepository) GetByID(ctx context.Context, id uuid.UUID) (*PatientDocument, error) {
	query := `
		SELECT pd.id, pd.patient_id, pd.clinic_id, pd.document_type, pd.document_number,
			pd.issued_by, pd.issue_date, pd.expiry_date, pd.file_path, pd.notes,
			pd.is_primary, pd.is_verified, pd.verified_by, pd.verified_at,
			pd.created_by, pd.created_at, pd.updated_by, pd.updated_at,
			p.first_name || ' ' || p.last_name as patient_name
		FROM patient_documents pd
		LEFT JOIN patients p ON pd.patient_id = p.id
		WHERE pd.id = $1
	`

	doc := &PatientDocument{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&doc.ID, &doc.PatientID, &doc.ClinicID, &doc.DocumentType, &doc.DocumentNumber,
		&doc.IssuedBy, &doc.IssueDate, &doc.ExpiryDate, &doc.FilePath, &doc.Notes,
		&doc.IsPrimary, &doc.IsVerified, &doc.VerifiedBy, &doc.VerifiedAt,
		&doc.CreatedBy, &doc.CreatedAt, &doc.UpdatedBy, &doc.UpdatedAt, &doc.PatientName,
	)
	if err != nil {
		return nil, err
	}

	return doc, nil
}

// GetByPatientID - Get all documents for a patient
func (r *PatientDocumentRepository) GetByPatientID(ctx context.Context, patientID uuid.UUID) ([]PatientDocument, error) {
	query := `
		SELECT pd.id, pd.patient_id, pd.clinic_id, pd.document_type, pd.document_number,
			pd.issued_by, pd.issue_date, pd.expiry_date, pd.file_path, pd.notes,
			pd.is_primary, pd.is_verified, pd.verified_by, pd.verified_at,
			pd.created_by, pd.created_at, pd.updated_by, pd.updated_at,
			p.first_name || ' ' || p.last_name as patient_name
		FROM patient_documents pd
		LEFT JOIN patients p ON pd.patient_id = p.id
		WHERE pd.patient_id = $1
		ORDER BY pd.is_primary DESC, pd.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []PatientDocument
	for rows.Next() {
		d := PatientDocument{}
		err := rows.Scan(
			&d.ID, &d.PatientID, &d.ClinicID, &d.DocumentType, &d.DocumentNumber,
			&d.IssuedBy, &d.IssueDate, &d.ExpiryDate, &d.FilePath, &d.Notes,
			&d.IsPrimary, &d.IsVerified, &d.VerifiedBy, &d.VerifiedAt,
			&d.CreatedBy, &d.CreatedAt, &d.UpdatedBy, &d.UpdatedAt, &d.PatientName,
		)
		if err != nil {
			return nil, err
		}
		docs = append(docs, d)
	}

	return docs, nil
}

// Update - Update patient document
func (r *PatientDocumentRepository) Update(ctx context.Context, id uuid.UUID, input UpdatePatientDocumentInput) error {
	query := `
		UPDATE patient_documents SET
			document_number = COALESCE($2, document_number),
			issued_by = COALESCE($3, issued_by),
			issue_date = COALESCE($4, issue_date),
			expiry_date = COALESCE($5, expiry_date),
			file_path = COALESCE($6, file_path),
			notes = COALESCE($7, notes),
			is_primary = COALESCE($8, is_primary),
			is_verified = COALESCE($9, is_verified),
			verified_by = COALESCE($10, verified_by),
			verified_at = COALESCE($11, verified_at),
			updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(ctx, query,
		id, input.DocumentNumber, input.IssuedBy, input.IssueDate, input.ExpiryDate,
		input.FilePath, input.Notes, input.IsPrimary, input.IsVerified,
		input.VerifiedBy, input.VerifiedAt,
	)

	return err
}

// Delete - Delete patient document (soft delete)
func (r *PatientDocumentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM patient_documents WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

// GetPrimaryDocument - Get primary document for a patient
func (r *PatientDocumentRepository) GetPrimaryDocument(ctx context.Context, patientID uuid.UUID) (*PatientDocument, error) {
	query := `
		SELECT pd.id, pd.patient_id, pd.clinic_id, pd.document_type, pd.document_number,
			pd.issued_by, pd.issue_date, pd.expiry_date, pd.file_path, pd.notes,
			pd.is_primary, pd.is_verified, pd.verified_by, pd.verified_at,
			pd.created_by, pd.created_at, pd.updated_by, pd.updated_at,
			p.first_name || ' ' || p.last_name as patient_name
		FROM patient_documents pd
		LEFT JOIN patients p ON pd.patient_id = p.id
		WHERE pd.patient_id = $1 AND pd.is_primary = true
	`

	doc := &PatientDocument{}
	err := r.db.QueryRow(ctx, query, patientID).Scan(
		&doc.ID, &doc.PatientID, &doc.ClinicID, &doc.DocumentType, &doc.DocumentNumber,
		&doc.IssuedBy, &doc.IssueDate, &doc.ExpiryDate, &doc.FilePath, &doc.Notes,
		&doc.IsPrimary, &doc.IsVerified, &doc.VerifiedBy, &doc.VerifiedAt,
		&doc.CreatedBy, &doc.CreatedAt, &doc.UpdatedBy, &doc.UpdatedAt, &doc.PatientName,
	)
	if err != nil {
		return nil, err
	}

	return doc, nil
}
