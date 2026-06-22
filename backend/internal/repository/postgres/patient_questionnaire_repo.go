package postgres

/**
 * AMIS - Patient Questionnaire Repository
 * TASK-001: Patient Profile Foundation
 */

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PatientQuestionnaire struct {
	ID                 uuid.UUID              `json:"id"`
	PatientID          uuid.UUID              `json:"patient_id"`
	ClinicID           *uuid.UUID             `json:"clinic_id,omitempty"`
	QuestionnaireID    uuid.UUID              `json:"questionnaire_id"`    // Reference to questionnaire template
	QuestionnaireTitle string                 `json:"questionnaire_title"` // Snapshot of title
	Version            string                 `json:"version"`
	Responses          map[string]interface{} `json:"responses"` // JSONB - question_id -> answer
	Score              *float64               `json:"score,omitempty"`
	RiskLevel          string                 `json:"risk_level"` // low, medium, high, critical
	IsComplete         bool                   `json:"is_complete"`
	CompletedAt        *time.Time             `json:"completed_at,omitempty"`
	ExpiresAt          *time.Time             `json:"expires_at,omitempty"`
	Notes              string                 `json:"notes"`
	IsActive           bool                   `json:"is_active"`
	CreatedBy          *uuid.UUID             `json:"created_by,omitempty"`
	CreatedAt          time.Time              `json:"created_at"`
	UpdatedBy          *uuid.UUID             `json:"updated_by,omitempty"`
	UpdatedAt          time.Time              `json:"updated_at"`

	// Joined data
	PatientName string `json:"patient_name,omitempty"`
	CreatorName string `json:"creator_name,omitempty"`
}

type CreateQuestionnaireResponseInput struct {
	PatientID          uuid.UUID
	ClinicID           *uuid.UUID
	QuestionnaireID    uuid.UUID
	QuestionnaireTitle string
	Version            string
	Responses          map[string]interface{}
	Score              *float64
	RiskLevel          string
	IsComplete         bool
	CompletedAt        *time.Time
	ExpiresAt          *time.Time
	Notes              string
	CreatedBy          *uuid.UUID
}

type UpdateQuestionnaireResponseInput struct {
	Responses   *map[string]interface{}
	Score       *float64
	RiskLevel   *string
	IsComplete  *bool
	CompletedAt *time.Time
	ExpiresAt   *time.Time
	Notes       *string
	IsActive    *bool
	UpdatedBy   *uuid.UUID
}

type PatientQuestionnaireRepository struct {
	db *pgxpool.Pool
}

func NewPatientQuestionnaireRepository(db *pgxpool.Pool) *PatientQuestionnaireRepository {
	return &PatientQuestionnaireRepository{db: db}
}

