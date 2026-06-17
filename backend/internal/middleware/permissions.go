package middleware

/**
 * AMIS - RBAC Permissions Constants
 * TZ Module: Rollar va Huquqlar (RBAC)
 * Status: Permissions definitions for all modules
 */

// Permission keys for all AMIS modules
const (
	// ===== ADMINISTRATOR MODULE =====
	PermissionClinicView         = "clinic:view"
	PermissionClinicCreate        = "clinic:create"
	PermissionClinicUpdate        = "clinic:update"
	PermissionClinicDelete        = "clinic:delete"
	PermissionUserView            = "user:view"
	PermissionUserCreate          = "user:create"
	PermissionUserUpdate          = "user:update"
	PermissionUserDelete          = "user:delete"
	PermissionUserRoleAssign      = "user:role_assign"
	PermissionBranchView          = "branch:view"
	PermissionBranchCreate        = "branch:create"
	PermissionBranchUpdate        = "branch:update"
	PermissionBranchDelete        = "branch:delete"
	PermissionReferenceView       = "reference:view"
	PermissionReferenceCreate     = "reference:create"
	PermissionReferenceUpdate     = "reference:update"
	PermissionReferenceDelete     = "reference:delete"
	PermissionSettingsView        = "settings:view"
	PermissionSettingsUpdate      = "settings:update"
	PermissionAuditLogView        = "audit_log:view"

	// ===== REGISTRATURA MODULE =====
	PermissionRegisterView        = "register:view"
	PermissionRegisterCreate     = "register:create"
	PermissionRegisterUpdate     = "register:update"
	PermissionRegisterCancel     = "register:cancel"
	PermissionAppointmentView    = "appointment:view"
	PermissionAppointmentCreate   = "appointment:create"
	PermissionAppointmentUpdate   = "appointment:update"
	PermissionAppointmentCancel   = "appointment:cancel"

	// ===== PATIENT MODULE =====
	PermissionPatientView         = "patient:view"
	PermissionPatientCreate       = "patient:create"
	PermissionPatientUpdate       = "patient:update"
	PermissionPatientDelete       = "patient:delete"

	// ===== KASSA MODULE =====
	PermissionCashierView         = "cashier:view"
	PermissionCashierInvoice      = "cashier:invoice"
	PermissionCashierPayment      = "cashier:payment"
	PermissionCashierRefund       = "cashier:refund"
	PermissionCashierReport       = "cashier:report"
	PermissionCashierStatistics   = "cashier:statistics"

	// ===== NAVBAT (QUEUE) MODULE =====
	PermissionQueueView           = "queue:view"
	PermissionQueueManage         = "queue:manage"
	PermissionQueueCall           = "queue:call"
	PermissionQueueComplete       = "queue:complete"
	PermissionQueueDisplayView    = "queue_display:view"
	PermissionQueueDisplayManage  = "queue_display:manage"

	// ===== EMR MODULE =====
	PermissionEMRView            = "emr:view"
	PermissionEMRCreate          = "emr:create"
	PermissionEMRUpdate          = "emr:update"
	PermissionEpisodeView        = "episode:view"
	PermissionEpisodeCreate      = "episode:create"
	PermissionEpisodeUpdate      = "episode:update"
	PermissionEpisodeClose       = "episode:close"
	PermissionDiagnosisView       = "diagnosis:view"
	PermissionDiagnosisCreate     = "diagnosis:create"
	PermissionDiagnosisUpdate     = "diagnosis:update"
	PermissionDiagnosisDelete     = "diagnosis:delete"
	PermissionRecommendationView = "recommendation:view"
	PermissionRecommendationCreate = "recommendation:create"
	PermissionRecommendationUpdate = "recommendation:update"
	PermissionRecommendationDelete = "recommendation:delete"
	PermissionReferralView       = "referral:view"
	PermissionReferralCreate     = "referral:create"
	PermissionReferralUpdate     = "referral:update"
	PermissionReferralDelete     = "referral:delete"
	PermissionVitalsView         = "vitals:view"
	PermissionVitalsCreate       = "vitals:create"
	PermissionVitalsUpdate       = "vitals:update"

	// ===== DOCTOR MODULE =====
	PermissionDoctorView         = "doctor:view"
	PermissionDoctorEncounter    = "doctor:encounter"
	PermissionDoctorPrescription = "doctor:prescription"
	PermissionDoctorLabOrder     = "doctor:lab_order"

	// ===== LIS MODULE =====
	PermissionLISView            = "lis:view"
	PermissionLISOrderCreate     = "lis:order_create"
	PermissionLISOrderUpdate     = "lis:order_update"
	PermissionLISSampleCollect   = "lis:sample_collect"
	PermissionLISResultEnter     = "lis:result_enter"
	PermissionLISResultValidate  = "lis:result_validate"

	// ===== DIRECTOR MODULE =====
	PermissionDirectorView         = "director:view"
	PermissionDirectorReport       = "director:report"
	PermissionDirectorDashboard    = "director:dashboard"
	PermissionDirectorRevenue      = "director:revenue"
	PermissionDirectorAppointments = "director:appointments"
	PermissionDirectorPatients     = "director:patients"
	PermissionDirectorExpenses     = "director:expenses"
	PermissionDirectorReferral     = "director:referral"
	PermissionDirectorStatistics  = "director:statistics"
	PermissionDirectorExport       = "director:export"

	// ===== HOSPITAL MODULE =====
	PermissionHospitalView        = "hospital:view"
	PermissionHospitalAdmission  = "hospital:admission"
	PermissionHospitalTransfer    = "hospital:transfer"
	PermissionHospitalDischarge   = "hospital:discharge"
	PermissionHospitalDepartment  = "hospital:department"
	PermissionHospitalRoom        = "hospital:room"
	PermissionHospitalBed         = "hospital:bed"

	// ===== FINANCE MODULE =====
	PermissionFinanceView         = "finance:view"
	PermissionFinanceInvoice      = "finance:invoice"
	PermissionFinancePayment      = "finance:payment"
	PermissionFinanceRefund       = "finance:refund"
	PermissionFinanceExpense      = "finance:expense"
	PermissionFinanceExpenseApprove = "finance:expense_approve"
	PermissionFinanceDeposit       = "finance:deposit"
	PermissionFinanceDepositTopup = "finance:deposit_topup"
	PermissionFinanceDepositWithdraw = "finance:deposit_withdraw"
	PermissionFinancePriceCategory = "finance:price_category"

	// ===== ROLES MODULE =====
	PermissionRoleView           = "role:view"
	PermissionRoleCreate         = "role:create"
	PermissionRoleUpdate         = "role:update"
	PermissionRoleDelete         = "role:delete"
	PermissionPermissionView     = "permission:view"
	PermissionPermissionAssign   = "permission:assign"

	// ===== SERVICES MODULE =====
	PermissionServicesView       = "services:view"
	PermissionServicesCreate     = "services:create"
	PermissionServicesUpdate     = "services:update"
	PermissionServicesDelete     = "services:delete"
	PermissionServicesGroupView  = "services:group_view"
	PermissionServicesGroupCreate = "services:group_create"
	PermissionServicesGroupUpdate = "services:group_update"
	PermissionServicesGroupDelete = "services:group_delete"
	PermissionServicesPriceView  = "services:price_view"
	PermissionServicesPriceUpdate = "services:price_update"

	// ===== STAFF MODULE =====
	PermissionStaffView          = "staff:view"
	PermissionStaffCreate        = "staff:create"
	PermissionStaffUpdate        = "staff:update"
	PermissionStaffDelete        = "staff:delete"
	PermissionStaffScheduleView   = "staff:schedule_view"
	PermissionStaffScheduleManage = "staff:schedule_manage"
	PermissionStaffAbsenceView    = "staff:absence_view"
	PermissionStaffAbsenceManage   = "staff:absence_manage"
	PermissionStaffStatistics    = "staff:statistics"
)

