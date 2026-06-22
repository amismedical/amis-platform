package postgres

/**
 * AMIS - Deposits Repository
 * TZ Module: Depozitlar boshqarish
 * Status: Repository Stub - Database logic pending
 */

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DepositsRepository struct {
	db *pgxpool.Pool
}

func NewDepositsRepository(db *pgxpool.Pool) *DepositsRepository {
	return &DepositsRepository{db: db}
}

func (r *DepositsRepository) List(ctx context.Context, params map[string]interface{}) ([]Deposit, int, error) {
	return []Deposit{}, 0, nil
}

func (r *DepositsRepository) GetPatientDeposit(ctx context.Context, patientID uuid.UUID) (*Deposit, error) {
	return nil, nil
}

func (r *DepositsRepository) TopUp(ctx context.Context, data map[string]interface{}) (*Deposit, error) {
	return nil, nil
}

func (r *DepositsRepository) Withdraw(ctx context.Context, data map[string]interface{}) (*Deposit, error) {
	return nil, nil
}

func (r *DepositsRepository) GetHistory(ctx context.Context, patientID uuid.UUID, params map[string]interface{}) ([]DepositHistory, error) {
	return []DepositHistory{}, nil
}

func (r *DepositsRepository) ListDebtors(ctx context.Context, params map[string]interface{}) ([]Debtor, error) {
	return []Debtor{}, nil
}

func (r *DepositsRepository) UpdateBalance(ctx context.Context, patientID uuid.UUID, data map[string]interface{}) error {
	return nil
}

func (r *DepositsRepository) SearchPatient(ctx context.Context, params map[string]interface{}) ([]Patient, error) {
	return []Patient{}, nil
}

type Deposit struct {
	ID        uuid.UUID `json:"id"`
	PatientID uuid.UUID `json:"patient_id"`
	Balance   float64   `json:"balance"`
	UpdatedAt string    `json:"updated_at"`
}

type DepositHistory struct {
	ID          uuid.UUID `json:"id"`
	PatientID   uuid.UUID `json:"patient_id"`
	Type        string    `json:"type"`
	Amount      float64   `json:"amount"`
	Balance     float64   `json:"balance"`
	Description string    `json:"description"`
	Reference   string    `json:"reference"`
	CreatedAt   string    `json:"created_at"`
}

type Debtor struct {
	PatientID   uuid.UUID `json:"patient_id"`
	PatientName string    `json:"patient_name"`
	Phone       string    `json:"phone"`
	DebtAmount  float64   `json:"debt_amount"`
	LastVisit   string    `json:"last_visit"`
}
