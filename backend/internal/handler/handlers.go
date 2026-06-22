package handler

import (
	"net/http"

	"github.com/amis/medverse-annahl/internal/config"
	"github.com/amis/medverse-annahl/internal/repository/postgres"
	"github.com/gin-gonic/gin"
)

type Handlers struct {
	Health         *HealthHandler
	Auth           *AuthHandler
	Patient        *PatientHandler
	PatientProfile *PatientProfileHandler
	Appointment    *AppointmentHandler
	Doctor         *DoctorHandler
	Cashier        *CashierHandler
	Queue          *QueueHandler
	LIS            *LISHandler
	Medical        *MedicalHandler
	Analytics      *AnalyticsHandler
	Reference      *ReferenceHandler
	Clinic         *ClinicHandler
	Branch         *BranchHandler
	User           *UserHandler
	Staff          *StaffHandler
	WebSocket      *WebSocketHandler
	Register       *RegisterHandler
	MedicalCard    *MedicalCardHandler
}

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "AMIS API",
		"version": "1.0.0",
	})
}

func NewHandlers(pool *postgres.PoolWrapper, jwtConfig config.JWTConfig) *Handlers {
	// Initialize repositories
	patientRepo := postgres.NewPatientRepository(pool.Pool)
	appointmentRepo := postgres.NewAppointmentRepository(pool.Pool)
	queueRepo := postgres.NewQueueRepository(pool.Pool)
	invoiceRepo := postgres.NewInvoiceRepository(pool.Pool)
	auditRepo := postgres.NewAuditRepository(pool.Pool)

	return &Handlers{
		Health:         NewHealthHandler(),
		Auth:           NewAuthHandler(pool, jwtConfig),
		Patient:        NewPatientHandler(pool),
		PatientProfile: NewPatientProfileHandler(pool),
		Appointment:    NewAppointmentHandler(pool),
		Doctor:         NewDoctorHandler(pool),
		Cashier:        NewCashierHandler(pool),
		Queue:          NewQueueHandler(pool),
		LIS:            NewLISHandler(pool),
		Medical:        NewMedicalHandler(pool),
		Analytics:      NewAnalyticsHandler(pool),
		Reference:      NewReferenceHandler(pool),
		Clinic:         NewClinicHandler(pool),
		Branch:         NewBranchHandler(pool),
		User:           NewUserHandler(pool),
		Staff:          NewStaffHandler(pool),
		WebSocket:      NewWebSocketHandler(pool),
		Register:       NewRegisterHandler(patientRepo, appointmentRepo, queueRepo, invoiceRepo, auditRepo, pool),
		MedicalCard:    NewMedicalCardHandler(pool),
	}
}
