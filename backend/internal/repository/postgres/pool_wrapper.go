package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/amis/medverse-annahl/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PoolWrapper struct {
	Pool *pgxpool.Pool
}

func NewPoolWrapper(pool *pgxpool.Pool) *PoolWrapper {
	return &PoolWrapper{Pool: pool}
}

func (w *PoolWrapper) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, clinic_id, branch_id, email, password_hash, first_name, last_name, role, is_active
		FROM users WHERE email = $1
	`

	var user domain.User
	var clinicID, branchID *uuid.UUID

	err := w.Pool.QueryRow(ctx, query, email).Scan(
		&user.ID, &clinicID, &branchID,
		&user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Role, &user.IsActive,
	)

	if err != nil {
		return nil, err
	}

	user.ClinicID = clinicID
	user.BranchID = branchID

	return &user, nil
}

func (w *PoolWrapper) GetUserByID(ctx context.Context, id string) (*domain.User, error) {
	query := `
		SELECT id, clinic_id, branch_id, email, password_hash, first_name, last_name, role, is_active
		FROM users WHERE id = $1
	`

	var user domain.User
	var clinicID, branchID *uuid.UUID

	err := w.Pool.QueryRow(ctx, query, id).Scan(
		&user.ID, &clinicID, &branchID,
		&user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Role, &user.IsActive,
	)

	if err != nil {
		return nil, err
	}

	user.ClinicID = clinicID
	user.BranchID = branchID

	return &user, nil
}

func (w *PoolWrapper) UpdateLastLogin(ctx context.Context, userID uuid.UUID) error {
	query := `UPDATE users SET last_login_at = $1 WHERE id = $2`
	_, err := w.Pool.Exec(ctx, query, time.Now(), userID)
	return err
}

func (w *PoolWrapper) ListPatients(ctx context.Context, search, gender, citizenship string, page, limit int) ([]domain.Patient, int, error) {
	offset := (page - 1) * limit

	// Build base queries matching actual table schema
	baseWhere := ` WHERE is_active = true`
	args := []interface{}{}
	argCount := 0

	if search != "" {
		argCount++
		searchPattern := "%" + search + "%"
		baseWhere += ` AND (first_name ILIKE $` + fmt.Sprintf("%d", argCount) + ` OR last_name ILIKE $` + fmt.Sprintf("%d", argCount) + ` OR phone ILIKE $` + fmt.Sprintf("%d", argCount) + `)`
		args = append(args, searchPattern)
	}

	if gender != "" {
		argCount++
		baseWhere += ` AND gender = $` + fmt.Sprintf("%d", argCount)
		args = append(args, gender)
	}

	if citizenship != "" {
		argCount++
		baseWhere += ` AND citizenship = $` + fmt.Sprintf("%d", argCount)
		args = append(args, citizenship)
	}

	countQuery := `SELECT COUNT(*) FROM patients` + baseWhere
	var total int
	if err := w.Pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	argCount++
	limitArg := argCount
	argCount++
	offsetArg := argCount

	listQuery := `SELECT id, clinic_id, COALESCE(med_id, '') as med_id, first_name, last_name, patronymic, birth_date, gender, phone, phone_2,
	              email, citizenship, address, deposit_balance, is_active, created_at
	              FROM patients` + baseWhere + ` ORDER BY created_at DESC LIMIT $` + fmt.Sprintf("%d", limitArg) + ` OFFSET $` + fmt.Sprintf("%d", offsetArg)
	args = append(args, limit, offset)

	rows, err := w.Pool.Query(ctx, listQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var patients []domain.Patient
	for rows.Next() {
		var p domain.Patient
		var birthDate sql.NullTime
		rows.Scan(&p.ID, &p.ClinicID, &p.MedID, &p.FirstName, &p.LastName, &p.Patronymic, &birthDate, &p.Gender,
			&p.Phone, &p.Phone2, &p.Email, &p.Citizenship, &p.Address, &p.DepositBalance, &p.IsActive, &p.CreatedAt)
		if birthDate.Valid {
			p.BirthDate = birthDate.Time
		}
		patients = append(patients, p)
	}

	return patients, total, nil
}

func (w *PoolWrapper) GetPatientByID(ctx context.Context, id string) (*domain.Patient, error) {
	query := `
		SELECT id, clinic_id, COALESCE(med_id, '') as med_id, first_name, last_name, patronymic, birth_date, gender, phone, phone_2,
		       email, citizenship, address, deposit_balance, is_active, created_at
		FROM patients WHERE id = $1
	`

	var p domain.Patient
	var birthDate sql.NullTime
	err := w.Pool.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.ClinicID, &p.MedID, &p.FirstName, &p.LastName, &p.Patronymic,
		&birthDate, &p.Gender, &p.Phone, &p.Phone2, &p.Email,
		&p.Citizenship, &p.Address, &p.DepositBalance, &p.IsActive, &p.CreatedAt,
	)
	if birthDate.Valid {
		p.BirthDate = birthDate.Time
	}

	return &p, err
}

func (w *PoolWrapper) CreatePatient(ctx context.Context, p *domain.Patient) error {
	tx, err := w.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO patients (id, clinic_id, med_id, passport_region_code, passport_region_name, first_name, last_name, patronymic, birth_date, gender, phone, phone_2,
		                      email, citizenship, address, deposit_balance, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
	`

	_, err = tx.Exec(ctx, query,
		p.ID, p.ClinicID, p.MedID, p.PassportRegionCode, p.PassportRegionName,
		p.FirstName, p.LastName, p.Patronymic, p.BirthDate, p.Gender,
		p.Phone, p.Phone2, p.Email, p.Citizenship, p.Address,
		p.DepositBalance, p.IsActive,
	)
	if err != nil {
		return err
	}

	// Auto-create medical card for the patient
	mcQuery := `
		INSERT INTO medical_cards (id, clinic_id, patient_id, created_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (clinic_id, patient_id) DO NOTHING
	`
	_, err = tx.Exec(ctx, mcQuery, uuid.New(), p.ClinicID, p.ID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// GenerateMedID creates a sequential MED-ID for the given region code
// Uses clinic-specific sequence naming to allow same codes across clinics
// Falls back to sequential number per region per clinic
func (w *PoolWrapper) GenerateMedID(ctx context.Context, clinicID, regionCode string) (string, error) {
	year := time.Now().Year()

	// Use clinic-specific sequence: medid_{clinic_prefix}_{region}
	// Replace hyphens in clinicID to make valid Postgres identifier
	safeClinicID := strings.ReplaceAll(clinicID, "-", "_")
	seqName := fmt.Sprintf("medid_%s_%s", safeClinicID[:8], regionCode)

	// Create sequence if not exists (run once per clinic+region combination)
	// This is safe to call multiple times - CREATE SEQUENCE IF NOT EXISTS is idempotent
	createSeqQuery := fmt.Sprintf("CREATE SEQUENCE IF NOT EXISTS %s START 1", seqName)
	w.Pool.Exec(ctx, createSeqQuery)

	// Get next value from sequence
	var seqVal int64
	err := w.Pool.QueryRow(ctx, fmt.Sprintf("SELECT nextval('%s')", seqName)).Scan(&seqVal)
	if err != nil {
		return "", fmt.Errorf("failed to get sequence value: %w", err)
	}

	// Format: MED-{REGION}-{YEAR}-{6-digit sequence}
	medID := fmt.Sprintf("MED-%s-%d-%06d", regionCode, year, seqVal)
	return medID, nil
}

func (w *PoolWrapper) UpdatePatient(ctx context.Context, id string, updates map[string]interface{}) error {
	query := `UPDATE patients SET `
	args := []interface{}{}
	argCount := 0

	for key, value := range updates {
		if argCount > 0 {
			query += ", "
		}
		argCount++
		query += key + " = $" + string(rune('0'+argCount))
		args = append(args, value)
	}

	argCount++
	query += " WHERE id = $" + string(rune('0'+argCount))
	args = append(args, id)

	_, err := w.Pool.Exec(ctx, query, args...)
	return err
}

func (w *PoolWrapper) GetPatientVitals(ctx context.Context, patientID string) ([]domain.Vitals, error) {
	query := `
		SELECT v.id, v.episode_id, v.height, v.weight, v.temperature, v.bp_systolic, v.bp_diastolic,
		       v.pulse, v.blood_sugar, v.waist, v.head_circumference, v.chest_circumference, v.comments, v.recorded_at
		FROM vitals v
		JOIN episodes e ON v.episode_id = e.id
		WHERE e.patient_id = $1
		ORDER BY v.recorded_at DESC
	`

	rows, err := w.Pool.Query(ctx, query, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var vitals []domain.Vitals
	for rows.Next() {
		var v domain.Vitals
		rows.Scan(&v.ID, &v.EpisodeID, &v.Height, &v.Weight, &v.Temperature, &v.BPSystolic, &v.BPDiastolic,
			&v.Pulse, &v.BloodSugar, &v.Waist, &v.HeadCircumference, &v.ChestCircumference, &v.Comments, &v.RecordedAt)
		vitals = append(vitals, v)
	}

	return vitals, nil
}

func (w *PoolWrapper) GetPatientDeposits(ctx context.Context, patientID string) ([]domain.Deposit, error) {
	query := `
		SELECT id, patient_id, type, amount, balance, description, payment_id, invoice_id, created_by, created_at
		FROM deposits WHERE patient_id = $1 ORDER BY created_at DESC
	`

	rows, err := w.Pool.Query(ctx, query, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var deposits []domain.Deposit
	for rows.Next() {
		var d domain.Deposit
		rows.Scan(&d.ID, &d.PatientID, &d.Type, &d.Amount, &d.Balance, &d.Description, &d.PaymentID, &d.InvoiceID, &d.CreatedBy, &d.CreatedAt)
		deposits = append(deposits, d)
	}

	return deposits, nil
}

func (w *PoolWrapper) ListAppointments(ctx context.Context, clinicID, status, doctorID, patientID, patientSearch, dateFrom, dateTo string, page, limit int) ([]domain.Appointment, int, error) {
	offset := (page - 1) * limit

	// JOIN to return nested patient, doctor, service objects for the frontend table
	// PostgreSQL TIME columns converted to string via TO_CHAR to avoid scan errors
	// Cabinet fallback: appointment.cabinet → doctor.staff_cabinet → ''
	query := `
		SELECT a.id, a.clinic_id, a.branch_id, a.patient_id, a.doctor_id, a.service_id, a.status,
		       a.appointment_date,
		       TO_CHAR(a.start_time, 'HH24:MI:SS') AS start_time,
		       COALESCE(TO_CHAR(a.end_time, 'HH24:MI:SS'), '') AS end_time,
		       a.booking_method,
		       COALESCE(a.cabinet, '') AS cabinet, a.notes, a.created_at,
		       COALESCE(p.first_name, ''), COALESCE(p.last_name, ''), COALESCE(p.phone, ''),
		       COALESCE(st.first_name, ''), COALESCE(st.last_name, ''), COALESCE(st.patronymic, ''), COALESCE(st.specialty, ''), COALESCE(st.cabinet, ''),
		       COALESCE(s.name, '')
		FROM appointments a
		LEFT JOIN patients p ON a.patient_id = p.id
		LEFT JOIN staff st ON a.doctor_id = st.id
		LEFT JOIN services s ON a.service_id = s.id
		WHERE 1=1
	`
	countQuery := `SELECT COUNT(*) FROM appointments a WHERE 1=1`

	args := []interface{}{}
	argCount := 0

	if clinicID != "" {
		argCount++
		query += ` AND a.clinic_id = $` + string(rune('0'+argCount))
		countQuery += ` AND a.clinic_id = $` + string(rune('0'+argCount))
		args = append(args, clinicID)
	}
	if status != "" {
		argCount++
		query += ` AND a.status = $` + string(rune('0'+argCount))
		countQuery += ` AND a.status = $` + string(rune('0'+argCount))
		args = append(args, status)
	}
	if doctorID != "" {
		argCount++
		query += ` AND a.doctor_id = $` + string(rune('0'+argCount))
		countQuery += ` AND a.doctor_id = $` + string(rune('0'+argCount))
		args = append(args, doctorID)
	}
	if patientID != "" {
		argCount++
		query += ` AND a.patient_id = $` + string(rune('0'+argCount))
		countQuery += ` AND a.patient_id = $` + string(rune('0'+argCount))
		args = append(args, patientID)
	}
	if patientSearch != "" {
		argCount++
		query += ` AND (p.first_name ILIKE $` + string(rune('0'+argCount)) + ` OR p.last_name ILIKE $` + string(rune('0'+argCount)) + ` OR p.phone ILIKE $` + string(rune('0'+argCount)) + `)`
		countQuery += ` AND (p.first_name ILIKE $` + string(rune('0'+argCount)) + ` OR p.last_name ILIKE $` + string(rune('0'+argCount)) + ` OR p.phone ILIKE $` + string(rune('0'+argCount)) + `)`
		args = append(args, "%"+patientSearch+"%")
	}
	if dateFrom != "" {
		argCount++
		query += ` AND a.appointment_date >= $` + string(rune('0'+argCount))
		countQuery += ` AND a.appointment_date >= $` + string(rune('0'+argCount))
		args = append(args, dateFrom)
	}
	if dateTo != "" {
		argCount++
		query += ` AND a.appointment_date <= $` + string(rune('0'+argCount))
		countQuery += ` AND a.appointment_date <= $` + string(rune('0'+argCount))
		args = append(args, dateTo)
	}

	var total int
	w.Pool.QueryRow(ctx, countQuery, args...).Scan(&total)

	argCount++
	query += ` ORDER BY a.appointment_date DESC, a.start_time DESC LIMIT $` + string(rune('0'+argCount))
	argCount++
	query += ` OFFSET $` + string(rune('0'+argCount))
	args = append(args, limit, offset)

	rows, err := w.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var appointments []domain.Appointment
	for rows.Next() {
		var a domain.Appointment
		var docID, svcID pgtype.UUID // nullable UUIDs for doctor_id and service_id
		var patient domain.Patient
		var docFirstName, docLastName, docPatronymic, docSpecialty, docCabinet string
		var serviceName string

		// Properly handle scan error — TIME columns are now strings via TO_CHAR
		if err := rows.Scan(&a.ID, &a.ClinicID, &a.BranchID, &a.PatientID, &docID, &svcID, &a.Status,
			&a.AppointmentDate, &a.StartTime, &a.EndTime, &a.BookingMethod,
			&a.Cabinet, &a.Notes, &a.CreatedAt,
			&patient.FirstName, &patient.LastName, &patient.Phone,
			&docFirstName, &docLastName, &docPatronymic, &docSpecialty, &docCabinet,
			&serviceName); err != nil {
			return nil, 0, fmt.Errorf("scan appointment row: %w", err)
		}

		// Nullable doctor_id
		if docID.Valid {
			u, _ := uuid.FromBytes(docID.Bytes[:])
			a.DoctorID = u
		}
		// Nullable service_id
		if svcID.Valid {
			u, _ := uuid.FromBytes(svcID.Bytes[:])
			a.ServiceID = &u
		}

		// Nested patient object
		if patient.FirstName != "" || patient.LastName != "" || patient.Phone != "" {
			a.Patient = &patient
		}

		// Nested doctor object
		if docFirstName != "" || docLastName != "" {
			a.Doctor = &domain.Staff{
				FirstName: docFirstName,
				LastName:  docLastName,
				Patronymic: docPatronymic,
				Specialty:  docSpecialty,
				Cabinet:    docCabinet,
			}
		}

		// Nested service object
		if serviceName != "" {
			a.Service = &domain.Service{Name: serviceName}
		}

		// Cabinet fallback: appointment.cabinet → doctor.staff.cabinet
		if a.Cabinet == "" && docCabinet != "" {
			a.Cabinet = docCabinet
		}

		appointments = append(appointments, a)
	}

	return appointments, total, nil
}

func (w *PoolWrapper) GetAppointmentByID(ctx context.Context, id string) (*domain.Appointment, error) {
	// NOTE: referral_doctor_id and contract_id removed — they do not exist in the appointments table
	// PostgreSQL TIME columns converted to string via TO_CHAR to avoid scan errors
	query := `
		SELECT id, clinic_id, branch_id, patient_id, doctor_id, service_id, status, appointment_date,
		       TO_CHAR(start_time, 'HH24:MI:SS') AS start_time,
		       COALESCE(TO_CHAR(end_time, 'HH24:MI:SS'), '') AS end_time,
		       booking_method, cabinet, notes, created_at
		FROM appointments WHERE id = $1
	`

	var a domain.Appointment
	var docID, svcID pgtype.UUID // both nullable
	err := w.Pool.QueryRow(ctx, query, id).Scan(
		&a.ID, &a.ClinicID, &a.BranchID, &a.PatientID, &docID, &svcID, &a.Status,
		&a.AppointmentDate, &a.StartTime, &a.EndTime, &a.BookingMethod,
		&a.Cabinet, &a.Notes, &a.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	if docID.Valid {
		u, _ := uuid.FromBytes(docID.Bytes[:])
		a.DoctorID = u
	}
	if svcID.Valid {
		u, _ := uuid.FromBytes(svcID.Bytes[:])
		a.ServiceID = &u
	}

	return &a, nil
}

func (w *PoolWrapper) CreateAppointment(ctx context.Context, a *domain.Appointment) error {
	// Empty end_time → pass nil so DB inserts NULL (not empty string)
	var endTime interface{}
	if a.EndTime != "" {
		endTime = a.EndTime
	}

	// doctor_id is nullable: pass nil if zero UUID (no doctor selected)
	var doctorID interface{}
	if a.DoctorID != uuid.Nil {
		doctorID = a.DoctorID
	}

	// NOTE: referral_doctor_id and contract_id removed — they do not exist in the appointments table
	query := `
		INSERT INTO appointments (id, clinic_id, branch_id, patient_id, doctor_id, service_id, status,
		                          appointment_date, start_time, end_time, booking_method, cabinet, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`

	_, err := w.Pool.Exec(ctx, query,
		a.ID, a.ClinicID, a.BranchID, a.PatientID, doctorID, a.ServiceID, a.Status,
		a.AppointmentDate, a.StartTime, endTime, a.BookingMethod, a.Cabinet, a.Notes,
	)

	return err
}

// CreateAppointmentWithQueueEntry creates an appointment AND a queue entry in a single transaction.
// Cabinet resolution priority: 1) explicit cabinet param, 2) doctor.cabinet from staff table, 3) ""
// Returns appointment and queue entry IDs.
func (w *PoolWrapper) CreateAppointmentWithQueueEntry(ctx context.Context, a *domain.Appointment, explicitCabinet string) (*uuid.UUID, *uuid.UUID, error) {
	tx, err := w.Pool.Begin(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Resolve cabinet: explicit > doctor.cabinet > ""
	cabinet := explicitCabinet
	if cabinet == "" && a.DoctorID != uuid.Nil {
		var docCabinet string
		err = tx.QueryRow(ctx, `SELECT cabinet FROM staff WHERE id = $1`, a.DoctorID).Scan(&docCabinet)
		if err == nil && docCabinet != "" {
			cabinet = docCabinet
		}
	}

	// 2. Insert appointment with resolved cabinet
	var endTime interface{}
	if a.EndTime != "" {
		endTime = a.EndTime
	}
	var doctorID interface{}
	if a.DoctorID != uuid.Nil {
		doctorID = a.DoctorID
	}
	aptQuery := `
		INSERT INTO appointments (id, clinic_id, branch_id, patient_id, doctor_id, service_id, status,
		                          appointment_date, start_time, end_time, booking_method, cabinet, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`
	_, err = tx.Exec(ctx, aptQuery,
		a.ID, a.ClinicID, a.BranchID, a.PatientID, doctorID, a.ServiceID, a.Status,
		a.AppointmentDate, a.StartTime, endTime, a.BookingMethod, cabinet, a.Notes)
	if err != nil {
		return nil, nil, fmt.Errorf("insert appointment: %w", err)
	}

	// 3. Find or create default active queue for this clinic
	var queueID uuid.UUID
	queueQuery := `SELECT id FROM queues WHERE clinic_id = $1 AND is_active = true LIMIT 1`
	err = tx.QueryRow(ctx, queueQuery, a.ClinicID).Scan(&queueID)
	if err != nil {
		// No active queue → create default "Asosiy navbat"
		queueID = uuid.New()
		var branchID interface{}
		if a.BranchID != uuid.Nil {
			branchID = a.BranchID
		}
		createQ := `
			INSERT INTO queues (id, clinic_id, branch_id, name, queue_type, is_active, settings)
			VALUES ($1, $2, $3, 'Asosiy navbat', 'general', true, '{}')
		`
		_, err = tx.Exec(ctx, createQ, queueID, a.ClinicID, branchID)
		if err != nil {
			return nil, nil, fmt.Errorf("create default queue: %w", err)
		}
	}

	// 4. Generate queue number with race-safe upsert (avoids SELECT MAX race condition)
	today := time.Now().Format("2006-01-02")
	var queueNumber int
	numQuery := `
		INSERT INTO queue_daily_numbers (id, queue_id, queue_date, last_number)
		VALUES (gen_random_uuid(), $1, $2, 1)
		ON CONFLICT (queue_id, queue_date) DO UPDATE
		SET last_number = queue_daily_numbers.last_number + 1
		RETURNING last_number
	`
	err = tx.QueryRow(ctx, numQuery, queueID, today).Scan(&queueNumber)
	if err != nil {
		return nil, nil, fmt.Errorf("generate queue number: %w", err)
	}

	// 5. Insert queue_entry linked to appointment
	var branchIDPtr *uuid.UUID
	if a.BranchID != uuid.Nil {
		branchIDPtr = &a.BranchID
	}
	var doctorIDPtr *uuid.UUID
	if a.DoctorID != uuid.Nil {
		doctorIDPtr = &a.DoctorID
	}
	entryID := uuid.New()
	entryQuery := `
		INSERT INTO queue_entries (id, queue_id, clinic_id, branch_id, appointment_id, patient_id,
		                           queue_number, status, registered_at, cabinet, doctor_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'waiting', NOW(), $8, $9)
	`
	_, err = tx.Exec(ctx, entryQuery,
		entryID, queueID, a.ClinicID, branchIDPtr, a.ID, a.PatientID,
		queueNumber, cabinet, doctorIDPtr)
	if err != nil {
		return nil, nil, fmt.Errorf("insert queue entry: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, nil, fmt.Errorf("commit transaction: %w", err)
	}

	return &entryID, nil, nil
}

func (w *PoolWrapper) UpdateAppointment(ctx context.Context, id string, updates map[string]interface{}) error {
	query := `UPDATE appointments SET `
	args := []interface{}{}
	argCount := 0

	for key, value := range updates {
		if argCount > 0 {
			query += ", "
		}
		argCount++
		query += key + " = $" + string(rune('0'+argCount))
		args = append(args, value)
	}

	argCount++
	query += " WHERE id = $" + string(rune('0'+argCount))
	args = append(args, id)

	_, err := w.Pool.Exec(ctx, query, args...)
	return err
}

func (w *PoolWrapper) GetCalendar(ctx context.Context, doctorID, date, branchID string) ([]domain.Appointment, error) {
	// PostgreSQL TIME columns converted to string via TO_CHAR to avoid scan errors
	query := `
		SELECT id, clinic_id, branch_id, patient_id, doctor_id, service_id, status, appointment_date,
		       TO_CHAR(start_time, 'HH24:MI:SS') AS start_time,
		       COALESCE(TO_CHAR(end_time, 'HH24:MI:SS'), '') AS end_time,
		       booking_method, cabinet, notes, created_at
		FROM appointments WHERE 1=1
	`

	args := []interface{}{}
	argCount := 0

	if doctorID != "" {
		argCount++
		query += ` AND doctor_id = $` + string(rune('0'+argCount))
		args = append(args, doctorID)
	}
	if date != "" {
		argCount++
		query += ` AND appointment_date = $` + string(rune('0'+argCount))
		args = append(args, date)
	}
	if branchID != "" {
		argCount++
		query += ` AND branch_id = $` + string(rune('0'+argCount))
		args = append(args, branchID)
	}

	query += ` ORDER BY start_time`

	rows, err := w.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var appointments []domain.Appointment
	for rows.Next() {
		var a domain.Appointment
		if err := rows.Scan(&a.ID, &a.ClinicID, &a.BranchID, &a.PatientID, &a.DoctorID, &a.ServiceID, &a.Status,
			&a.AppointmentDate, &a.StartTime, &a.EndTime, &a.BookingMethod, &a.Cabinet, &a.Notes, &a.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan calendar row: %w", err)
		}
		appointments = append(appointments, a)
	}

	return appointments, nil
}

// Doctor handlers repository methods
func (w *PoolWrapper) GetDoctorPatients(ctx context.Context, doctorID string, page, limit int) ([]domain.Patient, int, error) {
	offset := (page - 1) * limit

	countQuery := `
		SELECT COUNT(DISTINCT e.patient_id) FROM episodes e
		JOIN patients p ON e.patient_id = p.id
		WHERE e.doctor_id = $1 AND p.is_active = true
	`
	listQuery := `
		SELECT DISTINCT ON (p.id) p.id, p.clinic_id, p.first_name, p.last_name, p.patronymic, p.birth_date,
		       p.gender, p.phone, p.phone_2, p.email, p.citizenship, p.address, p.passport,
		       p.deposit_balance, p.is_active, p.created_at
		FROM episodes e
		JOIN patients p ON e.patient_id = p.id
		WHERE e.doctor_id = $1 AND p.is_active = true
		ORDER BY p.id
	`

	var total int
	err := w.Pool.QueryRow(ctx, countQuery, doctorID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	listQuery += ` LIMIT $2 OFFSET $3`
	rows, err := w.Pool.Query(ctx, listQuery, doctorID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var patients []domain.Patient
	for rows.Next() {
		var p domain.Patient
		rows.Scan(&p.ID, &p.ClinicID, &p.FirstName, &p.LastName, &p.Patronymic,
			&p.BirthDate, &p.Gender, &p.Phone, &p.Phone2, &p.Email,
			&p.Citizenship, &p.Address, &p.Passport, &p.DepositBalance, &p.IsActive, &p.CreatedAt)
		patients = append(patients, p)
	}

	return patients, total, nil
}

func (w *PoolWrapper) GetTodayAppointments(ctx context.Context, doctorID string, date string) ([]domain.Appointment, error) {
	// LEFT JOIN services — service_id is nullable; doctor_id is also nullable
	query := `
		SELECT a.id, a.clinic_id, a.branch_id, a.patient_id, a.doctor_id, a.service_id, a.status,
		       a.appointment_date, a.start_time, a.end_time, a.booking_method, a.cabinet, a.notes, a.created_at,
		       p.first_name, p.last_name, p.phone, s.name as service_name
		FROM appointments a
		JOIN patients p ON a.patient_id = p.id
		LEFT JOIN services s ON a.service_id = s.id
		WHERE a.doctor_id = $1 AND a.appointment_date = $2 AND a.status != 'cancelled'
		ORDER BY a.start_time
	`

	rows, err := w.Pool.Query(ctx, query, doctorID, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var appointments []domain.Appointment
	for rows.Next() {
		var a domain.Appointment
		var patient domain.Patient
		var docID, svcID pgtype.UUID // both nullable UUIDs
		var serviceName *string
		rows.Scan(&a.ID, &a.ClinicID, &a.BranchID, &a.PatientID, &docID, &svcID, &a.Status,
			&a.AppointmentDate, &a.StartTime, &a.EndTime, &a.BookingMethod, &a.Cabinet, &a.Notes, &a.CreatedAt,
			&patient.FirstName, &patient.LastName, &patient.Phone, &serviceName)
		// Parse nullable doctor_id
		if docID.Valid {
			u, _ := uuid.FromBytes(docID.Bytes[:])
			a.DoctorID = u
		}
		// Parse nullable service_id
		if svcID.Valid {
			u, _ := uuid.FromBytes(svcID.Bytes[:])
			a.ServiceID = &u
		}
		// Populate patient nested object
		a.Patient = &patient
		// Populate service nested object (nullable — show "-" if nil)
		if serviceName != nil {
			a.Service = &domain.Service{Name: *serviceName}
		}
		appointments = append(appointments, a)
	}

	return appointments, nil
}

// Episode and Encounter methods
func (w *PoolWrapper) UpdateEpisode(ctx context.Context, id string, updates map[string]interface{}) error {
	query := `UPDATE episodes SET `
	args := []interface{}{}
	argCount := 0

	for key, value := range updates {
		if argCount > 0 {
			query += ", "
		}
		argCount++
		query += key + " = $" + string(rune('0'+argCount))
		args = append(args, value)
	}

	argCount++
	query += " WHERE id = $" + string(rune('0'+argCount))
	args = append(args, id)

	_, err := w.Pool.Exec(ctx, query, args...)
	return err
}

func (w *PoolWrapper) CreateEpisode(ctx context.Context, e *domain.Episode) error {
	query := `
		INSERT INTO episodes (id, clinic_id, patient_id, doctor_id, referral_doctor_id, title, status, template_id, started_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := w.Pool.Exec(ctx, query,
		e.ID, e.ClinicID, e.PatientID, e.DoctorID, e.ReferralDoctorID,
		e.Title, e.Status, e.TemplateID, e.StartedAt)
	return err
}

func (w *PoolWrapper) CreateDiagnosis(ctx context.Context, d *domain.Diagnosis) error {
	query := `
		INSERT INTO diagnoses (id, episode_id, icd_code, icd_name, type, status, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := w.Pool.Exec(ctx, query, d.ID, d.EpisodeID, d.ICDCode, d.ICDName, d.Type, d.Status, d.Notes)
	return err
}

func (w *PoolWrapper) CreateRecommendation(ctx context.Context, r *domain.Recommendation) error {
	query := `
		INSERT INTO recommendations (id, episode_id, type, service_id, description, instructions, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := w.Pool.Exec(ctx, query, r.ID, r.EpisodeID, r.Type, r.ServiceID, r.Description, r.Instructions, r.Status)
	return err
}

func (w *PoolWrapper) CreateEncounter(ctx context.Context, e *domain.Encounter) error {
	query := `
		INSERT INTO encounters (id, episode_id, appointment_id, doctor_id, visit_date, complaints, examination, notes, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := w.Pool.Exec(ctx, query,
		e.ID, e.EpisodeID, e.AppointmentID, e.DoctorID, e.VisitDate,
		e.Complaints, e.Examination, e.Notes, e.Status)
	return err
}

func (w *PoolWrapper) CreateVitals(ctx context.Context, v *domain.Vitals) error {
	query := `
		INSERT INTO vitals (id, episode_id, height, weight, temperature, bp_systolic, bp_diastolic,
		                    pulse, blood_sugar, waist, head_circumference, chest_circumference, comments, recorded_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`
	_, err := w.Pool.Exec(ctx, query,
		v.ID, v.EpisodeID, v.Height, v.Weight, v.Temperature, v.BPSystolic, v.BPDiastolic,
		v.Pulse, v.BloodSugar, v.Waist, v.HeadCircumference, v.ChestCircumference, v.Comments, v.RecordedAt)
	return err
}

// Queue methods
func (w *PoolWrapper) ListQueues(ctx context.Context, clinicID, branchID string) ([]domain.Queue, error) {
	query := `SELECT id, clinic_id, branch_id, name, queue_type, is_active, settings, created_at FROM queues WHERE 1=1`
	args := []interface{}{}
	argCount := 0

	if clinicID != "" {
		argCount++
		query += ` AND clinic_id = $` + string(rune('0'+argCount))
		args = append(args, clinicID)
	}
	if branchID != "" {
		argCount++
		query += ` AND branch_id = $` + string(rune('0'+argCount))
		args = append(args, branchID)
	}

	rows, err := w.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var queues []domain.Queue
	for rows.Next() {
		var q domain.Queue
		rows.Scan(&q.ID, &q.ClinicID, &q.BranchID, &q.Name, &q.QueueType, &q.IsActive, &q.Settings, &q.CreatedAt)
		queues = append(queues, q)
	}
	return queues, nil
}

func (w *PoolWrapper) CreateQueue(ctx context.Context, q *domain.Queue) error {
	query := `
		INSERT INTO queues (id, clinic_id, branch_id, name, queue_type, is_active, settings)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := w.Pool.Exec(ctx, query, q.ID, q.ClinicID, q.BranchID, q.Name, q.QueueType, q.IsActive, q.Settings)
	return err
}

func (w *PoolWrapper) GetQueueByID(ctx context.Context, id string) (*domain.Queue, error) {
	query := `SELECT id, clinic_id, branch_id, name, queue_type, is_active, settings, created_at FROM queues WHERE id = $1`
	var q domain.Queue
	err := w.Pool.QueryRow(ctx, query, id).Scan(&q.ID, &q.ClinicID, &q.BranchID, &q.Name, &q.QueueType, &q.IsActive, &q.Settings, &q.CreatedAt)
	return &q, err
}

func (w *PoolWrapper) ListQueueEntries(ctx context.Context, queueID, status string) ([]domain.QueueEntry, error) {
	// LEFT JOIN staff so doctor names are available even if doctor_id is NULL
	query := `
		SELECT qe.id, qe.queue_id, qe.appointment_id, qe.patient_id, qe.queue_number, qe.status,
		       qe.registered_at, qe.called_at, qe.completed_at, qe.cabinet, qe.doctor_id,
		       p.first_name, p.last_name, p.phone,
		       COALESCE(st.first_name, ''), COALESCE(st.last_name, ''), COALESCE(st.patronymic, ''), COALESCE(st.specialty, '')
		FROM queue_entries qe
		JOIN patients p ON qe.patient_id = p.id
		LEFT JOIN staff st ON qe.doctor_id = st.id
		WHERE qe.queue_id = $1
	`
	args := []interface{}{queueID}
	argCount := 1

	if status != "" {
		argCount++
		query += ` AND qe.status = $` + string(rune('0'+argCount))
		args = append(args, status)
	}
	query += ` ORDER BY qe.queue_number`

	rows, err := w.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []domain.QueueEntry
	for rows.Next() {
		var e domain.QueueEntry
		var patient domain.Patient
		var docFirstName, docLastName, docPatronymic, docSpecialty string
		rows.Scan(&e.ID, &e.QueueID, &e.AppointmentID, &e.PatientID, &e.QueueNumber, &e.Status,
			&e.RegisteredAt, &e.CalledAt, &e.CompletedAt, &e.Cabinet, &e.DoctorID,
			&patient.FirstName, &patient.LastName, &patient.Phone,
			&docFirstName, &docLastName, &docPatronymic, &docSpecialty)
		e.Patient = &patient
		if docFirstName != "" || docLastName != "" {
			e.Doctor = &domain.Staff{
				FirstName:  docFirstName,
				LastName:   docLastName,
				Patronymic: docPatronymic,
				Specialty:  docSpecialty,
			}
		}
		entries = append(entries, e)
	}
	return entries, nil
}

// ListAllQueueEntries returns all queue entries for a clinic across all queues — for dashboard KPI aggregation
func (w *PoolWrapper) ListAllQueueEntries(ctx context.Context, clinicID, status string) ([]domain.QueueEntry, error) {
	query := `
		SELECT qe.id, qe.queue_id, qe.appointment_id, qe.patient_id, qe.queue_number, qe.status,
		       qe.registered_at, qe.called_at, qe.completed_at, qe.cabinet, qe.doctor_id,
		       p.first_name, p.last_name, p.phone,
		       COALESCE(st.first_name, ''), COALESCE(st.last_name, ''), COALESCE(st.patronymic, ''), COALESCE(st.specialty, '')
		FROM queue_entries qe
		JOIN patients p ON qe.patient_id = p.id
		LEFT JOIN staff st ON qe.doctor_id = st.id
		WHERE qe.clinic_id = $1
	`
	args := []interface{}{clinicID}
	argCount := 1

	if status != "" {
		argCount++
		query += ` AND qe.status = $` + string(rune('0'+argCount))
		args = append(args, status)
	}
	query += ` ORDER BY qe.registered_at DESC`

	rows, err := w.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []domain.QueueEntry
	for rows.Next() {
		var e domain.QueueEntry
		var patient domain.Patient
		var docFirstName, docLastName, docPatronymic, docSpecialty string
		rows.Scan(&e.ID, &e.QueueID, &e.AppointmentID, &e.PatientID, &e.QueueNumber, &e.Status,
			&e.RegisteredAt, &e.CalledAt, &e.CompletedAt, &e.Cabinet, &e.DoctorID,
			&patient.FirstName, &patient.LastName, &patient.Phone,
			&docFirstName, &docLastName, &docPatronymic, &docSpecialty)
		e.Patient = &patient
		if docFirstName != "" || docLastName != "" {
			e.Doctor = &domain.Staff{
				FirstName:  docFirstName,
				LastName:   docLastName,
				Patronymic: docPatronymic,
				Specialty:  docSpecialty,
			}
		}
		entries = append(entries, e)
	}
	return entries, nil
}

func (w *PoolWrapper) CreateQueueEntry(ctx context.Context, e *domain.QueueEntry) error {
	query := `
		INSERT INTO queue_entries (id, queue_id, clinic_id, branch_id, appointment_id, patient_id, queue_number, status, registered_at, cabinet, doctor_id, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`
	_, err := w.Pool.Exec(ctx, query,
		e.ID, e.QueueID, e.ClinicID, e.BranchID,
		e.AppointmentID, e.PatientID, e.QueueNumber,
		e.Status, e.RegisteredAt, e.Cabinet, e.DoctorID, e.CreatedBy,
	)
	return err
}

func (w *PoolWrapper) UpdateQueueEntry(ctx context.Context, id string, updates map[string]interface{}) error {
	query := `UPDATE queue_entries SET `
	args := []interface{}{}
	argCount := 0

	for key, value := range updates {
		if argCount > 0 {
			query += ", "
		}
		argCount++
		query += key + " = $" + string(rune('0'+argCount))
		args = append(args, value)
	}

	argCount++
	query += " WHERE id = $" + string(rune('0'+argCount))
	args = append(args, id)

	_, err := w.Pool.Exec(ctx, query, args...)
	return err
}

func (w *PoolWrapper) GetNextQueueNumber(ctx context.Context, queueID string) (int, error) {
	// Race-safe: upsert into queue_daily_numbers so concurrent requests get unique numbers
	today := time.Now().Format("2006-01-02")
	query := `
		INSERT INTO queue_daily_numbers (id, queue_id, queue_date, last_number)
		VALUES (gen_random_uuid(), $1, $2, 1)
		ON CONFLICT (queue_id, queue_date) DO UPDATE
		SET last_number = queue_daily_numbers.last_number + 1
		RETURNING last_number
	`
	var num int
	err := w.Pool.QueryRow(ctx, query, queueID, today).Scan(&num)
	return num, err
}

// Cashier and Invoice methods
func (w *PoolWrapper) ListInvoices(ctx context.Context, patientID, status, dateFrom, dateTo string, page, limit int) ([]domain.Invoice, int, error) {
	offset := (page - 1) * limit

	query := `
		SELECT i.id, i.clinic_id, i.branch_id, i.patient_id, i.appointment_id, i.total_amount,
		       i.discount_amount, i.paid_amount, i.status, i.created_by, i.created_at,
		       p.first_name, p.last_name
		FROM invoices i
		JOIN patients p ON i.patient_id = p.id
		WHERE 1=1
	`
	countQuery := `SELECT COUNT(*) FROM invoices i WHERE 1=1`
	args := []interface{}{}
	argCount := 0

	if patientID != "" {
		argCount++
		query += ` AND i.patient_id = $` + string(rune('0'+argCount))
		countQuery += ` AND i.patient_id = $` + string(rune('0'+argCount))
		args = append(args, patientID)
	}
	if status != "" {
		argCount++
		query += ` AND i.status = $` + string(rune('0'+argCount))
		countQuery += ` AND i.status = $` + string(rune('0'+argCount))
		args = append(args, status)
	}
	if dateFrom != "" {
		argCount++
		query += ` AND i.created_at >= $` + string(rune('0'+argCount))
		countQuery += ` AND i.created_at >= $` + string(rune('0'+argCount))
		args = append(args, dateFrom)
	}
	if dateTo != "" {
		argCount++
		query += ` AND i.created_at <= $` + string(rune('0'+argCount))
		countQuery += ` AND i.created_at <= $` + string(rune('0'+argCount))
		args = append(args, dateTo)
	}

	var total int
	w.Pool.QueryRow(ctx, countQuery, args...).Scan(&total)

	argCount++
	query += ` ORDER BY i.created_at DESC LIMIT $` + string(rune('0'+argCount))
	argCount++
	query += ` OFFSET $` + string(rune('0'+argCount))
	args = append(args, limit, offset)

	rows, err := w.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var invoices []domain.Invoice
	for rows.Next() {
		var inv domain.Invoice
		var patient domain.Patient
		rows.Scan(&inv.ID, &inv.ClinicID, &inv.BranchID, &inv.PatientID, &inv.AppointmentID,
			&inv.TotalAmount, &inv.DiscountAmount, &inv.PaidAmount, &inv.Status,
			&inv.CreatedBy, &inv.CreatedAt, &patient.FirstName, &patient.LastName)
		inv.Patient = &patient
		invoices = append(invoices, inv)
	}

	return invoices, total, nil
}

func (w *PoolWrapper) GetInvoiceByID(ctx context.Context, id string) (*domain.Invoice, error) {
	query := `
		SELECT id, clinic_id, branch_id, patient_id, appointment_id, total_amount,
		       discount_amount, paid_amount, status, created_by, created_at
		FROM invoices WHERE id = $1
	`
	var inv domain.Invoice
	err := w.Pool.QueryRow(ctx, query, id).Scan(
		&inv.ID, &inv.ClinicID, &inv.BranchID, &inv.PatientID, &inv.AppointmentID,
		&inv.TotalAmount, &inv.DiscountAmount, &inv.PaidAmount, &inv.Status,
		&inv.CreatedBy, &inv.CreatedAt)
	return &inv, err
}

func (w *PoolWrapper) CreateInvoice(ctx context.Context, inv *domain.Invoice) error {
	query := `
		INSERT INTO invoices (id, clinic_id, branch_id, patient_id, appointment_id, total_amount,
		                     discount_amount, paid_amount, status, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := w.Pool.Exec(ctx, query,
		inv.ID, inv.ClinicID, inv.BranchID, inv.PatientID, inv.AppointmentID,
		inv.TotalAmount, inv.DiscountAmount, inv.PaidAmount, inv.Status, inv.CreatedBy)
	return err
}

func (w *PoolWrapper) CreateInvoiceItem(ctx context.Context, item *domain.InvoiceItem) error {
	query := `
		INSERT INTO invoice_items (id, invoice_id, service_id, service_name, quantity, unit_price, discount, total_price)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := w.Pool.Exec(ctx, query,
		item.ID, item.InvoiceID, item.ServiceID, item.ServiceName,
		item.Quantity, item.UnitPrice, item.Discount, item.TotalPrice)
	return err
}

func (w *PoolWrapper) CreatePayment(ctx context.Context, p *domain.Payment) error {
	query := `
		INSERT INTO payments (id, invoice_id, amount, payment_method, reference, cashier_id)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := w.Pool.Exec(ctx, query, p.ID, p.InvoiceID, p.Amount, p.PaymentMethod, p.Reference, p.CashierID)
	return err
}

func (w *PoolWrapper) CreateRefund(ctx context.Context, r *domain.Refund) error {
	query := `
		INSERT INTO refunds (id, invoice_id, payment_id, amount, reason, approved_by)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := w.Pool.Exec(ctx, query, r.ID, r.InvoiceID, r.PaymentID, r.Amount, r.Reason, r.ApprovedBy)
	return err
}

func (w *PoolWrapper) UpdateInvoiceStatus(ctx context.Context, id string, status string, paidAmount float64) error {
	query := `UPDATE invoices SET status = $1, paid_amount = paid_amount + $2 WHERE id = $3`
	_, err := w.Pool.Exec(ctx, query, status, paidAmount, id)
	return err
}

func (w *PoolWrapper) CreateDeposit(ctx context.Context, d *domain.Deposit) error {
	query := `
		INSERT INTO deposits (id, patient_id, type, amount, balance, description, payment_id, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := w.Pool.Exec(ctx, query,
		d.ID, d.PatientID, d.Type, d.Amount, d.Balance, d.Description, d.PaymentID, d.CreatedBy)
	return err
}

func (w *PoolWrapper) UpdatePatientDepositBalance(ctx context.Context, patientID string, amount float64) error {
	query := `UPDATE patients SET deposit_balance = deposit_balance + $1 WHERE id = $2`
	_, err := w.Pool.Exec(ctx, query, amount, patientID)
	return err
}

// LIS methods
func (w *PoolWrapper) ListLISOrders(ctx context.Context, patientID, status, dateFrom, dateTo string, page, limit int) ([]domain.LISOrder, int, error) {
	offset := (page - 1) * limit

	query := `
		SELECT lo.id, lo.clinic_id, lo.episode_id, lo.appointment_id, lo.patient_id, lo.doctor_id,
		       lo.lab_technician_id, lo.status, lo.sample_type, lo.collected_at, lo.ready_at, lo.created_at,
		       p.first_name, p.last_name
		FROM lis_orders lo
		JOIN patients p ON lo.patient_id = p.id
		WHERE 1=1
	`
	countQuery := `SELECT COUNT(*) FROM lis_orders lo WHERE 1=1`
	args := []interface{}{}
	argCount := 0

	if patientID != "" {
		argCount++
		query += ` AND lo.patient_id = $` + string(rune('0'+argCount))
		countQuery += ` AND lo.patient_id = $` + string(rune('0'+argCount))
		args = append(args, patientID)
	}
	if status != "" {
		argCount++
		query += ` AND lo.status = $` + string(rune('0'+argCount))
		countQuery += ` AND lo.status = $` + string(rune('0'+argCount))
		args = append(args, status)
	}
	if dateFrom != "" {
		argCount++
		query += ` AND lo.created_at >= $` + string(rune('0'+argCount))
		countQuery += ` AND lo.created_at >= $` + string(rune('0'+argCount))
		args = append(args, dateFrom)
	}
	if dateTo != "" {
		argCount++
		query += ` AND lo.created_at <= $` + string(rune('0'+argCount))
		countQuery += ` AND lo.created_at <= $` + string(rune('0'+argCount))
		args = append(args, dateTo)
	}

	var total int
	w.Pool.QueryRow(ctx, countQuery, args...).Scan(&total)

	argCount++
	query += ` ORDER BY lo.created_at DESC LIMIT $` + string(rune('0'+argCount))
	argCount++
	query += ` OFFSET $` + string(rune('0'+argCount))
	args = append(args, limit, offset)

	rows, err := w.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var orders []domain.LISOrder
	for rows.Next() {
		var order domain.LISOrder
		var patient domain.Patient
		rows.Scan(&order.ID, &order.ClinicID, &order.EpisodeID, &order.AppointmentID,
			&order.PatientID, &order.DoctorID, &order.LabTechnicianID, &order.Status,
			&order.SampleType, &order.CollectedAt, &order.ReadyAt, &order.CreatedAt,
			&patient.FirstName, &patient.LastName)
		order.Patient = &patient
		orders = append(orders, order)
	}

	return orders, total, nil
}

func (w *PoolWrapper) GetLISOrderByID(ctx context.Context, id string) (*domain.LISOrder, error) {
	query := `
		SELECT id, clinic_id, episode_id, appointment_id, patient_id, doctor_id, lab_technician_id,
		       status, sample_type, collected_at, ready_at, created_at
		FROM lis_orders WHERE id = $1
	`
	var order domain.LISOrder
	err := w.Pool.QueryRow(ctx, query, id).Scan(
		&order.ID, &order.ClinicID, &order.EpisodeID, &order.AppointmentID,
		&order.PatientID, &order.DoctorID, &order.LabTechnicianID, &order.Status,
		&order.SampleType, &order.CollectedAt, &order.ReadyAt, &order.CreatedAt)
	return &order, err
}

func (w *PoolWrapper) CreateLISOrder(ctx context.Context, o *domain.LISOrder) error {
	query := `
		INSERT INTO lis_orders (id, clinic_id, episode_id, appointment_id, patient_id, doctor_id, status, sample_type)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := w.Pool.Exec(ctx, query,
		o.ID, o.ClinicID, o.EpisodeID, o.AppointmentID, o.PatientID, o.DoctorID, o.Status, o.SampleType)
	return err
}

func (w *PoolWrapper) UpdateLISOrder(ctx context.Context, id string, updates map[string]interface{}) error {
	query := `UPDATE lis_orders SET `
	args := []interface{}{}
	argCount := 0

	for key, value := range updates {
		if argCount > 0 {
			query += ", "
		}
		argCount++
		query += key + " = $" + string(rune('0'+argCount))
		args = append(args, value)
	}

	argCount++
	query += " WHERE id = $" + string(rune('0'+argCount))
	args = append(args, id)

	_, err := w.Pool.Exec(ctx, query, args...)
	return err
}

func (w *PoolWrapper) CreateLISOrderItem(ctx context.Context, item *domain.LISOrderItem) error {
	query := `
		INSERT INTO lis_order_items (id, order_id, service_id, service_name, status)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := w.Pool.Exec(ctx, query, item.ID, item.OrderID, item.ServiceID, item.ServiceName, item.Status)
	return err
}

func (w *PoolWrapper) UpdateLISOrderItem(ctx context.Context, id string, updates map[string]interface{}) error {
	query := `UPDATE lis_order_items SET `
	args := []interface{}{}
	argCount := 0

	for key, value := range updates {
		if argCount > 0 {
			query += ", "
		}
		argCount++
		query += key + " = $" + string(rune('0'+argCount))
		args = append(args, value)
	}

	argCount++
	query += " WHERE id = $" + string(rune('0'+argCount))
	args = append(args, id)

	_, err := w.Pool.Exec(ctx, query, args...)
	return err
}

// Analytics methods
func (w *PoolWrapper) GetDashboardStats(ctx context.Context, clinicID, branchID, date string) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total appointments today
	appointmentsQuery := `
		SELECT COUNT(*) FROM appointments
		WHERE appointment_date = $1 AND clinic_id = $2
	`
	if branchID != "" {
		appointmentsQuery += ` AND branch_id = $3`
	}
	var totalAppts int
	if branchID != "" {
		w.Pool.QueryRow(ctx, appointmentsQuery, date, clinicID, branchID).Scan(&totalAppts)
	} else {
		w.Pool.QueryRow(ctx, appointmentsQuery, date, clinicID).Scan(&totalAppts)
	}
	stats["total_appointments"] = totalAppts

	// Completed appointments
	completedQuery := `
		SELECT COUNT(*) FROM appointments
		WHERE appointment_date = $1 AND clinic_id = $2 AND status = 'completed'
	`
	if branchID != "" {
		completedQuery += ` AND branch_id = $3`
	}
	var completedAppts int
	if branchID != "" {
		w.Pool.QueryRow(ctx, completedQuery, date, clinicID, branchID).Scan(&completedAppts)
	} else {
		w.Pool.QueryRow(ctx, completedQuery, date, clinicID).Scan(&completedAppts)
	}
	stats["completed_appointments"] = completedAppts

	// Waiting patients
	waitingQuery := `
		SELECT COUNT(*) FROM queue_entries qe
		JOIN queues q ON qe.queue_id = q.id
		WHERE qe.status = 'waiting' AND q.clinic_id = $1
	`
	if branchID != "" {
		waitingQuery += ` AND q.branch_id = $2`
	}
	var waiting int
	if branchID != "" {
		w.Pool.QueryRow(ctx, waitingQuery, clinicID, branchID).Scan(&waiting)
	} else {
		w.Pool.QueryRow(ctx, waitingQuery, clinicID).Scan(&waiting)
	}
	stats["waiting_patients"] = waiting

	// Total revenue today
	revenueQuery := `
		SELECT COALESCE(SUM(p.amount), 0) FROM payments p
		JOIN invoices i ON p.invoice_id = i.id
		WHERE DATE(p.created_at) = $1 AND i.clinic_id = $2
	`
	if branchID != "" {
		revenueQuery += ` AND i.branch_id = $3`
	}
	var revenue float64
	if branchID != "" {
		w.Pool.QueryRow(ctx, revenueQuery, date, clinicID, branchID).Scan(&revenue)
	} else {
		w.Pool.QueryRow(ctx, revenueQuery, date, clinicID).Scan(&revenue)
	}
	stats["total_revenue"] = revenue

	// New patients this month
	newPatientsQuery := `
		SELECT COUNT(*) FROM patients
		WHERE DATE(created_at) >= DATE_TRUNC('month', $1::date) AND clinic_id = $2
	`
	var newPatients int
	w.Pool.QueryRow(ctx, newPatientsQuery, date, clinicID).Scan(&newPatients)
	stats["new_patients"] = newPatients

	return stats, nil
}

func (w *PoolWrapper) GetRevenueStats(ctx context.Context, clinicID, branchID, dateFrom, dateTo string) ([]map[string]interface{}, error) {
	query := `
		SELECT DATE(p.created_at) as date, SUM(p.amount) as total
		FROM payments p
		JOIN invoices i ON p.invoice_id = i.id
		WHERE i.clinic_id = $1 AND p.created_at >= $2 AND p.created_at <= $3
	`
	args := []interface{}{clinicID, dateFrom, dateTo}
	if branchID != "" {
		query += ` AND i.branch_id = $4`
		args = append(args, branchID)
	}
	query += ` GROUP BY DATE(p.created_at) ORDER BY date`

	rows, err := w.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var date string
		var total float64
		rows.Scan(&date, &total)
		results = append(results, map[string]interface{}{
			"date":  date,
			"total": total,
		})
	}

	return results, nil
}

// Reference data methods
func (w *PoolWrapper) ListServiceGroups(ctx context.Context, clinicID string) ([]domain.ServiceGroup, error) {
	query := `
		SELECT id, clinic_id, parent_id, name, description, icon, sort_order, is_active
		FROM service_groups WHERE clinic_id = $1 ORDER BY sort_order
	`
	rows, err := w.Pool.Query(ctx, query, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []domain.ServiceGroup
	for rows.Next() {
		var g domain.ServiceGroup
		rows.Scan(&g.ID, &g.ClinicID, &g.ParentID, &g.Name, &g.Description, &g.Icon, &g.SortOrder, &g.IsActive)
		groups = append(groups, g)
	}
	return groups, nil
}

func (w *PoolWrapper) ListServices(ctx context.Context, groupID string) ([]domain.Service, error) {
	query := `
		SELECT id, clinic_id, group_id, name, description, duration, base_price, is_active, requires_sample
		FROM services WHERE group_id = $1 AND is_active = true ORDER BY name
	`
	rows, err := w.Pool.Query(ctx, query, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []domain.Service
	for rows.Next() {
		var s domain.Service
		rows.Scan(&s.ID, &s.ClinicID, &s.GroupID, &s.Name, &s.Description, &s.Duration, &s.BasePrice, &s.IsActive, &s.RequiresSample)
		services = append(services, s)
	}
	return services, nil
}

// ListAllServices returns all individual services for a clinic, joined with group name for display.
// Returns []domain.Service with GroupName field available via Service.GroupID lookup.
func (w *PoolWrapper) ListAllServices(ctx context.Context, clinicID string) ([]domain.Service, error) {
	query := `
		SELECT s.id, s.clinic_id, s.group_id, s.name, s.description, s.duration,
		       s.base_price, s.is_active, s.requires_sample
		FROM services s
		WHERE s.clinic_id = $1 AND s.is_active = true
		ORDER BY s.name
	`
	rows, err := w.Pool.Query(ctx, query, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []domain.Service
	for rows.Next() {
		var s domain.Service
		err := rows.Scan(&s.ID, &s.ClinicID, &s.GroupID, &s.Name, &s.Description,
			&s.Duration, &s.BasePrice, &s.IsActive, &s.RequiresSample)
		if err != nil {
			return nil, err
		}
		services = append(services, s)
	}
	return services, nil
}

func (w *PoolWrapper) ListTerritories(ctx context.Context, parentID *string) ([]domain.Territory, error) {
	query := `SELECT id, parent_id, name, type, level FROM territories WHERE 1=1`
	args := []interface{}{}

	if parentID != nil && *parentID != "" {
		query += ` AND parent_id = $1`
		args = append(args, *parentID)
	} else {
		query += ` AND parent_id IS NULL`
	}

	rows, err := w.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var territories []domain.Territory
	for rows.Next() {
		var t domain.Territory
		rows.Scan(&t.ID, &t.ParentID, &t.Name, &t.Type, &t.Level)
		territories = append(territories, t)
	}
	return territories, nil
}

func (w *PoolWrapper) ListStaff(ctx context.Context, clinicID, role string, page, limit int) ([]domain.Staff, int, error) {
	offset := (page - 1) * limit

	countQuery := `SELECT COUNT(*) FROM staff WHERE clinic_id = $1 AND is_active = true`
	listQuery := `
		SELECT id, clinic_id, branch_id, user_id, first_name, last_name, patronymic, specialty,
		       position, phone, cabinet, is_active
		FROM staff WHERE clinic_id = $1 AND is_active = true
	`
	args := []interface{}{clinicID}
	argCount := 1

	if role != "" {
		// Match by specialty OR position (case-insensitive). E.g. role="doctor" matches
		// specialty containing "doctor" OR position containing "doctor" (shifokor in Uzbek).
		argCount++
		countQuery += ` AND (specialty ILIKE '%' || $` + fmt.Sprintf("%d", argCount) + ` || '%' OR position ILIKE '%' || $` + fmt.Sprintf("%d", argCount) + ` || '%')`
		listQuery += ` AND (specialty ILIKE '%' || $` + fmt.Sprintf("%d", argCount) + ` || '%' OR position ILIKE '%' || $` + fmt.Sprintf("%d", argCount) + ` || '%')`
		args = append(args, role)
	}

	var total int
	w.Pool.QueryRow(ctx, countQuery, args...).Scan(&total)

	listQuery += ` ORDER BY last_name LIMIT $` + string(rune('0'+argCount+1)) + ` OFFSET $` + string(rune('0'+argCount+2))
	args = append(args, limit, offset)

	rows, err := w.Pool.Query(ctx, listQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var staffList []domain.Staff
	for rows.Next() {
		var s domain.Staff
		rows.Scan(&s.ID, &s.ClinicID, &s.BranchID, &s.UserID, &s.FirstName, &s.LastName,
			&s.Patronymic, &s.Specialty, &s.Position, &s.Phone, &s.Cabinet, &s.IsActive)
		staffList = append(staffList, s)
	}

	return staffList, total, nil
}

func (w *PoolWrapper) GetStaffByID(ctx context.Context, id string) (*domain.Staff, error) {
	query := `
		SELECT id, clinic_id, branch_id, user_id, first_name, last_name, patronymic, specialty,
		       position, phone, cabinet, schedule, qualification, photo_url, is_active
		FROM staff WHERE id = $1
	`
	var s domain.Staff
	err := w.Pool.QueryRow(ctx, query, id).Scan(
		&s.ID, &s.ClinicID, &s.BranchID, &s.UserID, &s.FirstName, &s.LastName,
		&s.Patronymic, &s.Specialty, &s.Position, &s.Phone, &s.Cabinet,
		&s.Schedule, &s.Qualification, &s.PhotoURL, &s.IsActive)
	return &s, err
}

func (w *PoolWrapper) CreateStaff(ctx context.Context, s *domain.Staff) error {
	query := `
		INSERT INTO staff (id, clinic_id, branch_id, user_id, first_name, last_name, patronymic,
		                   specialty, position, phone, cabinet, schedule, qualification, photo_url, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`

	// Marshal schedule as JSON: empty string → NULL (DB default '{}'::jsonb applies),
	// non-empty string → {"text": "..."}
	var scheduleJSON interface{}
	if s.Schedule != "" {
		scheduleBytes, err := json.Marshal(map[string]string{"text": s.Schedule})
		if err != nil {
			return fmt.Errorf("failed to marshal schedule: %w", err)
		}
		scheduleJSON = scheduleBytes
	}
	// else: scheduleJSON stays nil → SQL NULL → DB default applies

	// Convert empty strings for optional text fields to nil for proper NULL handling
	var cabinet, specialty, qualification, photoURL interface{}
	if s.Cabinet != "" {
		cabinet = s.Cabinet
	}
	if s.Specialty != "" {
		specialty = s.Specialty
	}
	if s.Qualification != "" {
		qualification = s.Qualification
	}
	if s.PhotoURL != "" {
		photoURL = s.PhotoURL
	}

	_, err := w.Pool.Exec(ctx, query,
		s.ID, s.ClinicID, s.BranchID, s.UserID, s.FirstName, s.LastName, s.Patronymic,
		specialty, s.Position, s.Phone, cabinet, scheduleJSON, qualification, photoURL, s.IsActive)
	return err
}

func (w *PoolWrapper) UpdateStaff(ctx context.Context, id string, updates map[string]interface{}) error {
	query := `UPDATE staff SET `
	args := []interface{}{}
	argCount := 0

	for key, value := range updates {
		if argCount > 0 {
			query += ", "
		}
		argCount++
		query += key + " = $" + string(rune('0'+argCount))
		args = append(args, value)
	}

	argCount++
	query += " WHERE id = $" + string(rune('0'+argCount))
	args = append(args, id)

	_, err := w.Pool.Exec(ctx, query, args...)
	return err
}

func (w *PoolWrapper) DeactivateStaff(ctx context.Context, id string) error {
	query := `UPDATE staff SET is_active = false WHERE id = $1`
	_, err := w.Pool.Exec(ctx, query, id)
	return err
}

func (w *PoolWrapper) ListUsers(ctx context.Context, clinicID string, page, limit int) ([]domain.User, int, error) {
	offset := (page - 1) * limit

	countQuery := `SELECT COUNT(*) FROM users WHERE clinic_id = $1`
	listQuery := `
		SELECT id, clinic_id, branch_id, staff_id, email, first_name, last_name, phone, role, is_active
		FROM users WHERE clinic_id = $1
	`

	var total int
	w.Pool.QueryRow(ctx, countQuery, clinicID).Scan(&total)

	listQuery += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	rows, err := w.Pool.Query(ctx, listQuery, clinicID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []domain.User
	for rows.Next() {
		var u domain.User
		rows.Scan(&u.ID, &u.ClinicID, &u.BranchID, &u.StaffID, &u.Email,
			&u.FirstName, &u.LastName, &u.Phone, &u.Role, &u.IsActive)
		users = append(users, u)
	}

	return users, total, nil
}

func (w *PoolWrapper) CreateUser(ctx context.Context, u *domain.User) error {
	query := `
		INSERT INTO users (id, clinic_id, branch_id, staff_id, email, password_hash, first_name,
		                   last_name, phone, role, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err := w.Pool.Exec(ctx, query,
		u.ID, u.ClinicID, u.BranchID, u.StaffID, u.Email, u.PasswordHash,
		u.FirstName, u.LastName, u.Phone, u.Role, u.IsActive)
	return err
}

func (w *PoolWrapper) UpdateUser(ctx context.Context, id string, updates map[string]interface{}) error {
	query := `UPDATE users SET `
	args := []interface{}{}
	argCount := 0

	for key, value := range updates {
		if argCount > 0 {
			query += ", "
		}
		argCount++
		query += key + " = $" + string(rune('0'+argCount))
		args = append(args, value)
	}

	argCount++
	query += " WHERE id = $" + string(rune('0'+argCount))
	args = append(args, id)

	_, err := w.Pool.Exec(ctx, query, args...)
	return err
}

func (w *PoolWrapper) DeactivateUser(ctx context.Context, id string) error {
	query := `UPDATE users SET is_active = false WHERE id = $1`
	_, err := w.Pool.Exec(ctx, query, id)
	return err
}

// Clinic and Branch methods
func (w *PoolWrapper) ListClinics(ctx context.Context) ([]domain.Clinic, error) {
	query := `SELECT id, name, legal_name, inn, address, phone, email, logo_url, is_active, created_at FROM clinics WHERE is_active = true`
	rows, err := w.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var clinics []domain.Clinic
	for rows.Next() {
		var c domain.Clinic
		rows.Scan(&c.ID, &c.Name, &c.LegalName, &c.INN, &c.Address, &c.Phone, &c.Email, &c.LogoURL, &c.IsActive, &c.CreatedAt)
		clinics = append(clinics, c)
	}
	return clinics, nil
}

func (w *PoolWrapper) GetClinicByID(ctx context.Context, id string) (*domain.Clinic, error) {
	query := `SELECT id, name, legal_name, inn, address, phone, email, logo_url, settings, is_active, created_at FROM clinics WHERE id = $1`
	var c domain.Clinic
	err := w.Pool.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.Name, &c.LegalName, &c.INN, &c.Address, &c.Phone, &c.Email, &c.LogoURL, &c.Settings, &c.IsActive, &c.CreatedAt)
	return &c, err
}

func (w *PoolWrapper) CreateClinic(ctx context.Context, c *domain.Clinic) error {
	query := `
		INSERT INTO clinics (id, name, legal_name, inn, address, phone, email, logo_url, settings, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := w.Pool.Exec(ctx, query,
		c.ID, c.Name, c.LegalName, c.INN, c.Address, c.Phone, c.Email, c.LogoURL, c.Settings, c.IsActive)
	return err
}

func (w *PoolWrapper) UpdateClinic(ctx context.Context, id string, updates map[string]interface{}) error {
	query := `UPDATE clinics SET `
	args := []interface{}{}
	argCount := 0

	for key, value := range updates {
		if argCount > 0 {
			query += ", "
		}
		argCount++
		query += key + " = $" + string(rune('0'+argCount))
		args = append(args, value)
	}

	argCount++
	query += " WHERE id = $" + string(rune('0'+argCount))
	args = append(args, id)

	_, err := w.Pool.Exec(ctx, query, args...)
	return err
}

func (w *PoolWrapper) ListBranches(ctx context.Context, clinicID string) ([]domain.Branch, error) {
	query := `SELECT id, clinic_id, name, address, phone, latitude, longitude, work_schedule, timezone, is_main, is_active FROM branches WHERE clinic_id = $1`
	rows, err := w.Pool.Query(ctx, query, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var branches []domain.Branch
	for rows.Next() {
		var b domain.Branch
		rows.Scan(&b.ID, &b.ClinicID, &b.Name, &b.Address, &b.Phone, &b.Latitude, &b.Longitude,
			&b.WorkSchedule, &b.Timezone, &b.IsMain, &b.IsActive)
		branches = append(branches, b)
	}
	return branches, nil
}

func (w *PoolWrapper) GetBranchByID(ctx context.Context, id string) (*domain.Branch, error) {
	query := `SELECT id, clinic_id, name, address, phone, latitude, longitude, work_schedule, timezone, is_main, is_active FROM branches WHERE id = $1`
	var b domain.Branch
	err := w.Pool.QueryRow(ctx, query, id).Scan(
		&b.ID, &b.ClinicID, &b.Name, &b.Address, &b.Phone, &b.Latitude, &b.Longitude,
		&b.WorkSchedule, &b.Timezone, &b.IsMain, &b.IsActive)
	return &b, err
}

func (w *PoolWrapper) CreateBranch(ctx context.Context, b *domain.Branch) error {
	query := `
		INSERT INTO branches (id, clinic_id, name, address, phone, latitude, longitude, work_schedule, timezone, is_main, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err := w.Pool.Exec(ctx, query,
		b.ID, b.ClinicID, b.Name, b.Address, b.Phone, b.Latitude, b.Longitude,
		b.WorkSchedule, b.Timezone, b.IsMain, b.IsActive)
	return err
}

func (w *PoolWrapper) UpdateBranch(ctx context.Context, id string, updates map[string]interface{}) error {
	query := `UPDATE branches SET `
	args := []interface{}{}
	argCount := 0

	for key, value := range updates {
		if argCount > 0 {
			query += ", "
		}
		argCount++
		query += key + " = $" + string(rune('0'+argCount))
		args = append(args, value)
	}

	argCount++
	query += " WHERE id = $" + string(rune('0'+argCount))
	args = append(args, id)

	_, err := w.Pool.Exec(ctx, query, args...)
	return err
}

func (w *PoolWrapper) ListRefGroups(ctx context.Context) ([]domain.RefGroup, error) {
	query := `SELECT id, name, description FROM ref_groups`
	rows, err := w.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []domain.RefGroup
	for rows.Next() {
		var g domain.RefGroup
		rows.Scan(&g.ID, &g.Name, &g.Description)
		groups = append(groups, g)
	}
	return groups, nil
}

func (w *PoolWrapper) GetAppointmentStats(ctx context.Context, clinicID, dateFrom, dateTo string) ([]map[string]interface{}, int, error) {
	query := `
		SELECT
			a.id,
			a.appointment_date,
			a.start_time,
			a.status,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as doctor_name,
			svc.name as service_name
		FROM appointments a
		JOIN patients p ON a.patient_id = p.id
		JOIN staff s ON a.doctor_id = s.id
		JOIN services svc ON a.service_id = svc.id
		WHERE a.appointment_date BETWEEN $1 AND $2
		ORDER BY a.appointment_date DESC, a.start_time DESC
	`
	rows, err := w.Pool.Query(ctx, query, dateFrom, dateTo)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var appointments []map[string]interface{}
	for rows.Next() {
		var id, patientName, doctorName, serviceName string
		var appointmentDate time.Time
		var startTime, status string
		rows.Scan(&id, &appointmentDate, &startTime, &status, &patientName, &doctorName, &serviceName)
		appointments = append(appointments, map[string]interface{}{
			"id":              id,
			"date":            appointmentDate.Format("2006-01-02"),
			"time":            startTime,
			"status":          status,
			"patient_name":    patientName,
			"doctor_name":     doctorName,
			"service_name":    serviceName,
		})
	}
	return appointments, len(appointments), nil
}

// GetServiceByID - Get service by ID
func (w *PoolWrapper) GetServiceByID(ctx context.Context, id string) (*domain.Service, error) {
	query := `
		SELECT id, clinic_id, group_id, name, description, duration, base_price, is_active, requires_sample, created_at
		FROM services WHERE id = $1
	`
	var s domain.Service
	err := w.Pool.QueryRow(ctx, query, id).Scan(
		&s.ID, &s.ClinicID, &s.GroupID, &s.Name, &s.Description,
		&s.Duration, &s.BasePrice, &s.IsActive, &s.RequiresSample, &s.CreatedAt)
	return &s, err
}

// CreatePatientDepositTransaction - Create deposit transaction record
func (w *PoolWrapper) CreatePatientDepositTransaction(ctx context.Context, t *domain.PatientDepositTransaction) error {
	query := `
		INSERT INTO patient_deposit_transactions (
			id, patient_id, transaction_type, amount, balance_before, balance_after,
			payment_method, reference, description, cashier_id, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err := w.Pool.Exec(ctx, query,
		t.ID, t.PatientID, t.TransactionType, t.Amount, t.BalanceBefore, t.BalanceAfter,
		t.PaymentMethod, t.Reference, t.Description, t.CashierID, t.CreatedAt)
	return err
}

// CreateAuditLog - Create audit log entry
func (w *PoolWrapper) CreateAuditLog(ctx context.Context, input AuditLogInput) error {
	query := `
		INSERT INTO audit_logs (
			id, clinic_id, branch_id, user_id, action, entity_type, entity_id, details, ip_address, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	detailsJSON, err := json.Marshal(input.Details)
	if err != nil {
		detailsJSON = []byte("{}")
	}
	_, err = w.Pool.Exec(ctx, query,
		uuid.New(), input.ClinicID, input.BranchID, input.UserID,
		input.Action, input.EntityType, input.EntityID,
		detailsJSON, input.IPAddress, time.Now())
	return err
}

// ExecutePaymentWithTransaction - Execute payment with full transaction safety
func (w *PoolWrapper) ExecutePaymentWithTransaction(ctx context.Context, input PaymentTransactionInput) (*PaymentTransactionResult, error) {
	tx, err := w.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Get invoice
	var invoice struct {
		ID           uuid.UUID
		PatientID    uuid.UUID
		TotalAmount  float64
		PaidAmount   float64
		Status       string
	}
	err = tx.QueryRow(ctx, `
		SELECT id, patient_id, total_amount, paid_amount, status FROM invoices WHERE id = $1 FOR UPDATE
	`, input.InvoiceID).Scan(&invoice.ID, &invoice.PatientID, &invoice.TotalAmount, &invoice.PaidAmount, &invoice.Status)
	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	// 2. Handle deposit payment method
	var depositTxID *uuid.UUID
	if input.PaymentMethod == "deposit" {
		// Get patient current balance
		var currentBalance float64
		err = tx.QueryRow(ctx, `SELECT deposit_balance FROM patients WHERE id = $1 FOR UPDATE`, invoice.PatientID).Scan(&currentBalance)
		if err != nil {
			return nil, fmt.Errorf("patient not found: %w", err)
		}
		if currentBalance < input.Amount {
			return nil, fmt.Errorf("insufficient deposit balance: have %.0f, need %.0f", currentBalance, input.Amount)
		}

		// Create deposit transaction record
		depositTx := &domain.PatientDepositTransaction{
			ID:              uuid.New(),
			PatientID:       invoice.PatientID,
			TransactionType: "withdrawal",
			Amount:          -input.Amount,
			BalanceBefore:   currentBalance,
			BalanceAfter:    currentBalance - input.Amount,
			PaymentMethod:   "deposit",
			Reference:       input.InvoiceID.String(),
			Description:     "Payment for Invoice",
			CashierID:      input.CashierID,
			CreatedAt:       time.Now(),
		}
		depositTxID = &depositTx.ID

		// Insert deposit transaction
		_, err = tx.Exec(ctx, `
			INSERT INTO patient_deposit_transactions (
				id, patient_id, transaction_type, amount, balance_before, balance_after,
				payment_method, reference, description, cashier_id, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`, depositTx.ID, depositTx.PatientID, depositTx.TransactionType, depositTx.Amount,
			depositTx.BalanceBefore, depositTx.BalanceAfter, depositTx.PaymentMethod,
			depositTx.Reference, depositTx.Description, depositTx.CashierID, depositTx.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to record deposit transaction: %w", err)
		}

		// Update patient deposit balance
		_, err = tx.Exec(ctx, `UPDATE patients SET deposit_balance = deposit_balance - $1 WHERE id = $2`, input.Amount, invoice.PatientID)
		if err != nil {
			return nil, fmt.Errorf("failed to update deposit balance: %w", err)
		}
	}

	// 3. Create payment record
	paymentID := uuid.New()
	_, err = tx.Exec(ctx, `
		INSERT INTO payments (id, invoice_id, patient_id, amount, payment_method, reference, cashier_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, paymentID, input.InvoiceID, invoice.PatientID, input.Amount, input.PaymentMethod, input.Reference, input.CashierID, time.Now())
	if err != nil {
		return nil, fmt.Errorf("failed to create payment record: %w", err)
	}

	// 4. Calculate new status
	newPaidAmount := invoice.PaidAmount + input.Amount
	newStatus := "partially_paid"
	if newPaidAmount >= invoice.TotalAmount {
		newStatus = "paid"
	}

	// 5. Update invoice
	_, err = tx.Exec(ctx, `
		UPDATE invoices SET paid_amount = $1, status = $2, updated_at = $3 WHERE id = $4
	`, newPaidAmount, newStatus, time.Now(), input.InvoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to update invoice: %w", err)
	}

	// 6. Create audit log
	auditDetails := map[string]interface{}{
		"invoice_id":     input.InvoiceID.String(),
		"payment_id":      paymentID.String(),
		"amount":          input.Amount,
		"payment_method":  input.PaymentMethod,
		"old_status":     invoice.Status,
		"new_status":     newStatus,
		"paid_amount":    newPaidAmount,
	}
	if depositTxID != nil {
		auditDetails["deposit_transaction_id"] = depositTxID.String()
	}
	_, _ = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, uuid.New(), input.CashierID, "PAYMENT_RECEIVED", "payment", paymentID, mustMarshalJSON(auditDetails), time.Now())

	// 7. Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &PaymentTransactionResult{
		PaymentID:        paymentID,
		InvoiceStatus:    newStatus,
		RemainingAmount:  invoice.TotalAmount - newPaidAmount,
		IsFullyPaid:      newStatus == "paid",
		DepositTxID:      depositTxID,
	}, nil
}

// PaymentTransactionInput - Input for payment transaction
type PaymentTransactionInput struct {
	InvoiceID     uuid.UUID
	Amount       float64
	PaymentMethod string
	Reference    string
	CashierID    *uuid.UUID
	ClinicID     *uuid.UUID
	BranchID     *uuid.UUID
}

// PaymentTransactionResult - Result of payment transaction
type PaymentTransactionResult struct {
	PaymentID        uuid.UUID
	InvoiceStatus    string
	RemainingAmount  float64
	IsFullyPaid      bool
	DepositTxID      *uuid.UUID
}

// ExecuteRefundWithTransaction - Execute refund with full transaction safety
func (w *PoolWrapper) ExecuteRefundWithTransaction(ctx context.Context, input RefundTransactionInput) (*RefundTransactionResult, error) {
	tx, err := w.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Get payment
	var payment struct {
		ID         uuid.UUID
		InvoiceID  uuid.UUID
		PatientID  uuid.UUID
		Amount     float64
	}
	err = tx.QueryRow(ctx, `
		SELECT id, invoice_id, patient_id, amount FROM payments WHERE id = $1
	`, input.PaymentID).Scan(&payment.ID, &payment.InvoiceID, &payment.PatientID, &payment.Amount)
	if err != nil {
		return nil, fmt.Errorf("payment not found: %w", err)
	}

	if input.Amount > payment.Amount {
		return nil, fmt.Errorf("refund amount exceeds payment amount")
	}

	// 2. Get invoice for update
	var invoice struct {
		TotalAmount float64
		PaidAmount  float64
		Status      string
	}
	err = tx.QueryRow(ctx, `
		SELECT total_amount, paid_amount, status FROM invoices WHERE id = $1 FOR UPDATE
	`, payment.InvoiceID).Scan(&invoice.TotalAmount, &invoice.PaidAmount, &invoice.Status)
	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	// 3. Create refund record
	refundID := uuid.New()
	_, err = tx.Exec(ctx, `
		INSERT INTO refunds (id, invoice_id, payment_id, amount, reason, approved_by, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, refundID, payment.InvoiceID, payment.ID, input.Amount, input.Reason, input.ApprovedBy, time.Now())
	if err != nil {
		return nil, fmt.Errorf("failed to create refund: %w", err)
	}

	// 4. Handle deposit refund if requested
	var depositTxID *uuid.UUID
	if input.RefundToDeposit {
		var currentBalance float64
		err = tx.QueryRow(ctx, `SELECT deposit_balance FROM patients WHERE id = $1 FOR UPDATE`, payment.PatientID).Scan(&currentBalance)
		if err != nil {
			return nil, fmt.Errorf("patient not found: %w", err)
		}

		// Create deposit transaction record
		depositTx := &domain.PatientDepositTransaction{
			ID:              uuid.New(),
			PatientID:       payment.PatientID,
			TransactionType: "refund",
			Amount:          input.Amount,
			BalanceBefore:   currentBalance,
			BalanceAfter:    currentBalance + input.Amount,
			PaymentMethod:   "deposit",
			Reference:       input.PaymentID.String(),
			Description:     "Refund to deposit",
			CashierID:      input.ApprovedBy,
			CreatedAt:       time.Now(),
		}
		depositTxID = &depositTx.ID

		_, err = tx.Exec(ctx, `
			INSERT INTO patient_deposit_transactions (
				id, patient_id, transaction_type, amount, balance_before, balance_after,
				payment_method, reference, description, cashier_id, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`, depositTx.ID, depositTx.PatientID, depositTx.TransactionType, depositTx.Amount,
			depositTx.BalanceBefore, depositTx.BalanceAfter, depositTx.PaymentMethod,
			depositTx.Reference, depositTx.Description, depositTx.CashierID, depositTx.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to record deposit transaction: %w", err)
		}

		// Update patient deposit balance
		_, err = tx.Exec(ctx, `UPDATE patients SET deposit_balance = deposit_balance + $1 WHERE id = $2`, input.Amount, payment.PatientID)
		if err != nil {
			return nil, fmt.Errorf("failed to update deposit balance: %w", err)
		}
	}

	// 5. Update invoice
	newPaidAmount := invoice.PaidAmount - input.Amount
	newStatus := "partially_paid"
	if newPaidAmount <= 0 {
		newStatus = "open"
	} else if newPaidAmount >= invoice.TotalAmount {
		newStatus = "paid"
	}

	_, err = tx.Exec(ctx, `
		UPDATE invoices SET paid_amount = $1, status = $2, updated_at = $3 WHERE id = $4
	`, newPaidAmount, newStatus, time.Now(), payment.InvoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to update invoice: %w", err)
	}

	// 6. Create audit log
	auditDetails := map[string]interface{}{
		"refund_id":      refundID.String(),
		"payment_id":     input.PaymentID.String(),
		"invoice_id":     payment.InvoiceID.String(),
		"amount":         input.Amount,
		"reason":         input.Reason,
		"to_deposit":    input.RefundToDeposit,
		"old_status":    invoice.Status,
		"new_status":    newStatus,
	}
	if depositTxID != nil {
		auditDetails["deposit_transaction_id"] = depositTxID.String()
	}
	_, _ = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, uuid.New(), input.ApprovedBy, "REFUND_PROCESSED", "refund", refundID, mustMarshalJSON(auditDetails), time.Now())

	// 7. Commit
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &RefundTransactionResult{
		RefundID:      refundID,
		InvoiceStatus: newStatus,
	}, nil
}

// RefundTransactionInput - Input for refund transaction
type RefundTransactionInput struct {
	PaymentID       uuid.UUID
	Amount          float64
	Reason          string
	ApprovedBy      *uuid.UUID
	RefundToDeposit bool
}

// RefundTransactionResult - Result of refund transaction
type RefundTransactionResult struct {
	RefundID      uuid.UUID
	InvoiceStatus string
}

// mustMarshalJSON - helper to marshal or return empty object
func mustMarshalJSON(v interface{}) []byte {
	b, err := json.Marshal(v)
	if err != nil {
		return []byte("{}")
	}
	return b
}

// ==================== MEDICAL CARD METHODS ====================

// GetMedicalCard - Get medical card for patient
func (w *PoolWrapper) GetMedicalCard(ctx context.Context, patientID string) (*domain.MedicalCard, error) {
	query := `
		SELECT id, clinic_id, patient_id, blood_type, rh_factor, allergies, chronic_conditions, family_history, created_at, updated_at
		FROM medical_cards WHERE patient_id = $1
	`
	var card domain.MedicalCard
	err := w.Pool.QueryRow(ctx, query, patientID).Scan(
		&card.ID, &card.ClinicID, &card.PatientID, &card.BloodType, &card.RHFactor,
		&card.Allergies, &card.ChronicConditions, &card.FamilyHistory, &card.CreatedAt, &card.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &card, nil
}

// CreateMedicalCard - Create medical card for patient
func (w *PoolWrapper) CreateMedicalCard(ctx context.Context, input CreateMedicalCardInput) (*domain.MedicalCard, error) {
	query := `
		INSERT INTO medical_cards (id, clinic_id, patient_id, blood_type, rh_factor, allergies, chronic_conditions, family_history, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, clinic_id, patient_id, blood_type, rh_factor, allergies, chronic_conditions, family_history, created_at, updated_at
	`
	var card domain.MedicalCard
	err := w.Pool.QueryRow(ctx, query,
		uuid.New(), input.ClinicID, input.PatientID, input.BloodType, input.RHFactor,
		input.Allergies, input.ChronicConditions, input.FamilyHistory, input.CreatedBy,
	).Scan(
		&card.ID, &card.ClinicID, &card.PatientID, &card.BloodType, &card.RHFactor,
		&card.Allergies, &card.ChronicConditions, &card.FamilyHistory, &card.CreatedAt, &card.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &card, nil
}

// UpdateMedicalCard - Update medical card
func (w *PoolWrapper) UpdateMedicalCard(ctx context.Context, patientID string, input UpdateMedicalCardInput) error {
	query := `
		UPDATE medical_cards SET
			blood_type = COALESCE(NULLIF($2, ''), blood_type),
			rh_factor = COALESCE(NULLIF($3, ''), rh_factor),
			allergies = COALESCE(NULLIF($4, ''), allergies),
			chronic_conditions = COALESCE(NULLIF($5, ''), chronic_conditions),
			family_history = COALESCE(NULLIF($6, ''), family_history),
			updated_by = $7,
			updated_at = NOW()
		WHERE patient_id = $1
	`
	_, err := w.Pool.Exec(ctx, query,
		patientID, input.BloodType, input.RHFactor, input.Allergies,
		input.ChronicConditions, input.FamilyHistory, input.UpdatedBy,
	)
	return err
}

// GetPatientEpisodes - Get all episodes for patient
func (w *PoolWrapper) GetPatientEpisodes(ctx context.Context, patientID string, limit int) ([]domain.Episode, error) {
	query := `
		SELECT e.id, e.clinic_id, e.patient_id, e.doctor_id, e.referral_doctor_id, e.title, e.status,
			e.template_id, e.conclusion, e.started_at, e.completed_at, e.appointment_id, e.created_at, e.updated_at,
			s.first_name || ' ' || s.last_name as doctor_name
		FROM episodes e
		LEFT JOIN staff s ON e.doctor_id = s.id
		WHERE e.patient_id = $1
		ORDER BY e.started_at DESC
		LIMIT $2
	`
	rows, err := w.Pool.Query(ctx, query, patientID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var episodes []domain.Episode
	for rows.Next() {
		var ep domain.Episode
		var clinicID, patientID, doctorID sql.NullString
		var referralDoctorID, templateID, appointmentID *uuid.UUID
		var title, status, conclusion sql.NullString
		var doctorName sql.NullString
		var completedAt sql.NullTime
		var createdAt, updatedAt sql.NullTime
		err := rows.Scan(
			&ep.ID, &clinicID, &patientID, &doctorID, &referralDoctorID, &title, &status,
			&templateID, &conclusion, &ep.StartedAt, &completedAt, &appointmentID, &createdAt, &updatedAt,
			&doctorName,
		)
		if err != nil {
			return nil, err
		}
		// Handle nullable UUID fields
		if clinicID.Valid {
			if u, err := uuid.Parse(clinicID.String); err == nil {
				ep.ClinicID = u
			}
		}
		if patientID.Valid {
			if u, err := uuid.Parse(patientID.String); err == nil {
				ep.PatientID = u
			}
		}
		if doctorID.Valid {
			if u, err := uuid.Parse(doctorID.String); err == nil {
				ep.DoctorID = u
			}
		}
		// Handle nullable string fields
		if title.Valid {
			ep.Title = title.String
		}
		if status.Valid {
			ep.Status = status.String
		}
		if conclusion.Valid {
			ep.Conclusion = conclusion.String
		}
		ep.ReferralDoctorID = referralDoctorID
		ep.TemplateID = templateID
		ep.AppointmentID = appointmentID
		if completedAt.Valid {
			ep.CompletedAt = &completedAt.Time
		}
		if createdAt.Valid {
			ep.CreatedAt = createdAt.Time
		}
		if updatedAt.Valid {
			ep.UpdatedAt = updatedAt.Time
		}
		if doctorName.Valid {
			ep.DoctorName = doctorName.String
		}
		episodes = append(episodes, ep)
	}
	return episodes, nil
}

// GetEpisodeByID - Get episode by ID
func (w *PoolWrapper) GetEpisodeByID(ctx context.Context, episodeID string) (*domain.Episode, error) {
	query := `
		SELECT e.id, e.clinic_id, e.patient_id, e.doctor_id, e.referral_doctor_id, e.title, e.status,
			e.template_id, e.conclusion, e.started_at, e.completed_at, e.appointment_id, e.branch_id, e.created_at, e.updated_at,
			s.first_name || ' ' || s.last_name as doctor_name,
			p.first_name || ' ' || p.last_name as patient_name
		FROM episodes e
		LEFT JOIN staff s ON e.doctor_id = s.id
		LEFT JOIN patients p ON e.patient_id = p.id
		WHERE e.id = $1
	`
	var ep domain.Episode
	var clinicID, patientID, doctorID sql.NullString
	var referralDoctorID, templateID, appointmentID, branchID *uuid.UUID
	var title, status, conclusion sql.NullString
	var startedAt, createdAt, updatedAt sql.NullTime
	var completedAt sql.NullTime
	var doctorName, patientName sql.NullString
	err := w.Pool.QueryRow(ctx, query, episodeID).Scan(
		&ep.ID, &clinicID, &patientID, &doctorID, &referralDoctorID, &title, &status,
		&templateID, &conclusion, &startedAt, &completedAt, &appointmentID, &branchID, &createdAt, &updatedAt,
		&doctorName, &patientName,
	)
	if err != nil {
		return nil, err
	}
	// Handle nullable UUID fields
	if clinicID.Valid {
		if u, err := uuid.Parse(clinicID.String); err == nil {
			ep.ClinicID = u
		}
	}
	if patientID.Valid {
		if u, err := uuid.Parse(patientID.String); err == nil {
			ep.PatientID = u
		}
	}
	if doctorID.Valid {
		if u, err := uuid.Parse(doctorID.String); err == nil {
			ep.DoctorID = u
		}
	}
	// Handle nullable string fields
	if title.Valid {
		ep.Title = title.String
	}
	if status.Valid {
		ep.Status = status.String
	}
	if conclusion.Valid {
		ep.Conclusion = conclusion.String
	}
	ep.ReferralDoctorID = referralDoctorID
	ep.TemplateID = templateID
	ep.AppointmentID = appointmentID
	ep.BranchID = branchID
	// Handle nullable time fields
	if startedAt.Valid {
		ep.StartedAt = startedAt.Time
	}
	if completedAt.Valid {
		ep.CompletedAt = &completedAt.Time
	}
	if createdAt.Valid {
		ep.CreatedAt = createdAt.Time
	}
	if updatedAt.Valid {
		ep.UpdatedAt = updatedAt.Time
	}
	if doctorName.Valid {
		ep.DoctorName = doctorName.String
	}
	if patientName.Valid {
		ep.PatientName = patientName.String
	}

	// Get diagnoses
	ep.Diagnoses, _ = w.GetEpisodeDiagnoses(ctx, episodeID)

	// Get recommendations
	ep.Recommendations, _ = w.GetEpisodeRecommendations(ctx, episodeID)

	// Get vitals
	ep.Vitals, _ = w.GetEpisodeVitals(ctx, episodeID)

	// Get encounters
	ep.Encounters, _ = w.GetEpisodeEncounters(ctx, episodeID)

	return &ep, nil
}

// GetEpisodeByAppointmentID - Get episode linked to a specific appointment (for duplicate prevention)
func (w *PoolWrapper) GetEpisodeByAppointmentID(ctx context.Context, appointmentID string) (*domain.Episode, error) {
	query := `
		SELECT e.id, e.clinic_id, e.patient_id, e.doctor_id, e.referral_doctor_id, e.title, e.status,
			e.template_id, e.conclusion, e.started_at, e.completed_at, e.appointment_id, e.branch_id, e.created_at, e.updated_at,
			s.first_name || ' ' || s.last_name as doctor_name,
			p.first_name || ' ' || p.last_name as patient_name
		FROM episodes e
		LEFT JOIN staff s ON e.doctor_id = s.id
		LEFT JOIN patients p ON e.patient_id = p.id
		WHERE e.appointment_id = $1
		LIMIT 1
	`
	var ep domain.Episode
	var clinicID, patientID, doctorID sql.NullString
	var referralDoctorID, templateID, apptID, branchID *uuid.UUID
	var title, status, conclusion sql.NullString
	var startedAt, createdAt, updatedAt sql.NullTime
	var completedAt sql.NullTime
	var doctorName, patientName sql.NullString
	err := w.Pool.QueryRow(ctx, query, appointmentID).Scan(
		&ep.ID, &clinicID, &patientID, &doctorID, &referralDoctorID, &title, &status,
		&templateID, &conclusion, &startedAt, &completedAt, &apptID, &branchID, &createdAt, &updatedAt,
		&doctorName, &patientName,
	)
	if err != nil {
		return nil, err
	}
	// Handle nullable UUID fields
	if clinicID.Valid {
		if u, err := uuid.Parse(clinicID.String); err == nil {
			ep.ClinicID = u
		}
	}
	if patientID.Valid {
		if u, err := uuid.Parse(patientID.String); err == nil {
			ep.PatientID = u
		}
	}
	if doctorID.Valid {
		if u, err := uuid.Parse(doctorID.String); err == nil {
			ep.DoctorID = u
		}
	}
	// Handle nullable string fields
	if title.Valid {
		ep.Title = title.String
	}
	if status.Valid {
		ep.Status = status.String
	}
	if conclusion.Valid {
		ep.Conclusion = conclusion.String
	}
	ep.ReferralDoctorID = referralDoctorID
	ep.TemplateID = templateID
	ep.AppointmentID = apptID
	ep.BranchID = branchID
	// Handle nullable time fields
	if startedAt.Valid {
		ep.StartedAt = startedAt.Time
	}
	if completedAt.Valid {
		ep.CompletedAt = &completedAt.Time
	}
	if createdAt.Valid {
		ep.CreatedAt = createdAt.Time
	}
	if updatedAt.Valid {
		ep.UpdatedAt = updatedAt.Time
	}
	if doctorName.Valid {
		ep.DoctorName = doctorName.String
	}
	if patientName.Valid {
		ep.PatientName = patientName.String
	}
	ep.Diagnoses, _ = w.GetEpisodeDiagnoses(ctx, ep.ID.String())
	ep.Recommendations, _ = w.GetEpisodeRecommendations(ctx, ep.ID.String())
	ep.Vitals, _ = w.GetEpisodeVitals(ctx, ep.ID.String())
	ep.Encounters, _ = w.GetEpisodeEncounters(ctx, ep.ID.String())
	return &ep, nil
}

// CreateEpisode - Create new episode
// TASK-005e: Moved audit log OUTSIDE the transaction.
// Audit log MUST NOT block episode creation. audit_logs table uses different column names
// (table_name/record_id/new_data) than what CreateEpisodeEx was inserting (entity_type/entity_id/details).
// Audit log is best-effort: logged after commit, failure logged as warning only.
func (w *PoolWrapper) CreateEpisodeEx(ctx context.Context, input CreateEpisodeInput) (*domain.Episode, error) {
	tx, err := w.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("Begin tx failed: %w", err)
	}
	defer tx.Rollback(ctx)

	// STEP 1: INSERT episode
	// RETURNING order: id, clinic_id, branch_id, patient_id, doctor_id, referral_doctor_id,
	//                  title, status, template_id, started_at, created_at, updated_at
	// appointment_id NOT in RETURNING — use input value after scan.
	insertQuery := `
		INSERT INTO episodes (id, clinic_id, branch_id, patient_id, doctor_id, referral_doctor_id, title, status, template_id, appointment_id, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, clinic_id, branch_id, patient_id, doctor_id, referral_doctor_id,
		           title, status, template_id, started_at, created_at, updated_at
	`
	var ep domain.Episode
	var branchID, referralDoctorID, templateID *uuid.UUID
	err = tx.QueryRow(ctx, insertQuery,
		uuid.New(), input.ClinicID, input.BranchID, input.PatientID, input.DoctorID,
		input.ReferralDoctorID, input.Title, "active", input.TemplateID, input.AppointmentID, input.CreatedBy,
	).Scan(
		&ep.ID, &ep.ClinicID, &branchID, &ep.PatientID, &ep.DoctorID, &referralDoctorID,
		&ep.Title, &ep.Status, &templateID, &ep.StartedAt, &ep.CreatedAt, &ep.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("STEP1 INSERT episodes failed: %w | clinic_id=%s branch_id=%v patient_id=%s doctor_id=%s",
			err, input.ClinicID, input.BranchID, input.PatientID, input.DoctorID)
	}
	ep.BranchID = branchID
	ep.ReferralDoctorID = referralDoctorID
	ep.TemplateID = templateID
	ep.AppointmentID = input.AppointmentID

	fmt.Printf("[CreateEpisodeEx] STEP1 OK: episode id=%s clinic_id=%s doctor_id=%s\n",
		ep.ID, ep.ClinicID, ep.DoctorID)

	// STEP 2: Commit episode — ONLY episode in this transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("STEP2 Commit failed: %w | episode_id=%s", err, ep.ID)
	}
	fmt.Printf("[CreateEpisodeEx] STEP2 OK: committed episode id=%s\n", ep.ID)

	// STEP 3: Best-effort audit log (outside transaction — MUST NOT rollback episode)
	// audit_logs columns: id, user_id, action, table_name, record_id, old_data, new_data, ip_address, user_agent, clinic_id, branch_id, created_at
	if input.CreatedBy != nil {
		_, err := w.Pool.Exec(ctx, `
			INSERT INTO audit_logs (id, user_id, action, table_name, record_id, new_data, clinic_id, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`, uuid.New(), input.CreatedBy, "EPISODE_CREATED", "episodes", ep.ID,
			mustMarshalJSON(map[string]interface{}{
				"patient_id": input.PatientID.String(),
				"doctor_id":  input.DoctorID.String(),
			}), input.ClinicID, time.Now())
		if err != nil {
			// Best-effort only — warn but do NOT fail. Episode is already committed.
			fmt.Printf("[CreateEpisodeEx] WARNING audit log failed (episode already committed): %v | episode_id=%s\n",
				err, ep.ID)
		} else {
			fmt.Printf("[CreateEpisodeEx] STEP3 OK: audit log written\n")
		}
	} else {
		fmt.Printf("[CreateEpisodeEx] STEP3 SKIP: no user_id for audit log\n")
	}

	return &ep, nil
}

// UpdateEpisode - Update episode
func (w *PoolWrapper) UpdateEpisodeEx(ctx context.Context, episodeID string, input UpdateEpisodeInput) error {
	query := `
		UPDATE episodes SET
			title = COALESCE(NULLIF($2, ''), title),
			conclusion = COALESCE(NULLIF($3, ''), conclusion),
			updated_by = $4,
			updated_at = NOW()
		WHERE id = $1
	`
	_, err := w.Pool.Exec(ctx, query, episodeID, input.Title, input.Conclusion, input.UpdatedBy)
	return err
}

// CompleteEpisode - Complete episode
func (w *PoolWrapper) CompleteEpisode(ctx context.Context, episodeID string, conclusion string, completedBy *uuid.UUID) error {
	tx, err := w.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Update episode to completed
	_, err = tx.Exec(ctx, `
		UPDATE episodes SET status = 'completed', conclusion = $2, completed_at = NOW(), updated_at = NOW()
		WHERE id = $1
	`, episodeID, conclusion)
	if err != nil {
		return err
	}

	// If episode has an appointment_id, update appointment status to completed
	_, _ = tx.Exec(ctx, `
		UPDATE appointments SET status = 'completed', updated_at = NOW()
		WHERE id = (SELECT appointment_id FROM episodes WHERE id = $1 AND appointment_id IS NOT NULL)
	`, episodeID)

	// Create audit log
	_, _ = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, uuid.New(), completedBy, "EPISODE_COMPLETED", "episode", episodeID, mustMarshalJSON(map[string]interface{}{
		"conclusion": conclusion,
	}), time.Now())

	return tx.Commit(ctx)
}

// CancelEpisode - Cancel episode
func (w *PoolWrapper) CancelEpisode(ctx context.Context, episodeID string, reason string, cancelledBy *uuid.UUID) error {
	tx, err := w.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		UPDATE episodes SET status = 'cancelled', conclusion = $2, updated_at = NOW()
		WHERE id = $1
	`, episodeID, reason)
	if err != nil {
		return err
	}

	// Create audit log
	_, _ = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, uuid.New(), cancelledBy, "EPISODE_CANCELLED", "episode", episodeID, mustMarshalJSON(map[string]interface{}{
		"reason": reason,
	}), time.Now())

	return tx.Commit(ctx)
}

// GetEpisodeExamination - Get examination (encounter) for episode
// FIX: Use sql.NullString for nullable UUID columns to prevent scan errors on NULL values.
// Returns nil,nil only for sql.ErrNoRows or pgx.ErrNoRows. All other errors are returned.
func (w *PoolWrapper) GetEpisodeExamination(ctx context.Context, episodeID string) (*domain.Encounter, error) {
	query := `
		SELECT id, episode_id, appointment_id, doctor_id, visit_date, complaints, examination, notes, status, branch_id, created_at, updated_at,
			s.first_name || ' ' || s.last_name as doctor_name
		FROM encounters
		LEFT JOIN staff s ON encounters.doctor_id = s.id
		WHERE episode_id = $1
		ORDER BY visit_date DESC
		LIMIT 1
	`
	var enc domain.Encounter
	var doctorName sql.NullString
	// FIX: Use sql.NullString for nullable UUID columns (appointment_id, doctor_id, branch_id)
	var appointmentIDStr, doctorIDStr, branchIDStr sql.NullString
	var visitDate, createdAt, updatedAt time.Time
	var complaints, examination, notes, status sql.NullString
	err := w.Pool.QueryRow(ctx, query, episodeID).Scan(
		&enc.ID, &enc.EpisodeID, &appointmentIDStr, &doctorIDStr, &visitDate,
		&complaints, &examination, &notes, &status, &branchIDStr, &createdAt, &updatedAt,
		&doctorName,
	)
	if err != nil {
		// Return nil with no error when no examination found
		if err == sql.ErrNoRows {
			return nil, nil
		}
		// Also check pgx.ErrNoRows
		if strings.Contains(err.Error(), "no rows") {
			return nil, nil
		}
		// Return actual scan error for debugging
		return nil, fmt.Errorf("GetEpisodeExamination scan failed: %w | episode_id=%s", err, episodeID)
	}
	// Parse nullable UUID fields safely
	if appointmentIDStr.Valid {
		if u, err := uuid.Parse(appointmentIDStr.String); err == nil {
			enc.AppointmentID = &u
		}
	}
	if doctorIDStr.Valid {
		if u, err := uuid.Parse(doctorIDStr.String); err == nil {
			enc.DoctorID = u
		}
	}
	if branchIDStr.Valid {
		if u, err := uuid.Parse(branchIDStr.String); err == nil {
			enc.BranchID = &u
		}
	}
	enc.VisitDate = visitDate
	enc.CreatedAt = createdAt
	enc.UpdatedAt = updatedAt
	if complaints.Valid {
		enc.Complaints = complaints.String
	}
	if examination.Valid {
		enc.Examination = examination.String
	}
	if notes.Valid {
		enc.Notes = notes.String
	}
	if status.Valid {
		enc.Status = status.String
	}
	if doctorName.Valid {
		enc.DoctorName = doctorName.String
	}
	return &enc, nil
}

// CreateOrUpdateExamination - Create or update examination for episode
// FIX: Audit log moved OUTSIDE transaction to prevent rollback if audit fails.
// Clinical examination save is critical; audit is best-effort.
func (w *PoolWrapper) CreateOrUpdateExamination(ctx context.Context, input CreateExaminationInput) (*domain.Encounter, error) {
	tx, err := w.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("Begin tx failed: %w", err)
	}
	defer tx.Rollback(ctx)

	// Check if examination exists
	var existingID *uuid.UUID
	err = tx.QueryRow(ctx, `SELECT id FROM encounters WHERE episode_id = $1`, input.EpisodeID).Scan(&existingID)

	var enc domain.Encounter
	if err == sql.ErrNoRows || existingID == nil {
		// Create new examination
		query := `
			INSERT INTO encounters (id, episode_id, appointment_id, doctor_id, visit_date, complaints, examination, notes, status, branch_id, created_by)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			RETURNING id, episode_id, appointment_id, doctor_id, visit_date, complaints, examination, notes, status, branch_id, created_at, updated_at
		`
		err = tx.QueryRow(ctx, query,
			uuid.New(), input.EpisodeID, input.AppointmentID, input.DoctorID, input.VisitDate,
			input.Complaints, input.Examination, input.Notes, "in_progress", input.BranchID, input.CreatedBy,
		).Scan(
			&enc.ID, &enc.EpisodeID, &enc.AppointmentID, &enc.DoctorID, &enc.VisitDate,
			&enc.Complaints, &enc.Examination, &enc.Notes, &enc.Status, &enc.BranchID, &enc.CreatedAt, &enc.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("INSERT encounters failed: %w | episode_id=%s", err, input.EpisodeID)
		}
	} else {
		// Update existing examination
		query := `
			UPDATE encounters SET
				complaints = COALESCE(NULLIF($2, ''), complaints),
				examination = COALESCE(NULLIF($3, ''), examination),
				notes = COALESCE(NULLIF($4, ''), notes),
				updated_by = $5,
				updated_at = NOW()
			WHERE episode_id = $1
			RETURNING id, episode_id, appointment_id, doctor_id, visit_date, complaints, examination, notes, status, branch_id, created_at, updated_at
		`
		err = tx.QueryRow(ctx, query,
			input.EpisodeID, input.Complaints, input.Examination, input.Notes, input.CreatedBy,
		).Scan(
			&enc.ID, &enc.EpisodeID, &enc.AppointmentID, &enc.DoctorID, &enc.VisitDate,
			&enc.Complaints, &enc.Examination, &enc.Notes, &enc.Status, &enc.BranchID, &enc.CreatedAt, &enc.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("UPDATE encounters failed: %w | episode_id=%s", err, input.EpisodeID)
		}
	}

	// STEP 1: Commit encounter ONLY — no audit inside transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("Commit encounters failed: %w | encounter_id=%s", err, enc.ID)
	}

	// STEP 2: Best-effort audit log (outside transaction — MUST NOT rollback encounter)
	// Audit log failure is warning only. Encounter is already committed.
	_, auditErr := w.Pool.Exec(ctx, `
		INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, uuid.New(), input.CreatedBy, "EXAMINATION_COMPLETED", "encounter", enc.ID, mustMarshalJSON(map[string]interface{}{
		"episode_id": input.EpisodeID.String(),
	}), time.Now())
	if auditErr != nil {
		// Best-effort only — warn but do NOT fail. Encounter is already committed.
		fmt.Printf("[CreateOrUpdateExamination] WARNING audit log failed (encounter already committed): %v | encounter_id=%s\n",
			auditErr, enc.ID)
	}

	return &enc, nil
}

// GetEpisodeEncounters - Get all encounters for episode
func (w *PoolWrapper) GetEpisodeEncounters(ctx context.Context, episodeID string) ([]domain.Encounter, error) {
	query := `
		SELECT id, episode_id, appointment_id, doctor_id, visit_date, complaints, examination, notes, status, branch_id, created_at, updated_at,
			s.first_name || ' ' || s.last_name as doctor_name
		FROM encounters
		LEFT JOIN staff s ON encounters.doctor_id = s.id
		WHERE episode_id = $1
		ORDER BY visit_date DESC
	`
	rows, err := w.Pool.Query(ctx, query, episodeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var encounters []domain.Encounter
	for rows.Next() {
		var enc domain.Encounter
		var doctorName sql.NullString
		var appointmentID, branchID *uuid.UUID
		err := rows.Scan(
			&enc.ID, &enc.EpisodeID, &appointmentID, &enc.DoctorID, &enc.VisitDate,
			&enc.Complaints, &enc.Examination, &enc.Notes, &enc.Status, &branchID, &enc.CreatedAt, &enc.UpdatedAt,
			&doctorName,
		)
		if err != nil {
			return nil, err
		}
		enc.AppointmentID = appointmentID
		enc.BranchID = branchID
		if doctorName.Valid {
			enc.DoctorName = doctorName.String
		}
		encounters = append(encounters, enc)
	}
	return encounters, nil
}

// GetEpisodeVitals - Get latest vitals for episode
func (w *PoolWrapper) GetEpisodeVitals(ctx context.Context, episodeID string) (*domain.Vitals, error) {
	query := `
		SELECT id, episode_id,
			COALESCE(height, 0), COALESCE(weight, 0), COALESCE(temperature, 0),
			COALESCE(bp_systolic, 0), COALESCE(bp_diastolic, 0), COALESCE(pulse, 0),
			COALESCE(blood_sugar, 0), COALESCE(waist, 0),
			COALESCE(head_circumference, 0), COALESCE(chest_circumference, 0),
			comments, recorded_at, branch_id, created_at
		FROM vitals
		WHERE episode_id = $1
		ORDER BY recorded_at DESC
		LIMIT 1
	`
	var v domain.Vitals
	var comments sql.NullString
	var recordedAt, createdAt time.Time
	var branchID *uuid.UUID
	err := w.Pool.QueryRow(ctx, query, episodeID).Scan(
		&v.ID, &v.EpisodeID, &v.Height, &v.Weight, &v.Temperature,
		&v.BPSystolic, &v.BPDiastolic, &v.Pulse,
		&v.BloodSugar, &v.Waist, &v.HeadCircumference, &v.ChestCircumference,
		&comments, &recordedAt, &branchID, &createdAt,
	)
	if err != nil {
		// Return nil with no error when no vitals found
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	if comments.Valid {
		v.Comments = comments.String
	}
	v.RecordedAt = recordedAt
	v.CreatedAt = createdAt
	v.BranchID = branchID
	return &v, nil
}

// CreateOrUpdateVitals - Create or update vitals for episode
func (w *PoolWrapper) CreateOrUpdateVitals(ctx context.Context, input CreateVitalsInput) (*domain.Vitals, error) {
	tx, err := w.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Check if vitals exist
	var existingID *uuid.UUID
	err = tx.QueryRow(ctx, `SELECT id FROM vitals WHERE episode_id = $1`, input.EpisodeID).Scan(&existingID)

	var v domain.Vitals
	if err == sql.ErrNoRows || existingID == nil {
		// Create new vitals
		query := `
			INSERT INTO vitals (id, episode_id, height, weight, temperature, bp_systolic, bp_diastolic, pulse, blood_sugar,
				waist, head_circumference, chest_circumference, comments, recorded_at, branch_id, created_by)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
			RETURNING id, episode_id, height, weight, temperature, bp_systolic, bp_diastolic, pulse, blood_sugar,
				waist, head_circumference, chest_circumference, comments, recorded_at, branch_id, created_at
		`
		err = tx.QueryRow(ctx, query,
			uuid.New(), input.EpisodeID, input.Height, input.Weight, input.Temperature,
			input.BPSystolic, input.BPDiastolic, input.Pulse, input.BloodSugar,
			input.Waist, input.HeadCircumference, input.ChestCircumference,
			input.Comments, time.Now(), input.BranchID, input.CreatedBy,
		).Scan(
			&v.ID, &v.EpisodeID, &v.Height, &v.Weight, &v.Temperature, &v.BPSystolic, &v.BPDiastolic,
			&v.Pulse, &v.BloodSugar, &v.Waist, &v.HeadCircumference, &v.ChestCircumference,
			&v.Comments, &v.RecordedAt, &v.BranchID, &v.CreatedAt,
		)
	} else {
		// Update existing vitals
		query := `
			UPDATE vitals SET
				height = COALESCE($2, height), weight = COALESCE($3, weight), temperature = COALESCE($4, temperature),
				bp_systolic = COALESCE($5, bp_systolic), bp_diastolic = COALESCE($6, bp_diastolic),
				pulse = COALESCE($7, pulse), blood_sugar = COALESCE($8, blood_sugar),
				waist = COALESCE($9, waist), head_circumference = COALESCE($10, head_circumference),
				chest_circumference = COALESCE($11, chest_circumference), comments = COALESCE($12, comments),
				recorded_at = NOW(), updated_by = $13
			WHERE episode_id = $1
			RETURNING id, episode_id, height, weight, temperature, bp_systolic, bp_diastolic, pulse, blood_sugar,
				waist, head_circumference, chest_circumference, comments, recorded_at, branch_id, created_at
		`
		err = tx.QueryRow(ctx, query,
			input.EpisodeID, input.Height, input.Weight, input.Temperature,
			input.BPSystolic, input.BPDiastolic, input.Pulse, input.BloodSugar,
			input.Waist, input.HeadCircumference, input.ChestCircumference,
			input.Comments, input.CreatedBy,
		).Scan(
			&v.ID, &v.EpisodeID, &v.Height, &v.Weight, &v.Temperature, &v.BPSystolic, &v.BPDiastolic,
			&v.Pulse, &v.BloodSugar, &v.Waist, &v.HeadCircumference, &v.ChestCircumference,
			&v.Comments, &v.RecordedAt, &v.BranchID, &v.CreatedAt,
		)
	}
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &v, nil
}

// GetPatientVitalsHistory - Get all vitals records for a patient across all episodes (newest first)
func (w *PoolWrapper) GetPatientVitalsHistory(ctx context.Context, patientID string, limit int) ([]VitalsWithEpisode, error) {
	query := `
		SELECT v.id, v.episode_id, v.height, v.weight, v.temperature, v.bp_systolic, v.bp_diastolic,
			v.pulse, v.blood_sugar, v.waist, v.head_circumference, v.chest_circumference,
			v.comments, v.recorded_at, v.branch_id, v.created_at,
			e.id, e.title, e.status, e.started_at,
			s.first_name || ' ' || s.last_name as doctor_name
		FROM vitals v
		JOIN episodes e ON v.episode_id = e.id
		LEFT JOIN staff s ON e.doctor_id = s.id
		WHERE e.patient_id = $1
		ORDER BY v.recorded_at DESC
		LIMIT $2
	`
	rows, err := w.Pool.Query(ctx, query, patientID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []VitalsWithEpisode
	for rows.Next() {
		var v VitalsWithEpisode
		var height, weight, temperature, bloodSugar, waist, headCirc, chestCirc sql.NullFloat64
		var bpSystolic, bpDiastolic, pulse sql.NullInt32
		var comments sql.NullString
		var recordedAt, createdAt time.Time
		var branchID *uuid.UUID
		var episodeID uuid.UUID
		var episodeTitle, episodeStatus sql.NullString
		var episodeStartedAt sql.NullTime
		var doctorName sql.NullString

		err := rows.Scan(
			&v.ID, &episodeID, &height, &weight, &temperature, &bpSystolic, &bpDiastolic,
			&pulse, &bloodSugar, &waist, &headCirc, &chestCirc,
			&comments, &recordedAt, &branchID, &createdAt,
			&episodeID, &episodeTitle, &episodeStatus, &episodeStartedAt,
			&doctorName,
		)
		if err != nil {
			return nil, err
		}

		// Set nullable numeric fields
		v.EpisodeID = episodeID
		if height.Valid {
			v.Height = &height.Float64
		}
		if weight.Valid {
			v.Weight = &weight.Float64
		}
		if temperature.Valid {
			v.Temperature = &temperature.Float64
		}
		if bpSystolic.Valid {
			bp := int(bpSystolic.Int32)
			v.BPSystolic = &bp
		}
		if bpDiastolic.Valid {
			bpd := int(bpDiastolic.Int32)
			v.BPDiastolic = &bpd
		}
		if pulse.Valid {
			pl := int(pulse.Int32)
			v.Pulse = &pl
		}
		if bloodSugar.Valid {
			v.BloodSugar = &bloodSugar.Float64
		}
		if waist.Valid {
			v.Waist = &waist.Float64
		}
		if headCirc.Valid {
			v.HeadCircumference = &headCirc.Float64
		}
		if chestCirc.Valid {
			v.ChestCircumference = &chestCirc.Float64
		}
		if comments.Valid {
			v.Comments = &comments.String
		}
		v.RecordedAt = recordedAt
		v.CreatedAt = createdAt
		v.BranchID = branchID
		// Episode context
		if episodeTitle.Valid {
			v.EpisodeTitle = episodeTitle.String
		}
		if episodeStatus.Valid {
			v.EpisodeStatus = episodeStatus.String
		}
		if episodeStartedAt.Valid {
			v.EpisodeStartedAt = episodeStartedAt.Time
		}
		if doctorName.Valid {
			v.DoctorName = doctorName.String
		}
		results = append(results, v)
	}
	return results, nil
}

// VitalsWithEpisode includes episode context for history display
type VitalsWithEpisode struct {
	ID                 uuid.UUID  `json:"id"`
	EpisodeID          uuid.UUID  `json:"episode_id"`
	Height             *float64  `json:"height"`
	Weight             *float64  `json:"weight"`
	Temperature        *float64  `json:"temperature"`
	BPSystolic         *int      `json:"bp_systolic"`
	BPDiastolic        *int      `json:"bp_diastolic"`
	Pulse              *int      `json:"pulse"`
	BloodSugar         *float64  `json:"blood_sugar"`
	Waist              *float64  `json:"waist"`
	HeadCircumference  *float64  `json:"head_circumference"`
	ChestCircumference *float64  `json:"chest_circumference"`
	Comments           *string   `json:"comments"`
	RecordedAt         time.Time `json:"recorded_at"`
	CreatedAt          time.Time `json:"created_at"`
	BranchID           *uuid.UUID `json:"branch_id,omitempty"`
	// Episode context
	EpisodeTitle    string    `json:"episode_title"`
	EpisodeStatus   string    `json:"episode_status"`
	EpisodeStartedAt time.Time `json:"episode_started_at"`
	DoctorName      string    `json:"doctor_name"`
}

// GetEpisodeDiagnoses - Get diagnoses for episode
func (w *PoolWrapper) GetEpisodeDiagnoses(ctx context.Context, episodeID string) ([]domain.Diagnosis, error) {
	query := `
		SELECT id, episode_id, icd_code, icd_name, type, status, notes, branch_id, created_at
		FROM diagnoses WHERE episode_id = $1
		ORDER BY created_at ASC
	`
	rows, err := w.Pool.Query(ctx, query, episodeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var diagnoses []domain.Diagnosis
	for rows.Next() {
		var d domain.Diagnosis
		var icdCode, icdName, diagType, status sql.NullString
		var notes sql.NullString
		var branchID *uuid.UUID
		var createdAt time.Time
		err := rows.Scan(&d.ID, &d.EpisodeID, &icdCode, &icdName, &diagType, &status, &notes, &branchID, &createdAt)
		if err != nil {
			return nil, err
		}
		if icdCode.Valid {
			d.ICDCode = icdCode.String
		}
		if icdName.Valid {
			d.ICDName = icdName.String
		}
		if diagType.Valid {
			d.Type = diagType.String
		}
		if status.Valid {
			d.Status = status.String
		}
		if notes.Valid {
			d.Notes = notes.String
		}
		d.BranchID = branchID
		d.CreatedAt = createdAt
		diagnoses = append(diagnoses, d)
	}
	return diagnoses, nil
}

// CreateDiagnosis - Create diagnosis for episode
func (w *PoolWrapper) CreateDiagnosisEx(ctx context.Context, input CreateDiagnosisInput) (*domain.Diagnosis, error) {
	tx, err := w.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO diagnoses (id, episode_id, icd_code, icd_name, type, status, notes, branch_id, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, episode_id, icd_code, icd_name, type, status, notes, branch_id, created_at
	`
	var d domain.Diagnosis
	var branchID *uuid.UUID
	err = tx.QueryRow(ctx, query,
		uuid.New(), input.EpisodeID, input.ICDCode, input.ICDName, input.Type, input.Status, input.Notes, input.BranchID, input.CreatedBy,
	).Scan(&d.ID, &d.EpisodeID, &d.ICDCode, &d.ICDName, &d.Type, &d.Status, &d.Notes, &branchID, &d.CreatedAt)
	if err != nil {
		return nil, err
	}
	d.BranchID = branchID

	// Create audit log
	_, _ = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, uuid.New(), input.CreatedBy, "DIAGNOSIS_ADDED", "diagnosis", d.ID, mustMarshalJSON(map[string]interface{}{
		"episode_id": input.EpisodeID.String(),
		"icd_code":  input.ICDCode,
		"icd_name":   input.ICDName,
	}), time.Now())

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &d, nil
}

// UpdateDiagnosis - Update diagnosis
func (w *PoolWrapper) UpdateDiagnosis(ctx context.Context, diagnosisID string, input UpdateDiagnosisInput) error {
	query := `
		UPDATE diagnoses SET
			icd_code = COALESCE(NULLIF($2, ''), icd_code),
			icd_name = COALESCE(NULLIF($3, ''), icd_name),
			type = COALESCE(NULLIF($4, ''), type),
			status = COALESCE(NULLIF($5, ''), status),
			notes = COALESCE(NULLIF($6, ''), notes),
			updated_by = $7
		WHERE id = $1
	`
	_, err := w.Pool.Exec(ctx, query, diagnosisID, input.ICDCode, input.ICDName, input.Type, input.Status, input.Notes, input.UpdatedBy)
	return err
}

// DeleteDiagnosis - Delete diagnosis
func (w *PoolWrapper) DeleteDiagnosis(ctx context.Context, diagnosisID string) error {
	_, err := w.Pool.Exec(ctx, `DELETE FROM diagnoses WHERE id = $1`, diagnosisID)
	return err
}

// GetEpisodeRecommendations - Get recommendations for episode
func (w *PoolWrapper) GetEpisodeRecommendations(ctx context.Context, episodeID string) ([]domain.Recommendation, error) {
	query := `
		SELECT r.id, r.episode_id, r.type, r.service_id, r.description, r.instructions, r.status, r.branch_id, r.created_at,
			s.name as service_name
		FROM recommendations r
		LEFT JOIN services s ON r.service_id = s.id
		WHERE r.episode_id = $1
		ORDER BY r.created_at ASC
	`
	rows, err := w.Pool.Query(ctx, query, episodeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var recs []domain.Recommendation
	for rows.Next() {
		var r domain.Recommendation
		var branchID, serviceID *uuid.UUID
		var serviceName sql.NullString
		err := rows.Scan(&r.ID, &r.EpisodeID, &r.Type, &serviceID, &r.Description, &r.Instructions, &r.Status, &branchID, &r.CreatedAt, &serviceName)
		if err != nil {
			return nil, err
		}
		r.ServiceID = serviceID
		r.BranchID = branchID
		if serviceName.Valid {
			r.ServiceName = serviceName.String
		}
		recs = append(recs, r)
	}
	return recs, nil
}

// CreateRecommendation - Create recommendation for episode
func (w *PoolWrapper) CreateRecommendationEx(ctx context.Context, input CreateRecommendationInput) (*domain.Recommendation, error) {
	query := `
		INSERT INTO recommendations (id, episode_id, type, service_id, description, instructions, status, branch_id, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, episode_id, type, service_id, description, instructions, status, branch_id, created_at
	`
	var r domain.Recommendation
	var branchID, serviceID *uuid.UUID
	err := w.Pool.QueryRow(ctx, query,
		uuid.New(), input.EpisodeID, input.Type, input.ServiceID, input.Description, input.Instructions, "pending", input.BranchID, input.CreatedBy,
	).Scan(&r.ID, &r.EpisodeID, &r.Type, &serviceID, &r.Description, &r.Instructions, &r.Status, &branchID, &r.CreatedAt)
	if err != nil {
		return nil, err
	}
	r.ServiceID = serviceID
	r.BranchID = branchID
	return &r, nil
}

// GetEpisodeFiles - Get files for episode
func (w *PoolWrapper) GetEpisodeFiles(ctx context.Context, episodeID string) ([]domain.EpisodeFile, error) {
	query := `
		SELECT id, episode_id, name, file_type, file_path, file_size, uploaded_by, branch_id, created_at
		FROM episode_files WHERE episode_id = $1
		ORDER BY created_at DESC
	`
	rows, err := w.Pool.Query(ctx, query, episodeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []domain.EpisodeFile
	for rows.Next() {
		var f domain.EpisodeFile
		var branchID, uploadedBy *uuid.UUID
		err := rows.Scan(&f.ID, &f.EpisodeID, &f.Name, &f.FileType, &f.FilePath, &f.FileSize, &uploadedBy, &branchID, &f.CreatedAt)
		if err != nil {
			return nil, err
		}
		f.UploadedBy = *uploadedBy
		f.BranchID = branchID
		files = append(files, f)
	}
	return files, nil
}

// CreateEpisodeFile - Create file record for episode
func (w *PoolWrapper) CreateEpisodeFile(ctx context.Context, input CreateEpisodeFileInput) (*domain.EpisodeFile, error) {
	query := `
		INSERT INTO episode_files (id, episode_id, name, file_type, file_path, file_size, uploaded_by, branch_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, episode_id, name, file_type, file_path, file_size, uploaded_by, branch_id, created_at
	`
	var f domain.EpisodeFile
	var branchID, uploadedBy *uuid.UUID
	err := w.Pool.QueryRow(ctx, query,
		uuid.New(), input.EpisodeID, input.Name, input.FileType, input.FilePath, input.FileSize, input.UploadedBy, input.BranchID,
	).Scan(&f.ID, &f.EpisodeID, &f.Name, &f.FileType, &f.FilePath, &f.FileSize, &uploadedBy, &branchID, &f.CreatedAt)
	if err != nil {
		return nil, err
	}
	f.UploadedBy = *uploadedBy
	f.BranchID = branchID
	return &f, nil
}

// SearchICD10 - Search ICD-10 codes
func (w *PoolWrapper) SearchICD10(ctx context.Context, query string, limit int) ([]domain.ICD10, error) {
	searchQuery := `
		SELECT id, code, name, parent_id, level
		FROM icd10
		WHERE code ILIKE $1 OR name ILIKE $1
		ORDER BY code
		LIMIT $2
	`
	rows, err := w.Pool.Query(ctx, searchQuery, "%"+query+"%", limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var codes []domain.ICD10
	for rows.Next() {
		var c domain.ICD10
		var parentID *uuid.UUID
		err := rows.Scan(&c.ID, &c.Code, &c.Name, &parentID, &c.Level)
		if err != nil {
			return nil, err
		}
		c.ParentID = parentID
		codes = append(codes, c)
	}
	return codes, nil
}

// ==================== INPUT STRUCTURES ====================

type CreateMedicalCardInput struct {
	ClinicID         uuid.UUID
	PatientID       uuid.UUID
	BloodType       string
	RHFactor        string
	Allergies       string
	ChronicConditions string
	FamilyHistory   string
	CreatedBy       *uuid.UUID
}

type UpdateMedicalCardInput struct {
	BloodType       *string
	RHFactor        *string
	Allergies       *string
	ChronicConditions *string
	FamilyHistory   *string
	UpdatedBy       *uuid.UUID
}

type CreateEpisodeInput struct {
	ClinicID         uuid.UUID
	BranchID         *uuid.UUID
	PatientID        uuid.UUID
	DoctorID         uuid.UUID
	ReferralDoctorID *uuid.UUID
	Title            string
	TemplateID       *uuid.UUID
	AppointmentID    *uuid.UUID
	CreatedBy        *uuid.UUID
}

type UpdateEpisodeInput struct {
	Title       *string
	Conclusion  *string
	UpdatedBy   *uuid.UUID
}

type CreateExaminationInput struct {
	EpisodeID     uuid.UUID
	AppointmentID *uuid.UUID
	DoctorID     uuid.UUID
	BranchID     *uuid.UUID
	VisitDate    time.Time
	Complaints   string
	Examination  string
	Notes        string
	CreatedBy    *uuid.UUID
}

type CreateVitalsInput struct {
	EpisodeID          uuid.UUID
	Height             *float64
	Weight             *float64
	Temperature        *float64
	BPSystolic         *int
	BPDiastolic        *int
	Pulse              *int
	BloodSugar         *float64
	Waist              *float64
	HeadCircumference  *float64
	ChestCircumference *float64
	Comments           *string
	BranchID           *uuid.UUID
	CreatedBy          *uuid.UUID
}

type CreateDiagnosisInput struct {
	EpisodeID  uuid.UUID
	ICDCode    string
	ICDName    string
	Type       string // main, сопутствующий, осложнение
	Status     string
	Notes      string
	BranchID   *uuid.UUID
	CreatedBy  *uuid.UUID
}

type UpdateDiagnosisInput struct {
	ICDCode    *string
	ICDName    *string
	Type       *string
	Status     *string
	Notes      *string
	UpdatedBy  *uuid.UUID
}

type CreateRecommendationInput struct {
	EpisodeID    uuid.UUID
	Type         string // анализы, процедуры, консультации, медикаменты, образ_жизни
	ServiceID    *uuid.UUID
	Description  string
	Instructions string
	BranchID     *uuid.UUID
	CreatedBy    *uuid.UUID
}

type CreateEpisodeFileInput struct {
	EpisodeID  uuid.UUID
	Name       string
	FileType   string
	FilePath   string
	FileSize   int
	UploadedBy *uuid.UUID
	BranchID   *uuid.UUID
}
