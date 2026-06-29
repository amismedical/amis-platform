package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Clinic struct {
	ID        uuid.UUID       `json:"id"`
	Name      string          `json:"name"`
	LegalName string          `json:"legal_name"`
	INN       string          `json:"inn"`
	Address   string          `json:"address"`
	Phone     string          `json:"phone"`
	Email     string          `json:"email"`
	LogoURL   string          `json:"logo_url"`
	Settings  json.RawMessage `json:"settings"`
	IsActive  bool            `json:"is_active"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}

type Branch struct {
	ID           uuid.UUID `json:"id"`
	ClinicID     uuid.UUID `json:"clinic_id"`
	Name         string    `json:"name"`
	Address      string    `json:"address"`
	Phone        string    `json:"phone"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
	WorkSchedule string    `json:"work_schedule"`
	Timezone     string    `json:"timezone"`
	IsMain       bool      `json:"is_main"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type User struct {
	ID           uuid.UUID  `json:"id"`
	ClinicID     *uuid.UUID `json:"clinic_id,omitempty"`
	BranchID     *uuid.UUID `json:"branch_id,omitempty"`
	StaffID      *uuid.UUID `json:"staff_id,omitempty"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	FirstName    string     `json:"first_name"`
	LastName     string     `json:"last_name"`
	Phone        string     `json:"phone"`
	Role         string     `json:"role"`
	IsActive     bool       `json:"is_active"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type Staff struct {
	ID            uuid.UUID  `json:"id"`
	ClinicID      uuid.UUID  `json:"clinic_id"`
	BranchID      *uuid.UUID `json:"branch_id,omitempty"`
	UserID        *uuid.UUID `json:"user_id,omitempty"`
	FirstName     string     `json:"first_name"`
	LastName      string     `json:"last_name"`
	Patronymic    string     `json:"patronymic"`
	Specialty     string     `json:"specialty"`
	Position      string     `json:"position"`
	Phone         string     `json:"phone"`
	Cabinet       string     `json:"cabinet"`
	Schedule      string     `json:"schedule"`
	Qualification string     `json:"qualification"`
	PhotoURL      string     `json:"photo_url"`
	IsActive      bool       `json:"is_active"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type Patient struct {
	ID              uuid.UUID  `json:"id"`
	ClinicID        uuid.UUID  `json:"clinic_id"`
	MedID               string     `json:"med_id,omitempty"`           // Medical ID (e.g. MED-FAR-2026-000001)
	PassportRegionCode  string     `json:"passport_region_code,omitempty"`  // e.g. "FAR", "AND", "FRN" for foreign
	PassportRegionName  string     `json:"passport_region_name,omitempty"`  // e.g. "Farg'ona", "Chet el"
	FirstName       string     `json:"first_name"`
	LastName        string     `json:"last_name"`
	Patronymic      string     `json:"patronymic"`
	BirthDate       time.Time  `json:"birth_date"`
	Gender          string     `json:"gender"`
	Phone           string     `json:"phone"`
	Phone2          string     `json:"phone_2"`
	Email           string     `json:"email"`
	Citizenship     string     `json:"citizenship"`
	Address         string     `json:"address"`
	RegionID        *uuid.UUID `json:"region_id,omitempty"`
	Passport        string     `json:"passport"`
	PriceCategoryID *uuid.UUID `json:"price_category_id,omitempty"`
	DepositBalance  float64    `json:"deposit_balance"`
	Notes           string     `json:"notes"`
	IsActive        bool       `json:"is_active"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type PriceCategory struct {
	ID        uuid.UUID `json:"id"`
	ClinicID  uuid.UUID `json:"clinic_id"`
	Name      string    `json:"name"`
	Priority  int       `json:"priority"`
	Discount  float64   `json:"discount"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

type ServiceGroup struct {
	ID          uuid.UUID      `json:"id"`
	ClinicID    uuid.UUID      `json:"clinic_id"`
	ParentID    *uuid.UUID     `json:"parent_id,omitempty"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Icon        string         `json:"icon"`
	SortOrder   int            `json:"sort_order"`
	IsActive    bool           `json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	Children    []ServiceGroup `json:"children,omitempty"`
}

type Service struct {
	ID             uuid.UUID `json:"id"`
	ClinicID       uuid.UUID `json:"clinic_id"`
	GroupID        uuid.UUID `json:"group_id"`
	Name           string    `json:"name"`
	Description    string    `json:"description"`
	Duration       int       `json:"duration"`
	BasePrice      float64   `json:"base_price"`
	IsActive       bool      `json:"is_active"`
	RequiresSample bool      `json:"requires_sample"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type ServicePrice struct {
	ID              uuid.UUID `json:"id"`
	ServiceID       uuid.UUID `json:"service_id"`
	PriceCategoryID uuid.UUID `json:"price_category_id"`
	Price           float64   `json:"price"`
	EffectiveFrom   time.Time `json:"effective_from"`
}

type Appointment struct {
	ID               uuid.UUID  `json:"id"`
	ClinicID         uuid.UUID  `json:"clinic_id"`
	BranchID         uuid.UUID  `json:"branch_id"`
	PatientID        uuid.UUID  `json:"patient_id"`
	DoctorID         uuid.UUID  `json:"doctor_id"`
	ServiceID        *uuid.UUID `json:"service_id,omitempty"` // nullable — nil when no service selected
	Status           string     `json:"status"`
	AppointmentDate  time.Time  `json:"appointment_date"`
	StartTime        string     `json:"start_time"`
	EndTime          string     `json:"end_time"`
	BookingMethod    string     `json:"booking_method"`
	ReferralDoctorID *uuid.UUID `json:"referral_doctor_id,omitempty"`
	ContractID       *uuid.UUID `json:"contract_id,omitempty"`
	Cabinet          string     `json:"cabinet"`
	Notes            string     `json:"notes"`
	CancelledAt      *time.Time `json:"cancelled_at,omitempty"`
	CancelReason     string     `json:"cancel_reason,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`

	Patient *Patient `json:"patient,omitempty"`
	Doctor  *Staff   `json:"doctor,omitempty"`
	Service *Service `json:"service,omitempty"`
}

type Queue struct {
	ID        uuid.UUID       `json:"id"`
	ClinicID  uuid.UUID       `json:"clinic_id"`
	BranchID  uuid.UUID       `json:"branch_id"`
	Name      string          `json:"name"`
	QueueType string          `json:"queue_type"`
	IsActive  bool            `json:"is_active"`
	Settings  json.RawMessage `json:"settings"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}

type QueueEntry struct {
	ID            uuid.UUID  `json:"id"`
	QueueID       uuid.UUID  `json:"queue_id"`
	ClinicID      uuid.UUID  `json:"clinic_id"`
	BranchID      *uuid.UUID `json:"branch_id,omitempty"`
	AppointmentID *uuid.UUID `json:"appointment_id,omitempty"`
	PatientID     uuid.UUID  `json:"patient_id"`
	QueueNumber   int        `json:"queue_number"`
	Status        string     `json:"status"`
	RegisteredAt  time.Time  `json:"registered_at"`
	CalledAt      *time.Time `json:"called_at,omitempty"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
	Cabinet       string     `json:"cabinet"`
	DoctorID      *uuid.UUID `json:"doctor_id,omitempty"`
	CreatedBy     *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`

	Patient     *Patient     `json:"patient,omitempty"`
	Doctor      *Staff       `json:"doctor,omitempty"`
	Appointment *Appointment `json:"appointment,omitempty"`
}

type Invoice struct {
	ID             uuid.UUID  `json:"id"`
	ClinicID       uuid.UUID  `json:"clinic_id"`
	BranchID       uuid.UUID  `json:"branch_id"`
	PatientID      uuid.UUID  `json:"patient_id"`
	AppointmentID  *uuid.UUID `json:"appointment_id,omitempty"`
	TotalAmount    float64    `json:"total_amount"`
	DiscountAmount float64    `json:"discount_amount"`
	PaidAmount     float64    `json:"paid_amount"`
	Status         string     `json:"status"`
	CreatedBy      uuid.UUID  `json:"created_by"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`

	Patient  *Patient      `json:"patient,omitempty"`
	Items    []InvoiceItem `json:"items,omitempty"`
	Payments []Payment     `json:"payments,omitempty"`
}

type InvoiceItem struct {
	ID          uuid.UUID `json:"id"`
	InvoiceID   uuid.UUID `json:"invoice_id"`
	ServiceID   uuid.UUID `json:"service_id"`
	ServiceName string    `json:"service_name"`
	Quantity    int       `json:"quantity"`
	UnitPrice   float64   `json:"unit_price"`
	Discount    float64   `json:"discount"`
	TotalPrice  float64   `json:"total_price"`
	CreatedAt   time.Time `json:"created_at"`

	Service *Service `json:"service,omitempty"`
}

type Payment struct {
	ID            uuid.UUID `json:"id"`
	InvoiceID     uuid.UUID `json:"invoice_id"`
	Amount        float64   `json:"amount"`
	PaymentMethod string    `json:"payment_method"`
	Reference     string    `json:"reference"`
	CashierID     uuid.UUID `json:"cashier_id"`
	CreatedAt     time.Time `json:"created_at"`

	Cashier *User `json:"cashier,omitempty"`
}

type Refund struct {
	ID         uuid.UUID `json:"id"`
	InvoiceID  uuid.UUID `json:"invoice_id"`
	PaymentID  uuid.UUID `json:"payment_id"`
	Amount     float64   `json:"amount"`
	Reason     string    `json:"reason"`
	ApprovedBy uuid.UUID `json:"approved_by"`
	CreatedAt  time.Time `json:"created_at"`
}

type Deposit struct {
	ID          uuid.UUID  `json:"id"`
	PatientID   uuid.UUID  `json:"patient_id"`
	Type        string     `json:"type"`
	Amount      float64    `json:"amount"`
	Balance     float64    `json:"balance"`
	Description string     `json:"description"`
	PaymentID   *uuid.UUID `json:"payment_id,omitempty"`
	InvoiceID   *uuid.UUID `json:"invoice_id,omitempty"`
	CreatedBy   uuid.UUID  `json:"created_by"`
	CreatedAt   time.Time  `json:"created_at"`

	Patient *Patient `json:"patient,omitempty"`
}

type Episode struct {
	ID               uuid.UUID  `json:"id"`
	ClinicID         uuid.UUID  `json:"clinic_id"`
	PatientID        uuid.UUID  `json:"patient_id"`
	DoctorID         uuid.UUID  `json:"doctor_id"`
	ReferralDoctorID *uuid.UUID `json:"referral_doctor_id,omitempty"`
	Title            string     `json:"title"`
	Status           string     `json:"status"`
	TemplateID       *uuid.UUID `json:"template_id,omitempty"`
	Conclusion       string     `json:"conclusion"`
	StartedAt        time.Time  `json:"started_at"`
	CompletedAt      *time.Time `json:"completed_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	CreatedBy        *uuid.UUID `json:"created_by,omitempty"`
	UpdatedBy        *uuid.UUID `json:"updated_by,omitempty"`
	AppointmentID    *uuid.UUID `json:"appointment_id,omitempty"`
	BranchID         *uuid.UUID `json:"branch_id,omitempty"`

	Patient         *Patient         `json:"patient,omitempty"`
	Doctor          *Staff           `json:"doctor,omitempty"`
	Encounters      []Encounter      `json:"encounters,omitempty"`
	Diagnoses       []Diagnosis      `json:"diagnoses,omitempty"`
	Vitals          *Vitals          `json:"vitals,omitempty"`
	Recommendations []Recommendation `json:"recommendations,omitempty"`
	DoctorName      string           `json:"doctor_name,omitempty"`
	PatientName     string           `json:"patient_name,omitempty"`
}

type Encounter struct {
	ID            uuid.UUID  `json:"id"`
	EpisodeID     uuid.UUID  `json:"episode_id"`
	AppointmentID *uuid.UUID `json:"appointment_id,omitempty"`
	DoctorID      uuid.UUID  `json:"doctor_id"`
	VisitDate     time.Time  `json:"visit_date"`
	Complaints    string     `json:"complaints"`
	Examination   string     `json:"examination"`
	Notes         string     `json:"notes"`
	Status        string     `json:"status"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	CreatedBy     *uuid.UUID `json:"created_by,omitempty"`
	UpdatedBy     *uuid.UUID `json:"updated_by,omitempty"`
	BranchID      *uuid.UUID `json:"branch_id,omitempty"`
	DoctorName    string     `json:"doctor_name,omitempty"`

	Doctor *Staff `json:"doctor,omitempty"`
}

// ExaminationHistoryItem - Patient examination history item for Ko'rik natijalari tab
type ExaminationHistoryItem struct {
	ID            uuid.UUID  `json:"id"`
	EpisodeID     uuid.UUID  `json:"episode_id"`
	EpisodeTitle  string     `json:"episode_title"`
	EpisodeStatus string     `json:"episode_status"`
	DoctorName    string     `json:"doctor_name"`
	VisitDate     time.Time  `json:"visit_date"`
	Complaints    string     `json:"complaints"`
	Examination   string     `json:"examination"`
	Notes         string     `json:"notes"`
	Status        string     `json:"status"`
	CreatedAt     time.Time  `json:"created_at"`
}

type Vitals struct {
	ID                 uuid.UUID  `json:"id"`
	EpisodeID          uuid.UUID  `json:"episode_id"`
	Height             float64    `json:"height"`
	Weight             float64    `json:"weight"`
	Temperature        float64    `json:"temperature"`
	BPSystolic         int        `json:"bp_systolic"`
	BPDiastolic        int        `json:"bp_diastolic"`
	Pulse              int        `json:"pulse"`
	BloodSugar         float64    `json:"blood_sugar"`
	Waist              float64    `json:"waist"`
	HeadCircumference  float64    `json:"head_circumference"`
	ChestCircumference float64    `json:"chest_circumference"`
	Comments           string     `json:"comments"`
	RecordedAt         time.Time  `json:"recorded_at"`
	CreatedAt          time.Time  `json:"created_at"`
	CreatedBy          *uuid.UUID `json:"created_by,omitempty"`
	BranchID           *uuid.UUID `json:"branch_id,omitempty"`
}

type Diagnosis struct {
	ID        uuid.UUID  `json:"id"`
	EpisodeID uuid.UUID  `json:"episode_id"`
	ICDCode   string     `json:"icd_code"`
	ICDName   string     `json:"icd_name"`
	Type      string     `json:"type"`
	Status    string     `json:"status"`
	Notes     string     `json:"notes"`
	CreatedAt time.Time  `json:"created_at"`
	CreatedBy *uuid.UUID `json:"created_by,omitempty"`
	BranchID  *uuid.UUID `json:"branch_id,omitempty"`

	ICD *ICD10 `json:"icd,omitempty"`
}

type Recommendation struct {
	ID           uuid.UUID  `json:"id"`
	EpisodeID    uuid.UUID  `json:"episode_id"`
	Type         string     `json:"type"`
	ServiceID    *uuid.UUID `json:"service_id,omitempty"`
	Description  string     `json:"description"`
	Instructions string     `json:"instructions"`
	Status       string     `json:"status"`
	CreatedAt    time.Time  `json:"created_at"`
	CreatedBy    *uuid.UUID `json:"created_by,omitempty"`
	BranchID     *uuid.UUID `json:"branch_id,omitempty"`
	ServiceName  string     `json:"service_name,omitempty"`

	Service *Service `json:"service,omitempty"`
}

type EpisodeFile struct {
	ID         uuid.UUID  `json:"id"`
	EpisodeID  uuid.UUID  `json:"episode_id"`
	Name       string     `json:"name"`
	FileType   string     `json:"file_type"`
	FilePath   string     `json:"file_path"`
	FileSize   int        `json:"file_size"`
	UploadedBy uuid.UUID  `json:"uploaded_by"`
	CreatedAt  time.Time  `json:"created_at"`
	BranchID   *uuid.UUID `json:"branch_id,omitempty"`
	UpdatedBy  *uuid.UUID `json:"updated_by,omitempty"`
}

type LISOrder struct {
	ID              uuid.UUID  `json:"id"`
	ClinicID        uuid.UUID  `json:"clinic_id"`
	EpisodeID       *uuid.UUID `json:"episode_id,omitempty"`
	AppointmentID   *uuid.UUID `json:"appointment_id,omitempty"`
	PatientID       uuid.UUID  `json:"patient_id"`
	DoctorID        uuid.UUID  `json:"doctor_id"`
	LabTechnicianID *uuid.UUID `json:"lab_technician_id,omitempty"`
	Status          string     `json:"status"`
	SampleType      string     `json:"sample_type"`
	CollectedAt     *time.Time `json:"collected_at,omitempty"`
	ReadyAt         *time.Time `json:"ready_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	Patient    *Patient       `json:"patient,omitempty"`
	Doctor     *Staff         `json:"doctor,omitempty"`
	Technician *Staff         `json:"technician,omitempty"`
	Items      []LISOrderItem `json:"items,omitempty"`
}

type LISOrderItem struct {
	ID          uuid.UUID `json:"id"`
	OrderID     uuid.UUID `json:"order_id"`
	ServiceID   uuid.UUID `json:"service_id"`
	ServiceName string    `json:"service_name"`
	Status      string    `json:"status"`
	Result      string    `json:"result"`
	Unit        string    `json:"unit"`
	RefMin      float64   `json:"ref_min"`
	RefMax      float64   `json:"ref_max"`
	IsAbnormal  bool      `json:"is_abnormal"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Service *Service `json:"service,omitempty"`
}

type RefGroup struct {
	ID          uuid.UUID           `json:"id"`
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Parameters  []RefGroupParameter `json:"parameters,omitempty"`
	CreatedAt   time.Time           `json:"created_at"`
}

type RefGroupParameter struct {
	ID        uuid.UUID `json:"id"`
	GroupID   uuid.UUID `json:"group_id"`
	Name      string    `json:"name"`
	Unit      string    `json:"unit"`
	RefMin    float64   `json:"ref_min"`
	RefMax    float64   `json:"ref_max"`
	Gender    string    `json:"gender"`
	AgeFrom   int       `json:"age_from"`
	AgeTo     int       `json:"age_to"`
	CreatedAt time.Time `json:"created_at"`
}

type ICD10 struct {
	ID       uuid.UUID  `json:"id"`
	Code     string     `json:"code"`
	Name     string     `json:"name"`
	ParentID *uuid.UUID `json:"parent_id,omitempty"`
	Level    int        `json:"level"`
}

type Territory struct {
	ID       uuid.UUID  `json:"id"`
	ParentID *uuid.UUID `json:"parent_id,omitempty"`
	Name     string     `json:"name"`
	Type     string     `json:"type"`
	Level    int        `json:"level"`

	Children []Territory `json:"children,omitempty"`
}

type Role struct {
	ID          uuid.UUID       `json:"id"`
	ClinicID    *uuid.UUID      `json:"clinic_id,omitempty"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Level       int             `json:"level"`
	Permissions json.RawMessage `json:"permissions"`
	IsSystem    bool            `json:"is_system"`
	IsActive    bool            `json:"is_active"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

type AuditLog struct {
	ID        uuid.UUID       `json:"id"`
	UserID    uuid.UUID       `json:"user_id"`
	Action    string          `json:"action"`
	TableName string          `json:"table_name"`
	RecordID  *uuid.UUID      `json:"record_id,omitempty"`
	OldData   json.RawMessage `json:"old_data,omitempty"`
	NewData   json.RawMessage `json:"new_data,omitempty"`
	IPAddress string          `json:"ip_address"`
	UserAgent string          `json:"user_agent"`
	ClinicID  *uuid.UUID      `json:"clinic_id,omitempty"`
	BranchID  *uuid.UUID      `json:"branch_id,omitempty"`
	CreatedAt time.Time       `json:"created_at"`

	User *User `json:"user,omitempty"`
}

type Hospitalization struct {
	ID            uuid.UUID  `json:"id"`
	ClinicID      uuid.UUID  `json:"clinic_id"`
	PatientID     uuid.UUID  `json:"patient_id"`
	Department    string     `json:"department"`
	DoctorID      uuid.UUID  `json:"doctor_id"`
	Room          string     `json:"room"`
	Bed           string     `json:"bed"`
	AdmissionDate time.Time  `json:"admission_date"`
	DischargeDate *time.Time `json:"discharge_date,omitempty"`
	Status        string     `json:"status"`
	Diagnosis     string     `json:"diagnosis"`
	Notes         string     `json:"notes"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`

	Patient *Patient `json:"patient,omitempty"`
	Doctor  *Staff   `json:"doctor,omitempty"`
}

type Expense struct {
	ID          uuid.UUID  `json:"id"`
	ClinicID    uuid.UUID  `json:"clinic_id"`
	BranchID    *uuid.UUID `json:"branch_id,omitempty"`
	Category    string     `json:"category"`
	Amount      float64    `json:"amount"`
	Description string     `json:"description"`
	Date        time.Time  `json:"date"`
	Status      string     `json:"status"`
	CreatedBy   uuid.UUID  `json:"created_by"`
	CreatedAt   time.Time  `json:"created_at"`

	Creator *User `json:"creator,omitempty"`
}

type Template struct {
	ID        uuid.UUID  `json:"id"`
	ClinicID  uuid.UUID  `json:"clinic_id"`
	DoctorID  *uuid.UUID `json:"doctor_id,omitempty"`
	Name      string     `json:"name"`
	Type      string     `json:"type"`
	Content   string     `json:"content"`
	IsDefault bool       `json:"is_default"`
	IsActive  bool       `json:"is_active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type Contract struct {
	ID            uuid.UUID `json:"id"`
	ClinicID      uuid.UUID `json:"clinic_id"`
	Name          string    `json:"name"`
	INN           string    `json:"inn"`
	ContactPerson string    `json:"contact_person"`
	Phone         string    `json:"phone"`
	Email         string    `json:"email"`
	Discount      float64   `json:"discount"`
	PaymentTerms  string    `json:"payment_terms"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ReferralSource struct {
	ID         uuid.UUID `json:"id"`
	ClinicID   uuid.UUID `json:"clinic_id"`
	Type       string    `json:"type"`
	Name       string    `json:"name"`
	Phone      string    `json:"phone"`
	Address    string    `json:"address"`
	Commission float64   `json:"commission"`
	IsActive   bool      `json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type ReferralAccount struct {
	ID            uuid.UUID  `json:"id"`
	ClinicID      uuid.UUID  `json:"clinic_id"`
	SourceID      uuid.UUID  `json:"source_id"`
	Amount        float64    `json:"amount"`
	Description   string     `json:"description"`
	PatientID     *uuid.UUID `json:"patient_id,omitempty"`
	AppointmentID *uuid.UUID `json:"appointment_id,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`

	Source *ReferralSource `json:"source,omitempty"`
}

// PatientDepositTransaction - tracks all deposit movements
type PatientDepositTransaction struct {
	ID              uuid.UUID  `json:"id"`
	PatientID       uuid.UUID  `json:"patient_id"`
	TransactionType string     `json:"transaction_type"` // topup, withdrawal, refund
	Amount          float64    `json:"amount"`           // positive for credit, negative for debit
	BalanceBefore   float64    `json:"balance_before"`
	BalanceAfter    float64    `json:"balance_after"`
	PaymentMethod   string     `json:"payment_method"` // cash, click, payme, terminal, deposit
	Reference       string     `json:"reference"`      // invoice_id or other reference
	Description     string     `json:"description"`
	CashierID       *uuid.UUID `json:"cashier_id,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

// MedicalCard - Patient's medical card
type MedicalCard struct {
	ID                uuid.UUID  `json:"id"`
	ClinicID          uuid.UUID  `json:"clinic_id"`
	PatientID         uuid.UUID  `json:"patient_id"`
	BloodType         string     `json:"blood_type"`
	RHFactor          string     `json:"rh_factor"`
	Allergies         string     `json:"allergies"`
	ChronicConditions string     `json:"chronic_conditions"`
	FamilyHistory     string     `json:"family_history"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
	CreatedBy         *uuid.UUID `json:"created_by,omitempty"`
	UpdatedBy         *uuid.UUID `json:"updated_by,omitempty"`

	Patient *Patient `json:"patient,omitempty"`
}

// Extended Episode with additional fields
type EpisodeExtended struct {
	Episode
	BranchID      *uuid.UUID    `json:"branch_id,omitempty"`
	AppointmentID *uuid.UUID    `json:"appointment_id,omitempty"`
	DoctorName    string        `json:"doctor_name,omitempty"`
	PatientName   string        `json:"patient_name,omitempty"`
	Files         []EpisodeFile `json:"files,omitempty"`
}
