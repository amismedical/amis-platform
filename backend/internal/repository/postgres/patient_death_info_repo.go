package postgres

/**
 * AMIS - Patient Death Info Repository
 * TASK-001: Patient Profile Foundation
 */

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PatientDeathInfo struct {
	ID                    uuid.UUID  `json:"id"`
	PatientID             uuid.UUID  `json:"patient_id"`
	ClinicID              *uuid.UUID `json:"clinic_id,omitempty"`
	DeathDate             time.Time  `json:"death_date"`
	DeathTime             string     `json:"death_time"`
	DeathPlace            string     `json:"death_place"` // hospital, home, other
	DeathCause            string     `json:"death_cause"`
	DeathCauseICD10       string     `json:"death_cause_icd10"`
	IsAutopsyPerformed    bool       `json:"is_autopsy_performed"`
	AutopsyResult         string     `json:"autopsy_result"`
	CertificateNumber     string     `json:"certificate_number"`
	CertificateIssuedDate *time.Time `json:"certificate_issued_date"`
	CertificateIssuedBy   string     `json:"certificate_issued_by"`
	AttendingPhysicianID  *uuid.UUID `json:"attending_physician_id,omitempty"`
	IsVerified            bool       `json:"is_verified"`
	VerifiedBy            *uuid.UUID `json:"verified_by,omitempty"`
	VerifiedAt            *time.Time `json:"verified_at,omitempty"`
	Notes                 string     `json:"notes"`
	IsActive              bool       `json:"is_active"`
	CreatedBy             *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedBy             *uuid.UUID `json:"updated_by,omitempty"`
	UpdatedAt             time.Time  `json:"updated_at"`

	// Joined data
	PatientName        string `json:"patient_name,omitempty"`
	PhysicianName      string `json:"physician_name,omitempty"`
	CertificateFileURL string `json:"certificate_file_url,omitempty"`
}

type CreateDeathInfoInput struct {
	PatientID             uuid.UUID
	ClinicID              *uuid.UUID
	DeathDate             time.Time
	DeathTime             string
	DeathPlace            string
	DeathCause            string
	DeathCauseICD10       string
	IsAutopsyPerformed    bool
	AutopsyResult         string
	CertificateNumber     string
	CertificateIssuedDate *time.Time
	CertificateIssuedBy   string
	AttendingPhysicianID  *uuid.UUID
	IsVerified            bool
	VerifiedBy            *uuid.UUID
	VerifiedAt            *time.Time
	Notes                 string
	CreatedBy             *uuid.UUID
}

type UpdateDeathInfoInput struct {
	DeathDate             *time.Time
	DeathTime             *string
	DeathPlace            *string
	DeathCause            *string
	DeathCauseICD10       *string
	IsAutopsyPerformed    *bool
	AutopsyResult         *string
	CertificateNumber     *string
	CertificateIssuedDate *time.Time
	CertificateIssuedBy   *string
	AttendingPhysicianID  *uuid.UUID
	IsVerified            *bool
	VerifiedBy            *uuid.UUID
	VerifiedAt            *time.Time
	Notes                 *string
	IsActive              *bool
	UpdatedBy             *uuid.UUID
}

type PatientDeathInfoRepository struct {
	db *pgxpool.Pool
}

func NewPatientDeathInfoRepository(db *pgxpool.Pool) *PatientDeathInfoRepository {
	return &PatientDeathInfoRepository{db: db}
}

