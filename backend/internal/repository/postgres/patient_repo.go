package postgres

/**
 * AMIS - Patient Repository
 * REAL BUSINESS LOGIC - Patient CRUD with med_id generation
 */

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PatientRepository struct {
	db *pgxpool.Pool
}

func NewPatientRepository(db *pgxpool.Pool) *PatientRepository {
	return &PatientRepository{db: db}
}

// Patient model
type Patient struct {
	ID              uuid.UUID  `json:"id"`
	MedID           string     `json:"med_id"`            // AMIS-P-2026-000001
	ClinicID        uuid.UUID  `json:"clinic_id"`
	BranchID        *uuid.UUID `json:"branch_id,omitempty"`
	FirstName       string     `json:"first_name"`
	LastName        string     `json:"last_name"`
	Patronymic      string     `json:"patronymic"`
	BirthDate       time.Time  `json:"birth_date"`
	Gender          string     `json:"gender"`
	Phone           string     `json:"phone"`
	Phone2          string     `json:"phone_2"`
	Email           string     `json:"email"`
	Citizenship     string     `json:"citizenship"`
	Address         string     `json:"address"`
	RegionID        *uuid.UUID `json:"region_id,omitempty"`
	Passport        string     `json:"passport"`
	PriceCategoryID *uuid.UUID `json:"price_category_id,omitempty"`
	DepositBalance  float64    `json:"deposit_balance"`
	IsActive        bool       `json:"is_active"`
	CreatedBy       *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// CreatePatientInput - Input for creating a new patient
type CreatePatientInput struct {
	ClinicID        uuid.UUID
	BranchID        *uuid.UUID
	FirstName       string
	LastName        string
	Patronymic      string
	BirthDate       time.Time
	Gender          string
	Phone           string
	Phone2          string
	Email           string
	Citizenship     string
	Address         string
	RegionID        *uuid.UUID
	Passport        string
	PriceCategoryID *uuid.UUID
	CreatedBy       *uuid.UUID
}

// GenerateMedID - Generate unique MED ID: AMIS-P-YYYY-NNNNNN
func (r *PatientRepository) generateMedID(ctx context.Context, clinicID uuid.UUID) (string, error) {
	year := time.Now().Year()

	// Get max sequence for this clinic and year
	var maxSeq int
	query := `
		SELECT COALESCE(MAX(
			CAST(SUBSTRING(med_id FROM 'AMIS-P-[0-9]{4}-([0-9]+)') AS INTEGER)
		), 0)
		FROM patients
		WHERE clinic_id = $1
		AND med_id LIKE $2
	`
	pattern := fmt.Sprintf("AMIS-P-%d-%%", year)
	err := r.db.QueryRow(ctx, query, clinicID, pattern).Scan(&maxSeq)
	if err != nil {
		// If error, start from 0
		maxSeq = 0
	}

	newSeq := maxSeq + 1
	return fmt.Sprintf("AMIS-P-%d-%06d", year, newSeq), nil
}

// Create - Create new patient with generated med_id
func (r *PatientRepository) Create(ctx context.Context, input CreatePatientInput) (*Patient, error) {
	// Generate med_id
	medID, err := r.generateMedID(ctx, input.ClinicID)
	if err != nil {
		return nil, fmt.Errorf("med_id генерация ошибка: %w", err)
	}

	patient := &Patient{
		ID:              uuid.New(),
		MedID:           medID,
		ClinicID:        input.ClinicID,
		BranchID:        input.BranchID,
		FirstName:       input.FirstName,
		LastName:        input.LastName,
		Patronymic:      input.Patronymic,
		BirthDate:       input.BirthDate,
		Gender:          input.Gender,
		Phone:           input.Phone,
		Phone2:          input.Phone2,
		Email:           input.Email,
		Citizenship:     input.Citizenship,
		Address:         input.Address,
		RegionID:        input.RegionID,
		Passport:        input.Passport,
		PriceCategoryID: input.PriceCategoryID,
		IsActive:        true,
		CreatedBy:       input.CreatedBy,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	query := `
		INSERT INTO patients (
			id, med_id, clinic_id, branch_id, first_name, last_name, patronymic,
			birth_date, gender, phone, phone_2, email, citizenship, address,
			region_id, passport, price_category_id, deposit_balance, is_active,
			created_by, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
		)
		RETURNING deposit_balance
	`

	err = r.db.QueryRow(ctx, query,
		patient.ID, patient.MedID, patient.ClinicID, patient.BranchID,
		patient.FirstName, patient.LastName, patient.Patronymic,
		patient.BirthDate, patient.Gender, patient.Phone, patient.Phone2,
		patient.Email, patient.Citizenship, patient.Address,
		patient.RegionID, patient.Passport, patient.PriceCategoryID, 0.0, patient.IsActive,
		patient.CreatedBy, patient.CreatedAt, patient.UpdatedAt,
	).Scan(&patient.DepositBalance)

	if err != nil {
		return nil, fmt.Errorf("patient создание ошибка: %w", err)
	}

	return patient, nil
}

// GetByID - Get patient by UUID
func (r *PatientRepository) GetByID(ctx context.Context, id uuid.UUID) (*Patient, error) {
	query := `
		SELECT id, med_id, clinic_id, branch_id, first_name, last_name, patronymic,
			birth_date, gender, phone, phone_2, email, citizenship, address,
			region_id, passport, price_category_id, deposit_balance, is_active,
			created_by, created_at, updated_at
		FROM patients
		WHERE id = $1 AND is_active = true
	`

	patient := &Patient{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&patient.ID, &patient.MedID, &patient.ClinicID, &patient.BranchID,
		&patient.FirstName, &patient.LastName, &patient.Patronymic,
		&patient.BirthDate, &patient.Gender, &patient.Phone, &patient.Phone2,
		&patient.Email, &patient.Citizenship, &patient.Address,
		&patient.RegionID, &patient.Passport, &patient.PriceCategoryID,
		&patient.DepositBalance, &patient.IsActive, &patient.CreatedBy,
		&patient.CreatedAt, &patient.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return patient, nil
}

// GetByMedID - Get patient by MED ID
func (r *PatientRepository) GetByMedID(ctx context.Context, medID string) (*Patient, error) {
	query := `
		SELECT id, med_id, clinic_id, branch_id, first_name, last_name, patronymic,
			birth_date, gender, phone, phone_2, email, citizenship, address,
			region_id, passport, price_category_id, deposit_balance, is_active,
			created_by, created_at, updated_at
		FROM patients
		WHERE med_id = $1 AND is_active = true
	`

	patient := &Patient{}
	err := r.db.QueryRow(ctx, query, medID).Scan(
		&patient.ID, &patient.MedID, &patient.ClinicID, &patient.BranchID,
		&patient.FirstName, &patient.LastName, &patient.Patronymic,
		&patient.BirthDate, &patient.Gender, &patient.Phone, &patient.Phone2,
		&patient.Email, &patient.Citizenship, &patient.Address,
		&patient.RegionID, &patient.Passport, &patient.PriceCategoryID,
		&patient.DepositBalance, &patient.IsActive, &patient.CreatedBy,
		&patient.CreatedAt, &patient.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return patient, nil
}

// Search - Search patients by name, phone, or med_id
func (r *PatientRepository) Search(ctx context.Context, clinicID uuid.UUID, search string, limit int) ([]Patient, error) {
	if limit <= 0 {
		limit = 20
	}

	query := `
		SELECT id, med_id, clinic_id, branch_id, first_name, last_name, patronymic,
			birth_date, gender, phone, phone_2, email, citizenship, address,
			region_id, passport, price_category_id, deposit_balance, is_active,
			created_by, created_at, updated_at
		FROM patients
		WHERE clinic_id = $1 AND is_active = true
		AND (
			LOWER(first_name || ' ' || last_name || ' ' || COALESCE(patronymic, '')) LIKE LOWER($2)
			OR phone LIKE $2
			OR med_id LIKE $2
			OR passport LIKE $2
		)
		ORDER BY last_name, first_name
		LIMIT $3
	`

	pattern := "%" + search + "%"
	rows, err := r.db.Query(ctx, query, clinicID, pattern, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var patients []Patient
	for rows.Next() {
		p := Patient{}
		err := rows.Scan(
			&p.ID, &p.MedID, &p.ClinicID, &p.BranchID,
			&p.FirstName, &p.LastName, &p.Patronymic,
			&p.BirthDate, &p.Gender, &p.Phone, &p.Phone2,
			&p.Email, &p.Citizenship, &p.Address,
			&p.RegionID, &p.Passport, &p.PriceCategoryID,
			&p.DepositBalance, &p.IsActive, &p.CreatedBy,
			&p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		patients = append(patients, p)
	}

	return patients, nil
}

// List - List patients with pagination
func (r *PatientRepository) List(ctx context.Context, clinicID uuid.UUID, page, limit int) ([]Patient, int, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	// Get total count
	var total int
	countQuery := `SELECT COUNT(*) FROM patients WHERE clinic_id = $1 AND is_active = true`
	err := r.db.QueryRow(ctx, countQuery, clinicID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get patients
	query := `
		SELECT id, med_id, clinic_id, branch_id, first_name, last_name, patronymic,
			birth_date, gender, phone, phone_2, email, citizenship, address,
			region_id, passport, price_category_id, deposit_balance, is_active,
			created_by, created_at, updated_at
		FROM patients
		WHERE clinic_id = $1 AND is_active = true
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(ctx, query, clinicID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var patients []Patient
	for rows.Next() {
		p := Patient{}
		err := rows.Scan(
			&p.ID, &p.MedID, &p.ClinicID, &p.BranchID,
			&p.FirstName, &p.LastName, &p.Patronymic,
			&p.BirthDate, &p.Gender, &p.Phone, &p.Phone2,
			&p.Email, &p.Citizenship, &p.Address,
			&p.RegionID, &p.Passport, &p.PriceCategoryID,
			&p.DepositBalance, &p.IsActive, &p.CreatedBy,
			&p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		patients = append(patients, p)
	}

	return patients, total, nil
}

// Update - Update patient
func (r *PatientRepository) Update(ctx context.Context, id uuid.UUID, input map[string]interface{}) (*Patient, error) {
	// Build dynamic update query
	query := `UPDATE patients SET updated_at = NOW(), `
	args := []interface{}{}
	argIdx := 1

	allowedFields := map[string]bool{
		"first_name": true, "last_name": true, "patronymic": true,
		"birth_date": true, "gender": true, "phone": true, "phone_2": true,
		"email": true, "citizenship": true, "address": true,
		"region_id": true, "passport": true, "price_category_id": true,
	}

	for field, value := range input {
		if allowedFields[field] && value != nil {
			if argIdx > 1 {
				query += ", "
			}
			query += fmt.Sprintf("%s = $%d", field, argIdx)
			args = append(args, value)
			argIdx++
		}
	}

	query += fmt.Sprintf(" WHERE id = $%d RETURNING id", argIdx)
	args = append(args, id)

	_, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id)
}

// UpdateDepositBalance - Update patient deposit balance
func (r *PatientRepository) UpdateDepositBalance(ctx context.Context, patientID uuid.UUID, amount float64) error {
	query := `
		UPDATE patients
		SET deposit_balance = deposit_balance + $2, updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.Exec(ctx, query, patientID, amount)
	return err
}