// RolePermissions maps roles to their permissions
var RolePermissions = map[string][]string{
	"super_admin": {
		// All permissions for super admin
		"*", // Wildcard for all
	},
	"admin": {
		PermissionClinicView, PermissionClinicCreate, PermissionClinicUpdate, PermissionClinicDelete,
		PermissionUserView, PermissionUserCreate, PermissionUserUpdate, PermissionUserDelete, PermissionUserRoleAssign,
		PermissionBranchView, PermissionBranchCreate, PermissionBranchUpdate, PermissionBranchDelete,
		PermissionReferenceView, PermissionReferenceCreate, PermissionReferenceUpdate, PermissionReferenceDelete,
		PermissionSettingsView, PermissionSettingsUpdate, PermissionAuditLogView,
		PermissionRoleView, PermissionRoleCreate, PermissionRoleUpdate, PermissionRoleDelete,
		PermissionPermissionView, PermissionPermissionAssign,
		PermissionDirectorView, PermissionDirectorReport, PermissionDirectorDashboard, PermissionDirectorExport,
		PermissionServicesView, PermissionServicesCreate, PermissionServicesUpdate, PermissionServicesDelete,
		PermissionServicesGroupView, PermissionServicesGroupCreate, PermissionServicesGroupUpdate, PermissionServicesGroupDelete,
		PermissionServicesPriceView, PermissionServicesPriceUpdate,
		PermissionStaffView, PermissionStaffCreate, PermissionStaffUpdate, PermissionStaffDelete,
		PermissionStaffScheduleView, PermissionStaffScheduleManage, PermissionStaffAbsenceView, PermissionStaffAbsenceManage,
		PermissionFinanceView, PermissionFinanceExpense, PermissionFinanceExpenseApprove,
	},
	"registrator": {
		PermissionRegisterView, PermissionRegisterCreate, PermissionRegisterUpdate, PermissionRegisterCancel,
		PermissionAppointmentView, PermissionAppointmentCreate, PermissionAppointmentUpdate, PermissionAppointmentCancel,
		PermissionPatientView,
	},
	"cashier": {
		PermissionCashierView, PermissionCashierInvoice, PermissionCashierPayment, PermissionCashierRefund,
		PermissionCashierReport, PermissionCashierStatistics,
		PermissionFinanceView, PermissionFinanceInvoice, PermissionFinancePayment, PermissionFinanceRefund,
		PermissionFinanceDeposit, PermissionFinanceDepositTopup, PermissionFinanceDepositWithdraw,
	},
	"doctor": {
		PermissionDoctorView, PermissionDoctorEncounter, PermissionDoctorPrescription, PermissionDoctorLabOrder,
		PermissionEMRView, PermissionEMRCreate, PermissionEMRUpdate,
		PermissionEpisodeView, PermissionEpisodeCreate, PermissionEpisodeUpdate, PermissionEpisodeClose,
		PermissionDiagnosisView, PermissionDiagnosisCreate, PermissionDiagnosisUpdate, PermissionDiagnosisDelete,
		PermissionRecommendationView, PermissionRecommendationCreate, PermissionRecommendationUpdate, PermissionRecommendationDelete,
		PermissionReferralView, PermissionReferralCreate,
		PermissionVitalsView, PermissionVitalsCreate, PermissionVitalsUpdate,
		PermissionLISView, PermissionLISOrderCreate, PermissionLISOrderUpdate,
		PermissionPatientView,
	},
	"nurse": {
		PermissionEMRView, PermissionEMRUpdate,
		PermissionEpisodeView,
		PermissionVitalsView, PermissionVitalsCreate, PermissionVitalsUpdate,
		PermissionLISView, PermissionLISSampleCollect,
		PermissionPatientView,
	},
	"lab_technician": {
		PermissionLISView, PermissionLISSampleCollect, PermissionLISResultEnter,
		PermissionPatientView,
	},
	"director": {
		PermissionDirectorView, PermissionDirectorReport, PermissionDirectorDashboard, PermissionDirectorRevenue,
		PermissionDirectorAppointments, PermissionDirectorPatients, PermissionDirectorExpenses,
		PermissionDirectorReferral, PermissionDirectorStatistics, PermissionDirectorExport,
		PermissionFinanceView,
	},
	"accountant": {
		PermissionFinanceView, PermissionFinanceInvoice, PermissionFinancePayment, PermissionFinanceRefund,
		PermissionFinanceExpense, PermissionFinanceExpenseApprove,
		PermissionCashierView, PermissionCashierReport, PermissionCashierStatistics,
	},
	"patient": {
		PermissionPatientView,
	},
}