// Create - Create death info record
func (r *PatientDeathInfoRepository) Create(ctx context.Context, input CreateDeathInfoInput) (*PatientDeathInfo, error) {
	info := &PatientDeathInfo{
		ID:                    uuid.New(),
		PatientID:             input.PatientID,
		ClinicID:              input.ClinicID,
		DeathDate:             input.DeathDate,
		DeathTime:             input.DeathTime,
		DeathPlace:            input.DeathPlace,
		DeathCause:            input.DeathCause,
		DeathCauseICD10:       input.DeathCauseICD10,
		IsAutopsyPerformed:    input.IsAutopsyPerformed,
		AutopsyResult:         input.AutopsyResult,
		CertificateNumber:     input.CertificateNumber,
		CertificateIssuedDate: input.CertificateIssuedDate,
		CertificateIssuedBy:   input.CertificateIssuedBy,
		AttendingPhysicianID:  input.AttendingPhysicianID,
		IsVerified:            input.IsVerified,
		VerifiedBy:            input.VerifiedBy,
		VerifiedAt:            input.VerifiedAt,
		Notes:                 input.Notes,
		IsActive:              true,
		CreatedBy:             input.CreatedBy,
		CreatedAt:             time.Now(),
		UpdatedAt:             time.Now(),
	}

	query := `
		INSERT INTO patient_death_info (
			id, patient_id, clinic_id, death_date, death_time, death_place,
			death_cause, death_cause_icd10, is_autopsy_performed, autopsy_result,
			certificate_number, certificate_issued_date, certificate_issued_by,
			attending_physician_id, is_verified, verified_by, verified_at,
			notes, is_active, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
		RETURNING id
	`

	err := r.db.QueryRow(ctx, query,
		info.ID, info.PatientID, info.ClinicID, info.DeathDate, info.DeathTime, info.DeathPlace,
		info.DeathCause, info.DeathCauseICD10, info.IsAutopsyPerformed, info.AutopsyResult,
		info.CertificateNumber, info.CertificateIssuedDate, info.CertificateIssuedBy,
		info.AttendingPhysicianID, info.IsVerified, info.VerifiedBy, info.VerifiedAt,
		info.Notes, info.IsActive, info.CreatedBy, info.CreatedAt, info.UpdatedAt,
	).Scan(&info.ID)

	if err != nil {
		return nil, fmt.Errorf("ошибка создания записи о смерти: %w", err)
	}

	return info, nil
}

// GetByPatientID - Get death info by patient ID
func (r *PatientDeathInfoRepository) GetByPatientID(ctx context.Context, patientID uuid.UUID) (*PatientDeathInfo, error) {
	query := `
		SELECT pdi.id, pdi.patient_id, pdi.clinic_id, pdi.death_date, pdi.death_time,
			pdi.death_place, pdi.death_cause, pdi.death_cause_icd10, pdi.is_autopsy_performed,
			pdi.autopsy_result, pdi.certificate_number, pdi.certificate_issued_date,
			pdi.certificate_issued_by, pdi.attending_physician_id, pdi.is_verified,
			pdi.verified_by, pdi.verified_at, pdi.notes, pdi.is_active, pdi.created_by,
			pdi.created_at, pdi.updated_by, pdi.updated_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as physician_name,
			pdi.certificate_file_url
		FROM patient_death_info pdi
		LEFT JOIN patients p ON pdi.patient_id = p.id
		LEFT JOIN staff s ON pdi.attending_physician_id = s.id
		WHERE pdi.patient_id = $1 AND pdi.is_active = true
	`

	info := &PatientDeathInfo{}
	err := r.db.QueryRow(ctx, query, patientID).Scan(
		&info.ID, &info.PatientID, &info.ClinicID, &info.DeathDate, &info.DeathTime,
		&info.DeathPlace, &info.DeathCause, &info.DeathCauseICD10, &info.IsAutopsyPerformed,
		&info.AutopsyResult, &info.CertificateNumber, &info.CertificateIssuedDate,
		&info.CertificateIssuedBy, &info.AttendingPhysicianID, &info.IsVerified,
		&info.VerifiedBy, &info.VerifiedAt, &info.Notes, &info.IsActive, &info.CreatedBy,
		&info.CreatedAt, &info.UpdatedBy, &info.UpdatedAt,
		&info.PatientName, &info.PhysicianName, &info.CertificateFileURL,
	)
	if err != nil {
		return nil, err
	}

	return info, nil
}

