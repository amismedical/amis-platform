package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/amis/medverse-annahl/internal/domain"
	"github.com/amis/medverse-annahl/internal/repository/postgres"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DoctorHandler struct {
	db *postgres.PoolWrapper
}

func NewDoctorHandler(db *postgres.PoolWrapper) *DoctorHandler {
	return &DoctorHandler{db: db}
}

func (h *DoctorHandler) TodayAppointments(c *gin.Context) {
	doctorID := c.GetString("staff_id")
	if doctorID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Doctor ID required"})
		return
	}

	date := c.Query("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	appointments, err := h.db.GetTodayAppointments(c.Request.Context(), doctorID, date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"appointments": appointments})
}

func (h *DoctorHandler) Patients(c *gin.Context) {
	doctorID := c.GetString("staff_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	patients, total, err := h.db.GetDoctorPatients(c.Request.Context(), doctorID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": patients, "total": total})
}

func (h *DoctorHandler) StartEncounter(c *gin.Context) {
	var req struct {
		EpisodeID     string `json:"episode_id"`
		AppointmentID string `json:"appointment_id"`
		Complaints    string `json:"complaints"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	doctorID, _ := uuid.Parse(c.GetString("staff_id"))
	clinicID, _ := uuid.Parse(c.GetString("clinic_id"))

	var episodeID uuid.UUID

	// If episode_id not provided, auto-create one from appointment
	if req.EpisodeID == "" {
		var episode *domain.Episode
		if req.AppointmentID != "" {
			// Get appointment to find patient
			apt, err := h.db.GetAppointmentByID(ctx, req.AppointmentID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Appointment not found"})
				return
			}
			episode = &domain.Episode{
				ID:        uuid.New(),
				ClinicID:  clinicID,
				PatientID: apt.PatientID,
				DoctorID:  doctorID,
				Title:     "Qabul",
				Status:    "in_progress",
				StartedAt: time.Now(),
			}
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "episode_id yoki appointment_id berilishi kerak"})
			return
		}

		if err := h.db.CreateEpisode(ctx, episode); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		episodeID = episode.ID
	} else {
		episodeID = uuid.MustParse(req.EpisodeID)
	}

	// Update appointment status to in_progress if appointment_id provided
	if req.AppointmentID != "" {
		updates := map[string]interface{}{"status": "in_progress"}
		h.db.UpdateAppointment(ctx, req.AppointmentID, updates)
	}

	encounter := &domain.Encounter{
		ID:         uuid.New(),
		EpisodeID:  episodeID,
		DoctorID:   doctorID,
		VisitDate:  time.Now(),
		Complaints: req.Complaints,
		Status:     "in_progress",
	}

	if req.AppointmentID != "" {
		appointmentID, _ := uuid.Parse(req.AppointmentID)
		encounter.AppointmentID = &appointmentID
	}

	if err := h.db.CreateEncounter(ctx, encounter); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Qabul boshlandi", "encounter_id": encounter.ID, "episode_id": episodeID})
}

func (h *DoctorHandler) CompleteEncounter(c *gin.Context) {
	var req struct {
		EpisodeID   string `json:"episode_id" binding:"required"`
		Examination string `json:"examination"`
		Notes       string `json:"notes"`
		Conclusion  string `json:"conclusion"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update episode with conclusion
	updates := map[string]interface{}{
		"status":       "completed",
		"conclusion":   req.Conclusion,
		"completed_at": time.Now(),
	}

	if err := h.db.UpdateEpisode(c.Request.Context(), req.EpisodeID, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Encounter completed"})
}

func (h *DoctorHandler) RecordVitals(c *gin.Context) {
	var req struct {
		EpisodeID          string  `json:"episode_id" binding:"required"`
		Height             float64 `json:"height"`
		Weight             float64 `json:"weight"`
		Temperature        float64 `json:"temperature"`
		BPSystolic         int     `json:"bp_systolic"`
		BPDiastolic        int     `json:"bp_diastolic"`
		Pulse              int     `json:"pulse"`
		BloodSugar         float64 `json:"blood_sugar"`
		Waist              float64 `json:"waist"`
		HeadCircumference  float64 `json:"head_circumference"`
		ChestCircumference float64 `json:"chest_circumference"`
		Comments           string  `json:"comments"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	vitals := &domain.Vitals{
		ID:                 uuid.New(),
		EpisodeID:          uuid.MustParse(req.EpisodeID),
		Height:             req.Height,
		Weight:             req.Weight,
		Temperature:        req.Temperature,
		BPSystolic:         req.BPSystolic,
		BPDiastolic:        req.BPDiastolic,
		Pulse:              req.Pulse,
		BloodSugar:         req.BloodSugar,
		Waist:              req.Waist,
		HeadCircumference:  req.HeadCircumference,
		ChestCircumference: req.ChestCircumference,
		Comments:           req.Comments,
		RecordedAt:         time.Now(),
	}

	if err := h.db.CreateVitals(c.Request.Context(), vitals); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Vitals recorded", "vitals_id": vitals.ID})
}

func (h *DoctorHandler) AddDiagnosis(c *gin.Context) {
	var req struct {
		EpisodeID string `json:"episode_id" binding:"required"`
		ICDCode   string `json:"icd_code" binding:"required"`
		ICDName   string `json:"icd_name" binding:"required"`
		Type      string `json:"type" binding:"required"`
		Notes     string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	diagnosis := &domain.Diagnosis{
		ID:        uuid.New(),
		EpisodeID: uuid.MustParse(req.EpisodeID),
		ICDCode:   req.ICDCode,
		ICDName:   req.ICDName,
		Type:      req.Type,
		Status:    "active",
		Notes:     req.Notes,
	}

	if err := h.db.CreateDiagnosis(c.Request.Context(), diagnosis); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Diagnosis added", "diagnosis_id": diagnosis.ID})
}

func (h *DoctorHandler) AddRecommendation(c *gin.Context) {
	var req struct {
		EpisodeID    string `json:"episode_id" binding:"required"`
		Type         string `json:"type" binding:"required"`
		ServiceID    string `json:"service_id"`
		Description  string `json:"description" binding:"required"`
		Instructions string `json:"instructions"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rec := &domain.Recommendation{
		ID:           uuid.New(),
		EpisodeID:    uuid.MustParse(req.EpisodeID),
		Type:         req.Type,
		Description:  req.Description,
		Instructions: req.Instructions,
		Status:       "active",
	}

	if req.ServiceID != "" {
		serviceID, _ := uuid.Parse(req.ServiceID)
		rec.ServiceID = &serviceID
	}

	if err := h.db.CreateRecommendation(c.Request.Context(), rec); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Recommendation added", "recommendation_id": rec.ID})
}

func (h *DoctorHandler) Statistics(c *gin.Context) {
	doctorID := c.GetString("staff_id")
	date := time.Now().Format("2006-01-02")

	appointments, _ := h.db.GetTodayAppointments(c.Request.Context(), doctorID, date)

	c.JSON(http.StatusOK, gin.H{
		"statistics": gin.H{
			"today_appointments": len(appointments),
			"completed":          0,
			"waiting":            0,
		},
	})
}

type CashierHandler struct {
	db *postgres.PoolWrapper
}

func NewCashierHandler(db *postgres.PoolWrapper) *CashierHandler {
	return &CashierHandler{db: db}
}

func (h *CashierHandler) Invoices(c *gin.Context) {
	patientID := c.Query("patient_id")
	status := c.Query("status")
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	invoices, total, err := h.db.ListInvoices(c.Request.Context(), patientID, status, dateFrom, dateTo, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": invoices, "total": total})
}

// GetPendingInvoices - GET /api/v1/cashier/pending-invoices
func (h *CashierHandler) GetPendingInvoices(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	invoices, total, err := h.db.ListInvoices(c.Request.Context(), "", "open", "", "", page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Also get partially_paid invoices
	partiallyPaid, _, _ := h.db.ListInvoices(c.Request.Context(), "", "partially_paid", "", "", page, limit)
	allPending := append(invoices, partiallyPaid...)

	c.JSON(http.StatusOK, gin.H{"data": allPending, "total": total + len(partiallyPaid), "page": page, "limit": limit})
}

// GetCompletedPayments - GET /api/v1/cashier/completed-payments
func (h *CashierHandler) GetCompletedPayments(c *gin.Context) {
	patientID := c.Query("patient_id")
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	// Get paid invoices as payments
	invoices, total, err := h.db.ListInvoices(c.Request.Context(), patientID, "paid", dateFrom, dateTo, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": invoices, "total": total, "page": page, "limit": limit})
}

// GetCashierSummary - GET /api/v1/cashier/summary
func (h *CashierHandler) GetCashierSummary(c *gin.Context) {
	ctx := c.Request.Context()
	clinicID := c.GetString("clinic_id")
	date := time.Now().Format("2006-01-02")

	// Get today's statistics
	var totalPaid float64
	var totalRefunded float64
	var transactionCount int

	// Query payments for today
	paymentsQuery := `
		SELECT COALESCE(SUM(p.amount), 0), COUNT(*)
		FROM payments p
		JOIN invoices i ON p.invoice_id = i.id
		WHERE DATE(p.created_at) = $1 AND i.clinic_id = $2
	`
	if clinicID != "" {
		h.db.Pool.QueryRow(ctx, paymentsQuery, date, clinicID).Scan(&totalPaid, &transactionCount)
	}

	// Query refunds for today
	refundsQuery := `
		SELECT COALESCE(SUM(r.amount), 0)
		FROM refunds r
		JOIN invoices i ON r.invoice_id = i.id
		WHERE DATE(r.created_at) = $1 AND i.clinic_id = $2
	`
	if clinicID != "" {
		h.db.Pool.QueryRow(ctx, refundsQuery, date, clinicID).Scan(&totalRefunded)
	}

	// Get pending invoices count
	pendingInvoices, _, _ := h.db.ListInvoices(ctx, "", "open", "", "", 1, 1000)
	partiallyPaid, _, _ := h.db.ListInvoices(ctx, "", "partially_paid", "", "", 1, 1000)
	totalDebt := 0.0
	for _, inv := range pendingInvoices {
		totalDebt += (inv.TotalAmount - inv.PaidAmount)
	}
	for _, inv := range partiallyPaid {
		totalDebt += (inv.TotalAmount - inv.PaidAmount)
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"total_paid":        totalPaid,
			"total_refunded":    totalRefunded,
			"total_debt":        totalDebt,
			"transaction_count": transactionCount,
			"pending_invoices":  len(pendingInvoices),
			"partially_paid":    len(partiallyPaid),
			"date":              date,
		},
	})
}

func (h *CashierHandler) InvoiceDetails(c *gin.Context) {
	id := c.Param("id")

	invoice, err := h.db.GetInvoiceByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	c.JSON(http.StatusOK, invoice)
}

func (h *CashierHandler) Pay(c *gin.Context) {
	var req struct {
		InvoiceID     string  `json:"invoice_id" binding:"required"`
		Amount        float64 `json:"amount" binding:"required"`
		PaymentMethod string  `json:"payment_method" binding:"required"` // cash, click, payme, terminal, deposit
		Reference     string  `json:"reference"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userIDStr := c.GetString("user_id")
	cashierID, _ := uuid.Parse(userIDStr)
	clinicIDStr := c.GetString("clinic_id")
	clinicID, _ := uuid.Parse(clinicIDStr)

	// Validate amount
	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Amount must be positive"})
		return
	}

	// CRITICAL-4: Use transaction-safe payment method
	invoiceUUID, _ := uuid.Parse(req.InvoiceID)
	txResult, err := h.db.ExecutePaymentWithTransaction(ctx, postgres.PaymentTransactionInput{
		InvoiceID:     invoiceUUID,
		Amount:        req.Amount,
		PaymentMethod: req.PaymentMethod,
		Reference:     req.Reference,
		CashierID:     &cashierID,
		ClinicID:      &clinicID,
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// CRITICAL-3: Queue creation must be guaranteed
	if txResult.IsFullyPaid {
		// Get invoice to check for appointment
		invoice, err := h.db.GetInvoiceByID(ctx, req.InvoiceID)
		if err == nil && invoice.AppointmentID != nil {
			// Check if queue entry already exists
			existingQueues, _ := h.db.ListQueueEntries(ctx, "", "waiting")
			hasQueue := false
			for _, q := range existingQueues {
				if q.AppointmentID != nil && q.AppointmentID.String() == invoice.AppointmentID.String() {
					hasQueue = true
					break
				}
			}

			if !hasQueue {
				// Get queue for clinic
				queues, err := h.db.ListQueues(ctx, clinicIDStr, "")
				if err != nil || len(queues) == 0 {
					c.JSON(http.StatusInternalServerError, gin.H{
						"error":   "CRITICAL: Queue creation failed - no queue available",
						"message": "Invoice paid but queue entry could not be created. Please contact administrator.",
					})
					return
				}

				queue := queues[0]
				queueNum, err := h.db.GetNextQueueNumber(ctx, queue.ID.String())
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{
						"error":   "CRITICAL: Queue number generation failed",
						"message": "Invoice paid but queue entry could not be created. Please contact administrator.",
					})
					return
				}

				queueEntry := &domain.QueueEntry{
					ID:            uuid.New(),
					QueueID:       queue.ID,
					AppointmentID: invoice.AppointmentID,
					PatientID:     invoice.PatientID,
					QueueNumber:   queueNum,
					Status:        "waiting",
					RegisteredAt:  time.Now(),
				}

				if err := h.db.CreateQueueEntry(ctx, queueEntry); err != nil {
					// CRITICAL: Return error - do not silently continue
					c.JSON(http.StatusInternalServerError, gin.H{
						"error":   "CRITICAL: Queue entry creation failed",
						"message": "Invoice paid but queue entry could not be created. Please contact administrator.",
					})
					return
				}

				// Update appointment payment_status
				appointmentUpdates := map[string]interface{}{
					"payment_status": "paid",
				}
				_ = h.db.UpdateAppointment(ctx, invoice.AppointmentID.String(), appointmentUpdates)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Payment successful",
		"payment_id":     txResult.PaymentID,
		"invoice_status": txResult.InvoiceStatus,
		"remaining":      txResult.RemainingAmount,
		"is_fully_paid":  txResult.IsFullyPaid,
	})
}

func (h *CashierHandler) Refund(c *gin.Context) {
	var req struct {
		PaymentID       string  `json:"payment_id" binding:"required"`
		Amount          float64 `json:"amount" binding:"required"`
		Reason          string  `json:"reason" binding:"required"`
		RefundToDeposit bool    `json:"refund_to_deposit"` // If true, refund goes to patient deposit
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userIDStr := c.GetString("user_id")
	approvedBy, _ := uuid.Parse(userIDStr)

	// CRITICAL-4: Use transaction-safe refund method
	paymentUUID, _ := uuid.Parse(req.PaymentID)
	txResult, err := h.db.ExecuteRefundWithTransaction(ctx, postgres.RefundTransactionInput{
		PaymentID:       paymentUUID,
		Amount:          req.Amount,
		Reason:          req.Reason,
		ApprovedBy:      &approvedBy,
		RefundToDeposit: req.RefundToDeposit,
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "Refund processed",
		"refund_id":        txResult.RefundID,
		"invoice_status":   txResult.InvoiceStatus,
		"deposit_refunded": req.RefundToDeposit,
	})
}

func (h *CashierHandler) Deposits(c *gin.Context) {
	patientID := c.Param("patient_id")

	deposits, err := h.db.GetPatientDeposits(c.Request.Context(), patientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": deposits})
}

func (h *CashierHandler) TopUpDeposit(c *gin.Context) {
	var req struct {
		PatientID     string  `json:"patient_id" binding:"required"`
		Amount        float64 `json:"amount" binding:"required"`
		Description   string  `json:"description"`
		PaymentMethod string  `json:"payment_method" binding:"required"` // cash, click, payme, terminal
		Reference     string  `json:"reference"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userIDStr := c.GetString("user_id")
	createdBy, _ := uuid.Parse(userIDStr)
	// clinicIDStr is available if needed for future use
	_ = c.GetString("clinic_id")

	// Validate amount
	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Amount must be positive"})
		return
	}

	// Get current balance
	patient, err := h.db.GetPatientByID(ctx, req.PatientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		return
	}

	oldBalance := patient.DepositBalance
	newBalance := oldBalance + req.Amount

	// Create deposit transaction record (CRITICAL-2: Full deposit withdrawal implementation)
	depositTx := &domain.PatientDepositTransaction{
		ID:              uuid.New(),
		PatientID:       patient.ID,
		TransactionType: "topup",
		Amount:          req.Amount,
		BalanceBefore:   oldBalance,
		BalanceAfter:    newBalance,
		PaymentMethod:   req.PaymentMethod,
		Reference:       req.Reference,
		Description:     req.Description,
		CashierID:       &createdBy,
		CreatedAt:       time.Now(),
	}

	// Use transaction for safety
	tx, err := h.db.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback(ctx)

	// Update patient deposit balance
	_, err = tx.Exec(ctx, `UPDATE patients SET deposit_balance = $1 WHERE id = $2`, newBalance, req.PatientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create deposit transaction record
	_, err = tx.Exec(ctx, `
		INSERT INTO patient_deposit_transactions (
			id, patient_id, transaction_type, amount, balance_before, balance_after,
			payment_method, reference, description, cashier_id, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`, depositTx.ID, depositTx.PatientID, depositTx.TransactionType, depositTx.Amount,
		depositTx.BalanceBefore, depositTx.BalanceAfter, depositTx.PaymentMethod,
		depositTx.Reference, depositTx.Description, depositTx.CashierID, depositTx.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// CRITICAL-5: Audit log for deposit topup
	auditDetails := map[string]interface{}{
		"patient_id":     req.PatientID,
		"amount":         req.Amount,
		"payment_method": req.PaymentMethod,
		"old_balance":    oldBalance,
		"new_balance":    newBalance,
	}
	_, _ = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, uuid.New(), &createdBy, "DEPOSIT_TOPUP", "deposit", depositTx.ID, mustMarshalJSON(auditDetails), time.Now())

	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":       "Deposit topped up",
		"new_balance":   newBalance,
		"deposit_tx_id": depositTx.ID,
	})
}

func (h *CashierHandler) Statistics(c *gin.Context) {
	clinicID := c.GetString("clinic_id")
	branchID := c.GetString("branch_id")
	date := time.Now().Format("2006-01-02")

	stats, err := h.db.GetDashboardStats(c.Request.Context(), clinicID, branchID, date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"statistics": stats})
}

type QueueHandler struct {
	db *postgres.PoolWrapper
}

func NewQueueHandler(db *postgres.PoolWrapper) *QueueHandler {
	return &QueueHandler{db: db}
}

func (h *QueueHandler) List(c *gin.Context) {
	clinicID := c.GetString("clinic_id")
	branchID := c.GetString("branch_id")

	queues, err := h.db.ListQueues(c.Request.Context(), clinicID, branchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": queues})
}

func (h *QueueHandler) Get(c *gin.Context) {
	id := c.Param("id")

	queue, err := h.db.GetQueueByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Queue not found"})
		return
	}

	status := c.Query("status")
	entries, err := h.db.ListQueueEntries(c.Request.Context(), id, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"queue":   queue,
		"entries": entries,
	})
}

func (h *QueueHandler) Create(c *gin.Context) {
	var req struct {
		Name      string `json:"name" binding:"required"`
		QueueType string `json:"queue_type" binding:"required"`
		Settings  string `json:"settings"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	clinicID, _ := uuid.Parse(c.GetString("clinic_id"))
	branchID, _ := uuid.Parse(c.GetString("branch_id"))

	settings, _ := json.Marshal(req.Settings)
	if req.Settings == "" {
		settings = json.RawMessage("{}")
	}

	queue := &domain.Queue{
		ID:        uuid.New(),
		ClinicID:  clinicID,
		BranchID:  branchID,
		Name:      req.Name,
		QueueType: req.QueueType,
		IsActive:  true,
		Settings:  settings,
	}

	if err := h.db.CreateQueue(c.Request.Context(), queue); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Queue created", "queue_id": queue.ID})
}

func (h *QueueHandler) Register(c *gin.Context) {
	var req struct {
		QueueID       string `json:"queue_id" binding:"required"`
		PatientID     string `json:"patient_id" binding:"required"`
		AppointmentID string `json:"appointment_id"`
		Cabinet       string `json:"cabinet"`
		DoctorID      string `json:"doctor_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	queueNum, err := h.db.GetNextQueueNumber(c.Request.Context(), req.QueueID)
	if err != nil {
		queueNum = 1
	}

	entry := &domain.QueueEntry{
		ID:           uuid.New(),
		QueueID:      uuid.MustParse(req.QueueID),
		PatientID:    uuid.MustParse(req.PatientID),
		QueueNumber:  queueNum,
		Status:       "waiting",
		RegisteredAt: time.Now(),
		Cabinet:      req.Cabinet,
	}

	if req.AppointmentID != "" {
		aptID, _ := uuid.Parse(req.AppointmentID)
		entry.AppointmentID = &aptID
	}

	if req.DoctorID != "" {
		docID, _ := uuid.Parse(req.DoctorID)
		entry.DoctorID = &docID
	}

	if err := h.db.CreateQueueEntry(c.Request.Context(), entry); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Patient registered", "queue_number": queueNum, "entry_id": entry.ID})
}

func (h *QueueHandler) CallNext(c *gin.Context) {
	queueID := c.Param("id")

	entries, err := h.db.ListQueueEntries(c.Request.Context(), queueID, "waiting")
	if err != nil || len(entries) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No patients waiting"})
		return
	}

	entry := entries[0]
	updates := map[string]interface{}{
		"status":    "called",
		"called_at": time.Now(),
	}

	if err := h.db.UpdateQueueEntry(c.Request.Context(), entry.ID.String(), updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Next patient called",
		"queue_number": entry.QueueNumber,
		"entry_id":     entry.ID,
	})
}

