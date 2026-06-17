package handler

/**
 * AMIS - Patient Profile Handler
 * TASK-002: Patient Profile API Handler Layer
 *
 * Handles all patient profile related endpoints:
 * - Patient Profile (basic medical data)
 * - Patient Documents
 * - Patient Contacts
 * - Patient Relatives
 * - Patient Allergies
 * - Patient Deposit Transactions
 * - Patient Death Info
 * - Patient Questionnaires
 */

import (
	"net/http"
	"time"

	"github.com/amis/medverse-annahl/internal/repository/postgres"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PatientProfileHandler struct {
	db *postgres.PoolWrapper
}

func NewPatientProfileHandler(db *postgres.PoolWrapper) *PatientProfileHandler {
	return &PatientProfileHandler{db: db}
}

// Helper to get context values
func getContextValues(c *gin.Context) (clinicID *uuid.UUID, branchID *uuid.UUID, userID *uuid.UUID) {
	if cid, exists := c.Get("clinic_id"); exists && cid != "" {
		if s, ok := cid.(string); ok && s != "" {
			if parsed, err := uuid.Parse(s); err == nil {
				clinicID = &parsed
			}
		}
	}
	if bid, exists := c.Get("branch_id"); exists && bid != "" {
		if s, ok := bid.(string); ok && s != "" {
			if parsed, err := uuid.Parse(s); err == nil {
				branchID = &parsed
			}
		}
	}
	if uid, exists := c.Get("user_id"); exists && uid != "" {
		if s, ok := uid.(string); ok && s != "" {
			if parsed, err := uuid.Parse(s); err == nil {
				userID = &parsed
			}
		}
	}
	return
}

// ============================================
// PATIENT PROFILE ENDPOINTS
// ============================================

// GetPatientProfile - GET /api/v1/patients/:id/profile
func (h *PatientProfileHandler) GetProfile(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	profileRepo := postgres.NewPatientProfileRepository(h.db.Pool)
	profile, err := profileRepo.GetByPatientID(c.Request.Context(), patientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient profile not found"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdatePatientProfile - PUT /api/v1/patients/:id/profile
func (h *PatientProfileHandler) UpdateProfile(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	var input struct {
		BloodType       *string  `json:"blood_type"`
		RhFactor        *string  `json:"rh_factor"`
		Height          *float64 `json:"height"`
		Weight          *float64 `json:"weight"`
		Allergies       *[]string `json:"allergies"`
		ChronicDiseases *[]string `json:"chronic_diseases"`
		Disabilities    *string   `json:"disabilities"`
		Notes           *string   `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	_, branchID, userID := getContextValues(c)

	// Check if profile exists
	profileRepo := postgres.NewPatientProfileRepository(h.db.Pool)
	existing, err := profileRepo.GetByPatientID(c.Request.Context(), patientID)
	if err != nil {
		// Create new profile
		createInput := postgres.CreatePatientProfileInput{
			PatientID:       patientID,
			ClinicID:        nil,
			BloodType:       "",
			RhFactor:        "",
			Height:          0,
			Weight:          0,
			Allergies:       []string{},
			ChronicDiseases: []string{},
			Disabilities:    "",
			Notes:           "",
			CreatedBy:       userID,
		}
		if input.BloodType != nil {
			createInput.BloodType = *input.BloodType
		}
		if input.RhFactor != nil {
			createInput.RhFactor = *input.RhFactor
		}
		if input.Height != nil {
			createInput.Height = *input.Height
		}
		if input.Weight != nil {
			createInput.Weight = *input.Weight
		}
		if input.Allergies != nil {
			createInput.Allergies = *input.Allergies
		}
		if input.ChronicDiseases != nil {
			createInput.ChronicDiseases = *input.ChronicDiseases
		}
		if input.Disabilities != nil {
			createInput.Disabilities = *input.Disabilities
		}
		if input.Notes != nil {
			createInput.Notes = *input.Notes
		}
		_ = branchID

		newProfile, err := profileRepo.Create(c.Request.Context(), createInput)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create profile"})
			return
		}
		c.JSON(http.StatusCreated, newProfile)
		return
	}

	// Update existing profile
	updateInput := postgres.UpdatePatientProfileInput{
		UpdatedBy: userID,
	}
	if input.BloodType != nil {
		updateInput.BloodType = input.BloodType
	}
	if input.RhFactor != nil {
		updateInput.RhFactor = input.RhFactor
	}
	if input.Height != nil {
		updateInput.Height = input.Height
	}
	if input.Weight != nil {
		updateInput.Weight = input.Weight
	}
	if input.Allergies != nil {
		updateInput.Allergies = input.Allergies
	}
	if input.ChronicDiseases != nil {
		updateInput.ChronicDiseases = input.ChronicDiseases
	}
	if input.Disabilities != nil {
		updateInput.Disabilities = input.Disabilities
	}
	if input.Notes != nil {
		updateInput.Notes = input.Notes
	}
	_ = branchID
	_ = existing

	if err := profileRepo.Update(c.Request.Context(), patientID, updateInput); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	updated, _ := profileRepo.GetByPatientID(c.Request.Context(), patientID)
	c.JSON(http.StatusOK, updated)
}

// ============================================
// PATIENT DOCUMENT ENDPOINTS
// ============================================

// GetDocuments - GET /api/v1/patients/:id/documents
func (h *PatientProfileHandler) GetDocuments(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	docRepo := postgres.NewPatientDocumentRepository(h.db.Pool)
	docs, err := docRepo.GetByPatientID(c.Request.Context(), patientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get documents"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": docs})
}

// CreateDocument - POST /api/v1/patients/:id/documents
func (h *PatientProfileHandler) CreateDocument(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	var input struct {
		DocumentType   string  `json:"document_type" binding:"required"`
		DocumentNumber string  `json:"document_number"`
		IssuedBy      string  `json:"issued_by"`
		IssueDate     *string `json:"issue_date"`
		ExpiryDate    *string `json:"expiry_date"`
		FilePath      string  `json:"file_path"`
		Notes         string  `json:"notes"`
		IsPrimary     bool    `json:"is_primary"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	clinicID, branchID, userID := getContextValues(c)

	var issueDate, expiryDate *time.Time
	if input.IssueDate != nil {
		t, _ := time.Parse("2006-01-02", *input.IssueDate)
		issueDate = &t
	}
	if input.ExpiryDate != nil {
		t, _ := time.Parse("2006-01-02", *input.ExpiryDate)
		expiryDate = &t
	}

	createInput := postgres.CreatePatientDocumentInput{
		PatientID:      patientID,
		ClinicID:       clinicID,
		DocumentType:   input.DocumentType,
		DocumentNumber: input.DocumentNumber,
		IssuedBy:      input.IssuedBy,
		IssueDate:     issueDate,
		ExpiryDate:    expiryDate,
		FilePath:      input.FilePath,
		Notes:         input.Notes,
		IsPrimary:     input.IsPrimary,
		CreatedBy:     userID,
	}

	docRepo := postgres.NewPatientDocumentRepository(h.db.Pool)
	doc, err := docRepo.Create(c.Request.Context(), createInput)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create document"})
		return
	}
	_ = branchID

	c.JSON(http.StatusCreated, doc)
}

// UpdateDocument - PUT /api/v1/patients/:id/documents/:documentId
func (h *PatientProfileHandler) UpdateDocument(c *gin.Context) {
	documentIDStr := c.Param("documentId")
	documentID, err := uuid.Parse(documentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	var input struct {
		DocumentNumber *string `json:"document_number"`
		IssuedBy      *string `json:"issued_by"`
		IssueDate     *string `json:"issue_date"`
		ExpiryDate    *string `json:"expiry_date"`
		FilePath      *string `json:"file_path"`
		Notes         *string `json:"notes"`
		IsPrimary     *bool   `json:"is_primary"`
		IsVerified    *bool   `json:"is_verified"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, _, userID := getContextValues(c)

	var issueDate, expiryDate *time.Time
	if input.IssueDate != nil {
		t, _ := time.Parse("2006-01-02", *input.IssueDate)
		issueDate = &t
	}
	if input.ExpiryDate != nil {
		t, _ := time.Parse("2006-01-02", *input.ExpiryDate)
		expiryDate = &t
	}

	updateInput := postgres.UpdatePatientDocumentInput{
		DocumentNumber: input.DocumentNumber,
		IssuedBy:      input.IssuedBy,
		IssueDate:     issueDate,
		ExpiryDate:    expiryDate,
		FilePath:      input.FilePath,
		Notes:         input.Notes,
		IsPrimary:     input.IsPrimary,
		IsVerified:   input.IsVerified,
		UpdatedBy:     userID,
	}

	docRepo := postgres.NewPatientDocumentRepository(h.db.Pool)
	if err := docRepo.Update(c.Request.Context(), documentID, updateInput); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update document"})
		return
	}

	doc, _ := docRepo.GetByID(c.Request.Context(), documentID)
	c.JSON(http.StatusOK, doc)
}

// DeleteDocument - DELETE /api/v1/patients/:id/documents/:documentId
func (h *PatientProfileHandler) DeleteDocument(c *gin.Context) {
	documentIDStr := c.Param("documentId")
	documentID, err := uuid.Parse(documentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document ID"})
		return
	}

	docRepo := postgres.NewPatientDocumentRepository(h.db.Pool)
	if err := docRepo.Delete(c.Request.Context(), documentID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete document"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Document deleted"})
}

// ============================================
// PATIENT CONTACT ENDPOINTS
// ============================================

// GetContacts - GET /api/v1/patients/:id/contacts
func (h *PatientProfileHandler) GetContacts(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	contactRepo := postgres.NewPatientContactRepository(h.db.Pool)
	contacts, err := contactRepo.GetByPatientID(c.Request.Context(), patientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get contacts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": contacts})
}

// CreateContact - POST /api/v1/patients/:id/contacts
func (h *PatientProfileHandler) CreateContact(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	var input struct {
		ContactType  string `json:"contact_type" binding:"required"`
		Name         string `json:"name" binding:"required"`
		Relationship string `json:"relationship"`
		Phone        string `json:"phone"`
		Email        string `json:"email"`
		Address      string `json:"address"`
		IsPrimary    bool   `json:"is_primary"`
		Notes        string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	clinicID, _, userID := getContextValues(c)

	createInput := postgres.CreatePatientContactInput{
		PatientID:    patientID,
		ClinicID:     clinicID,
		ContactType:  input.ContactType,
		Name:         input.Name,
		Relationship: input.Relationship,
		Phone:        input.Phone,
		Email:        input.Email,
		Address:      input.Address,
		IsPrimary:    input.IsPrimary,
		Notes:        input.Notes,
		CreatedBy:    userID,
	}

	contactRepo := postgres.NewPatientContactRepository(h.db.Pool)
	contact, err := contactRepo.Create(c.Request.Context(), createInput)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create contact"})
		return
	}

	c.JSON(http.StatusCreated, contact)
}

// UpdateContact - PUT /api/v1/patients/:id/contacts/:contactId
func (h *PatientProfileHandler) UpdateContact(c *gin.Context) {
	contactIDStr := c.Param("contactId")
	contactID, err := uuid.Parse(contactIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid contact ID"})
		return
	}

	var input struct {
		ContactType  *string `json:"contact_type"`
		Name         *string `json:"name"`
		Relationship *string `json:"relationship"`
		Phone        *string `json:"phone"`
		Email        *string `json:"email"`
		Address      *string `json:"address"`
		IsPrimary    *bool   `json:"is_primary"`
		Notes        *string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, _, userID := getContextValues(c)

	updateInput := postgres.UpdatePatientContactInput{
		ContactType:  input.ContactType,
		Name:         input.Name,
		Relationship: input.Relationship,
		Phone:        input.Phone,
		Email:        input.Email,
		Address:      input.Address,
		IsPrimary:    input.IsPrimary,
		Notes:        input.Notes,
		UpdatedBy:    userID,
	}

	contactRepo := postgres.NewPatientContactRepository(h.db.Pool)
	if err := contactRepo.Update(c.Request.Context(), contactID, updateInput); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update contact"})
		return
	}

	contact, _ := contactRepo.GetByID(c.Request.Context(), contactID)
	c.JSON(http.StatusOK, contact)
}

// DeleteContact - DELETE /api/v1/patients/:id/contacts/:contactId
func (h *PatientProfileHandler) DeleteContact(c *gin.Context) {
	contactIDStr := c.Param("contactId")
	contactID, err := uuid.Parse(contactIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid contact ID"})
		return
	}

	contactRepo := postgres.NewPatientContactRepository(h.db.Pool)
	if err := contactRepo.Delete(c.Request.Context(), contactID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete contact"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Contact deleted"})
}

// ============================================
// PATIENT RELATIVE ENDPOINTS
// ============================================

// GetRelatives - GET /api/v1/patients/:id/relatives
func (h *PatientProfileHandler) GetRelatives(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	relativeRepo := postgres.NewPatientRelativeRepository(h.db.Pool)
	relatives, err := relativeRepo.GetByPatientID(c.Request.Context(), patientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get relatives"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": relatives})
}

// CreateRelative - POST /api/v1/patients/:id/relatives
func (h *PatientProfileHandler) CreateRelative(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	var input struct {
		FullName     string  `json:"full_name" binding:"required"`
		Relationship string  `json:"relationship" binding:"required"`
		BirthDate    *string `json:"birth_date"`
		Gender       string  `json:"gender"`
		Phone        string  `json:"phone"`
		Email        string  `json:"email"`
		Address      string  `json:"address"`
		Occupation   string  `json:"occupation"`
		Workplace    string  `json:"workplace"`
		IsNextOfKin  bool    `json:"is_next_of_kin"`
		IsEmergency  bool    `json:"is_emergency"`
		IsInformed   bool    `json:"is_informed"`
		ConsentDate  *string `json:"consent_date"`
		Notes        string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	clinicID, _, userID := getContextValues(c)

	var birthDate, consentDate *time.Time
	if input.BirthDate != nil {
		t, _ := time.Parse("2006-01-02", *input.BirthDate)
		birthDate = &t
	}
	if input.ConsentDate != nil {
		t, _ := time.Parse("2006-01-02", *input.ConsentDate)
		consentDate = &t
	}

	createInput := postgres.CreatePatientRelativeInput{
		PatientID:    patientID,
		ClinicID:     clinicID,
		FullName:     input.FullName,
		Relationship: input.Relationship,
		DateOfBirth:  birthDate,
		Gender:       input.Gender,
		Phone:        input.Phone,
		Email:        input.Email,
		Address:      input.Address,
		Occupation:   input.Occupation,
		Workplace:    input.Workplace,
		IsNextOfKin:  input.IsNextOfKin,
		IsEmergency:  input.IsEmergency,
		IsInformed:   input.IsInformed,
		ConsentDate:  consentDate,
		Notes:        input.Notes,
		CreatedBy:    userID,
	}

	relativeRepo := postgres.NewPatientRelativeRepository(h.db.Pool)
	relative, err := relativeRepo.Create(c.Request.Context(), createInput)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create relative"})
		return
	}

	c.JSON(http.StatusCreated, relative)
}

// UpdateRelative - PUT /api/v1/patients/:id/relatives/:relativeId
func (h *PatientProfileHandler) UpdateRelative(c *gin.Context) {
	relativeIDStr := c.Param("relativeId")
	relativeID, err := uuid.Parse(relativeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid relative ID"})
		return
	}

	var input struct {
		FullName     *string `json:"full_name"`
		Relationship *string `json:"relationship"`
		BirthDate    *string `json:"birth_date"`
		Gender       *string `json:"gender"`
		Phone        *string `json:"phone"`
		Email        *string `json:"email"`
		Address      *string `json:"address"`
		Occupation   *string `json:"occupation"`
		Workplace    *string `json:"workplace"`
		IsNextOfKin  *bool   `json:"is_next_of_kin"`
		IsEmergency  *bool   `json:"is_emergency"`
		IsInformed   *bool   `json:"is_informed"`
		ConsentDate  *string `json:"consent_date"`
		Notes        *string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, _, userID := getContextValues(c)

	var birthDate, consentDate *time.Time
	if input.BirthDate != nil {
		t, _ := time.Parse("2006-01-02", *input.BirthDate)
		birthDate = &t
	}
	if input.ConsentDate != nil {
		t, _ := time.Parse("2006-01-02", *input.ConsentDate)
		consentDate = &t
	}

	updateInput := postgres.UpdatePatientRelativeInput{
		FullName:     input.FullName,
		Relationship: input.Relationship,
		DateOfBirth:  birthDate,
		Gender:       input.Gender,
		Phone:        input.Phone,
		Email:        input.Email,
		Address:      input.Address,
		Occupation:   input.Occupation,
		Workplace:    input.Workplace,
		IsNextOfKin:  input.IsNextOfKin,
		IsEmergency:  input.IsEmergency,
		IsInformed:   input.IsInformed,
		ConsentDate:  consentDate,
		Notes:        input.Notes,
		UpdatedBy:    userID,
	}

	relativeRepo := postgres.NewPatientRelativeRepository(h.db.Pool)
	if err := relativeRepo.Update(c.Request.Context(), relativeID, updateInput); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update relative"})
		return
	}

	relative, _ := relativeRepo.GetByID(c.Request.Context(), relativeID)
	c.JSON(http.StatusOK, relative)
}

// DeleteRelative - DELETE /api/v1/patients/:id/relatives/:relativeId
func (h *PatientProfileHandler) DeleteRelative(c *gin.Context) {
	relativeIDStr := c.Param("relativeId")
	relativeID, err := uuid.Parse(relativeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid relative ID"})
		return
	}

	relativeRepo := postgres.NewPatientRelativeRepository(h.db.Pool)
	if err := relativeRepo.Delete(c.Request.Context(), relativeID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete relative"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Relative deleted"})
}

// ============================================
// PATIENT ALLERGY ENDPOINTS
// ============================================

// GetAllergies - GET /api/v1/patients/:id/allergies
func (h *PatientProfileHandler) GetAllergies(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	allergyRepo := postgres.NewPatientAllergyRepository(h.db.Pool)
	allergies, err := allergyRepo.GetByPatientID(c.Request.Context(), patientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get allergies"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": allergies})
}

// CreateAllergy - POST /api/v1/patients/:id/allergies
func (h *PatientProfileHandler) CreateAllergy(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	var input struct {
		Allergen    string  `json:"allergen" binding:"required"`
		AllergyType string  `json:"allergy_type"`
		Severity    string  `json:"severity"`
		Reactions   string  `json:"reactions"`
		OnsetDate   *string `json:"onset_date"`
		IsVerified  bool    `json:"is_verified"`
		Notes       string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	clinicID, _, userID := getContextValues(c)

	var onsetDate *time.Time
	if input.OnsetDate != nil {
		t, _ := time.Parse("2006-01-02", *input.OnsetDate)
		onsetDate = &t
	}

	createInput := postgres.CreatePatientAllergyInput{
		PatientID:   patientID,
		ClinicID:    clinicID,
		Allergen:    input.Allergen,
		AllergyType: input.AllergyType,
		Severity:    input.Severity,
		Reactions:   input.Reactions,
		OnsetDate:   onsetDate,
		IsVerified:  input.IsVerified,
		Notes:       input.Notes,
		CreatedBy:   userID,
	}

	allergyRepo := postgres.NewPatientAllergyRepository(h.db.Pool)
	allergy, err := allergyRepo.Create(c.Request.Context(), createInput)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create allergy"})
		return
	}

	c.JSON(http.StatusCreated, allergy)
}

// UpdateAllergy - PUT /api/v1/patients/:id/allergies/:allergyId
func (h *PatientProfileHandler) UpdateAllergy(c *gin.Context) {
	allergyIDStr := c.Param("allergyId")
	allergyID, err := uuid.Parse(allergyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid allergy ID"})
		return
	}

	var input struct {
		Allergen    *string `json:"allergen"`
		AllergyType *string `json:"allergy_type"`
		Severity    *string `json:"severity"`
		Reactions   *string `json:"reactions"`
		OnsetDate   *string `json:"onset_date"`
		IsVerified  *bool   `json:"is_verified"`
		Notes       *string `json:"notes"`
		IsActive    *bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, _, userID := getContextValues(c)

	var onsetDate *time.Time
	if input.OnsetDate != nil {
		t, _ := time.Parse("2006-01-02", *input.OnsetDate)
		onsetDate = &t
	}

	updateInput := postgres.UpdatePatientAllergyInput{
		Allergen:    input.Allergen,
		AllergyType: input.AllergyType,
		Severity:    input.Severity,
		Reactions:   input.Reactions,
		OnsetDate:   onsetDate,
		IsVerified:  input.IsVerified,
		Notes:       input.Notes,
		IsActive:    input.IsActive,
		UpdatedBy:   userID,
	}

	allergyRepo := postgres.NewPatientAllergyRepository(h.db.Pool)
	if err := allergyRepo.Update(c.Request.Context(), allergyID, updateInput); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update allergy"})
		return
	}

	allergy, _ := allergyRepo.GetByID(c.Request.Context(), allergyID)
	c.JSON(http.StatusOK, allergy)
}

// DeleteAllergy - DELETE /api/v1/patients/:id/allergies/:allergyId
func (h *PatientProfileHandler) DeleteAllergy(c *gin.Context) {
	allergyIDStr := c.Param("allergyId")
	allergyID, err := uuid.Parse(allergyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid allergy ID"})
		return
	}

	allergyRepo := postgres.NewPatientAllergyRepository(h.db.Pool)
	if err := allergyRepo.Delete(c.Request.Context(), allergyID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete allergy"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Allergy deleted"})
}

// ============================================
// PATIENT DEPOSIT TRANSACTION ENDPOINTS
// ============================================

// GetDepositTransactions - GET /api/v1/patients/:id/deposit-transactions
func (h *PatientProfileHandler) GetDepositTransactions(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	page := 1
	limit := 50
	if p := c.Query("page"); p != "" {
		page = 1 // simplified
	}

	depositRepo := postgres.NewPatientDepositTransactionRepository(h.db.Pool)
	txs, total, err := depositRepo.GetByPatientID(c.Request.Context(), patientID, limit, (page-1)*limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get deposit transactions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  txs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// CreateDepositTransaction - POST /api/v1/patients/:id/deposit-transactions
func (h *PatientProfileHandler) CreateDepositTransaction(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	var input struct {
		TransactionType string  `json:"transaction_type" binding:"required"`
		Amount          float64 `json:"amount" binding:"required"`
		PaymentMethod   string  `json:"payment_method"`
		Reference       string  `json:"reference"`
		Description     string  `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	clinicID, branchID, userID := getContextValues(c)

	// Get current balance
	depositRepo := postgres.NewPatientDepositTransactionRepository(h.db.Pool)
	currentBalance, _ := depositRepo.GetCurrentBalance(c.Request.Context(), patientID)

	// Calculate new balance
	var newBalance float64
	switch input.TransactionType {
	case "deposit", "refund":
		newBalance = currentBalance + input.Amount
	case "withdrawal", "transfer":
		newBalance = currentBalance - input.Amount
	default:
		newBalance = currentBalance
	}

	createInput := postgres.CreateDepositTransactionInput{
		PatientID:       patientID,
		ClinicID:        clinicID,
		TransactionType: input.TransactionType,
		Amount:          input.Amount,
		BalanceBefore:   currentBalance,
		BalanceAfter:    newBalance,
		PaymentMethod:   input.PaymentMethod,
		Reference:       input.Reference,
		Description:     input.Description,
		CreatedBy:       userID,
	}

	tx, err := depositRepo.Create(c.Request.Context(), createInput)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction"})
		return
	}
	_ = branchID

	c.JSON(http.StatusCreated, tx)
}

// ============================================
// PATIENT DEATH INFO ENDPOINTS
// ============================================

// GetDeathInfo - GET /api/v1/patients/:id/death-info
func (h *PatientProfileHandler) GetDeathInfo(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	deathRepo := postgres.NewPatientDeathInfoRepository(h.db.Pool)
	info, err := deathRepo.GetByPatientID(c.Request.Context(), patientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Death info not found"})
		return
	}

	c.JSON(http.StatusOK, info)
}

// UpdateDeathInfo - PUT /api/v1/patients/:id/death-info
func (h *PatientProfileHandler) UpdateDeathInfo(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	var input struct {
		DeathDate             *string `json:"death_date"`
		DeathTime             *string `json:"death_time"`
		DeathPlace            *string `json:"death_place"`
		DeathCause            *string `json:"death_cause"`
		DeathCauseICD10       *string `json:"death_cause_icd10"`
		IsAutopsyPerformed    *bool   `json:"is_autopsy_performed"`
		AutopsyResult         *string `json:"autopsy_result"`
		CertificateNumber     *string `json:"certificate_number"`
		CertificateIssuedDate *string `json:"certificate_issued_date"`
		CertificateIssuedBy   *string `json:"certificate_issued_by"`
		Notes                 *string `json:"notes"`
		IsVerified            *bool   `json:"is_verified"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, _, userID := getContextValues(c)

	var deathDate *time.Time
	var certDate *time.Time
	if input.DeathDate != nil {
		t, _ := time.Parse(time.RFC3339, *input.DeathDate)
		if t.IsZero() {
			t, _ = time.Parse("2006-01-02", *input.DeathDate)
		}
		deathDate = &t
	}
	if input.CertificateIssuedDate != nil {
		t, _ := time.Parse("2006-01-02", *input.CertificateIssuedDate)
		certDate = &t
	}

	updateInput := postgres.UpdateDeathInfoInput{
		DeathDate:             deathDate,
		DeathTime:             input.DeathTime,
		DeathPlace:            input.DeathPlace,
		DeathCause:            input.DeathCause,
		DeathCauseICD10:       input.DeathCauseICD10,
		IsAutopsyPerformed:    input.IsAutopsyPerformed,
		AutopsyResult:         input.AutopsyResult,
		CertificateNumber:     input.CertificateNumber,
		CertificateIssuedDate: certDate,
		CertificateIssuedBy:   input.CertificateIssuedBy,
		Notes:                 input.Notes,
		IsVerified:            input.IsVerified,
		UpdatedBy:             userID,
	}

	deathRepo := postgres.NewPatientDeathInfoRepository(h.db.Pool)

	// Check if exists
	existing, err := deathRepo.GetByPatientID(c.Request.Context(), patientID)
	if err != nil {
		// Create new
		createInput := postgres.CreateDeathInfoInput{
			PatientID:   patientID,
			DeathDate:   time.Now(),
			Notes:       "",
			CreatedBy:   userID,
		}
		if deathDate != nil {
			createInput.DeathDate = *deathDate
		}
		if input.DeathTime != nil {
			createInput.DeathTime = *input.DeathTime
		}
		if input.DeathPlace != nil {
			createInput.DeathPlace = *input.DeathPlace
		}
		if input.DeathCause != nil {
			createInput.DeathCause = *input.DeathCause
		}
		if input.DeathCauseICD10 != nil {
			createInput.DeathCauseICD10 = *input.DeathCauseICD10
		}

		newInfo, err := deathRepo.Create(c.Request.Context(), createInput)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create death info"})
			return
		}
		c.JSON(http.StatusCreated, newInfo)
		return
	}

	// Update existing
	if err := deathRepo.Update(c.Request.Context(), existing.ID, updateInput); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update death info"})
		return
	}

	updated, _ := deathRepo.GetByPatientID(c.Request.Context(), patientID)
	c.JSON(http.StatusOK, updated)
}

// ============================================
// PATIENT QUESTIONNAIRE ENDPOINTS
// ============================================

// GetQuestionnaires - GET /api/v1/patients/:id/questionnaires
func (h *PatientProfileHandler) GetQuestionnaires(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	questionnaireRepo := postgres.NewPatientQuestionnaireRepository(h.db.Pool)
	questionnaires, err := questionnaireRepo.GetByPatientID(c.Request.Context(), patientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get questionnaires"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": questionnaires})
}

// CreateQuestionnaire - POST /api/v1/patients/:id/questionnaires
func (h *PatientProfileHandler) CreateQuestionnaire(c *gin.Context) {
	patientIDStr := c.Param("id")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	var input struct {
		QuestionnaireID    string                  `json:"questionnaire_id" binding:"required"`
		QuestionnaireTitle string                  `json:"questionnaire_title"`
		Version            string                  `json:"version"`
		Responses          map[string]interface{}  `json:"responses" binding:"required"`
		Score              *float64                `json:"score"`
		RiskLevel          string                  `json:"risk_level"`
		IsComplete         bool                    `json:"is_complete"`
		CompletedAt        *string                 `json:"completed_at"`
		ExpiresAt          *string                 `json:"expires_at"`
		Notes              string                  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	clinicID, _, userID := getContextValues(c)

	questionnaireID, _ := uuid.Parse(input.QuestionnaireID)

	var completedAt, expiresAt *time.Time
	if input.CompletedAt != nil {
		t, _ := time.Parse(time.RFC3339, *input.CompletedAt)
		completedAt = &t
	}
	if input.ExpiresAt != nil {
		t, _ := time.Parse(time.RFC3339, *input.ExpiresAt)
		expiresAt = &t
	}

	createInput := postgres.CreateQuestionnaireResponseInput{
		PatientID:           patientID,
		ClinicID:           clinicID,
		QuestionnaireID:    questionnaireID,
		QuestionnaireTitle: input.QuestionnaireTitle,
		Version:            input.Version,
		Responses:          input.Responses,
		Score:               input.Score,
		RiskLevel:          input.RiskLevel,
		IsComplete:         input.IsComplete,
		CompletedAt:        completedAt,
		ExpiresAt:          expiresAt,
		Notes:              input.Notes,
		CreatedBy:          userID,
	}

	questionnaireRepo := postgres.NewPatientQuestionnaireRepository(h.db.Pool)
	questionnaire, err := questionnaireRepo.Create(c.Request.Context(), createInput)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create questionnaire"})
		return
	}

	c.JSON(http.StatusCreated, questionnaire)
}

// UpdateQuestionnaire - PUT /api/v1/patients/:id/questionnaires/:questionnaireId
func (h *PatientProfileHandler) UpdateQuestionnaire(c *gin.Context) {
	questionnaireIDStr := c.Param("questionnaireId")
	questionnaireID, err := uuid.Parse(questionnaireIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid questionnaire ID"})
		return
	}

	var input struct {
		Responses    *map[string]interface{} `json:"responses"`
		Score        *float64               `json:"score"`
		RiskLevel    *string                `json:"risk_level"`
		IsComplete   *bool                  `json:"is_complete"`
		CompletedAt  *string                `json:"completed_at"`
		ExpiresAt    *string                `json:"expires_at"`
		Notes        *string                `json:"notes"`
		IsActive     *bool                  `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, _, userID := getContextValues(c)

	var completedAt, expiresAt *time.Time
	if input.CompletedAt != nil {
		t, _ := time.Parse(time.RFC3339, *input.CompletedAt)
		completedAt = &t
	}
	if input.ExpiresAt != nil {
		t, _ := time.Parse(time.RFC3339, *input.ExpiresAt)
		expiresAt = &t
	}

	updateInput := postgres.UpdateQuestionnaireResponseInput{
		Responses:   input.Responses,
		Score:       input.Score,
		RiskLevel:   input.RiskLevel,
		IsComplete:  input.IsComplete,
		CompletedAt: completedAt,
		ExpiresAt:   expiresAt,
		Notes:       input.Notes,
		IsActive:    input.IsActive,
		UpdatedBy:   userID,
	}

	questionnaireRepo := postgres.NewPatientQuestionnaireRepository(h.db.Pool)
	if err := questionnaireRepo.Update(c.Request.Context(), questionnaireID, updateInput); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update questionnaire"})
		return
	}

	questionnaire, _ := questionnaireRepo.GetByID(c.Request.Context(), questionnaireID)
	c.JSON(http.StatusOK, questionnaire)
}

// DeleteQuestionnaire - DELETE /api/v1/patients/:id/questionnaires/:questionnaireId
func (h *PatientProfileHandler) DeleteQuestionnaire(c *gin.Context) {
	questionnaireIDStr := c.Param("questionnaireId")
	questionnaireID, err := uuid.Parse(questionnaireIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid questionnaire ID"})
		return
	}

	questionnaireRepo := postgres.NewPatientQuestionnaireRepository(h.db.Pool)
	if err := questionnaireRepo.Delete(c.Request.Context(), questionnaireID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete questionnaire"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Questionnaire deleted"})
}
