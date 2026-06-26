package handler

import (
	"log"
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

	clinicID, _ := c.Get("clinic_id")
	clinicIDStr := ""
	if cid, ok := clinicID.(string); ok {
		clinicIDStr = cid
	}

	patientID := c.Query("patient_id") // UUID filter for Patient 360 / detail page
	patientSearch := c.Query("search")  // text search (first_name, last_name, phone)
	doctorID := c.Query("doctor_id")
	status := c.Query("status")
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	appointments, total, err := pool.ListAppointments(
		c.Request.Context(),
		clinicIDStr, status, doctorID, patientID, patientSearch,
		dateFrom, dateTo, page, limit,
	)
	log.Printf("[ListAppointments] clinicID=%q status=%q doctorID=%q dateFrom=%q total=%d count=%d err=%v",
		clinicIDStr, status, doctorID, dateFrom, total, len(appointments), err)
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
		DoctorID        string `json:"doctor_id" binding:"required"`
		ServiceID       string `json:"service_id"`
		AppointmentDate string `json:"appointment_date" binding:"required"`
		StartTime       string `json:"start_time" binding:"required"`
		BookingMethod   string `json:"booking_method"`
		Cabinet         string `json:"cabinet"`
		Notes           string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "So'rov noto'g'ri", "details": err.Error()})
		return
	}

	// Safely parse clinic_id from auth context (never panic)
	clinicIDVal, _ := c.Get("clinic_id")
	var clinicID uuid.UUID
	if cid, ok := clinicIDVal.(string); ok && cid != "" {
		if parsed, err := uuid.Parse(cid); err == nil {
			clinicID = parsed
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Klinika ID noto'g'ri formatda"})
			return
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Klinika aniqlanmagan"})
		return
	}

	// Safely parse branch_id
	branchIDVal, _ := c.Get("branch_id")
	var branchID uuid.UUID
	if bid, ok := branchIDVal.(string); ok && bid != "" {
		if parsed, err := uuid.Parse(bid); err == nil {
			branchID = parsed
		}
	}

	// Safely parse required UUID fields
	patientID, err := uuid.Parse(input.PatientID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bemor ID noto'g'ri formatda"})
		return
	}

	doctorID, err := uuid.Parse(input.DoctorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Shifokor ID noto'g'ri formatda"})
		return
	}

	// Safely parse optional service_id: nil when empty/invalid, pointer when valid
	var serviceID *uuid.UUID
	if input.ServiceID != "" {
		if parsed, err := uuid.Parse(input.ServiceID); err == nil {
			serviceID = &parsed
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Xizmat ID noto'g'ri formatda"})
			return
		}
	}

	appointment := &domain.Appointment{
		ID:            uuid.New(),
		ClinicID:      clinicID,
		BranchID:      branchID,
		PatientID:     patientID,
		DoctorID:      doctorID,
		ServiceID:     serviceID,
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

	// Use CreateAppointmentWithQueueEntry — creates BOTH appointment AND queue_entry atomically
	entryID, _, err := pool.CreateAppointmentWithQueueEntry(c.Request.Context(), appointment, input.Cabinet)
	if err != nil {
		log.Printf("[CreateAppointmentWithQueueEntry] DB error: patient_id=%s doctor_id=%s service_id=%v date=%s start=%s cabinet=%s err=%v",
			patientID, doctorID, serviceID, input.AppointmentDate, input.StartTime, input.Cabinet, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Qabul yaratishda xatolik", "details": err.Error()})
		return
	}

	log.Printf("[CreateAppointment] Success: appointment_id=%s queue_entry_id=%s patient_id=%s doctor_id=%s cabinet=%s",
		appointment.ID, entryID, patientID, doctorID, appointment.Cabinet)

	c.JSON(http.StatusCreated, gin.H{
		"message":        "Appointment and queue entry created successfully",
		"appointment_id":  appointment.ID,
		"queue_entry_id": entryID,
		"appointment":     appointment,
	})
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

// GetEpisodeByAppointment - GET /api/v1/appointments/:id/episode
// Returns the episode linked to this appointment, or null if none exists.
// Used by Medical Card to prevent duplicate episode creation.
func (h *AppointmentHandler) GetEpisodeByAppointment(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)
	appointmentID := c.Param("id")

	episode, err := pool.GetEpisodeByAppointmentID(c.Request.Context(), appointmentID)
	if err != nil {
		// No episode found for this appointment is NOT an error — return null
		c.JSON(http.StatusOK, gin.H{"data": nil})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": episode})
}
