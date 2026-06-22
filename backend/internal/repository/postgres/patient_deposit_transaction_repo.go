package postgres

/**
 * AMIS - Patient Deposit Transaction Repository
 * TASK-001: Patient Profile Foundation
 */

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PatientDepositTransaction struct {
	ID              uuid.UUID  `json:"id"`
	PatientID       uuid.UUID  `json:"patient_id"`
	ClinicID        *uuid.UUID `json:"clinic_id,omitempty"`
	TransactionType string     `json:"transaction_type"` // deposit, withdrawal, refund, transfer, reversal
	Amount          float64    `json:"amount"`
	BalanceBefore   float64    `json:"balance_before"`
	BalanceAfter    float64    `json:"balance_after"`
	PaymentMethod   string     `json:"payment_method"` // cash, card, transfer, insurance
	Reference       string     `json:"reference"`      // invoice_id, appointment_id, etc.
	Description     string     `json:"description"`
	IsReversed      bool       `json:"is_reversed"`
	ReversedBy      *uuid.UUID `json:"reversed_by,omitempty"`
	ReversedAt      *time.Time `json:"reversed_at,omitempty"`
	ReverseReason   string     `json:"reverse_reason,omitempty"`
	CreatedBy       *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`

	// Joined data
	PatientName string `json:"patient_name,omitempty"`
	CashierName string `json:"cashier_name,omitempty"`
}

type CreateDepositTransactionInput struct {
	PatientID       uuid.UUID
	ClinicID        *uuid.UUID
	TransactionType string
	Amount          float64
	BalanceBefore   float64
	BalanceAfter    float64
	PaymentMethod   string
	Reference       string
	Description     string
	CreatedBy       *uuid.UUID
}

type ReverseTransactionInput struct {
	ReversedBy    uuid.UUID
	ReversedAt    time.Time
	ReverseReason string
}

type PatientDepositTransactionRepository struct {
	db *pgxpool.Pool
}

func NewPatientDepositTransactionRepository(db *pgxpool.Pool) *PatientDepositTransactionRepository {
	return &PatientDepositTransactionRepository{db: db}
}

// Create - Create new deposit transaction
func (r *PatientDepositTransactionRepository) Create(ctx context.Context, input CreateDepositTransactionInput) (*PatientDepositTransaction, error) {
	tx := &PatientDepositTransaction{
		ID:              uuid.New(),
		PatientID:       input.PatientID,
		ClinicID:        input.ClinicID,
		TransactionType: input.TransactionType,
		Amount:          input.Amount,
		BalanceBefore:   input.BalanceBefore,
		BalanceAfter:    input.BalanceAfter,
		PaymentMethod:   input.PaymentMethod,
		Reference:       input.Reference,
		Description:     input.Description,
		IsReversed:      false,
		CreatedBy:       input.CreatedBy,
		CreatedAt:       time.Now(),
	}

	query := `
		INSERT INTO patient_deposit_transactions (
			id, patient_id, clinic_id, transaction_type, amount,
			balance_before, balance_after, payment_method, reference,
			description, is_reversed, created_by, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id
	`

	err := r.db.QueryRow(ctx, query,
		tx.ID, tx.PatientID, tx.ClinicID, tx.TransactionType, tx.Amount,
		tx.BalanceBefore, tx.BalanceAfter, tx.PaymentMethod, tx.Reference,
		tx.Description, tx.IsReversed, tx.CreatedBy, tx.CreatedAt,
	).Scan(&tx.ID)

	if err != nil {
		return nil, fmt.Errorf("ошибка создания транзакции: %w", err)
	}

	return tx, nil
}

// GetByID - Get transaction by ID
func (r *PatientDepositTransactionRepository) GetByID(ctx context.Context, id uuid.UUID) (*PatientDepositTransaction, error) {
	query := `
		SELECT pdt.id, pdt.patient_id, pdt.clinic_id, pdt.transaction_type,
			pdt.amount, pdt.balance_before, pdt.balance_after, pdt.payment_method,
			pdt.reference, pdt.description, pdt.is_reversed, pdt.reversed_by,
			pdt.reversed_at, pdt.reverse_reason, pdt.created_by, pdt.created_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as cashier_name
		FROM patient_deposit_transactions pdt
		LEFT JOIN patients p ON pdt.patient_id = p.id
		LEFT JOIN staff s ON pdt.created_by = s.id
		WHERE pdt.id = $1
	`

	tx := &PatientDepositTransaction{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&tx.ID, &tx.PatientID, &tx.ClinicID, &tx.TransactionType,
		&tx.Amount, &tx.BalanceBefore, &tx.BalanceAfter, &tx.PaymentMethod,
		&tx.Reference, &tx.Description, &tx.IsReversed, &tx.ReversedBy,
		&tx.ReversedAt, &tx.ReverseReason, &tx.CreatedBy, &tx.CreatedAt,
		&tx.PatientName, &tx.CashierName,
	)
	if err != nil {
		return nil, err
	}

	return tx, nil
}

// GetByPatientID - Get all transactions for a patient
func (r *PatientDepositTransactionRepository) GetByPatientID(ctx context.Context, patientID uuid.UUID, limit, offset int) ([]PatientDepositTransaction, int, error) {
	countQuery := `SELECT COUNT(*) FROM patient_deposit_transactions WHERE patient_id = $1`
	var total int
	if err := r.db.QueryRow(ctx, countQuery, patientID).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `
		SELECT pdt.id, pdt.patient_id, pdt.clinic_id, pdt.transaction_type,
			pdt.amount, pdt.balance_before, pdt.balance_after, pdt.payment_method,
			pdt.reference, pdt.description, pdt.is_reversed, pdt.reversed_by,
			pdt.reversed_at, pdt.reverse_reason, pdt.created_by, pdt.created_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as cashier_name
		FROM patient_deposit_transactions pdt
		LEFT JOIN patients p ON pdt.patient_id = p.id
		LEFT JOIN staff s ON pdt.created_by = s.id
		WHERE pdt.patient_id = $1
		ORDER BY pdt.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(ctx, query, patientID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var txs []PatientDepositTransaction
	for rows.Next() {
		tx := PatientDepositTransaction{}
		err := rows.Scan(
			&tx.ID, &tx.PatientID, &tx.ClinicID, &tx.TransactionType,
			&tx.Amount, &tx.BalanceBefore, &tx.BalanceAfter, &tx.PaymentMethod,
			&tx.Reference, &tx.Description, &tx.IsReversed, &tx.ReversedBy,
			&tx.ReversedAt, &tx.ReverseReason, &tx.CreatedBy, &tx.CreatedAt,
			&tx.PatientName, &tx.CashierName,
		)
		if err != nil {
			return nil, 0, err
		}
		txs = append(txs, tx)
	}

	return txs, total, nil
}

// GetCurrentBalance - Get current deposit balance for a patient
func (r *PatientDepositTransactionRepository) GetCurrentBalance(ctx context.Context, patientID uuid.UUID) (float64, error) {
	query := `
		SELECT COALESCE(balance_after, 0)
		FROM patient_deposit_transactions
		WHERE patient_id = $1 AND is_reversed = false
		ORDER BY created_at DESC
		LIMIT 1
	`

	var balance float64
	err := r.db.QueryRow(ctx, query, patientID).Scan(&balance)
	if err != nil {
		// No transactions yet - balance is 0
		return 0, nil
	}

	return balance, nil
}

// Reverse - Reverse a transaction
func (r *PatientDepositTransactionRepository) Reverse(ctx context.Context, id uuid.UUID, input ReverseTransactionInput) error {
	query := `
		UPDATE patient_deposit_transactions SET
			is_reversed = true,
			reversed_by = $2,
			reversed_at = $3,
			reverse_reason = $4
		WHERE id = $1 AND is_reversed = false
	`

	result, err := r.db.Exec(ctx, query, id, input.ReversedBy, input.ReversedAt, input.ReverseReason)
	if err != nil {
		return err
	}

	affected := result.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("транзакция уже отменена или не найдена")
	}

	return nil
}

// GetDeposits - Get only deposit transactions
func (r *PatientDepositTransactionRepository) GetDeposits(ctx context.Context, patientID uuid.UUID) ([]PatientDepositTransaction, error) {
	query := `
		SELECT pdt.id, pdt.patient_id, pdt.clinic_id, pdt.transaction_type,
			pdt.amount, pdt.balance_before, pdt.balance_after, pdt.payment_method,
			pdt.reference, pdt.description, pdt.is_reversed, pdt.reversed_by,
			pdt.reversed_at, pdt.reverse_reason, pdt.created_by, pdt.created_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as cashier_name
		FROM patient_deposit_transactions pdt
		LEFT JOIN patients p ON pdt.patient_id = p.id
		LEFT JOIN staff s ON pdt.created_by = s.id
		WHERE pdt.patient_id = $1 AND pdt.transaction_type = 'deposit' AND pdt.is_reversed = false
		ORDER BY pdt.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var txs []PatientDepositTransaction
	for rows.Next() {
		tx := PatientDepositTransaction{}
		err := rows.Scan(
			&tx.ID, &tx.PatientID, &tx.ClinicID, &tx.TransactionType,
			&tx.Amount, &tx.BalanceBefore, &tx.BalanceAfter, &tx.PaymentMethod,
			&tx.Reference, &tx.Description, &tx.IsReversed, &tx.ReversedBy,
			&tx.ReversedAt, &tx.ReverseReason, &tx.CreatedBy, &tx.CreatedAt,
			&tx.PatientName, &tx.CashierName,
		)
		if err != nil {
			return nil, err
		}
		txs = append(txs, tx)
	}

	return txs, nil
}