// ModulePermissions groups permissions by module
var ModulePermissions = map[string][]string{
	"admin": {
		PermissionClinicView, PermissionClinicCreate, PermissionClinicUpdate, PermissionClinicDelete,
		PermissionUserView, PermissionUserCreate, PermissionUserUpdate, PermissionUserDelete, PermissionUserRoleAssign,
		PermissionBranchView, PermissionBranchCreate, PermissionBranchUpdate, PermissionBranchDelete,
		PermissionReferenceView, PermissionReferenceCreate, PermissionReferenceUpdate, PermissionReferenceDelete,
		PermissionSettingsView, PermissionSettingsUpdate, PermissionAuditLogView,
	},
	"register": {
		PermissionRegisterView, PermissionRegisterCreate, PermissionRegisterUpdate, PermissionRegisterCancel,
		PermissionAppointmentView, PermissionAppointmentCreate, PermissionAppointmentUpdate, PermissionAppointmentCancel,
	},
	"cashier": {
		PermissionCashierView, PermissionCashierInvoice, PermissionCashierPayment, PermissionCashierRefund,
		PermissionCashierReport, PermissionCashierStatistics,
	},
	"queue": {
		PermissionQueueView, PermissionQueueManage, PermissionQueueCall, PermissionQueueComplete,
		PermissionQueueDisplayView, PermissionQueueDisplayManage,
	},
	"emr": {
		PermissionEMRView, PermissionEMRCreate, PermissionEMRUpdate,
		PermissionEpisodeView, PermissionEpisodeCreate, PermissionEpisodeUpdate, PermissionEpisodeClose,
		PermissionDiagnosisView, PermissionDiagnosisCreate, PermissionDiagnosisUpdate, PermissionDiagnosisDelete,
		PermissionRecommendationView, PermissionRecommendationCreate, PermissionRecommendationUpdate, PermissionRecommendationDelete,
		PermissionReferralView, PermissionReferralCreate, PermissionReferralUpdate, PermissionReferralDelete,
		PermissionVitalsView, PermissionVitalsCreate, PermissionVitalsUpdate,
	},
	"doctor": {
		PermissionDoctorView, PermissionDoctorEncounter, PermissionDoctorPrescription, PermissionDoctorLabOrder,
	},
	"lis": {
		PermissionLISView, PermissionLISOrderCreate, PermissionLISOrderUpdate,
		PermissionLISSampleCollect, PermissionLISResultEnter, PermissionLISResultValidate,
	},
	"director": {
		PermissionDirectorView, PermissionDirectorReport, PermissionDirectorDashboard, PermissionDirectorRevenue,
		PermissionDirectorAppointments, PermissionDirectorPatients, PermissionDirectorExpenses,
		PermissionDirectorReferral, PermissionDirectorStatistics, PermissionDirectorExport,
	},
	"hospital": {
		PermissionHospitalView, PermissionHospitalAdmission, PermissionHospitalTransfer,
		PermissionHospitalDischarge, PermissionHospitalDepartment, PermissionHospitalRoom, PermissionHospitalBed,
	},
	"finance": {
		PermissionFinanceView, PermissionFinanceInvoice, PermissionFinancePayment, PermissionFinanceRefund,
		PermissionFinanceExpense, PermissionFinanceExpenseApprove,
		PermissionFinanceDeposit, PermissionFinanceDepositTopup, PermissionFinanceDepositWithdraw,
		PermissionFinancePriceCategory,
	},
	"roles": {
		PermissionRoleView, PermissionRoleCreate, PermissionRoleUpdate, PermissionRoleDelete,
		PermissionPermissionView, PermissionPermissionAssign,
	},
	"services": {
		PermissionServicesView, PermissionServicesCreate, PermissionServicesUpdate, PermissionServicesDelete,
		PermissionServicesGroupView, PermissionServicesGroupCreate, PermissionServicesGroupUpdate, PermissionServicesGroupDelete,
		PermissionServicesPriceView, PermissionServicesPriceUpdate,
	},
	"staff": {
		PermissionStaffView, PermissionStaffCreate, PermissionStaffUpdate, PermissionStaffDelete,
		PermissionStaffScheduleView, PermissionStaffScheduleManage,
		PermissionStaffAbsenceView, PermissionStaffAbsenceManage, PermissionStaffStatistics,
	},
}
