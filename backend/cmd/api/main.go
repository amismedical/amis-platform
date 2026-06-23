package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/amis/medverse-annahl/internal/config"
	"github.com/amis/medverse-annahl/internal/handler"
	"github.com/amis/medverse-annahl/internal/middleware"
	"github.com/amis/medverse-annahl/internal/repository/postgres"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load(".")
	if err != nil {
		log.Fatalf("Ошибка загрузки конфигурации: %v", err)
	}

	db, err := postgres.NewConnection(cfg.Database)
	if err != nil {
		log.Fatalf("Ошибка подключения к базе данных: %v", err)
	}
	defer db.Close()

	pool := postgres.NewPoolWrapper(db)

	if err := postgres.RunMigrations(db); err != nil {
		log.Fatalf("Ошибка выполнения миграций: %v", err)
	}
	log.Println("Миграции базы данных успешно выполнены")

	// Fix schema compatibility for existing databases
	if err := postgres.FixSchemaCompatibility(db); err != nil {
		log.Printf("Предупреждение при исправлении схемы: %v", err)
	} else {
		log.Println("Проверка совместимости схемы завершена")
	}

	// TASK-001: Patient Profile Migrations
	if err := postgres.RunPatientProfileMigrations(db); err != nil {
		log.Fatalf("Ошибка выполнения миграций patient_profile: %v", err)
	}
	log.Println("Patient Profile миграции успешно выполнены")

	if err := postgres.SeedData(db); err != nil {
		log.Printf("Предупреждение при заполнении начальными данными: %v", err)
	}

	redisClient, err := postgres.NewRedisClient(cfg.Redis)
	if err != nil {
		log.Printf("Предупреждение: Redis недоступен, кэширование отключено: %v", err)
	}

	handlers := handler.NewHandlers(pool, cfg.JWT)
	mw := middleware.NewMiddleware(cfg.JWT, nil)

	router := setupRouter(handlers, mw)

	srv := &http.Server{
		Addr:         cfg.Server.Address(),
		Handler:      router,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(cfg.Server.IdleTimeout) * time.Second,
	}

	go func() {
		log.Printf("Запуск сервера на %s", cfg.Server.Address())
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Ошибка запуска сервера: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Завершение работы сервера...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Ошибка при завершении сервера: %v", err)
	}

	_ = redisClient

	log.Println("Сервер успешно остановлен")
}

