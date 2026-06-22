package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// ==================== Models ====================

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	Role         string    `json:"role"`
	IsActive     bool      `json:"is_active"`
	Phone        string    `json:"phone"`
	CreatedAt    time.Time `json:"created_at"`
}

type Patient struct {
	ID             string    `json:"id"`
	FirstName      string    `json:"first_name"`
	LastName       string    `json:"last_name"`
	Patronymic     string    `json:"patronymic,omitempty"`
	BirthDate      string    `json:"birth_date"`
	Gender         string    `json:"gender"`
	Phone          string    `json:"phone"`
	Phone2         string    `json:"phone_2,omitempty"`
	Email          string    `json:"email,omitempty"`
	Citizenship    string    `json:"citizenship,omitempty"`
	Address        string    `json:"address,omitempty"`
	DepositBalance float64   `json:"deposit_balance"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
}

type Appointment struct {
	ID              string    `json:"id"`
	PatientID       string    `json:"patient_id"`
	DoctorID        string    `json:"doctor_id"`
	ServiceID       string    `json:"service_id"`
	Status          string    `json:"status"`
	AppointmentDate string    `json:"appointment_date"`
	StartTime       string    `json:"start_time"`
	EndTime         string    `json:"end_time,omitempty"`
	BookingMethod   string    `json:"booking_method"`
	Notes           string    `json:"notes,omitempty"`
	Patient         *Patient  `json:"patient,omitempty"`
	Doctor          *Staff    `json:"doctor,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

type Staff struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Position  string `json:"position,omitempty"`
	Specialty string `json:"specialty,omitempty"`
	Cabinet   string `json:"cabinet,omitempty"`
}

type Dashboard struct {
	TotalAppointments     int     `json:"total_appointments"`
	CompletedAppointments int     `json:"completed_appointments"`
	CancelledAppointments int     `json:"cancelled_appointments"`
	TotalRevenue          float64 `json:"total_revenue"`
	NewPatients           int     `json:"new_patients"`
	WaitingPatients       int     `json:"waiting_patients"`
}

type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	User         User   `json:"user"`
}

// ==================== Global Data ====================

var (
	users        = make(map[string]User)
	patients     = make(map[string]Patient)
	appointments = make(map[string]Appointment)
	staff        = make(map[string]Staff)
)

func init() {
	// Create admin user
	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	users["admin@amis.uz"] = User{
		ID:           "550e8400-e29b-41d4-a716-446655440000",
		Email:        "admin@amis.uz",
		PasswordHash: string(hash),
		FirstName:    "Admin",
		LastName:     "User",
		Role:         "clinic_admin",
		IsActive:     true,
		Phone:        "+998901234567",
		CreatedAt:    time.Now(),
	}

	// Sample patients
	patients["1"] = Patient{
		ID:             "p1",
		FirstName:      "John",
		LastName:       "Smith",
		BirthDate:      "1990-05-15",
		Gender:         "male",
		Phone:          "+998901111111",
		Email:          "john@example.com",
		Citizenship:    "Uzbekistan",
		Address:        "Tashkent, Yunusobod",
		DepositBalance: 500000,
		IsActive:       true,
		CreatedAt:      time.Now().AddDate(0, -3, 0),
	}
	patients["2"] = Patient{
		ID:             "p2",
		FirstName:      "Mary",
		LastName:       "Johnson",
		BirthDate:      "1985-08-22",
		Gender:         "female",
		Phone:          "+998902222222",
		Email:          "mary@example.com",
		Citizenship:    "Uzbekistan",
		Address:        "Samarkand, Center",
		DepositBalance: 250000,
		IsActive:       true,
		CreatedAt:      time.Now().AddDate(0, -1, 0),
	}
	patients["3"] = Patient{
		ID:             "p3",
		FirstName:      "Bobur",
		LastName:       "Rahimov",
		BirthDate:      "1995-03-10",
		Gender:         "male",
		Phone:          "+998903333333",
		Citizenship:    "Uzbekistan",
		DepositBalance: 100000,
		IsActive:       true,
		CreatedAt:      time.Now(),
	}

	// Sample doctors
	staff["d1"] = Staff{
		ID:        "d1",
		FirstName: "Dr. Ahmad",
		LastName:  "Karimov",
		Position:  "Therapist",
		Specialty: "General Practice",
		Cabinet:   "101",
	}
	staff["d2"] = Staff{
		ID:        "d2",
		FirstName: "Dr. Nilufar",
		LastName:  "Saidova",
		Position:  "Cardiologist",
		Specialty: "Cardiology",
		Cabinet:   "205",
	}
	staff["d3"] = Staff{
		ID:        "d3",
		FirstName: "Dr. Jasur",
		LastName:  "Alimov",
		Position:  "Surgeon",
		Specialty: "Surgery",
		Cabinet:   "302",
	}

	// Sample appointments
	today := time.Now().Format("2006-01-02")
	appointments["a1"] = Appointment{
		ID:              "a1",
		PatientID:       "p1",
		DoctorID:        "d1",
		ServiceID:       "s1",
		Status:          "completed",
		AppointmentDate: today,
		StartTime:       "09:00",
		EndTime:         "09:30",
		BookingMethod:   "online",
		CreatedAt:       time.Now().AddDate(0, 0, -1),
	}
	appointments["a2"] = Appointment{
		ID:              "a2",
		PatientID:       "p2",
		DoctorID:        "d2",
		ServiceID:       "s2",
		Status:          "waiting",
		AppointmentDate: today,
		StartTime:       "10:00",
		BookingMethod:   "phone",
		CreatedAt:       time.Now().AddDate(0, 0, -1),
	}
	appointments["a3"] = Appointment{
		ID:              "a3",
		PatientID:       "p3",
		DoctorID:        "d3",
		ServiceID:       "s3",
		Status:          "scheduled",
		AppointmentDate: today,
		StartTime:       "11:00",
		BookingMethod:   "online",
		CreatedAt:       time.Now(),
	}
}

