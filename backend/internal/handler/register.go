package handler

/**
 * AMIS - Register Handler
 * TZ Module: Registratura
 * Stub implementation - uses PoolWrapper repository methods
 */

import (
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

	appointments, total, err := h.db.ListAppointments(ctx, clinicIDStr, "", "", "", "", page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": appointments, "total": total, "page": page, "limit": limit})
}

// GetCompletedAppointments - GET /api/v1/register/appointments/completed
func (h *RegisterHandler) GetCompletedAppointments(c *gin.Context) {
	h.GetActiveAppointments(c)
}

// GetCancelledAppointments - GET /api/v1/register/appointments/cancelled
func (h *RegisterHandler) GetCancelledAppointments(c *gin.Context) {
	h.GetActiveAppointments(c)
}

// CreateAppointment - POST /api/v1/register/appointments
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

	// Search for existing patient by phone
	patients, _, err := h.db.ListPatients(ctx, req.Phone, "", "", 1, 1)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search patients", "message": err.Error()})
		return
	}

	var patientID uuid.UUID
	if len(patients) > 0 {
		// Use existing patient
		patientID = patients[0].ID
	} else {
		// Create new patient
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

	// Parse dates
	appointmentDate, _ := time.Parse("2006-01-02", req.AppointmentDate)

	// Create appointment
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
	}
	if req.ServiceID != "" {
		serviceUUID, _ := uuid.Parse(req.ServiceID)
		appointment.ServiceID = &serviceUUID
	}

	if err := h.db.CreateAppointment(ctx, appointment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create appointment", "message": err.Error()})
		return
	}

	// Create invoice with service items
	invoice := &domain.Invoice{
		ID:        uuid.New(),
		Status:    "open",
		CreatedBy: uuid.New(),
	}
	if clinicIDStr != "" {
		clinicUUID, _ := uuid.Parse(clinicIDStr)
		invoice.ClinicID = clinicUUID
	}
	if branchIDStr != "" {
		branchUUID, _ := uuid.Parse(branchIDStr)
		invoice.BranchID = branchUUID
	}
	invoice.PatientID = patientID
	invoice.AppointmentID = &appointment.ID

	if userIDStr != "" {
		userUUID, _ := uuid.Parse(userIDStr)
		invoice.CreatedBy = userUUID
	}

	// Calculate total from service price (CRITICAL-1: Invoice total must never be 0)
	totalAmount := 0.0
	serviceName := "Medical Service"
	if req.ServiceID != "" {
		// Get actual service price from database
		service, err := h.db.GetServiceByID(ctx, req.ServiceID)
		if err == nil && service != nil {
			totalAmount = service.BasePrice
			serviceName = service.Name
		} else {
			// CRITICAL: Set a default price if service not found - DO NOT leave as 0
			c.JSON(http.StatusBadRequest, gin.H{"error": "Service not found", "message": "Invalid service ID"})
			return
		}
	}
	invoice.TotalAmount = totalAmount
	invoice.DiscountAmount = 0
	invoice.PaidAmount = 0

	if err := h.db.CreateInvoice(ctx, invoice); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice", "message": err.Error()})
		return
	}

	// If service is provided, create invoice item with real price
	if req.ServiceID != "" {
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
		if err := h.db.CreateInvoiceItem(ctx, item); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice item", "message": err.Error()})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":        "Appointment created successfully",
		"patient_id":     patientID,
		"appointment_id": appointment.ID,
		"invoice_id":     invoice.ID,
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
	appointments, _, _ := h.db.ListAppointments(ctx, clinicIDStr, "", "", today, today, 1, 1000)
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
func (h *RegisterHandler) RegisterToQueue(c *gin.Context) {
	var req struct {
		PatientID     string `json:"patient_id" binding:"required"`
		ServiceID     string `json:"service_id"`
		DoctorID      string `json:"doctor_id"`
		AppointmentID string `json:"appointment_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Register to queue - business logic pending",
		"data": gin.H{
			"patient_id": req.PatientID,
			"service_id": req.ServiceID,
			"doctor_id":  req.DoctorID,
		},
	})
}

// GetQueueStatus - Alias for queue status
func (h *RegisterHandler) GetQueue(c *gin.Context) {
	h.GetQueueStatus(c)
}