// Create - Create new questionnaire response
func (r *PatientQuestionnaireRepository) Create(ctx context.Context, input CreateQuestionnaireResponseInput) (*PatientQuestionnaire, error) {
	responsesJSON, err := json.Marshal(input.Responses)
	if err != nil {
		return nil, fmt.Errorf("ошибка сериализации ответов: %w", err)
	}

	resp := &PatientQuestionnaire{
		ID:                 uuid.New(),
		PatientID:          input.PatientID,
		ClinicID:           input.ClinicID,
		QuestionnaireID:    input.QuestionnaireID,
		QuestionnaireTitle: input.QuestionnaireTitle,
		Version:            input.Version,
		Responses:          input.Responses,
		Score:              input.Score,
		RiskLevel:          input.RiskLevel,
		IsComplete:         input.IsComplete,
		CompletedAt:        input.CompletedAt,
		ExpiresAt:          input.ExpiresAt,
		Notes:              input.Notes,
		IsActive:           true,
		CreatedBy:          input.CreatedBy,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	query := `
		INSERT INTO patient_questionnaires (
			id, patient_id, clinic_id, questionnaire_id, questionnaire_title,
			version, responses, score, risk_level, is_complete, completed_at,
			expires_at, notes, is_active, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		RETURNING id
	`

	err = r.db.QueryRow(ctx, query,
		resp.ID, resp.PatientID, resp.ClinicID, resp.QuestionnaireID, resp.QuestionnaireTitle,
		resp.Version, responsesJSON, resp.Score, resp.RiskLevel, resp.IsComplete, resp.CompletedAt,
		resp.ExpiresAt, resp.Notes, resp.IsActive, resp.CreatedBy, resp.CreatedAt, resp.UpdatedAt,
	).Scan(&resp.ID)

	if err != nil {
		return nil, fmt.Errorf("ошибка создания анкеты: %w", err)
	}

	return resp, nil
}

// GetByID - Get questionnaire response by ID
func (r *PatientQuestionnaireRepository) GetByID(ctx context.Context, id uuid.UUID) (*PatientQuestionnaire, error) {
	query := `
		SELECT pq.id, pq.patient_id, pq.clinic_id, pq.questionnaire_id, pq.questionnaire_title,
			pq.version, pq.responses, pq.score, pq.risk_level, pq.is_complete, pq.completed_at,
			pq.expires_at, pq.notes, pq.is_active, pq.created_by, pq.created_at,
			pq.updated_by, pq.updated_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as creator_name
		FROM patient_questionnaires pq
		LEFT JOIN patients p ON pq.patient_id = p.id
		LEFT JOIN staff s ON pq.created_by = s.id
		WHERE pq.id = $1
	`

	resp := &PatientQuestionnaire{}
	var responsesJSON []byte
	err := r.db.QueryRow(ctx, query, id).Scan(
		&resp.ID, &resp.PatientID, &resp.ClinicID, &resp.QuestionnaireID, &resp.QuestionnaireTitle,
		&resp.Version, &responsesJSON, &resp.Score, &resp.RiskLevel, &resp.IsComplete, &resp.CompletedAt,
		&resp.ExpiresAt, &resp.Notes, &resp.IsActive, &resp.CreatedBy, &resp.CreatedAt,
		&resp.UpdatedBy, &resp.UpdatedAt,
		&resp.PatientName, &resp.CreatorName,
	)
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal(responsesJSON, &resp.Responses); err != nil {
		return nil, fmt.Errorf("ошибка десериализации ответов: %w", err)
	}

	return resp, nil
}

// GetByPatientID - Get all questionnaire responses for a patient
func (r *PatientQuestionnaireRepository) GetByPatientID(ctx context.Context, patientID uuid.UUID) ([]PatientQuestionnaire, error) {
	query := `
		SELECT pq.id, pq.patient_id, pq.clinic_id, pq.questionnaire_id, pq.questionnaire_title,
			pq.version, pq.responses, pq.score, pq.risk_level, pq.is_complete, pq.completed_at,
			pq.expires_at, pq.notes, pq.is_active, pq.created_by, pq.created_at,
			pq.updated_by, pq.updated_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as creator_name
		FROM patient_questionnaires pq
		LEFT JOIN patients p ON pq.patient_id = p.id
		LEFT JOIN staff s ON pq.created_by = s.id
		WHERE pq.patient_id = $1 AND pq.is_active = true
		ORDER BY pq.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var responses []PatientQuestionnaire
	for rows.Next() {
		resp := PatientQuestionnaire{}
		var responsesJSON []byte
		err := rows.Scan(
			&resp.ID, &resp.PatientID, &resp.ClinicID, &resp.QuestionnaireID, &resp.QuestionnaireTitle,
			&resp.Version, &responsesJSON, &resp.Score, &resp.RiskLevel, &resp.IsComplete, &resp.CompletedAt,
			&resp.ExpiresAt, &resp.Notes, &resp.IsActive, &resp.CreatedBy, &resp.CreatedAt,
			&resp.UpdatedBy, &resp.UpdatedAt,
			&resp.PatientName, &resp.CreatorName,
		)
		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal(responsesJSON, &resp.Responses); err != nil {
			return nil, err
		}

		responses = append(responses, resp)
	}

	return responses, nil
}

// GetLatestByType - Get latest response for a specific questionnaire type
func (r *PatientQuestionnaireRepository) GetLatestByType(ctx context.Context, patientID uuid.UUID, questionnaireID uuid.UUID) (*PatientQuestionnaire, error) {
	query := `
		SELECT pq.id, pq.patient_id, pq.clinic_id, pq.questionnaire_id, pq.questionnaire_title,
			pq.version, pq.responses, pq.score, pq.risk_level, pq.is_complete, pq.completed_at,
			pq.expires_at, pq.notes, pq.is_active, pq.created_by, pq.created_at,
			pq.updated_by, pq.updated_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as creator_name
		FROM patient_questionnaires pq
		LEFT JOIN patients p ON pq.patient_id = p.id
		LEFT JOIN staff s ON pq.created_by = s.id
		WHERE pq.patient_id = $1 AND pq.questionnaire_id = $2 AND pq.is_active = true
		ORDER BY pq.created_at DESC
		LIMIT 1
	`

	resp := &PatientQuestionnaire{}
	var responsesJSON []byte
	err := r.db.QueryRow(ctx, query, patientID, questionnaireID).Scan(
		&resp.ID, &resp.PatientID, &resp.ClinicID, &resp.QuestionnaireID, &resp.QuestionnaireTitle,
		&resp.Version, &responsesJSON, &resp.Score, &resp.RiskLevel, &resp.IsComplete, &resp.CompletedAt,
		&resp.ExpiresAt, &resp.Notes, &resp.IsActive, &resp.CreatedBy, &resp.CreatedAt,
		&resp.UpdatedBy, &resp.UpdatedAt,
		&resp.PatientName, &resp.CreatorName,
	)
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal(responsesJSON, &resp.Responses); err != nil {
		return nil, err
	}

	return resp, nil
}

// GetHighRisk - Get high/critical risk questionnaires for a patient
func (r *PatientQuestionnaireRepository) GetHighRisk(ctx context.Context, patientID uuid.UUID) ([]PatientQuestionnaire, error) {
	query := `
		SELECT pq.id, pq.patient_id, pq.clinic_id, pq.questionnaire_id, pq.questionnaire_title,
			pq.version, pq.responses, pq.score, pq.risk_level, pq.is_complete, pq.completed_at,
			pq.expires_at, pq.notes, pq.is_active, pq.created_by, pq.created_at,
			pq.updated_by, pq.updated_at,
			p.first_name || ' ' || p.last_name as patient_name,
			s.first_name || ' ' || s.last_name as creator_name
		FROM patient_questionnaires pq
		LEFT JOIN patients p ON pq.patient_id = p.id
		LEFT JOIN staff s ON pq.created_by = s.id
		WHERE pq.patient_id = $1 AND pq.is_active = true
			AND pq.risk_level IN ('high', 'critical')
		ORDER BY pq.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var responses []PatientQuestionnaire
	for rows.Next() {
		resp := PatientQuestionnaire{}
		var responsesJSON []byte
		err := rows.Scan(
			&resp.ID, &resp.PatientID, &resp.ClinicID, &resp.QuestionnaireID, &resp.QuestionnaireTitle,
			&resp.Version, &responsesJSON, &resp.Score, &resp.RiskLevel, &resp.IsComplete, &resp.CompletedAt,
			&resp.ExpiresAt, &resp.Notes, &resp.IsActive, &resp.CreatedBy, &resp.CreatedAt,
			&resp.UpdatedBy, &resp.UpdatedAt,
			&resp.PatientName, &resp.CreatorName,
		)
		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal(responsesJSON, &resp.Responses); err != nil {
			return nil, err
		}

		responses = append(responses, resp)
	}

	return responses, nil
}

// Update - Update questionnaire response
func (r *PatientQuestionnaireRepository) Update(ctx context.Context, id uuid.UUID, input UpdateQuestionnaireResponseInput) error {
	var responsesJSON []byte
	var err error

	if input.Responses != nil {
		responsesJSON, err = json.Marshal(*input.Responses)
		if err != nil {
			return fmt.Errorf("ошибка сериализации ответов: %w", err)
		}
	}

	query := `
		UPDATE patient_questionnaires SET
			responses = COALESCE($2, responses),
			score = COALESCE($3, score),
			risk_level = COALESCE($4, risk_level),
			is_complete = COALESCE($5, is_complete),
			completed_at = COALESCE($6, completed_at),
			expires_at = COALESCE($7, expires_at),
			notes = COALESCE($8, notes),
			is_active = COALESCE($9, is_active),
			updated_at = NOW()
		WHERE id = $1
	`

	_, err = r.db.Exec(ctx, query,
		id, responsesJSON, input.Score, input.RiskLevel, input.IsComplete,
		input.CompletedAt, input.ExpiresAt, input.Notes, input.IsActive,
	)

	return err
}

// Delete - Soft delete questionnaire response
func (r *PatientQuestionnaireRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE patient_questionnaires SET is_active = false, updated_at = NOW() WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}
