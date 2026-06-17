package postgres

/**
 * AMIS - Audit Log Repository
 * REAL BUSINESS LOGIC - Audit trail for all actions
 */

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuditRepository struct {
	db *pgxpool.Pool
}

func NewAuditRepository(db *pgxpool.Pool) *AuditRepository {
	return &AuditRepository{db: db}
}

// AuditLog model
type AuditLog struct {
	ID         uuid.UUID              `json:"id"`
	ClinicID   *uuid.UUID             `json:"clinic_id,omitempty"`
	BranchID   *uuid.UUID             `json:"branch_id,omitempty"`
	UserID     *uuid.UUID             `json:"user_id,omitempty"`
	Action     string                 `json:"action"`
	EntityType string                 `json:"entity_type"`
	EntityID   *uuid.UUID            `json:"entity_id,omitempty"`
	Details    map[string]interface{} `json:"details,omitempty"`
	IPAddress  string                 `json:"ip_address,omitempty"`
	CreatedAt  time.Time             `json:"created_at"`
}

// LogAction - Log an action
func (r *AuditRepository) LogAction(ctx context.Context, input AuditLogInput) error {
	query := `
		INSERT INTO audit_logs (
			id, clinic_id, branch_id, user_id, action, entity_type, entity_id, details, ip_address, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	detailsJSON, err := json.Marshal(input.Details)
	if err != nil {
		detailsJSON = []byte("{}")
	}

	_, err = r.db.Exec(ctx, query,
		uuid.New(), input.ClinicID, input.BranchID, input.UserID,
		input.Action, input.EntityType, input.EntityID,
		detailsJSON, input.IPAddress, time.Now(),
	)

	return err
}

// AuditLogInput - Input for creating audit log
type AuditLogInput struct {
	ClinicID   *uuid.UUID
	BranchID   *uuid.UUID
	UserID     *uuid.UUID
	Action     string
	EntityType string
	EntityID   *uuid.UUID
	Details    map[string]interface{}
	IPAddress  string
}

// Predefined action constants
const (
	ActionPatientCreated     = "PATIENT_CREATED"
	ActionPatientUpdated     = "PATIENT_UPDATED"
	ActionPatientDeleted     = "PATIENT_DELETED"
	ActionAppointmentCreated = "APPOINTMENT_CREATED"
	ActionAppointmentUpdated = "APPOINTMENT_UPDATED"
	ActionAppointmentCancelled = "APPOINTMENT_CANCELLED"
	ActionInvoiceCreated     = "INVOICE_CREATED"
	ActionPaymentReceived    = "PAYMENT_RECEIVED"
	ActionQueueEntryCreated  = "QUEUE_ENTRY_CREATED"
	ActionQueueEntryCalled   = "QUEUE_ENTRY_CALLED"
)

// Entity type constants
const (
	EntityPatient     = "patient"
	EntityAppointment = "appointment"
	EntityInvoice     = "invoice"
	EntityPayment     = "payment"
	EntityQueueEntry  = "queue_entry"
)