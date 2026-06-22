package handler

import (
	"net/http"
	"time"

	"github.com/amis/medverse-annahl/internal/domain"
	"github.com/amis/medverse-annahl/internal/repository/postgres"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AppointmentHandler struct {
	db interface{}
}

func NewAppointmentHandler(db interface{}) *AppointmentHandler {
	return &AppointmentHandler{db: db}
}

func (h *AppointmentHandler) List(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)

	page := 1
	limit := 20

	patientID := c.Query("patient_id")
	doctorID := c.Query("doctor_id")
	status := c.Query("status")
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	appointments, total, err := pool.ListAppointments(c.Request.Context(), patientID, doctorID, status, dateFrom, dateTo, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list appointments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        appointments,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (total + limit - 1) / limit,
	})
}

func (h *AppointmentHandler) Get(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)
	id := c.Param("id")

	appointment, err := pool.GetAppointmentByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	c.JSON(http.StatusOK, appointment)
}

func (h *AppointmentHandler) Create(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)

	var input struct {
		PatientID        string `json:"patient_id" binding:"required"`
		DoctorID         string `json:"doctor_id" binding:"required"`
		ServiceID        string `json:"service_id" binding:"required"`
		AppointmentDate  string `json:"appointment_date" binding:"required"`
		StartTime        string `json:"start_time" binding:"required"`
		BookingMethod    string `json:"booking_method"`
		ReferralDoctorID string `json:"referral_doctor_id"`
		ContractID       string `json:"contract_id"`
		Cabinet          string `json:"cabinet"`
		Notes            string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	clinicID, _ := c.Get("clinic_id")
	branchID, _ := c.Get("branch_id")

	appointment := &domain.Appointment{
		ID:            uuid.New(),
		ClinicID:      uuid.MustParse(clinicID.(string)),
		BranchID:      uuid.MustParse(branchID.(string)),
		PatientID:     uuid.MustParse(input.PatientID),
		DoctorID:      uuid.MustParse(input.DoctorID),
		ServiceID:     uuid.MustParse(input.ServiceID),
		Status:        "scheduled",
		BookingMethod: "manual",
		Cabinet:       input.Cabinet,
		Notes:         input.Notes,
	}

	if input.AppointmentDate != "" {
		appointment.AppointmentDate = parseDate(input.AppointmentDate)
	}
	appointment.StartTime = input.StartTime

	if input.BookingMethod != "" {
		appointment.BookingMethod = input.BookingMethod
	}

	if input.ReferralDoctorID != "" {
		refID, _ := uuid.Parse(input.ReferralDoctorID)
		appointment.ReferralDoctorID = &refID
	}

	if input.ContractID != "" {
		contractID, _ := uuid.Parse(input.ContractID)
		appointment.ContractID = &contractID
	}

	if err := pool.CreateAppointment(c.Request.Context(), appointment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create appointment"})
		return
	}

	c.JSON(http.StatusCreated, appointment)
}

func (h *AppointmentHandler) Update(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)
	id := c.Param("id")

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := pool.UpdateAppointment(c.Request.Context(), id, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update appointment"})
		return
	}

	appointment, _ := pool.GetAppointmentByID(c.Request.Context(), id)
	c.JSON(http.StatusOK, appointment)
}

func (h *AppointmentHandler) UpdateStatus(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)
	id := c.Param("id")

	var input struct {
		Status       string `json:"status" binding:"required"`
		CancelReason string `json:"cancel_reason"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	updates := map[string]interface{}{
		"status": input.Status,
	}

	if input.Status == "cancelled" {
		updates["cancelled_at"] = time.Now()
		updates["cancel_reason"] = input.CancelReason
	}

	if err := pool.UpdateAppointment(c.Request.Context(), id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update appointment status"})
		return
	}

	appointment, _ := pool.GetAppointmentByID(c.Request.Context(), id)
	c.JSON(http.StatusOK, appointment)
}

func (h *AppointmentHandler) Cancel(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)
	id := c.Param("id")

	var input struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&input)

	updates := map[string]interface{}{
		"status":        "cancelled",
		"cancelled_at":  time.Now(),
		"cancel_reason": input.Reason,
	}

	if err := pool.UpdateAppointment(c.Request.Context(), id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel appointment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Appointment cancelled"})
}

func (h *AppointmentHandler) Calendar(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)

	doctorID := c.Query("doctor_id")
	date := c.Query("date")
	branchID := c.Query("branch_id")

	appointments, err := pool.GetCalendar(c.Request.Context(), doctorID, date, branchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get calendar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"date":  date,
		"slots": appointments,
	})
}
