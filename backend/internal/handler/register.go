package handler

/**
 * AMIS - Register Handler
 * TZ Module: Registratura
 * Stub implementation - uses PoolWrapper repository methods
 */

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/amis/medverse-annahl/internal/domain"
	"github.com/amis/medverse-annahl/internal/repository/postgres"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RegisterHandler struct {
	patientRepo     *postgres.PatientRepository
	appointmentRepo *postgres.AppointmentRepository
	queueRepo       *postgres.QueueRepository
	invoiceRepo     *postgres.InvoiceRepository
	auditRepo       *postgres.AuditRepository
	db              *postgres.PoolWrapper
}

func NewRegisterHandler(
	patientRepo *postgres.PatientRepository,
	appointmentRepo *postgres.AppointmentRepository,
	queueRepo *postgres.QueueRepository,
	invoiceRepo *postgres.InvoiceRepository,
	auditRepo *postgres.AuditRepository,
	pool *postgres.PoolWrapper,
) *RegisterHandler {
	return &RegisterHandler{
		patientRepo:     patientRepo,
		appointmentRepo: appointmentRepo,
		queueRepo:       queueRepo,
		invoiceRepo:     invoiceRepo,
		auditRepo:       auditRepo,
		db:              pool,
	}
}

// CreateAppointmentRequest - Request for creating appointment with new patient
type CreateAppointmentRequest struct {
	LastName        string `json:"last_name" binding:"required"`
	FirstName       string `json:"first_name" binding:"required"`
	Patronymic      string `json:"patronymic"`
	BirthDate       string `json:"birth_date" binding:"required"`
	Phone           string `json:"phone" binding:"required"`
	Citizenship     string `json:"citizenship"`
	Gender          string `json:"gender"`
	Address         string `json:"address"`
	Email           string `json:"email"`
	ServiceID       string `json:"service_id"`
	DoctorID        string `json:"doctor_id"`
	AppointmentDate string `json:"appointment_date" binding:"required"`
	StartTime       string `json:"start_time" binding:"required"`
	BookingMethod   string `json:"booking_method"`
	Cabinet         string `json:"cabinet"` // optional override; falls back to doctor.cabinet
}

