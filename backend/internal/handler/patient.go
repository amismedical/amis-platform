package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/amis/medverse-annahl/internal/domain"
	"github.com/amis/medverse-annahl/internal/repository/postgres"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PatientHandler struct {
	db interface{}
}

func NewPatientHandler(db interface{}) *PatientHandler {
	return &PatientHandler{db: db}
}

func (h *PatientHandler) List(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)

	page := 1
	limit := 20
	if p := c.Query("page"); p != "" {
		page = 1
	}

	search := c.Query("search")
	gender := c.Query("gender")
	citizenship := c.Query("citizenship")

	patients, total, err := pool.ListPatients(c.Request.Context(), search, gender, citizenship, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list patients"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        patients,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (total + limit - 1) / limit,
	})
}

func (h *PatientHandler) Get(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)
	id := c.Param("id")

	patient, err := pool.GetPatientByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		return
	}

	c.JSON(http.StatusOK, patient)
}

func (h *PatientHandler) Create(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)

	var input struct {
		FirstName       string `json:"first_name" binding:"required"`
		LastName        string `json:"last_name" binding:"required"`
		Patronymic      string `json:"patronymic"`
		BirthDate       string `json:"birth_date" binding:"required"`
		Gender          string `json:"gender" binding:"required"`
		Phone           string `json:"phone" binding:"required"`
		Phone2          string `json:"phone_2"`
		Email           string `json:"email"`
		Citizenship     string `json:"citizenship"`
		Address         string `json:"address"`
		Passport        string `json:"passport"`
		PriceCategoryID string `json:"price_category_id"`
		Notes           string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	clinicIDStr, _ := c.Get("clinic_id")
	clinicID := uuid.MustParse(clinicIDStr.(string))

	// Generate MED-ID (format: LIFE-YYYY-XXXXXXXX)
	medID := generateMedID()

	patient := &domain.Patient{
		ID:             uuid.New(),
		ClinicID:       clinicID,
		MedID:          medID,
		FirstName:      input.FirstName,
		LastName:       input.LastName,
		Patronymic:     input.Patronymic,
		Gender:         input.Gender,
		Phone:          input.Phone,
		Phone2:         input.Phone2,
		Email:          input.Email,
		Citizenship:    input.Citizenship,
		Address:        input.Address,
		Passport:       input.Passport,
		Notes:          input.Notes,
		DepositBalance: 0,
		IsActive:       true,
	}

	if input.BirthDate != "" {
		patient.BirthDate = parseDate(input.BirthDate)
	}

	if input.PriceCategoryID != "" {
		priceCatID, _ := uuid.Parse(input.PriceCategoryID)
		patient.PriceCategoryID = &priceCatID
	}

	if err := pool.CreatePatient(c.Request.Context(), patient); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create patient"})
		return
	}

	c.JSON(http.StatusCreated, patient)
}

// generateMedID creates a unique MED-ID for the patient
func generateMedID() string {
	year := time.Now().Year()
	// Use random suffix for uniqueness
	randStr := uuid.New().String()[:8]
	return fmt.Sprintf("LIFE-%d-%s", year, randStr)
}

func (h *PatientHandler) Update(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)
	id := c.Param("id")

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := pool.UpdatePatient(c.Request.Context(), id, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update patient"})
		return
	}

	patient, _ := pool.GetPatientByID(c.Request.Context(), id)
	c.JSON(http.StatusOK, patient)
}

func (h *PatientHandler) MedicalCard(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)
	id := c.Param("id")

	patient, err := pool.GetPatientByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		return
	}

	episodes, _ := pool.GetPatientEpisodes(c.Request.Context(), id, 50)
	vitals, _ := pool.GetPatientVitals(c.Request.Context(), id)

	c.JSON(http.StatusOK, gin.H{
		"patient":  patient,
		"episodes": episodes,
		"vitals":   vitals,
	})
}

func (h *PatientHandler) Deposits(c *gin.Context) {
	pool := h.db.(*postgres.PoolWrapper)
	id := c.Param("id")

	deposits, err := pool.GetPatientDeposits(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get deposits"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": deposits})
}

func parseDate(dateStr string) time.Time {
	if dateStr == "" {
		return time.Time{}
	}
	t, _ := time.Parse("2006-01-02", dateStr)
	return t
}
