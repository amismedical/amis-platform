package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/amis/medverse-annahl/internal/repository/postgres"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// MedicalCardHandler - Handler for medical card operations
type MedicalCardHandler struct {
	db *postgres.PoolWrapper
}

func NewMedicalCardHandler(db *postgres.PoolWrapper) *MedicalCardHandler {
	return &MedicalCardHandler{db: db}
}

// GetPatientMedicalCard - GET /api/v1/patients/:id/medical-card
func (h *MedicalCardHandler) GetPatientMedicalCard(c *gin.Context) {
	patientID := c.Param("id")
	ctx := c.Request.Context()

	card, err := h.db.GetMedicalCard(ctx, patientID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"data":    nil,
			"message": "Medical card not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": card})
}

// CreatePatientMedicalCard - POST /api/v1/patients/:id/medical-card
func (h *MedicalCardHandler) CreatePatientMedicalCard(c *gin.Context) {
	patientID := c.Param("id")
	var req struct {
		BloodType         string `json:"blood_type"`
		RHFactor          string `json:"rh_factor"`
		Allergies         string `json:"allergies"`
		ChronicConditions string `json:"chronic_conditions"`
		FamilyHistory     string `json:"family_history"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userIDStr := c.GetString("user_id")
	clinicIDStr := c.GetString("clinic_id")

	userID, _ := uuid.Parse(userIDStr)
	clinicID, _ := uuid.Parse(clinicIDStr)
	patientUUID, _ := uuid.Parse(patientID)

	input := postgres.CreateMedicalCardInput{
		ClinicID:          clinicID,
		PatientID:        patientUUID,
		BloodType:        req.BloodType,
		RHFactor:         req.RHFactor,
		Allergies:        req.Allergies,
		ChronicConditions: req.ChronicConditions,
		FamilyHistory:    req.FamilyHistory,
		CreatedBy:        &userID,
	}

	card, err := h.db.CreateMedicalCard(ctx, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": card, "message": "Medical card created"})
}

// UpdatePatientMedicalCard - PUT /api/v1/patients/:id/medical-card
func (h *MedicalCardHandler) UpdatePatientMedicalCard(c *gin.Context) {
	patientID := c.Param("id")
	var req struct {
		BloodType         string `json:"blood_type"`
		RHFactor          string `json:"rh_factor"`
		Allergies         string `json:"allergies"`
		ChronicConditions string `json:"chronic_conditions"`
		FamilyHistory     string `json:"family_history"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userID := uuid.Nil
	_ = c.GetString("user_id")

	// Convert strings to pointers
	bloodTypePtr := &req.BloodType
	rhFactorPtr := &req.RHFactor
	allergiesPtr := &req.Allergies
	chronicConditionsPtr := &req.ChronicConditions
	familyHistoryPtr := &req.FamilyHistory

	input := postgres.UpdateMedicalCardInput{
		BloodType:         bloodTypePtr,
		RHFactor:          rhFactorPtr,
		Allergies:         allergiesPtr,
		ChronicConditions: chronicConditionsPtr,
		FamilyHistory:     familyHistoryPtr,
		UpdatedBy:         &userID,
	}

	if err := h.db.UpdateMedicalCard(ctx, patientID, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Medical card updated"})
}

// GetPatientEpisodes - GET /api/v1/patients/:id/episodes
func (h *MedicalCardHandler) GetPatientEpisodes(c *gin.Context) {
	patientID := c.Param("id")
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)

	ctx := c.Request.Context()
	episodes, err := h.db.GetPatientEpisodes(ctx, patientID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": episodes})
}

// CreatePatientEpisode - POST /api/v1/patients/:id/episodes
func (h *MedicalCardHandler) CreatePatientEpisode(c *gin.Context) {
	patientID := c.Param("id")
	var req struct {
		Title            string  `json:"title"`
		DoctorID         string  `json:"doctor_id" binding:"required"`
		ReferralDoctorID string  `json:"referral_doctor_id"`
		AppointmentID    string  `json:"appointment_id"`
		TemplateID       string  `json:"template_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userIDStr := c.GetString("user_id")
	clinicIDStr := c.GetString("clinic_id")
	branchIDStr := c.GetString("branch_id")

	userID, _ := uuid.Parse(userIDStr)
	clinicID, _ := uuid.Parse(clinicIDStr)
	patientUUID, _ := uuid.Parse(patientID)
	doctorID, _ := uuid.Parse(req.DoctorID)

	var branchID, referralDoctorID, appointmentID, templateID *uuid.UUID
	if branchIDStr != "" {
		b, _ := uuid.Parse(branchIDStr)
		branchID = &b
	}
	if req.ReferralDoctorID != "" {
		rd, _ := uuid.Parse(req.ReferralDoctorID)
		referralDoctorID = &rd
	}
	if req.AppointmentID != "" {
		aid, _ := uuid.Parse(req.AppointmentID)
		appointmentID = &aid
	}
	if req.TemplateID != "" {
		tid, _ := uuid.Parse(req.TemplateID)
		templateID = &tid
	}

	input := postgres.CreateEpisodeInput{
		ClinicID:         clinicID,
		BranchID:         branchID,
		PatientID:       patientUUID,
		DoctorID:         doctorID,
		ReferralDoctorID: referralDoctorID,
		Title:            req.Title,
		TemplateID:       templateID,
		AppointmentID:    appointmentID,
		CreatedBy:        &userID,
	}

	episode, err := h.db.CreateEpisodeEx(ctx, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": episode, "message": "Episode created"})
}

// GetEpisode - GET /api/v1/episodes/:id
func (h *MedicalCardHandler) GetEpisode(c *gin.Context) {
	episodeID := c.Param("id")
	ctx := c.Request.Context()

	episode, err := h.db.GetEpisodeByID(ctx, episodeID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Episode not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": episode})
}

// UpdateEpisode - PUT /api/v1/episodes/:id
func (h *MedicalCardHandler) UpdateEpisode(c *gin.Context) {
	episodeID := c.Param("id")
	var req struct {
		Title      string `json:"title"`
		Conclusion string `json:"conclusion"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userIDStr := c.GetString("user_id")
	userID, _ := uuid.Parse(userIDStr)

	var titlePtr, conclusionPtr *string
	if req.Title != "" {
		titlePtr = &req.Title
	}
	if req.Conclusion != "" {
		conclusionPtr = &req.Conclusion
	}

	input := postgres.UpdateEpisodeInput{
		Title:      titlePtr,
		Conclusion: conclusionPtr,
		UpdatedBy:  &userID,
	}

	if err := h.db.UpdateEpisodeEx(ctx, episodeID, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Episode updated"})
}

// CompleteEpisode - POST /api/v1/episodes/:id/complete
func (h *MedicalCardHandler) CompleteEpisode(c *gin.Context) {
	episodeID := c.Param("id")
	var req struct {
		Conclusion string `json:"conclusion"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userIDStr := c.GetString("user_id")
	userID, _ := uuid.Parse(userIDStr)

	if err := h.db.CompleteEpisode(ctx, episodeID, req.Conclusion, &userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Episode completed"})
}

// CancelEpisode - POST /api/v1/episodes/:id/cancel
func (h *MedicalCardHandler) CancelEpisode(c *gin.Context) {
	episodeID := c.Param("id")
	var req struct {
		Reason string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userIDStr := c.GetString("user_id")
	userID, _ := uuid.Parse(userIDStr)

	if err := h.db.CancelEpisode(ctx, episodeID, req.Reason, &userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Episode cancelled"})
}

// GetEpisodeExamination - GET /api/v1/episodes/:id/examination
func (h *MedicalCardHandler) GetEpisodeExamination(c *gin.Context) {
	episodeID := c.Param("id")
	ctx := c.Request.Context()

	examination, err := h.db.GetEpisodeExamination(ctx, episodeID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"data": nil})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": examination})
}

// CreateOrUpdateExamination - PUT /api/v1/episodes/:id/examination
func (h *MedicalCardHandler) CreateOrUpdateExamination(c *gin.Context) {
	episodeID := c.Param("id")
	var req struct {
		Complaints  string `json:"complaints"`
		Examination string `json:"examination"`
		Notes       string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userIDStr := c.GetString("user_id")
	branchIDStr := c.GetString("branch_id")

	userID, _ := uuid.Parse(userIDStr)
	episodeUUID, _ := uuid.Parse(episodeID)
	doctorID, _ := uuid.Parse(c.GetString("user_id"))

	var branchID *uuid.UUID
	if branchIDStr != "" {
		b, _ := uuid.Parse(branchIDStr)
		branchID = &b
	}

	input := postgres.CreateExaminationInput{
		EpisodeID:   episodeUUID,
		DoctorID:    doctorID,
		BranchID:     branchID,
		VisitDate:   time.Now(),
		Complaints:  req.Complaints,
		Examination: req.Examination,
		Notes:       req.Notes,
		CreatedBy:   &userID,
	}

	examination, err := h.db.CreateOrUpdateExamination(ctx, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": examination, "message": "Examination saved"})
}

// GetEpisodeAnthropometry - GET /api/v1/episodes/:id/anthropometry
func (h *MedicalCardHandler) GetEpisodeAnthropometry(c *gin.Context) {
	episodeID := c.Param("id")
	ctx := c.Request.Context()

	vitals, err := h.db.GetEpisodeVitals(ctx, episodeID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"data": nil})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": vitals})
}

// CreateOrUpdateAnthropometry - POST /api/v1/episodes/:id/anthropometry
func (h *MedicalCardHandler) CreateOrUpdateAnthropometry(c *gin.Context) {
	episodeID := c.Param("id")
	var req struct {
		Height             *float64 `json:"height"`
		Weight             *float64 `json:"weight"`
		Temperature        *float64 `json:"temperature"`
		BPSystolic         *int     `json:"bp_systolic"`
		BPDiastolic        *int     `json:"bp_diastolic"`
		Pulse              *int     `json:"pulse"`
		BloodSugar         *float64 `json:"blood_sugar"`
		Waist              *float64 `json:"waist"`
		HeadCircumference  *float64 `json:"head_circumference"`
		ChestCircumference *float64 `json:"chest_circumference"`
		Comments           *string  `json:"comments"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userIDStr := c.GetString("user_id")
	branchIDStr := c.GetString("branch_id")

	userID, _ := uuid.Parse(userIDStr)
	episodeUUID, _ := uuid.Parse(episodeID)

	var branchID *uuid.UUID
	if branchIDStr != "" {
		b, _ := uuid.Parse(branchIDStr)
		branchID = &b
	}

	input := postgres.CreateVitalsInput{
		EpisodeID:          episodeUUID,
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
		BranchID:           branchID,
		CreatedBy:          &userID,
	}

	vitals, err := h.db.CreateOrUpdateVitals(ctx, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": vitals, "message": "Anthropometry saved"})
}

// GetEpisodeDiagnoses - GET /api/v1/episodes/:id/diagnoses
func (h *MedicalCardHandler) GetEpisodeDiagnoses(c *gin.Context) {
	episodeID := c.Param("id")
	ctx := c.Request.Context()

	diagnoses, err := h.db.GetEpisodeDiagnoses(ctx, episodeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": diagnoses})
}

// CreateDiagnosis - POST /api/v1/episodes/:id/diagnoses
func (h *MedicalCardHandler) CreateDiagnosis(c *gin.Context) {
	episodeID := c.Param("id")
	var req struct {
		ICDCode string `json:"icd_code" binding:"required"`
		ICDName string `json:"icd_name" binding:"required"`
		Type    string `json:"type"`    // main, сопутствующий, осложнение
		Status  string `json:"status"` // preliminary, confirmed
		Notes   string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userIDStr := c.GetString("user_id")
	branchIDStr := c.GetString("branch_id")

	userID, _ := uuid.Parse(userIDStr)
	episodeUUID, _ := uuid.Parse(episodeID)

	var branchID *uuid.UUID
	if branchIDStr != "" {
		b, _ := uuid.Parse(branchIDStr)
		branchID = &b
	}

	diagType := req.Type
	if diagType == "" {
		diagType = "main"
	}
	diagStatus := req.Status
	if diagStatus == "" {
		diagStatus = "preliminary"
	}

	input := postgres.CreateDiagnosisInput{
		EpisodeID: episodeUUID,
		ICDCode:   req.ICDCode,
		ICDName:   req.ICDName,
		Type:      diagType,
		Status:    diagStatus,
		Notes:     req.Notes,
		BranchID:  branchID,
		CreatedBy: &userID,
	}

	diagnosis, err := h.db.CreateDiagnosisEx(ctx, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": diagnosis, "message": "Diagnosis added"})
}

// UpdateDiagnosis - PUT /api/v1/diagnoses/:id
func (h *MedicalCardHandler) UpdateDiagnosis(c *gin.Context) {
	diagnosisID := c.Param("id")
	var req struct {
		ICDCode *string `json:"icd_code"`
		ICDName *string `json:"icd_name"`
		Type    *string `json:"type"`
		Status  *string `json:"status"`
		Notes   *string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userIDStr := c.GetString("user_id")
	userID, _ := uuid.Parse(userIDStr)

	input := postgres.UpdateDiagnosisInput{
		ICDCode:   req.ICDCode,
		ICDName:   req.ICDName,
		Type:      req.Type,
		Status:    req.Status,
		Notes:     req.Notes,
		UpdatedBy: &userID,
	}

	if err := h.db.UpdateDiagnosis(ctx, diagnosisID, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Diagnosis updated"})
}

// DeleteDiagnosis - DELETE /api/v1/diagnoses/:id
func (h *MedicalCardHandler) DeleteDiagnosis(c *gin.Context) {
	diagnosisID := c.Param("id")
	ctx := c.Request.Context()

	if err := h.db.DeleteDiagnosis(ctx, diagnosisID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Diagnosis deleted"})
}

// SearchICD10 - GET /api/v1/icd10/search?q=
func (h *MedicalCardHandler) SearchICD10(c *gin.Context) {
	query := c.Query("q")
	limitStr := c.DefaultQuery("limit", "20")
	limit, _ := strconv.Atoi(limitStr)

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' is required"})
		return
	}

	ctx := c.Request.Context()
	codes, err := h.db.SearchICD10(ctx, query, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": codes})
}

// GetEpisodeRecommendations - GET /api/v1/episodes/:id/recommendations
func (h *MedicalCardHandler) GetEpisodeRecommendations(c *gin.Context) {
	episodeID := c.Param("id")
	ctx := c.Request.Context()

	recommendations, err := h.db.GetEpisodeRecommendations(ctx, episodeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": recommendations})
}

// CreateRecommendation - POST /api/v1/episodes/:id/recommendations
func (h *MedicalCardHandler) CreateRecommendation(c *gin.Context) {
	episodeID := c.Param("id")
	var req struct {
		Type         string  `json:"type" binding:"required"` // анализы, процедуры, консультации, медикаменты, образ_жизни
		ServiceID    *string `json:"service_id"`
		Description  string  `json:"description" binding:"required"`
		Instructions string  `json:"instructions"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userIDStr := c.GetString("user_id")
	branchIDStr := c.GetString("branch_id")

	userID, _ := uuid.Parse(userIDStr)
	episodeUUID, _ := uuid.Parse(episodeID)

	var branchID, serviceID *uuid.UUID
	if branchIDStr != "" {
		b, _ := uuid.Parse(branchIDStr)
		branchID = &b
	}
	if req.ServiceID != nil && *req.ServiceID != "" {
		s, _ := uuid.Parse(*req.ServiceID)
		serviceID = &s
	}

	input := postgres.CreateRecommendationInput{
		EpisodeID:    episodeUUID,
		Type:         req.Type,
		ServiceID:    serviceID,
		Description:  req.Description,
		Instructions: req.Instructions,
		BranchID:     branchID,
		CreatedBy:    &userID,
	}

	recommendation, err := h.db.CreateRecommendationEx(ctx, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": recommendation, "message": "Recommendation added"})
}

// GetEpisodeFiles - GET /api/v1/episodes/:id/files
func (h *MedicalCardHandler) GetEpisodeFiles(c *gin.Context) {
	episodeID := c.Param("id")
	ctx := c.Request.Context()

	files, err := h.db.GetEpisodeFiles(ctx, episodeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": files})
}

// CreateEpisodeFile - POST /api/v1/episodes/:id/files
func (h *MedicalCardHandler) CreateEpisodeFile(c *gin.Context) {
	episodeID := c.Param("id")
	var req struct {
		Name     string `json:"name" binding:"required"`
		FileType string `json:"file_type" binding:"required"`
		FilePath string `json:"file_path" binding:"required"`
		FileSize int    `json:"file_size"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	userIDStr := c.GetString("user_id")
	branchIDStr := c.GetString("branch_id")

	userID, _ := uuid.Parse(userIDStr)
	episodeUUID, _ := uuid.Parse(episodeID)

	var branchID *uuid.UUID
	if branchIDStr != "" {
		b, _ := uuid.Parse(branchIDStr)
		branchID = &b
	}

	input := postgres.CreateEpisodeFileInput{
		EpisodeID:  episodeUUID,
		Name:       req.Name,
		FileType:   req.FileType,
		FilePath:   req.FilePath,
		FileSize:   req.FileSize,
		UploadedBy: &userID,
		BranchID:   branchID,
	}

	file, err := h.db.CreateEpisodeFile(ctx, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": file, "message": "File uploaded"})
}