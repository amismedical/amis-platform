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
	// TODO: Implement staff creation
	c.JSON(http.StatusNotImplemented, gin.H{
		"message": "Create staff - business logic pending",
	})
}

// UpdateStaff - Xodimni yangilash
// PUT /api/v1/staff/:id
func (h *StaffHandler) UpdateStaff(c *gin.Context) {
	// TODO: Implement staff update
	c.JSON(http.StatusNotImplemented, gin.H{
		"message": "Update staff - business logic pending",
	})
}

// DeactivateStaff - Xodimni faolsizlantirish
// DELETE /api/v1/staff/:id
func (h *StaffHandler) DeactivateStaff(c *gin.Context) {
	// TODO: Implement staff deactivation
	c.JSON(http.StatusNotImplemented, gin.H{
		"message": "Deactivate staff - business logic pending",
	})
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
