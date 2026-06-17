package postgres

/**
 * AMIS - Invoice Repository
 * REAL BUSINESS LOGIC - Invoice creation for appointments
 */

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InvoiceRepository struct {
	db *pgxpool.Pool
}

func NewInvoiceRepository(db *pgxpool.Pool) *InvoiceRepository {
	return &InvoiceRepository{db: db}
}

// Invoice model
type Invoice struct {
	ID             uuid.UUID       `json:"id"`
	PatientID      uuid.UUID       `json:"patient_id"`
	ClinicID       uuid.UUID       `json:"clinic_id"`
	TotalAmount    float64         `json:"total_amount"`
	DiscountAmount float64         `json:"discount_amount"`
	PaidAmount     float64         `json:"paid_amount"`
	Status         string          `json:"status"` // open, partially_paid, paid, cancelled
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`

	// Joined
	PatientName string         `json:"patient_name,omitempty"`
	Items       []InvoiceItem  `json:"items,omitempty"`
}

// InvoiceItem model
type InvoiceItem struct {
	ID          uuid.UUID `json:"id"`
	InvoiceID   uuid.UUID `json:"invoice_id"`
	ServiceID   uuid.UUID `json:"service_id"`
	ServiceName string    `json:"service_name"`
	Quantity    int       `json:"quantity"`
	UnitPrice   float64   `json:"unit_price"`
	Discount    float64   `json:"discount"`
	TotalPrice  float64   `json:"total_price"`
}

// CreateInvoiceInput - Input for creating invoice
type CreateInvoiceInput struct {
	PatientID      uuid.UUID
	ClinicID       uuid.UUID
	Items          []CreateInvoiceItemInput
	DiscountAmount float64
	CreatedBy      *uuid.UUID
}

// CreateInvoiceItemInput - Item input
type CreateInvoiceItemInput struct {
	ServiceID   uuid.UUID
	ServiceName string
	Quantity    int
	UnitPrice   float64
	Discount    float64
}

// Create - Create new invoice with items
func (r *InvoiceRepository) Create(ctx context.Context, input CreateInvoiceInput) (*Invoice, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Calculate total
	var totalAmount float64
	for _, item := range input.Items {
		itemTotal := float64(item.Quantity) * item.UnitPrice * (1 - item.Discount/100)
		totalAmount += itemTotal
	}

	// Create invoice
	invoice := &Invoice{
		ID:             uuid.New(),
		PatientID:      input.PatientID,
		ClinicID:       input.ClinicID,
		TotalAmount:    totalAmount - input.DiscountAmount,
		DiscountAmount: input.DiscountAmount,
		PaidAmount:     0,
		Status:         "open",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	invoiceQuery := `
		INSERT INTO invoices (id, patient_id, clinic_id, total_amount, discount_amount, paid_amount, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`
	_, err = tx.Exec(ctx, invoiceQuery,
		invoice.ID, invoice.PatientID, invoice.ClinicID,
		invoice.TotalAmount, invoice.DiscountAmount, invoice.PaidAmount,
		invoice.Status, invoice.CreatedAt, invoice.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Create invoice items
	for _, item := range input.Items {
		itemTotal := float64(item.Quantity) * item.UnitPrice * (1 - item.Discount/100)
		itemQuery := `
			INSERT INTO invoice_items (id, invoice_id, service_id, service_name, quantity, unit_price, discount, total_price)
			VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
		`
		_, err = tx.Exec(ctx, itemQuery,
			invoice.ID, item.ServiceID, item.ServiceName,
			item.Quantity, item.UnitPrice, item.Discount, itemTotal,
		)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return invoice, nil
}

// GetByID - Get invoice by ID
func (r *InvoiceRepository) GetByID(ctx context.Context, id uuid.UUID) (*Invoice, error) {
	query := `
		SELECT i.id, i.patient_id, i.clinic_id, i.total_amount, i.discount_amount,
			i.paid_amount, i.status, i.created_at, i.updated_at,
			p.first_name || ' ' || p.last_name as patient_name
		FROM invoices i
		LEFT JOIN patients p ON i.patient_id = p.id
		WHERE i.id = $1
	`

	invoice := &Invoice{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&invoice.ID, &invoice.PatientID, &invoice.ClinicID,
		&invoice.TotalAmount, &invoice.DiscountAmount, &invoice.PaidAmount,
		&invoice.Status, &invoice.CreatedAt, &invoice.UpdatedAt,
		&invoice.PatientName,
	)
	if err != nil {
		return nil, err
	}

	// Get items
	itemQuery := `
		SELECT id, service_id, service_name, quantity, unit_price, discount, total_price
		FROM invoice_items
		WHERE invoice_id = $1
	`
	rows, err := r.db.Query(ctx, itemQuery, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		item := InvoiceItem{}
		err := rows.Scan(
			&item.ID, &item.ServiceID, &item.ServiceName,
			&item.Quantity, &item.UnitPrice, &item.Discount, &item.TotalPrice,
		)
		if err != nil {
			return nil, err
		}
		invoice.Items = append(invoice.Items, item)
	}

	return invoice, nil
}

// GetPatientInvoices - Get invoices for a patient
func (r *InvoiceRepository) GetPatientInvoices(ctx context.Context, patientID uuid.UUID) ([]Invoice, error) {
	query := `
		SELECT i.id, i.patient_id, i.clinic_id, i.total_amount, i.discount_amount,
			i.paid_amount, i.status, i.created_at, i.updated_at,
			p.first_name || ' ' || p.last_name as patient_name
		FROM invoices i
		LEFT JOIN patients p ON i.patient_id = p.id
		WHERE i.patient_id = $1
		ORDER BY i.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invoices []Invoice
	for rows.Next() {
		inv := Invoice{}
		err := rows.Scan(
			&inv.ID, &inv.PatientID, &inv.ClinicID,
			&inv.TotalAmount, &inv.DiscountAmount, &inv.PaidAmount,
			&inv.Status, &inv.CreatedAt, &inv.UpdatedAt,
			&inv.PatientName,
		)
		if err != nil {
			return nil, err
		}
		invoices = append(invoices, inv)
	}

	return invoices, nil
}

// RecordPayment - Record payment for invoice
func (r *InvoiceRepository) RecordPayment(ctx context.Context, invoiceID uuid.UUID, amount float64, paymentMethod string, reference string, createdBy *uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Get current paid amount
	var paidAmount float64
	var totalAmount float64
	err = tx.QueryRow(ctx, "SELECT paid_amount, total_amount FROM invoices WHERE id = $1", invoiceID).Scan(&paidAmount, &totalAmount)
	if err != nil {
		return err
	}

	newPaidAmount := paidAmount + amount
	newStatus := "partially_paid"
	if newPaidAmount >= totalAmount {
		newStatus = "paid"
	}

	// Update invoice
	_, err = tx.Exec(ctx, `
		UPDATE invoices SET paid_amount = $2, status = $3, updated_at = NOW()
		WHERE id = $1
	`, invoiceID, newPaidAmount, newStatus)
	if err != nil {
		return err
	}

	// Create payment record
	_, err = tx.Exec(ctx, `
		INSERT INTO payments (id, invoice_id, patient_id, amount, payment_method, reference, created_at)
		VALUES (gen_random_uuid(), $1, (SELECT patient_id FROM invoices WHERE id = $1), $2, $3, $4, NOW())
	`, invoiceID, amount, paymentMethod, reference)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}