// GetActiveAppointments - GET /api/v1/register/appointments/active
func (h *RegisterHandler) GetActiveAppointments(c *gin.Context) {
	ctx := c.Request.Context()
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	clinicID, _ := c.Get("clinic_id")
	clinicIDStr := ""
	if cid, ok := clinicID.(string); ok {
		clinicIDStr = cid
	}

	appointments, total, err := h.db.ListAppointments(ctx, clinicIDStr, "", "", "", "", "", page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": appointments, "total": total, "page": page, "limit": limit})
}

// GetCompletedAppointments - GET /api/v1/register/appointments/completed
func (h *RegisterHandler) GetCompletedAppointments(c *gin.Context) {
	ctx := c.Request.Context()
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	clinicID, _ := c.Get("clinic_id")
	clinicIDStr := ""
	if cid, ok := clinicID.(string); ok {
		clinicIDStr = cid
	}

	appointments, total, err := h.db.ListAppointments(ctx, clinicIDStr, "completed", "", "", "", "", page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": appointments, "total": total, "page": page, "limit": limit})
}

// GetCancelledAppointments - GET /api/v1/register/appointments/cancelled
func (h *RegisterHandler) GetCancelledAppointments(c *gin.Context) {
	ctx := c.Request.Context()
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	clinicID, _ := c.Get("clinic_id")
	clinicIDStr := ""
	if cid, ok := clinicID.(string); ok {
		clinicIDStr = cid
	}

	appointments, total, err := h.db.ListAppointments(ctx, clinicIDStr, "cancelled", "", "", "", "", page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": appointments, "total": total, "page": page, "limit": limit})
}

// CreateAppointment - POST /api/v1/register/appointments
// Creates: patient → appointment + queue_entry (in transaction) → invoice
func (h *RegisterHandler) CreateAppointment(c *gin.Context) {
	var req CreateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	ctx := c.Request.Context()

	clinicID, _ := c.Get("clinic_id")
	clinicIDStr := ""
	if cid, ok := clinicID.(string); ok {
		clinicIDStr = cid
	}

	branchID, _ := c.Get("branch_id")
	branchIDStr := ""
	if bid, ok := branchID.(string); ok {
		branchIDStr = bid
	}

	userID, _ := c.Get("user_id")
	userIDStr := ""
	if uid, ok := userID.(string); ok {
		userIDStr = uid
	}

	// 1. Find or create patient
	patients, _, err := h.db.ListPatients(ctx, req.Phone, "", "", 1, 1)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search patients", "message": err.Error()})
		return
	}

	var patientID uuid.UUID
	if len(patients) > 0 {
		patientID = patients[0].ID
	} else {
		birthDate, _ := time.Parse("2006-01-02", req.BirthDate)
		newPatient := &domain.Patient{
			ID:             uuid.New(),
			FirstName:      req.FirstName,
			LastName:       req.LastName,
			Patronymic:     req.Patronymic,
			BirthDate:      birthDate,
			Gender:         req.Gender,
			Phone:          req.Phone,
			Citizenship:    req.Citizenship,
			Address:        req.Address,
			Email:          req.Email,
			DepositBalance: 0,
			IsActive:       true,
		}
		if clinicIDStr != "" {
			clinicUUID, _ := uuid.Parse(clinicIDStr)
			newPatient.ClinicID = clinicUUID
		}
		if err := h.db.CreatePatient(ctx, newPatient); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create patient", "message": err.Error()})
			return
		}
		patientID = newPatient.ID
	}

	// 2. Build appointment and create with queue entry in single transaction
	appointmentDate, _ := time.Parse("2006-01-02", req.AppointmentDate)
	appointment := &domain.Appointment{
		ID:              uuid.New(),
		Status:          "scheduled",
		AppointmentDate: appointmentDate,
		StartTime:       req.StartTime,
		BookingMethod:   req.BookingMethod,
		Notes:           "",
	}
	if clinicIDStr != "" {
		clinicUUID, _ := uuid.Parse(clinicIDStr)
		appointment.ClinicID = clinicUUID
	}
	if branchIDStr != "" {
		branchUUID, _ := uuid.Parse(branchIDStr)
		appointment.BranchID = branchUUID
	}
	appointment.PatientID = patientID
	if req.DoctorID != "" {
		doctorUUID, _ := uuid.Parse(req.DoctorID)
		appointment.DoctorID = doctorUUID
	} else {
		appointment.DoctorID = uuid.Nil
	}
	if req.ServiceID != "" {
		serviceUUID, _ := uuid.Parse(req.ServiceID)
		appointment.ServiceID = &serviceUUID
	}

	// Cabinet resolution: explicit override > doctor.cabinet (done inside CreateAppointmentWithQueueEntry)
	entryID, _, err := h.db.CreateAppointmentWithQueueEntry(ctx, appointment, req.Cabinet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create appointment", "message": err.Error()})
		return
	}

	// 3. Create invoice (outside appointment transaction — best-effort)
	var invoiceID uuid.UUID
	serviceName := "Medical Service"
	totalAmount := 0.0
	if req.ServiceID != "" {
		service, svcErr := h.db.GetServiceByID(ctx, req.ServiceID)
		if svcErr == nil && service != nil {
			totalAmount = service.BasePrice
			serviceName = service.Name
		}
	}

	invoice := &domain.Invoice{
		ID:             uuid.New(),
		ClinicID:       appointment.ClinicID,
		BranchID:       appointment.BranchID,
		PatientID:      patientID,
		AppointmentID:   &appointment.ID,
		TotalAmount:    totalAmount,
		DiscountAmount: 0,
		PaidAmount:     0,
		Status:         "open",
	}
	if userIDStr != "" {
		userUUID, _ := uuid.Parse(userIDStr)
		invoice.CreatedBy = userUUID
	}

	if invErr := h.db.CreateInvoice(ctx, invoice); invErr == nil {
		invoiceID = invoice.ID
		// Add invoice item if service was selected
		if req.ServiceID != "" && appointment.ServiceID != nil {
			item := &domain.InvoiceItem{
				ID:          uuid.New(),
				InvoiceID:   invoice.ID,
				ServiceID:   *appointment.ServiceID,
				ServiceName: serviceName,
				Quantity:    1,
				UnitPrice:   totalAmount,
				Discount:    0,
				TotalPrice:  totalAmount,
			}
			h.db.CreateInvoiceItem(ctx, item) // best-effort
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":        "Appointment created successfully",
		"patient_id":     patientID,
		"appointment_id": appointment.ID,
		"queue_entry_id": *entryID,
		"invoice_id":     invoiceID,
	})
}

// UpdateAppointment - PUT /api/v1/register/appointments/:id
func (h *RegisterHandler) UpdateAppointment(c *gin.Context) {
	idStr := c.Param("id")
	_, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Appointment updated"})
}

// CancelAppointment - POST /api/v1/register/appointments/:id/cancel
func (h *RegisterHandler) CancelAppointment(c *gin.Context) {
	idStr := c.Param("id")
	_, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req) // optional — ignore errors

	updates := map[string]interface{}{
		"status":        "cancelled",
		"cancelled_at":  time.Now(),
	}
	if req.Reason != "" {
		updates["cancel_reason"] = req.Reason
	}

	userIDStr := c.GetString("user_id")
	if userIDStr != "" {
		if uid, err := uuid.Parse(userIDStr); err == nil {
			updates["cancelled_by"] = uid
		}
	}

	if err := h.db.UpdateAppointment(c.Request.Context(), idStr, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Cancel failed: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Appointment cancelled"})
}

// SearchPatient - GET /api/v1/register/patients/search
func (h *RegisterHandler) SearchPatient(c *gin.Context) {
	ctx := c.Request.Context()
	search := c.Query("q")
	gender := c.Query("gender")
	citizenship := c.Query("citizenship")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	patients, total, err := h.db.ListPatients(ctx, search, gender, citizenship, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": patients, "total": total, "page": page, "limit": limit})
}

// GetAvailableSlots - GET /api/v1/register/slots
func (h *RegisterHandler) GetAvailableSlots(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": []interface{}{}})
}

// GetQueueStatus - GET /api/v1/register/queue/status
func (h *RegisterHandler) GetQueueStatus(c *gin.Context) {
	ctx := c.Request.Context()
	clinicID, _ := c.Get("clinic_id")
	clinicIDStr := ""
	if cid, ok := clinicID.(string); ok {
		clinicIDStr = cid
	}

	queues, err := h.db.ListQueues(ctx, clinicIDStr, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": queues})
}

// GetStatistics - GET /api/v1/register/statistics
func (h *RegisterHandler) GetStatistics(c *gin.Context) {
	ctx := c.Request.Context()
	clinicID, _ := c.Get("clinic_id")
	clinicIDStr := ""
	if cid, ok := clinicID.(string); ok {
		clinicIDStr = cid
	}

	today := time.Now().Format("2006-01-02")
	appointments, _, _ := h.db.ListAppointments(ctx, clinicIDStr, "", "", "", today, today, 1, 1000)
	patients, _, _ := h.db.ListPatients(ctx, "", "", "", 1, 10000)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"today_appointments": len(appointments),
			"total_patients":     len(patients),
			"date":               today,
		},
	})
}