func setupRouter(h *handler.Handlers, mw *middleware.Middleware) *gin.Engine {
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())

	router.GET("/health", h.Health.Health)

	auth := router.Group("/api/v1/auth")
	{
		auth.POST("/login", h.Auth.Login)
		auth.POST("/refresh", h.Auth.Refresh)
		auth.POST("/forgot-password", h.Auth.ForgotPassword)
		auth.POST("/reset-password", h.Auth.ResetPassword)
	}

	api := router.Group("/api/v1")
	api.Use(mw.Auth())
	api.Use(mw.ClinicContext())
	{
		clinics := api.Group("/clinics")
		{
			clinics.GET("", h.Clinic.List)
			clinics.GET("/:id", h.Clinic.Get)
			clinics.POST("", mw.RequireRole("clinic_admin", "super_admin"), h.Clinic.Create)
			clinics.PUT("/:id", mw.RequireRole("clinic_admin", "super_admin"), h.Clinic.Update)
		}

		branches := api.Group("/branches")
		{
			branches.GET("", h.Branch.List)
			branches.GET("/:id", h.Branch.Get)
			branches.POST("", mw.RequireRole("clinic_admin", "branch_admin"), h.Branch.Create)
			branches.PUT("/:id", mw.RequireRole("clinic_admin", "branch_admin"), h.Branch.Update)
		}

		users := api.Group("/users")
		{
			users.GET("", h.User.List)
			users.GET("/:id", h.User.Get)
			users.POST("", mw.RequireRole("clinic_admin"), h.User.Create)
			users.PUT("/:id", mw.RequireRole("clinic_admin"), h.User.Update)
			users.DELETE("/:id", mw.RequireRole("clinic_admin"), h.User.Deactivate)
			users.GET("/profile", h.User.Profile)
			users.PUT("/profile", h.User.UpdateProfile)
			users.PUT("/:id/password", mw.RequireRole("clinic_admin"), h.User.ChangePassword)
		}

		patients := api.Group("/patients")
		{
			patients.GET("", h.Patient.List)
			patients.GET("/:id", h.Patient.Get)
			patients.POST("", h.Patient.Create)
			patients.PUT("/:id", h.Patient.Update)
			patients.GET("/:id/deposits", h.Patient.Deposits)

			// TASK-005: Medical Card endpoints
			patients.GET("/:id/medical-card", h.MedicalCard.GetPatientMedicalCard)
			patients.POST("/:id/medical-card", h.MedicalCard.CreatePatientMedicalCard)
			patients.PUT("/:id/medical-card", h.MedicalCard.UpdatePatientMedicalCard)
			patients.GET("/:id/episodes", h.MedicalCard.GetPatientEpisodes)

			// TASK-002: Patient Profile endpoints
			patients.GET("/:id/profile", h.PatientProfile.GetProfile)
			patients.PUT("/:id/profile", h.PatientProfile.UpdateProfile)

			// Patient Documents
			patients.GET("/:id/documents", h.PatientProfile.GetDocuments)
			patients.POST("/:id/documents", h.PatientProfile.CreateDocument)
			patients.PUT("/:id/documents/:documentId", h.PatientProfile.UpdateDocument)
			patients.DELETE("/:id/documents/:documentId", h.PatientProfile.DeleteDocument)

			// Patient Contacts
			patients.GET("/:id/contacts", h.PatientProfile.GetContacts)
			patients.POST("/:id/contacts", h.PatientProfile.CreateContact)
			patients.PUT("/:id/contacts/:contactId", h.PatientProfile.UpdateContact)
			patients.DELETE("/:id/contacts/:contactId", h.PatientProfile.DeleteContact)

			// Patient Relatives
			patients.GET("/:id/relatives", h.PatientProfile.GetRelatives)
			patients.POST("/:id/relatives", h.PatientProfile.CreateRelative)
			patients.PUT("/:id/relatives/:relativeId", h.PatientProfile.UpdateRelative)
			patients.DELETE("/:id/relatives/:relativeId", h.PatientProfile.DeleteRelative)

			// Patient Allergies
			patients.GET("/:id/allergies", h.PatientProfile.GetAllergies)
			patients.POST("/:id/allergies", h.PatientProfile.CreateAllergy)
			patients.PUT("/:id/allergies/:allergyId", h.PatientProfile.UpdateAllergy)
			patients.DELETE("/:id/allergies/:allergyId", h.PatientProfile.DeleteAllergy)

			// Patient Deposit Transactions
			patients.GET("/:id/deposit-transactions", h.PatientProfile.GetDepositTransactions)
			patients.POST("/:id/deposit-transactions", h.PatientProfile.CreateDepositTransaction)

			// Patient Death Info
			patients.GET("/:id/death-info", h.PatientProfile.GetDeathInfo)
			patients.PUT("/:id/death-info", h.PatientProfile.UpdateDeathInfo)

			// Patient Questionnaires
			patients.GET("/:id/questionnaires", h.PatientProfile.GetQuestionnaires)
			patients.POST("/:id/questionnaires", h.PatientProfile.CreateQuestionnaire)
			patients.PUT("/:id/questionnaires/:questionnaireId", h.PatientProfile.UpdateQuestionnaire)
			patients.DELETE("/:id/questionnaires/:questionnaireId", h.PatientProfile.DeleteQuestionnaire)
		}

		staff := api.Group("/staff")
		{
			staff.GET("", h.Staff.List)
			staff.GET("/doctors", h.Staff.ListDoctors)
			staff.GET("/:id", h.Staff.Get)
			staff.POST("", h.Staff.Create)
			staff.PUT("/:id", h.Staff.Update)
			staff.DELETE("/:id", h.Staff.Deactivate)
			staff.GET("/:id/schedule", h.Staff.Schedule)
			staff.GET("/:id/statistics", h.Staff.Statistics)
		}

		appointments := api.Group("/appointments")
		{
			appointments.GET("", h.Appointment.List)
			appointments.GET("/:id", h.Appointment.Get)
			appointments.POST("", h.Appointment.Create)
			appointments.PUT("/:id", h.Appointment.Update)
			appointments.PATCH("/:id/status", h.Appointment.UpdateStatus)
			appointments.DELETE("/:id", h.Appointment.Cancel)
			appointments.GET("/calendar", h.Appointment.Calendar)
		}

		doctor := api.Group("/doctor")
		doctor.Use(mw.RequireRole("doctor", "director", "super_admin"))
		{
			doctor.GET("/appointments/today", h.Doctor.TodayAppointments)
			doctor.GET("/patients", h.Doctor.Patients)
			doctor.POST("/encounter/start", h.Doctor.StartEncounter)
			doctor.POST("/encounter/complete", h.Doctor.CompleteEncounter)
			doctor.POST("/vitals", h.Doctor.RecordVitals)
			doctor.POST("/diagnosis", h.Doctor.AddDiagnosis)
			doctor.POST("/recommendation", h.Doctor.AddRecommendation)
			doctor.GET("/statistics", h.Doctor.Statistics)
		}

		queues := api.Group("/queues")
		{
			queues.GET("", h.Queue.List)
			queues.GET("/:id", h.Queue.Get)
			queues.POST("", mw.RequireRole("registrar", "clinic_admin", "super_admin"), h.Queue.Create)
			queues.POST("/register", h.Queue.Register)
			queues.POST("/:id/call-next", mw.RequireRole("doctor", "registrar", "super_admin"), h.Queue.CallNext)
			queues.POST("/complete/:entry_id", mw.RequireRole("doctor", "registrar", "super_admin"), h.Queue.Complete)
		}

		cashier := api.Group("/cashier")
		cashier.Use(mw.RequireRole("cashier", "clinic_admin", "director"))
		{
			cashier.GET("/invoices", h.Cashier.Invoices)
			cashier.GET("/invoices/pending", h.Cashier.GetPendingInvoices)
			cashier.GET("/invoices/completed", h.Cashier.GetCompletedPayments)
			cashier.GET("/invoices/:id", h.Cashier.InvoiceDetails)
			cashier.POST("/invoices/:id/pay", h.Cashier.Pay)
			cashier.POST("/invoices/:id/refund", h.Cashier.Refund)
			cashier.GET("/summary", h.Cashier.GetCashierSummary)
			cashier.GET("/deposits", h.Cashier.Deposits)
			cashier.POST("/deposits/:patientId/topup", h.Cashier.TopUpDeposit)
			cashier.GET("/statistics", h.Cashier.Statistics)
		}

		lis := api.Group("/lis")
		lis.Use(mw.RequireRole("lab_tech", "clinic_admin", "doctor"))
		{
			lis.GET("/orders", h.LIS.Orders)
			lis.GET("/orders/:id", h.LIS.OrderDetails)
			lis.POST("/orders/:id/collect", h.LIS.CollectMaterial)
			lis.POST("/orders/:id/results", h.LIS.SubmitResults)
			lis.POST("/orders/:id/confirm", h.LIS.Confirm)
			lis.GET("/ref-groups", h.LIS.RefGroups)
		}

		medical := api.Group("/medical")
		{
			medical.GET("/episodes", h.Medical.Episodes)
			medical.GET("/episodes/:id", h.Medical.EpisodeDetails)
			medical.POST("/episodes", h.Medical.CreateEpisode)
			medical.PUT("/episodes/:id", h.Medical.UpdateEpisode)
			medical.POST("/episodes/:id/files", h.Medical.UploadFile)
		}

		// TASK-005: Medical Card Episode endpoints
		episodes := api.Group("/episodes")
		{
			episodes.GET("/:id", h.MedicalCard.GetEpisode)
			episodes.PUT("/:id", h.MedicalCard.UpdateEpisode)
			episodes.POST("/:id/complete", h.MedicalCard.CompleteEpisode)
			episodes.POST("/:id/cancel", h.MedicalCard.CancelEpisode)
			episodes.GET("/:id/examination", h.MedicalCard.GetEpisodeExamination)
			episodes.PUT("/:id/examination", h.MedicalCard.CreateOrUpdateExamination)
			episodes.GET("/:id/anthropometry", h.MedicalCard.GetEpisodeAnthropometry)
			episodes.POST("/:id/anthropometry", h.MedicalCard.CreateOrUpdateAnthropometry)
			episodes.GET("/:id/diagnoses", h.MedicalCard.GetEpisodeDiagnoses)
			episodes.POST("/:id/diagnoses", h.MedicalCard.CreateDiagnosis)
			episodes.GET("/:id/recommendations", h.MedicalCard.GetEpisodeRecommendations)
			episodes.POST("/:id/recommendations", h.MedicalCard.CreateRecommendation)
			episodes.GET("/:id/files", h.MedicalCard.GetEpisodeFiles)
			episodes.POST("/:id/files", h.MedicalCard.CreateEpisodeFile)
		}

		// Diagnosis management
		diagnoses := api.Group("/diagnoses")
		{
			diagnoses.PUT("/:id", h.MedicalCard.UpdateDiagnosis)
			diagnoses.DELETE("/:id", h.MedicalCard.DeleteDiagnosis)
		}

		// ICD-10 search
		icd10 := api.Group("/icd10")
		{
			icd10.GET("/search", h.MedicalCard.SearchICD10)
		}

		analytics := api.Group("/analytics")
		analytics.Use(mw.RequireRole("clinic_admin", "director"))
		{
			analytics.GET("/appointments", h.Analytics.Appointments)
			analytics.GET("/revenue", h.Analytics.Revenue)
			analytics.GET("/patients", h.Analytics.Patients)
			analytics.GET("/doctors", h.Analytics.Doctors)
			analytics.GET("/dashboard", h.Analytics.Dashboard)
		}

		references := api.Group("/references")
		{
			references.GET("/services", h.Reference.Services)
			references.GET("/services-groups", h.Reference.ServiceGroups)
			references.GET("/icd10", h.Reference.ICD10)
			references.GET("/territories", h.Reference.Territories)
			references.GET("/payment-methods", h.Reference.PaymentMethods)
			references.GET("/roles", h.Reference.Roles)
		}

		// Individual services endpoint — returns service rows, not groups
		api.GET("/services", h.Reference.ListAllServices)

		// Registratura - Qabullar boshqarish
		register := api.Group("/register")
		{
			register.GET("/appointments/active", h.Register.GetActiveAppointments)
			register.GET("/appointments/completed", h.Register.GetCompletedAppointments)
			register.GET("/appointments/cancelled", h.Register.GetCancelledAppointments)
			register.GET("/appointments/:id", h.Register.GetAppointmentDetails)
			register.POST("/appointments", h.Register.CreateAppointment)
			register.DELETE("/appointments/:id", h.Register.CancelAppointment)
			register.GET("/appointments/export", h.Register.ExportAppointments)
			register.GET("/patients/search", h.Register.SearchPatients)
			register.GET("/slots", h.Register.GetAvailableSlots)
			register.POST("/queue", h.Register.RegisterToQueue)
		}
	}

	router.GET("/ws/queue/:id", h.WebSocket.QueueHandler)

	return router
}