func (h *QueueHandler) Complete(c *gin.Context) {
	entryID := c.Param("entry_id")

	updates := map[string]interface{}{
		"status":       "completed",
		"completed_at": time.Now(),
	}

	if err := h.db.UpdateQueueEntry(c.Request.Context(), entryID, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Patient completed"})
}

type LISHandler struct {
	db *postgres.PoolWrapper
}

func NewLISHandler(db *postgres.PoolWrapper) *LISHandler {
	return &LISHandler{db: db}
}

func (h *LISHandler) Orders(c *gin.Context) {
	patientID := c.Query("patient_id")
	status := c.Query("status")
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	orders, total, err := h.db.ListLISOrders(c.Request.Context(), patientID, status, dateFrom, dateTo, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": orders, "total": total})
}

func (h *LISHandler) OrderDetails(c *gin.Context) {
	id := c.Param("id")

	order, err := h.db.GetLISOrderByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, order)
}

func (h *LISHandler) CollectMaterial(c *gin.Context) {
	orderID := c.Param("id")

	updates := map[string]interface{}{
		"status":       "collected",
		"collected_at": time.Now(),
	}

	if err := h.db.UpdateLISOrder(c.Request.Context(), orderID, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Material collected"})
}

func (h *LISHandler) SubmitResults(c *gin.Context) {
	var req struct {
		OrderID string `json:"order_id" binding:"required"`
		Items   []struct {
			ItemID   string  `json:"item_id" binding:"required"`
			Result   string  `json:"result"`
			RefMin   float64 `json:"ref_min"`
			RefMax   float64 `json:"ref_max"`
			IsNormal bool    `json:"is_normal"`
		} `json:"items"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, item := range req.Items {
		updates := map[string]interface{}{
			"result":      item.Result,
			"ref_min":     item.RefMin,
			"ref_max":     item.RefMax,
			"is_abnormal": !item.IsNormal,
			"status":      "completed",
		}

		if err := h.db.UpdateLISOrderItem(c.Request.Context(), item.ItemID, updates); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Results submitted"})
}

func (h *LISHandler) Confirm(c *gin.Context) {
	orderID := c.Param("id")

	updates := map[string]interface{}{
		"status":   "confirmed",
		"ready_at": time.Now(),
	}

	if err := h.db.UpdateLISOrder(c.Request.Context(), orderID, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order confirmed"})
}

func (h *LISHandler) RefGroups(c *gin.Context) {
	groups, err := h.db.ListRefGroups(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": groups})
}

type MedicalHandler struct {
	db *postgres.PoolWrapper
}

func NewMedicalHandler(db *postgres.PoolWrapper) *MedicalHandler {
	return &MedicalHandler{db: db}
}

func (h *MedicalHandler) Episodes(c *gin.Context) {
	patientID := c.Query("patient_id")

	if patientID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "patient_id required"})
		return
	}

	episodes, err := h.db.GetPatientEpisodes(c.Request.Context(), patientID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": episodes, "total": len(episodes)})
}

func (h *MedicalHandler) EpisodeDetails(c *gin.Context) {
	id := c.Param("id")

	episode, err := h.db.GetEpisodeByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Episode not found"})
		return
	}

	c.JSON(http.StatusOK, episode)
}

func (h *MedicalHandler) CreateEpisode(c *gin.Context) {
	var req struct {
		PatientID        string `json:"patient_id" binding:"required"`
		Title            string `json:"title" binding:"required"`
		ReferralDoctorID string `json:"referral_doctor_id"`
		TemplateID       string `json:"template_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	clinicID, _ := uuid.Parse(c.GetString("clinic_id"))
	doctorID, _ := uuid.Parse(c.GetString("staff_id"))

	episode := &domain.Episode{
		ID:        uuid.New(),
		ClinicID:  clinicID,
		PatientID: uuid.MustParse(req.PatientID),
		DoctorID:  doctorID,
		Title:     req.Title,
		Status:    "in_progress",
		StartedAt: time.Now(),
	}

	if req.ReferralDoctorID != "" {
		refID, _ := uuid.Parse(req.ReferralDoctorID)
		episode.ReferralDoctorID = &refID
	}

	if req.TemplateID != "" {
		tmplID, _ := uuid.Parse(req.TemplateID)
		episode.TemplateID = &tmplID
	}

	if err := h.db.CreateEpisode(c.Request.Context(), episode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Episode created", "episode_id": episode.ID})
}

func (h *MedicalHandler) UpdateEpisode(c *gin.Context) {
	id := c.Param("id")

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.UpdateEpisode(c.Request.Context(), id, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Episode updated"})
}

func (h *MedicalHandler) UploadFile(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"message": "File uploaded"})
}

type AnalyticsHandler struct {
	db *postgres.PoolWrapper
}

func NewAnalyticsHandler(db *postgres.PoolWrapper) *AnalyticsHandler {
	return &AnalyticsHandler{db: db}
}

func (h *AnalyticsHandler) Dashboard(c *gin.Context) {
	clinicID := c.GetString("clinic_id")
	branchID := c.GetString("branch_id")
	date := time.Now().Format("2006-01-02")

	stats, err := h.db.GetDashboardStats(c.Request.Context(), clinicID, branchID, date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_appointments":     stats["total_appointments"],
		"completed_appointments": stats["completed_appointments"],
		"cancelled_appointments": stats["total_appointments"],
		"total_revenue":          stats["total_revenue"],
		"new_patients":           stats["new_patients"],
		"waiting_patients":       stats["waiting_patients"],
	})
}

func (h *AnalyticsHandler) Revenue(c *gin.Context) {
	clinicID := c.GetString("clinic_id")
	branchID := c.GetString("branch_id")
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	if dateFrom == "" {
		dateFrom = time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	}
	if dateTo == "" {
		dateTo = time.Now().Format("2006-01-02")
	}

	revenue, err := h.db.GetRevenueStats(c.Request.Context(), clinicID, branchID, dateFrom, dateTo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": revenue})
}

func (h *AnalyticsHandler) Patients(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	patients, total, err := h.db.ListPatients(c.Request.Context(), "", "", "", page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": patients, "total": total})
}

func (h *AnalyticsHandler) Doctors(c *gin.Context) {
	clinicID := c.GetString("clinic_id")

	staff, total, err := h.db.ListStaff(c.Request.Context(), clinicID, "doctor", 1, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": staff, "total": total})
}

func (h *AnalyticsHandler) Appointments(c *gin.Context) {
	clinicID := c.GetString("clinic_id")
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	if dateFrom == "" {
		dateFrom = time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	}
	if dateTo == "" {
		dateTo = time.Now().Format("2006-01-02")
	}

	appointments, total, err := h.db.GetAppointmentStats(c.Request.Context(), clinicID, dateFrom, dateTo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": appointments, "total": total})
}

type ReferenceHandler struct {
	db *postgres.PoolWrapper
}

func NewReferenceHandler(db *postgres.PoolWrapper) *ReferenceHandler {
	return &ReferenceHandler{db: db}
}

func (h *ReferenceHandler) Services(c *gin.Context) {
	clinicID := c.GetString("clinic_id")

	groups, err := h.db.ListServiceGroups(c.Request.Context(), clinicID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": groups})
}

func (h *ReferenceHandler) ServiceGroups(c *gin.Context) {
	clinicID := c.GetString("clinic_id")

	groups, err := h.db.ListServiceGroups(c.Request.Context(), clinicID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": groups})
}

// ListAllServices returns individual service rows from the services table (not groups).
// This is the correct endpoint for populating the service selection dropdown.
func (h *ReferenceHandler) ListAllServices(c *gin.Context) {
	clinicID := c.GetString("clinic_id")

	services, err := h.db.ListAllServices(c.Request.Context(), clinicID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": services})
}

func (h *ReferenceHandler) ICD10(c *gin.Context) {
	query := c.Query("q")

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' required"})
		return
	}

	codes, err := h.db.SearchICD10(c.Request.Context(), query, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": codes})
}

func (h *ReferenceHandler) Territories(c *gin.Context) {
	parentID := c.Query("parent_id")

	var parentPtr *string
	if parentID != "" {
		parentPtr = &parentID
	}

	territories, err := h.db.ListTerritories(c.Request.Context(), parentPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": territories})
}

func (h *ReferenceHandler) PaymentMethods(c *gin.Context) {
	c.JSON(http.StatusOK, []string{"cash", "card", "transfer", "deposit", "relatives_deposit"})
}

func (h *ReferenceHandler) Roles(c *gin.Context) {
	c.JSON(http.StatusOK, []gin.H{
		{"id": "super_admin", "name": "Супер Администратор"},
		{"id": "clinic_admin", "name": "Администратор клиники"},
		{"id": "director", "name": "Директор"},
		{"id": "doctor", "name": "Врач"},
		{"id": "registrar", "name": "Регистратор"},
		{"id": "cashier", "name": "Кассир"},
		{"id": "lab_tech", "name": "Лаборант"},
	})
}

type ClinicHandler struct {
	db *postgres.PoolWrapper
}

func NewClinicHandler(db *postgres.PoolWrapper) *ClinicHandler {
	return &ClinicHandler{db: db}
}

func (h *ClinicHandler) List(c *gin.Context) {
	clinics, err := h.db.ListClinics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": clinics, "total": len(clinics)})
}

func (h *ClinicHandler) Get(c *gin.Context) {
	id := c.Param("id")

	clinic, err := h.db.GetClinicByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Clinic not found"})
		return
	}

	c.JSON(http.StatusOK, clinic)
}

func (h *ClinicHandler) Create(c *gin.Context) {
	var req domain.Clinic
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.ID = uuid.New()
	req.IsActive = true

	if err := h.db.CreateClinic(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Clinic created", "clinic_id": req.ID})
}

func (h *ClinicHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.UpdateClinic(c.Request.Context(), id, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Clinic updated"})
}

type BranchHandler struct {
	db *postgres.PoolWrapper
}

func NewBranchHandler(db *postgres.PoolWrapper) *BranchHandler {
	return &BranchHandler{db: db}
}

func (h *BranchHandler) List(c *gin.Context) {
	clinicID := c.GetString("clinic_id")

	branches, err := h.db.ListBranches(c.Request.Context(), clinicID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": branches, "total": len(branches)})
}

func (h *BranchHandler) Get(c *gin.Context) {
	id := c.Param("id")

	branch, err := h.db.GetBranchByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Branch not found"})
		return
	}

	c.JSON(http.StatusOK, branch)
}

func (h *BranchHandler) Create(c *gin.Context) {
	clinicID, _ := uuid.Parse(c.GetString("clinic_id"))

	var req domain.Branch
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.ID = uuid.New()
	req.ClinicID = clinicID
	req.IsActive = true

	if err := h.db.CreateBranch(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Branch created", "branch_id": req.ID})
}

func (h *BranchHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.UpdateBranch(c.Request.Context(), id, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Branch updated"})
}

type UserHandler struct {
	db *postgres.PoolWrapper
}

func NewUserHandler(db *postgres.PoolWrapper) *UserHandler {
	return &UserHandler{db: db}
}

func (h *UserHandler) List(c *gin.Context) {
	clinicID := c.GetString("clinic_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	users, total, err := h.db.ListUsers(c.Request.Context(), clinicID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": users, "total": total})
}

func (h *UserHandler) Get(c *gin.Context) {
	id := c.Param("id")

	user, err := h.db.GetUserByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) Create(c *gin.Context) {
	var req domain.User
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.ID = uuid.New()
	req.IsActive = true

	if err := h.db.CreateUser(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created", "user_id": req.ID})
}

func (h *UserHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.UpdateUser(c.Request.Context(), id, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated"})
}

func (h *UserHandler) Deactivate(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.DeactivateUser(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deactivated"})
}

func (h *UserHandler) Profile(c *gin.Context) {
	userID := c.GetString("user_id")

	user, err := h.db.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.UpdateUser(c.Request.Context(), userID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated"})
}

func (h *UserHandler) ChangePassword(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Password changed"})
}

type WebSocketHandler struct {
	db *postgres.PoolWrapper
}

func NewWebSocketHandler(db *postgres.PoolWrapper) *WebSocketHandler {
	return &WebSocketHandler{db: db}
}

func (h *WebSocketHandler) QueueHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "WebSocket connection required"})
}

// mustMarshalJSON - helper to marshal or return empty object
func mustMarshalJSON(v interface{}) []byte {
	b, err := json.Marshal(v)
	if err != nil {
		return []byte("{}")
	}
	return b
}