// ==================== Helpers ====================

func generateToken() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func getPatientByID(id string) *Patient {
	if p, ok := patients[id]; ok {
		return &p
	}
	return nil
}

func getDoctorByID(id string) *Staff {
	if s, ok := staff[id]; ok {
		return &s
	}
	return nil
}

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// ==================== Handlers ====================

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"service": "AMIS API",
		"status":  "ok",
		"version": "1.0.0",
	})
}

func login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	user, exists := users[req.Email]
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	accessToken := generateToken()
	refreshToken := generateToken()

	c.JSON(http.StatusOK, LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    900,
		User:         user,
	})
}

func listPatients(c *gin.Context) {
	search := c.Query("search")
	gender := c.Query("gender")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var result []Patient
	for _, p := range patients {
		if !p.IsActive {
			continue
		}
		if search != "" {
			low := strings.ToLower(search)
			if !strings.Contains(strings.ToLower(p.FirstName), low) &&
				!strings.Contains(strings.ToLower(p.LastName), low) &&
				!strings.Contains(strings.ToLower(p.Phone), low) {
				continue
			}
		}
		if gender != "" && p.Gender != gender {
			continue
		}
		result = append(result, p)
	}

	// Pagination
	start := (page - 1) * limit
	end := start + limit
	if start > len(result) {
		result = []Patient{}
	} else if end > len(result) {
		result = result[start:]
	} else {
		result = result[start:end]
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        result,
		"total":       len(patients),
		"page":        page,
		"limit":       limit,
		"total_pages": (len(patients) + limit - 1) / limit,
	})
}

func getPatient(c *gin.Context) {
	id := c.Param("id")
	if p, ok := patients[id]; ok {
		c.JSON(http.StatusOK, p)
		return
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
}

func createPatient(c *gin.Context) {
	var p Patient
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p.ID = fmt.Sprintf("p%d", len(patients)+1)
	p.IsActive = true
	p.CreatedAt = time.Now()
	if p.DepositBalance == 0 {
		p.DepositBalance = 0
	}

	patients[p.ID] = p
	c.JSON(http.StatusCreated, p)
}

func listAppointments(c *gin.Context) {
	status := c.Query("status")
	date := c.Query("date")

	var result []Appointment
	for _, a := range appointments {
		if status != "" && a.Status != status {
			continue
		}
		if date != "" && a.AppointmentDate != date {
			continue
		}

		// Enrich with patient and doctor data
		a.Patient = getPatientByID(a.PatientID)
		a.Doctor = getDoctorByID(a.DoctorID)
		result = append(result, a)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        result,
		"total":       len(result),
		"page":        1,
		"limit":       20,
		"total_pages": 1,
	})
}

