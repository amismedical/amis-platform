package handler

/**
 * AMIS - Staff Handler
 * TZ Module: Xodimlar boshqarish
 * Status: REAL BUSINESS LOGIC - Staff CRUD implemented
 */

import (
	"net/http"
	"strconv"

	"github.com/amis/medverse-annahl/internal/domain"
	"github.com/amis/medverse-annahl/internal/repository/postgres"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type StaffHandler struct {
	db interface{}
}

func NewStaffHandler(db interface{}) *StaffHandler {
	return &StaffHandler{db: db}
}

// ListStaff - Xodimlar ro'yxati
// GET /api/v1/staff
func (h *StaffHandler) ListStaff(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)

	// Get query params
	clinicID := c.Query("clinic_id")
	role := c.Query("role") // specialty filter

	// Parse pagination
	page := 1
	limit := 50
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	staff, total, err := pool.ListStaff(c.Request.Context(), clinicID, role, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list staff"})
		return
	}

	// Return empty array if nil
	if staff == nil {
		staff = []domain.Staff{}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        staff,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (total + limit - 1) / limit,
	})
}

// GetStaff - Xodim ma'lumoti
// GET /api/v1/staff/:id
func (h *StaffHandler) GetStaff(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)
	id := c.Param("id")

	staff, err := pool.GetStaffByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Staff not found"})
		return
	}

	c.JSON(http.StatusOK, staff)
}

// CreateStaff - Yangi xodim
// POST /api/v1/staff
func (h *StaffHandler) CreateStaff(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)

	var input struct {
		ClinicID      string  `json:"clinic_id" binding:"required"`
		BranchID      *string `json:"branch_id"`
		UserID        *string `json:"user_id"`
		FirstName     string  `json:"first_name" binding:"required"`
		LastName      string  `json:"last_name" binding:"required"`
		Patronymic    string  `json:"patronymic"`
		Specialty     string  `json:"specialty"`
		Position      string  `json:"position" binding:"required"`
		Phone         string  `json:"phone" binding:"required"`
		Cabinet       string  `json:"cabinet"`
		Schedule      string  `json:"schedule"`
		Qualification string  `json:"qualification"`
		PhotoURL      string  `json:"photo_url"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	clinicID, err := uuid.Parse(input.ClinicID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid clinic_id"})
		return
	}

	var branchID, userID *uuid.UUID
	if input.BranchID != nil {
		parsed, _ := uuid.Parse(*input.BranchID)
		branchID = &parsed
	}
	if input.UserID != nil {
		parsed, _ := uuid.Parse(*input.UserID)
		userID = &parsed
	}

	staff := &domain.Staff{
		ID:            uuid.New(),
		ClinicID:      clinicID,
		BranchID:      branchID,
		UserID:        userID,
		FirstName:     input.FirstName,
		LastName:      input.LastName,
		Patronymic:    input.Patronymic,
		Specialty:     input.Specialty,
		Position:      input.Position,
		Phone:         input.Phone,
		Cabinet:       input.Cabinet,
		Schedule:      input.Schedule,
		Qualification: input.Qualification,
		PhotoURL:      input.PhotoURL,
		IsActive:      true,
	}

	if err := pool.CreateStaff(c.Request.Context(), staff); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create staff"})
		return
	}

	c.JSON(http.StatusCreated, staff)
}

// UpdateStaff - Xodimni yangilash
// PUT /api/v1/staff/:id
func (h *StaffHandler) UpdateStaff(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)
	id := c.Param("id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Remove immutable fields
	delete(updates, "id")
	delete(updates, "clinic_id")
	delete(updates, "created_at")

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	if err := pool.UpdateStaff(c.Request.Context(), id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update staff"})
		return
	}

	// Return updated staff
	staff, err := pool.GetStaffByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Staff updated but failed to fetch"})
		return
	}

	c.JSON(http.StatusOK, staff)
}

// DeactivateStaff - Xodimni faolsizlantirish
// DELETE /api/v1/staff/:id
func (h *StaffHandler) DeactivateStaff(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)
	id := c.Param("id")

	if err := pool.DeactivateStaff(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate staff"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Staff deactivated successfully"})
}

// GetDoctorSchedule - Shifokor jadvali
// GET /api/v1/staff/:id/schedule
func (h *StaffHandler) GetDoctorSchedule(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Get doctor schedule - business logic pending",
		"data":    []interface{}{},
	})
}

// UpdateDoctorSchedule - Shifokor jadvalini yangilash
// PUT /api/v1/staff/:id/schedule
func (h *StaffHandler) UpdateDoctorSchedule(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Update doctor schedule - business logic pending",
	})
}

// GetDoctorAbsences - Shifokor kelmasliklari
// GET /api/v1/staff/:id/absences
func (h *StaffHandler) GetDoctorAbsences(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Get doctor absences - business logic pending",
		"data":    []interface{}{},
	})
}

// CreateAbsence - Kelmaslik yaratish
// POST /api/v1/staff/:id/absences
func (h *StaffHandler) CreateAbsence(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{
		"message": "Create absence - business logic pending",
	})
}

// GetDoctorStatistics - Shifokor statistikasi
// GET /api/v1/staff/:id/statistics
func (h *StaffHandler) GetDoctorStatistics(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Get doctor statistics - business logic pending",
	})
}

// ListDoctors - Shifokorlar ro'yxati (alias for ListStaff with doctor filter)
// GET /api/v1/staff/doctors
func (h *StaffHandler) ListDoctors(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)

	clinicID := c.Query("clinic_id")
	page := 1
	limit := 50
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	// Filter by doctor specialty
	staff, total, err := pool.ListStaff(c.Request.Context(), clinicID, "doctor", page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list doctors"})
		return
	}

	if staff == nil {
		staff = []domain.Staff{}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        staff,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (total + limit - 1) / limit,
	})
}

// GetDoctorProfile - Shifokor profili
// GET /api/v1/staff/doctors/:id/profile
func (h *StaffHandler) GetDoctorProfile(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)
	id := c.Param("id")

	staff, err := pool.GetStaffByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
		return
	}

	c.JSON(http.StatusOK, staff)
}

// List - Alias for ListStaff
func (h *StaffHandler) List(c *gin.Context) {
	h.ListStaff(c)
}

// Get - Alias for GetStaff
func (h *StaffHandler) Get(c *gin.Context) {
	h.GetStaff(c)
}

// Schedule - Alias for GetDoctorSchedule
func (h *StaffHandler) Schedule(c *gin.Context) {
	h.GetDoctorSchedule(c)
}

// Statistics - Alias for GetDoctorStatistics
func (h *StaffHandler) Statistics(c *gin.Context) {
	h.GetDoctorStatistics(c)
}

// Create - Alias for CreateStaff
func (h *StaffHandler) Create(c *gin.Context) {
	h.CreateStaff(c)
}

// Update - Alias for UpdateStaff
func (h *StaffHandler) Update(c *gin.Context) {
	h.UpdateStaff(c)
}

// Deactivate - Alias for DeactivateStaff
func (h *StaffHandler) Deactivate(c *gin.Context) {
	h.DeactivateStaff(c)
}
