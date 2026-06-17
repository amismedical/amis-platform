package postgres

/**
 * AMIS - Queue Repository
 * REAL BUSINESS LOGIC - Queue with auto-generated queue numbers
 */

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type QueueRepository struct {
	db *pgxpool.Pool
}

func NewQueueRepository(db *pgxpool.Pool) *QueueRepository {
	return &QueueRepository{db: db}
}

// QueueEntry model
type QueueEntry struct {
	ID            uuid.UUID  `json:"id"`
	QueueID       uuid.UUID  `json:"queue_id"`
	ClinicID      uuid.UUID  `json:"clinic_id"`
	BranchID      *uuid.UUID `json:"branch_id,omitempty"`
	PatientID     uuid.UUID  `json:"patient_id"`
	AppointmentID *uuid.UUID `json:"appointment_id,omitempty"`
	QueueNumber   int        `json:"queue_number"` // Q-001, Q-002, etc.
	Status        string     `json:"status"`       // waiting, called, completed, cancelled
	RegisteredAt  time.Time  `json:"registered_at"`
	CalledAt      *time.Time `json:"called_at,omitempty"`
	Cabinet       string     `json:"cabinet"`
	DoctorID      *uuid.UUID `json:"doctor_id,omitempty"`
	CreatedBy     *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`

	// Joined data
	PatientName     string `json:"patient_name,omitempty"`
	DoctorName      string `json:"doctor_name,omitempty"`
	AppointmentTime string `json:"appointment_time,omitempty"`
}

// CreateQueueEntryInput - Input for creating queue entry
type CreateQueueEntryInput struct {
	QueueID       uuid.UUID
	ClinicID      uuid.UUID
	BranchID      *uuid.UUID
	PatientID     uuid.UUID
	AppointmentID *uuid.UUID
	DoctorID      *uuid.UUID
	Cabinet       string
	CreatedBy     *uuid.UUID
}

// GetNextQueueNumber - Get next queue number for a queue on a specific date
func (r *QueueRepository) getNextQueueNumber(ctx context.Context, queueID uuid.UUID, date time.Time) (int, error) {
	today := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())

	// Try to update existing record
	updateQuery := `
		INSERT INTO queue_daily_numbers (id, queue_id, queue_date, last_number)
		VALUES (gen_random_uuid(), $1, $2, 1)
		ON CONFLICT (queue_id, queue_date)
		DO UPDATE SET last_number = queue_daily_numbers.last_number + 1
		RETURNING last_number
	`

	var newNumber int
	err := r.db.QueryRow(ctx, updateQuery, queueID, today).Scan(&newNumber)
	if err != nil {
		return 0, fmt.Errorf("ошибка генерации номера очереди: %w", err)
	}

	return newNumber, nil
}

// Create - Create new queue entry
func (r *QueueRepository) Create(ctx context.Context, input CreateQueueEntryInput) (*QueueEntry, error) {
	// Generate queue number
	queueNumber, err := r.getNextQueueNumber(ctx, input.QueueID, time.Now())
	if err != nil {
		return nil, err
	}

	entry := &QueueEntry{
		ID:            uuid.New(),
		QueueID:       input.QueueID,
		ClinicID:      input.ClinicID,
		BranchID:      input.BranchID,
		PatientID:     input.PatientID,
		AppointmentID: input.AppointmentID,
		QueueNumber:   queueNumber,
		Status:        "waiting",
		RegisteredAt:  time.Now(),
		Cabinet:       input.Cabinet,
		DoctorID:      input.DoctorID,
		CreatedBy:     input.CreatedBy,
		CreatedAt:     time.Now(),
	}

	query := `
		INSERT INTO queue_entries (
			id, queue_id, clinic_id, branch_id, patient_id, appointment_id,
			queue_number, status, registered_at, cabinet, doctor_id, created_by, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id
	`

	err = r.db.QueryRow(ctx, query,
		entry.ID, entry.QueueID, entry.ClinicID, entry.BranchID,
		entry.PatientID, entry.AppointmentID, entry.QueueNumber,
		entry.Status, entry.RegisteredAt, entry.Cabinet,
		entry.DoctorID, entry.CreatedBy, entry.CreatedAt,
	).Scan(&entry.ID)

	if err != nil {
		return nil, fmt.Errorf("ошибка создания записи очереди: %w", err)
	}

	return entry, nil
}

// GetByID - Get queue entry by ID
func (r *QueueRepository) GetByID(ctx context.Context, id uuid.UUID) (*QueueEntry, error) {
	query := `
		SELECT qe.id, qe.queue_id, qe.clinic_id, qe.branch_id, qe.patient_id,
			qe.appointment_id, qe.queue_number, qe.status, qe.registered_at,
			qe.called_at, qe.cabinet, qe.doctor_id, qe.created_by, qe.created_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as doctor_name,
			a.start_time as appointment_time
		FROM queue_entries qe
		LEFT JOIN patients p ON qe.patient_id = p.id
		LEFT JOIN staff s ON qe.doctor_id = s.id
		LEFT JOIN appointments a ON qe.appointment_id = a.id
		WHERE qe.id = $1
	`

	entry := &QueueEntry{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&entry.ID, &entry.QueueID, &entry.ClinicID, &entry.BranchID,
		&entry.PatientID, &entry.AppointmentID, &entry.QueueNumber,
		&entry.Status, &entry.RegisteredAt, &entry.CalledAt,
		&entry.Cabinet, &entry.DoctorID, &entry.CreatedBy, &entry.CreatedAt,
		&entry.PatientName, &entry.DoctorName, &entry.AppointmentTime,
	)
	if err != nil {
		return nil, err
	}

	return entry, nil
}

// GetWaitingList - Get waiting entries for a queue
func (r *QueueRepository) GetWaitingList(ctx context.Context, queueID uuid.UUID) ([]QueueEntry, error) {
	query := `
		SELECT qe.id, qe.queue_id, qe.clinic_id, qe.branch_id, qe.patient_id,
			qe.appointment_id, qe.queue_number, qe.status, qe.registered_at,
			qe.called_at, qe.cabinet, qe.doctor_id, qe.created_by, qe.created_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as doctor_name,
			a.start_time as appointment_time
		FROM queue_entries qe
		LEFT JOIN patients p ON qe.patient_id = p.id
		LEFT JOIN staff s ON qe.doctor_id = s.id
		LEFT JOIN appointments a ON qe.appointment_id = a.id
		WHERE qe.queue_id = $1 AND qe.status = 'waiting'
		ORDER BY qe.queue_number ASC
	`

	rows, err := r.db.Query(ctx, query, queueID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []QueueEntry
	for rows.Next() {
		e := QueueEntry{}
		err := rows.Scan(
			&e.ID, &e.QueueID, &e.ClinicID, &e.BranchID,
			&e.PatientID, &e.AppointmentID, &e.QueueNumber,
			&e.Status, &e.RegisteredAt, &e.CalledAt,
			&e.Cabinet, &e.DoctorID, &e.CreatedBy, &e.CreatedAt,
			&e.PatientName, &e.DoctorName, &e.AppointmentTime,
		)
		if err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}

	return entries, nil
}

// GetCalledPatient - Get currently called patient
func (r *QueueRepository) GetCalledPatient(ctx context.Context, queueID uuid.UUID) (*QueueEntry, error) {
	query := `
		SELECT qe.id, qe.queue_id, qe.clinic_id, qe.branch_id, qe.patient_id,
			qe.appointment_id, qe.queue_number, qe.status, qe.registered_at,
			qe.called_at, qe.cabinet, qe.doctor_id, qe.created_by, qe.created_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as doctor_name,
			a.start_time as appointment_time
		FROM queue_entries qe
		LEFT JOIN patients p ON qe.patient_id = p.id
		LEFT JOIN staff s ON qe.doctor_id = s.id
		LEFT JOIN appointments a ON qe.appointment_id = a.id
		WHERE qe.queue_id = $1 AND qe.status = 'called'
		ORDER BY qe.called_at DESC
		LIMIT 1
	`

	entry := &QueueEntry{}
	err := r.db.QueryRow(ctx, query, queueID).Scan(
		&entry.ID, &entry.QueueID, &entry.ClinicID, &entry.BranchID,
		&entry.PatientID, &entry.AppointmentID, &entry.QueueNumber,
		&entry.Status, &entry.RegisteredAt, &entry.CalledAt,
		&entry.Cabinet, &entry.DoctorID, &entry.CreatedBy, &entry.CreatedAt,
		&entry.PatientName, &entry.DoctorName, &entry.AppointmentTime,
	)
	if err != nil {
		return nil, err
	}

	return entry, nil
}

// CallNext - Call next patient in queue
func (r *QueueRepository) CallNext(ctx context.Context, queueID uuid.UUID, doctorID uuid.UUID, cabinet string) (*QueueEntry, error) {
	// First, mark current called as completed
	completeQuery := `
		UPDATE queue_entries
		SET status = 'completed'
		WHERE queue_id = $1 AND status = 'called'
	`
	r.db.Exec(ctx, completeQuery, queueID)

	// Get next waiting entry
	var entryID uuid.UUID
	query := `
		SELECT id FROM queue_entries
		WHERE queue_id = $1 AND status = 'waiting'
		ORDER BY queue_number ASC
		LIMIT 1
	`
	err := r.db.QueryRow(ctx, query, queueID).Scan(&entryID)
	if err != nil {
		return nil, fmt.Errorf("в очереди нет пациентов")
	}

	// Update to called status
	now := time.Now()
	updateQuery := `
		UPDATE queue_entries
		SET status = 'called', called_at = $2, doctor_id = $3, cabinet = $4
		WHERE id = $1
		RETURNING id
	`
	_, err = r.db.Exec(ctx, updateQuery, entryID, now, doctorID, cabinet)
	if err != nil {
		return nil, err
	}

	return r.GetByID(ctx, entryID)
}

// Complete - Mark entry as completed
func (r *QueueRepository) Complete(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE queue_entries SET status = 'completed' WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

// GetPatientQueueEntries - Get queue entries for a patient
func (r *QueueRepository) GetPatientQueueEntries(ctx context.Context, patientID uuid.UUID) ([]QueueEntry, error) {
	query := `
		SELECT qe.id, qe.queue_id, qe.clinic_id, qe.branch_id, qe.patient_id,
			qe.appointment_id, qe.queue_number, qe.status, qe.registered_at,
			qe.called_at, qe.cabinet, qe.doctor_id, qe.created_by, qe.created_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as doctor_name,
			a.start_time as appointment_time
		FROM queue_entries qe
		LEFT JOIN patients p ON qe.patient_id = p.id
		LEFT JOIN staff s ON qe.doctor_id = s.id
		LEFT JOIN appointments a ON qe.appointment_id = a.id
		WHERE qe.patient_id = $1
		ORDER BY qe.registered_at DESC
	`

	rows, err := r.db.Query(ctx, query, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []QueueEntry
	for rows.Next() {
		e := QueueEntry{}
		err := rows.Scan(
			&e.ID, &e.QueueID, &e.ClinicID, &e.BranchID,
			&e.PatientID, &e.AppointmentID, &e.QueueNumber,
			&e.Status, &e.RegisteredAt, &e.CalledAt,
			&e.Cabinet, &e.DoctorID, &e.CreatedBy, &e.CreatedAt,
			&e.PatientName, &e.DoctorName, &e.AppointmentTime,
		)
		if err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}

	return entries, nil
}