// Update - Update death info
func (r *PatientDeathInfoRepository) Update(ctx context.Context, id uuid.UUID, input UpdateDeathInfoInput) error {
	query := `
		UPDATE patient_death_info SET
			death_date = COALESCE($2, death_date),
			death_time = COALESCE($3, death_time),
			death_place = COALESCE($4, death_place),
			death_cause = COALESCE($5, death_cause),
			death_cause_icd10 = COALESCE($6, death_cause_icd10),
			is_autopsy_performed = COALESCE($7, is_autopsy_performed),
			autopsy_result = COALESCE($8, autopsy_result),
			certificate_number = COALESCE($9, certificate_number),
			certificate_issued_date = COALESCE($10, certificate_issued_date),
			certificate_issued_by = COALESCE($11, certificate_issued_by),
			attending_physician_id = COALESCE($12, attending_physician_id),
			is_verified = COALESCE($13, is_verified),
			verified_by = COALESCE($14, verified_by),
			verified_at = COALESCE($15, verified_at),
			notes = COALESCE($16, notes),
			is_active = COALESCE($17, is_active),
			updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(ctx, query,
		id, input.DeathDate, input.DeathTime, input.DeathPlace, input.DeathCause,
		input.DeathCauseICD10, input.IsAutopsyPerformed, input.AutopsyResult,
		input.CertificateNumber, input.CertificateIssuedDate, input.CertificateIssuedBy,
		input.AttendingPhysicianID, input.IsVerified, input.VerifiedBy, input.VerifiedAt,
		input.Notes, input.IsActive,
	)

	return err
}

// ListAll - List all death records for a clinic
func (r *PatientDeathInfoRepository) ListAll(ctx context.Context, clinicID uuid.UUID, limit, offset int) ([]PatientDeathInfo, int, error) {
	countQuery := `SELECT COUNT(*) FROM patient_death_info WHERE clinic_id = $1 AND is_active = true`
	var total int
	if err := r.db.QueryRow(ctx, countQuery, clinicID).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `
		SELECT pdi.id, pdi.patient_id, pdi.clinic_id, pdi.death_date, pdi.death_time,
			pdi.death_place, pdi.death_cause, pdi.death_cause_icd10, pdi.is_autopsy_performed,
			pdi.autopsy_result, pdi.certificate_number, pdi.certificate_issued_date,
			pdi.certificate_issued_by, pdi.attending_physician_id, pdi.is_verified,
			pdi.verified_by, pdi.verified_at, pdi.notes, pdi.is_active, pdi.created_by,
			pdi.created_at, pdi.updated_by, pdi.updated_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as physician_name,
			pdi.certificate_file_url
		FROM patient_death_info pdi
		LEFT JOIN patients p ON pdi.patient_id = p.id
		LEFT JOIN staff s ON pdi.attending_physician_id = s.id
		WHERE pdi.clinic_id = $1 AND pdi.is_active = true
		ORDER BY pdi.death_date DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(ctx, query, clinicID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var records []PatientDeathInfo
	for rows.Next() {
		info := PatientDeathInfo{}
		err := rows.Scan(
			&info.ID, &info.PatientID, &info.ClinicID, &info.DeathDate, &info.DeathTime,
			&info.DeathPlace, &info.DeathCause, &info.DeathCauseICD10, &info.IsAutopsyPerformed,
			&info.AutopsyResult, &info.CertificateNumber, &info.CertificateIssuedDate,
			&info.CertificateIssuedBy, &info.AttendingPhysicianID, &info.IsVerified,
			&info.VerifiedBy, &info.VerifiedAt, &info.Notes, &info.IsActive, &info.CreatedBy,
			&info.CreatedAt, &info.UpdatedBy, &info.UpdatedAt,
			&info.PatientName, &info.PhysicianName, &info.CertificateFileURL,
		)
		if err != nil {
			return nil, 0, err
		}
		records = append(records, info)
	}

	return records, total, nil
}