// GetAppointmentDetails - GET /api/v1/register/appointments/:id
func (h *RegisterHandler) GetAppointmentDetails(c *gin.Context) {
	idStr := c.Param("id")
	_, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Get appointment details - business logic pending",
	})
}

// ExportAppointments - GET /api/v1/register/appointments/export
func (h *RegisterHandler) ExportAppointments(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Export appointments - business logic pending",
		"data":    []interface{}{},
	})
}

// SearchPatients - Alias for SearchPatient
func (h *RegisterHandler) SearchPatients(c *gin.Context) {
	h.SearchPatient(c)
}

// RegisterToQueue - POST /api/v1/register/queue
// Wires real queue registration: find or auto-create queue, get next number, create entry.
func (h *RegisterHandler) RegisterToQueue(c *gin.Context) {
	var req struct {
		PatientID     string `json:"patient_id" binding:"required"`
		ServiceID     string `json:"service_id"`
		DoctorID      string `json:"doctor_id"`
		AppointmentID string `json:"appointment_id"`
		Cabinet       string `json:"cabinet"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	ctx := c.Request.Context()

	// Resolve context values
	var clinicID uuid.UUID
	if cidStr := c.GetString("clinic_id"); cidStr != "" {
		clinicID, _ = uuid.Parse(cidStr)
	}
	var branchID *uuid.UUID
	if bidStr := c.GetString("branch_id"); bidStr != "" {
		bid, _ := uuid.Parse(bidStr)
		branchID = &bid
	}
	var userID *uuid.UUID
	if uidStr := c.GetString("user_id"); uidStr != "" {
		uid, _ := uuid.Parse(uidStr)
		userID = &uid
	}

	patientUUID, err := uuid.Parse(req.PatientID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	// Find existing active queue for clinic, or auto-create one
	queues, err := h.db.ListQueues(ctx, clinicID.String(), "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list queues", "message": err.Error()})
		return
	}

	var queueID uuid.UUID
	if len(queues) == 0 {
		// Auto-create default queue for the clinic
		queueID = uuid.New()
		var branchUUID uuid.UUID
		if branchID != nil {
			branchUUID = *branchID
		}
		newQueue := &domain.Queue{
			ID:        queueID,
			ClinicID:  clinicID,
			BranchID:  branchUUID,
			Name:      "Asosiy navbat",
			QueueType: "general",
			IsActive:  true,
		}
		if err := h.db.CreateQueue(ctx, newQueue); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create queue", "message": err.Error()})
			return
		}
	} else {
		queueID = queues[0].ID
	}

	// Get next queue number
	queueNum, _ := h.db.GetNextQueueNumber(ctx, queueID.String())

	// Build queue entry
	entry := &domain.QueueEntry{
		ID:           uuid.New(),
		QueueID:      queueID,
		ClinicID:     clinicID,
		BranchID:     branchID,
		PatientID:    patientUUID,
		QueueNumber:  queueNum,
		Status:       "waiting",
		RegisteredAt: time.Now(),
		Cabinet:      req.Cabinet,
		CreatedBy:    userID,
	}

	if req.AppointmentID != "" {
		aptUUID, _ := uuid.Parse(req.AppointmentID)
		entry.AppointmentID = &aptUUID
	}
	if req.DoctorID != "" {
		docUUID, _ := uuid.Parse(req.DoctorID)
		entry.DoctorID = &docUUID
	}

	if err := h.db.CreateQueueEntry(ctx, entry); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register to queue", "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Bemor navbatga qo'shildi",
		"queue_number": fmt.Sprintf("A-%03d", queueNum),
		"entry_id":     entry.ID,
		"status":       "waiting",
	})
}

// GetQueueStatus - Alias for queue status
func (h *RegisterHandler) GetQueue(c *gin.Context) {
	h.GetQueueStatus(c)
}
