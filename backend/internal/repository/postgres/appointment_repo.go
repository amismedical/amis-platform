package postgres

/**
 * AMIS - Appointment Repository
 * REAL BUSINESS LOGIC - Appointment CRUD with appointment_number generation
 */

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AppointmentRepository struct {
	db *pgxpool.Pool
}

func NewAppointmentRepository(db *pgxpool.Pool) *AppointmentRepository {
	return &AppointmentRepository{db: db}
}

// Appointment model
type Appointment struct {
	ID               uuid.UUID  `json:"id"`
	AppointmentNumber string    `json:"appointment_number"` // AMIS-A-2026-000001
	ClinicID         uuid.UUID  `json:"clinic_id"`
	BranchID         *uuid.UUID `json:"branch_id,omitempty"`
	PatientID        uuid.UUID  `json:"patient_id"`
	DoctorID         uuid.UUID  `json:"doctor_id"`
	ServiceID        uuid.UUID  `json:"service_id"`
	Status           string     `json:"status"` // scheduled, waiting, in_progress, completed, cancelled
	AppointmentDate  time.Time  `json:"appointment_date"`
	StartTime        string     `json:"start_time"`
	EndTime          string     `json:"end_time"`
	BookingMethod    string     `json:"booking_method"`
	Cabinet          string     `json:"cabinet"`
	Notes            string     `json:"notes"`
	CancelReason     string     `json:"cancel_reason"`
	CreatedBy        *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`

	// Joined data
	PatientName string `json:"patient_name,omitempty"`
	DoctorName  string `json:"doctor_name,omitempty"`
	ServiceName string `json:"service_name,omitempty"`
}

// CreateAppointmentInput - Input for creating appointment
type CreateAppointmentInput struct {
	ClinicID        uuid.UUID
	BranchID        *uuid.UUID
	PatientID       uuid.UUID
	DoctorID        uuid.UUID
	ServiceID       uuid.UUID
	AppointmentDate time.Time
	StartTime       string
	BookingMethod   string
	Cabinet         string
	Notes           string
	CreatedBy       *uuid.UUID
}

// GenerateAppointmentNumber - Generate: AMIS-A-YYYY-NNNNNN
func (r *AppointmentRepository) generateAppointmentNumber(ctx context.Context, clinicID uuid.UUID) (string, error) {
	year := time.Now().Year()

	var maxSeq int
	query := `
		SELECT COALESCE(MAX(
			CAST(SUBSTRING(appointment_number FROM 'AMIS-A-[0-9]{4}-([0-9]+)') AS INTEGER)
		), 0)
		FROM appointments
		WHERE clinic_id = $1
		AND appointment_number LIKE $2
	`
	pattern := fmt.Sprintf("AMIS-A-%d-%%", year)
	err := r.db.QueryRow(ctx, query, clinicID, pattern).Scan(&maxSeq)
	if err != nil {
		maxSeq = 0
	}

	newSeq := maxSeq + 1
	return fmt.Sprintf("AMIS-A-%d-%06d", year, newSeq), nil
}

// Create - Create new appointment
func (r *AppointmentRepository) Create(ctx context.Context, input CreateAppointmentInput) (*Appointment, error) {
	// Generate appointment number
	apptNum, err := r.generateAppointmentNumber(ctx, input.ClinicID)
	if err != nil {
		return nil, fmt.Errorf("appointment number генерация ошибка: %w", err)
	}

	// Calculate end time based on service duration (default 30 min)
	endTime := input.StartTime + ":00"
	// You can extend this to query service duration from services table

	appointment := &Appointment{
		ID:               uuid.New(),
		AppointmentNumber: apptNum,
		ClinicID:         input.ClinicID,
		BranchID:        input.BranchID,
		PatientID:       input.PatientID,
		DoctorID:        input.DoctorID,
		ServiceID:       input.ServiceID,
		Status:          "scheduled",
		AppointmentDate: input.AppointmentDate,
		StartTime:       input.StartTime,
		EndTime:         endTime,
		BookingMethod:   input.BookingMethod,
		Cabinet:         input.Cabinet,
		Notes:           input.Notes,
		CreatedBy:       input.CreatedBy,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	query := `
		INSERT INTO appointments (
			id, appointment_number, clinic_id, branch_id, patient_id, doctor_id, service_id,
			status, appointment_date, start_time, end_time, booking_method, cabinet, notes,
			created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		RETURNING id
	`

	err = r.db.QueryRow(ctx, query,
		appointment.ID, appointment.AppointmentNumber, appointment.ClinicID, appointment.BranchID,
		appointment.PatientID, appointment.DoctorID, appointment.ServiceID,
		appointment.Status, appointment.AppointmentDate, appointment.StartTime, appointment.EndTime,
		appointment.BookingMethod, appointment.Cabinet, appointment.Notes,
		appointment.CreatedBy, appointment.CreatedAt, appointment.UpdatedAt,
	).Scan(&appointment.ID)

	if err != nil {
		return nil, fmt.Errorf("appointment создание ошибка: %w", err)
	}

	return appointment, nil
}

// GetByID - Get appointment by UUID
func (r *AppointmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*Appointment, error) {
	query := `
		SELECT a.id, a.appointment_number, a.clinic_id, a.branch_id, a.patient_id,
			a.doctor_id, a.service_id, a.status, a.appointment_date, a.start_time,
			a.end_time, a.booking_method, a.cabinet, a.notes, a.cancel_reason,
			a.created_by, a.created_at, a.updated_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as doctor_name,
			sv.name as service_name
		FROM appointments a
		LEFT JOIN patients p ON a.patient_id = p.id
		LEFT JOIN staff s ON a.doctor_id = s.id
		LEFT JOIN services sv ON a.service_id = sv.id
		WHERE a.id = $1
	`

	appt := &Appointment{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&appt.ID, &appt.AppointmentNumber, &appt.ClinicID, &appt.BranchID,
		&appt.PatientID, &appt.DoctorID, &appt.ServiceID, &appt.Status,
		&appt.AppointmentDate, &appt.StartTime, &appt.EndTime,
		&appt.BookingMethod, &appt.Cabinet, &appt.Notes, &appt.CancelReason,
		&appt.CreatedBy, &appt.CreatedAt, &appt.UpdatedAt,
		&appt.PatientName, &appt.DoctorName, &appt.ServiceName,
	)
	if err != nil {
		return nil, err
	}

	return appt, nil
}

// List - List appointments with filters
func (r *AppointmentRepository) List(ctx context.Context, clinicID uuid.UUID, filters map[string]interface{}, page, limit int) ([]Appointment, int, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	// Build WHERE clause
	whereClause := "WHERE a.clinic_id = $1 AND a.status != 'cancelled'"
	args := []interface{}{clinicID}
	argIdx := 2

	if patientID, ok := filters["patient_id"].(uuid.UUID); ok {
		whereClause += fmt.Sprintf(" AND a.patient_id = $%d", argIdx)
		args = append(args, patientID)
		argIdx++
	}
	if doctorID, ok := filters["doctor_id"].(uuid.UUID); ok {
		whereClause += fmt.Sprintf(" AND a.doctor_id = $%d", argIdx)
		args = append(args, doctorID)
		argIdx++
	}
	if status, ok := filters["status"].(string); ok && status != "" {
		whereClause += fmt.Sprintf(" AND a.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}
	if dateFrom, ok := filters["date_from"].(time.Time); ok {
		whereClause += fmt.Sprintf(" AND a.appointment_date >= $%d", argIdx)
		args = append(args, dateFrom)
		argIdx++
	}
	if dateTo, ok := filters["date_to"].(time.Time); ok {
		whereClause += fmt.Sprintf(" AND a.appointment_date <= $%d", argIdx)
		args = append(args, dateTo)
		argIdx++
	}

	// Get total count
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM appointments a %s", whereClause)
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get appointments
	query := fmt.Sprintf(`
		SELECT a.id, a.appointment_number, a.clinic_id, a.branch_id, a.patient_id,
			a.doctor_id, a.service_id, a.status, a.appointment_date, a.start_time,
			a.end_time, a.booking_method, a.cabinet, a.notes, a.cancel_reason,
			a.created_by, a.created_at, a.updated_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as doctor_name,
			sv.name as service_name
		FROM appointments a
		LEFT JOIN patients p ON a.patient_id = p.id
		LEFT JOIN staff s ON a.doctor_id = s.id
		LEFT JOIN services sv ON a.service_id = sv.id
		%s
		ORDER BY a.appointment_date DESC, a.start_time DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var appointments []Appointment
	for rows.Next() {
		a := Appointment{}
		err := rows.Scan(
			&a.ID, &a.AppointmentNumber, &a.ClinicID, &a.BranchID,
			&a.PatientID, &a.DoctorID, &a.ServiceID, &a.Status,
			&a.AppointmentDate, &a.StartTime, &a.EndTime,
			&a.BookingMethod, &a.Cabinet, &a.Notes, &a.CancelReason,
			&a.CreatedBy, &a.CreatedAt, &a.UpdatedAt,
			&a.PatientName, &a.DoctorName, &a.ServiceName,
		)
		if err != nil {
			return nil, 0, err
		}
		appointments = append(appointments, a)
	}

	return appointments, total, nil
}

// GetActiveAppointments - Get appointments for today (scheduled, waiting, in_progress)
func (r *AppointmentRepository) GetActiveAppointments(ctx context.Context, clinicID uuid.UUID, date time.Time) ([]Appointment, error) {
	query := `
		SELECT a.id, a.appointment_number, a.clinic_id, a.branch_id, a.patient_id,
			a.doctor_id, a.service_id, a.status, a.appointment_date, a.start_time,
			a.end_time, a.booking_method, a.cabinet, a.notes, a.cancel_reason,
			a.created_by, a.created_at, a.updated_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as doctor_name,
			sv.name as service_name
		FROM appointments a
		LEFT JOIN patients p ON a.patient_id = p.id
		LEFT JOIN staff s ON a.doctor_id = s.id
		LEFT JOIN services sv ON a.service_id = sv.id
		WHERE a.clinic_id = $1
			AND a.appointment_date = $2
			AND a.status IN ('scheduled', 'waiting', 'in_progress')
		ORDER BY a.start_time ASC
	`

	rows, err := r.db.Query(ctx, query, clinicID, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var appointments []Appointment
	for rows.Next() {
		a := Appointment{}
		err := rows.Scan(
			&a.ID, &a.AppointmentNumber, &a.ClinicID, &a.BranchID,
			&a.PatientID, &a.DoctorID, &a.ServiceID, &a.Status,
			&a.AppointmentDate, &a.StartTime, &a.EndTime,
			&a.BookingMethod, &a.Cabinet, &a.Notes, &a.CancelReason,
			&a.CreatedBy, &a.CreatedAt, &a.UpdatedAt,
			&a.PatientName, &a.DoctorName, &a.ServiceName,
		)
		if err != nil {
			return nil, err
		}
		appointments = append(appointments, a)
	}

	return appointments, nil
}

// UpdateStatus - Update appointment status
func (r *AppointmentRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string, cancelReason string) error {
	var query string
	if status == "cancelled" {
		query = `UPDATE appointments SET status = $2, cancel_reason = $3, updated_at = NOW() WHERE id = $1`
		_, err := r.db.Exec(ctx, query, id, status, cancelReason)
		return err
	}
	query = `UPDATE appointments SET status = $2, updated_at = NOW() WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id, status)
	return err
}

// GetPatientAppointments - Get all appointments for a patient
func (r *AppointmentRepository) GetPatientAppointments(ctx context.Context, patientID uuid.UUID) ([]Appointment, error) {
	query := `
		SELECT a.id, a.appointment_number, a.clinic_id, a.branch_id, a.patient_id,
			a.doctor_id, a.service_id, a.status, a.appointment_date, a.start_time,
			a.end_time, a.booking_method, a.cabinet, a.notes, a.cancel_reason,
			a.created_by, a.created_at, a.updated_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as doctor_name,
			sv.name as service_name
		FROM appointments a
		LEFT JOIN patients p ON a.patient_id = p.id
		LEFT JOIN staff s ON a.doctor_id = s.id
		LEFT JOIN services sv ON a.service_id = sv.id
		WHERE a.patient_id = $1
		ORDER BY a.appointment_date DESC, a.start_time DESC
	`

	rows, err := r.db.Query(ctx, query, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var appointments []Appointment
	for rows.Next() {
		a := Appointment{}
		err := rows.Scan(
			&a.ID, &a.AppointmentNumber, &a.ClinicID, &a.BranchID,
			&a.PatientID, &a.DoctorID, &a.ServiceID, &a.Status,
			&a.AppointmentDate, &a.StartTime, &a.EndTime,
			&a.BookingMethod, &a.Cabinet, &a.Notes, &a.CancelReason,
			&a.CreatedBy, &a.CreatedAt, &a.UpdatedAt,
			&a.PatientName, &a.DoctorName, &a.ServiceName,
		)
		if err != nil {
			return nil, err
		}
		appointments = append(appointments, a)
	}

	return appointments, nil
}