func createAppointment(c *gin.Context) {
	var a Appointment
	if err := c.ShouldBindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	a.ID = fmt.Sprintf("a%d", len(appointments)+1)
	a.Status = "scheduled"
	a.CreatedAt = time.Now()
	a.Patient = getPatientByID(a.PatientID)
	a.Doctor = getDoctorByID(a.DoctorID)

	appointments[a.ID] = a
	c.JSON(http.StatusCreated, a)
}

func dashboard(c *gin.Context) {
	var total, completed, cancelled, waiting int
	var revenue float64

	for _, a := range appointments {
		total++
		switch a.Status {
		case "completed":
			completed++
			revenue += 150000 // Sample revenue
		case "cancelled":
			cancelled++
		case "waiting":
			waiting++
		}
	}

	c.JSON(http.StatusOK, Dashboard{
		TotalAppointments:     total,
		CompletedAppointments: completed,
		CancelledAppointments: cancelled,
		TotalRevenue:          revenue,
		NewPatients:           3,
		WaitingPatients:       waiting,
	})
}

func listStaff(c *gin.Context) {
	var result []Staff
	for _, s := range staff {
		result = append(result, s)
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}

func listDoctors(c *gin.Context) {
	var result []Staff
	for _, s := range staff {
		result = append(result, s)
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}

func listServices(c *gin.Context) {
	c.JSON(http.StatusOK, []gin.H{
		{"id": "s1", "name": "General Consultation", "duration": 30, "base_price": 50000},
		{"id": "s2", "name": "Cardiology Consultation", "duration": 45, "base_price": 80000},
		{"id": "s3", "name": "Surgery Consultation", "duration": 60, "base_price": 120000},
		{"id": "s4", "name": "Laboratory Tests", "duration": 15, "base_price": 30000},
		{"id": "s5", "name": "X-Ray", "duration": 20, "base_price": 45000},
	})
}

func listServiceGroups(c *gin.Context) {
	c.JSON(http.StatusOK, []gin.H{
		{"id": "g1", "name": "Consultations"},
		{"id": "g2", "name": "Diagnostics"},
		{"id": "g3", "name": "Laboratory"},
		{"id": "g4", "name": "Procedures"},
	})
}

func listPaymentMethods(c *gin.Context) {
	c.JSON(http.StatusOK, []string{"cash", "card", "transfer", "deposit"})
}

func listRoles(c *gin.Context) {
	c.JSON(http.StatusOK, []gin.H{
		{"id": "clinic_admin", "name": "Clinic Administrator"},
		{"id": "doctor", "name": "Doctor"},
		{"id": "registrar", "name": "Registrar"},
		{"id": "cashier", "name": "Cashier"},
		{"id": "lab_tech", "name": "Lab Technician"},
		{"id": "director", "name": "Director"},
	})
}

func refreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Generate new tokens
	accessToken := generateToken()
	refreshToken := generateToken()

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"expires_in":    900,
	})
}

type HealthResponse struct {
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
	Version   string `json:"version"`
	Mode      string `json:"mode"`
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// For demo, accept any Bearer token
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// ==================== Main ====================

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// Middleware
	r.Use(CORS())

	// Public endpoints
	r.GET("/health", healthCheck)
	r.POST("/api/v1/auth/login", login)
	r.POST("/api/v1/auth/refresh", refreshToken)

	// Protected endpoints
	api := r.Group("/api/v1")
	api.Use(authMiddleware())
	{
		// Patients
		api.GET("/patients", listPatients)
		api.GET("/patients/:id", getPatient)
		api.POST("/patients", createPatient)

		// Appointments
		api.GET("/appointments", listAppointments)
		api.POST("/appointments", createAppointment)

		// Staff & Doctors
		api.GET("/staff", listStaff)
		api.GET("/doctor/patients", listPatients)
		api.GET("/doctor/appointments/today", listAppointments)

		// Dashboard & Analytics
		api.GET("/analytics/dashboard", dashboard)
		api.GET("/analytics/appointments", listAppointments)

		// References
		api.GET("/references/services", listServices)
		api.GET("/references/services-groups", listServiceGroups)
		api.GET("/references/payment-methods", listPaymentMethods)
		api.GET("/references/roles", listRoles)
	}

	fmt.Printf("AMIS Backend starting on port %s\n", port)
	fmt.Println("Health check: http://localhost:" + port + "/health")
	fmt.Println("Login: POST http://localhost:" + port + "/api/v1/auth/login")
	fmt.Println("Demo credentials: admin@amis.uz / admin123")

	r.Run(":" + port)
}
