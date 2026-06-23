package postgres

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(pool *pgxpool.Pool) error {
	ctx := context.Background()

	migrations := []string{
		// Users table
		`CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			first_name VARCHAR(100) NOT NULL,
			last_name VARCHAR(100) NOT NULL,
			role VARCHAR(50) NOT NULL,
			clinic_id UUID,
			branch_id UUID,
			is_active BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)`,
		// Clinics table
		`CREATE TABLE IF NOT EXISTS clinics (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(255) NOT NULL,
			address TEXT,
			phone VARCHAR(50),
			email VARCHAR(255),
			inn VARCHAR(50),
			is_active BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)`,
		// Branches table
		`CREATE TABLE IF NOT EXISTS branches (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			clinic_id UUID NOT NULL,
			name VARCHAR(255) NOT NULL,
			address TEXT,
			phone VARCHAR(50),
			is_active BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)`,
		// Patients table (updated with med_id, clinic_id, branch_id)
		`CREATE TABLE IF NOT EXISTS patients (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			med_id VARCHAR(50) UNIQUE NOT NULL,
			clinic_id UUID NOT NULL,
			branch_id UUID,
			first_name VARCHAR(100) NOT NULL,
			last_name VARCHAR(100) NOT NULL,
			patronymic VARCHAR(100),
			birth_date DATE NOT NULL,
			gender VARCHAR(10) NOT NULL,
			phone VARCHAR(50) NOT NULL,
			phone_2 VARCHAR(50),
			email VARCHAR(255),
			citizenship VARCHAR(100),
			address TEXT,
			region_id UUID,
			passport VARCHAR(50),
			price_category_id UUID,
			deposit_balance DECIMAL(12,2) DEFAULT 0,
			is_active BOOLEAN DEFAULT true,
			created_by UUID,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)`,
		// Audit logs table
		`CREATE TABLE IF NOT EXISTS audit_logs (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			clinic_id UUID,
			branch_id UUID,
			user_id UUID,
			action VARCHAR(100) NOT NULL,
			entity_type VARCHAR(50) NOT NULL,
			entity_id UUID,
			details JSONB,
			ip_address VARCHAR(50),
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		// Queues table
		`CREATE TABLE IF NOT EXISTS queues (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			clinic_id UUID NOT NULL,
			branch_id UUID,
			name VARCHAR(100) NOT NULL,
			description TEXT,
			is_active BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		// Queue daily numbers table
		`CREATE TABLE IF NOT EXISTS queue_daily_numbers (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			queue_id UUID NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
			queue_date DATE NOT NULL,
			last_number INTEGER DEFAULT 0,
			UNIQUE(queue_id, queue_date)
		)`,
		// Staff table
		`CREATE TABLE IF NOT EXISTS staff (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID REFERENCES users(id),
			first_name VARCHAR(100) NOT NULL,
			last_name VARCHAR(100) NOT NULL,
			patronymic VARCHAR(100),
			specialty VARCHAR(100),
			position VARCHAR(100),
			cabinet VARCHAR(20),
			photo_url TEXT,
			is_active BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)`,
		// Service groups table (fixed columns to match seed data)
		`CREATE TABLE IF NOT EXISTS service_groups (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			clinic_id UUID NOT NULL,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			icon VARCHAR(50),
			sort_order INTEGER DEFAULT 0,
			is_active BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		// Services table (fixed: group_id is UUID, added clinic_id)
		`CREATE TABLE IF NOT EXISTS services (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			clinic_id UUID NOT NULL,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			duration INTEGER NOT NULL DEFAULT 30,
			base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
			group_id UUID REFERENCES service_groups(id),
			is_active BOOLEAN DEFAULT true,
			requires_sample BOOLEAN DEFAULT false,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		// Appointments table (updated with clinic_id, branch_id, created_by, appointment_number)
		`CREATE TABLE IF NOT EXISTS appointments (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			appointment_number VARCHAR(50) UNIQUE NOT NULL,
			clinic_id UUID NOT NULL,
			branch_id UUID,
			patient_id UUID NOT NULL REFERENCES patients(id),
			doctor_id UUID,
			service_id UUID,
			status VARCHAR(50) DEFAULT 'scheduled',
			appointment_date DATE NOT NULL,
			start_time TIME NOT NULL,
			end_time TIME,
			booking_method VARCHAR(50),
			cabinet VARCHAR(20),
			notes TEXT,
			cancel_reason TEXT,
			created_by UUID,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)`,
		// Episodes table
		`CREATE TABLE IF NOT EXISTS episodes (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			patient_id UUID NOT NULL REFERENCES patients(id),
			doctor_id UUID NOT NULL REFERENCES staff(id),
			title VARCHAR(255) NOT NULL,
			status VARCHAR(50) DEFAULT 'active',
			conclusion TEXT,
			started_at TIMESTAMP DEFAULT NOW(),
			completed_at TIMESTAMP
		)`,
		// Encounters table
		`CREATE TABLE IF NOT EXISTS encounters (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			episode_id UUID NOT NULL REFERENCES episodes(id),
			appointment_id UUID REFERENCES appointments(id),
			started_at TIMESTAMP DEFAULT NOW(),
			completed_at TIMESTAMP,
			complaints TEXT,
			examination TEXT,
			notes TEXT,
			conclusion TEXT
		)`,
		// Vitals table
		`CREATE TABLE IF NOT EXISTS vitals (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			episode_id UUID NOT NULL REFERENCES episodes(id),
			height DECIMAL(5,2),
			weight DECIMAL(5,2),
			temperature DECIMAL(4,1),
			bp_systolic INTEGER,
			bp_diastolic INTEGER,
			pulse INTEGER,
			blood_sugar DECIMAL(5,1),
			waist DECIMAL(5,1),
			comments TEXT,
			recorded_at TIMESTAMP DEFAULT NOW()
		)`,
		// Diagnoses table
		`CREATE TABLE IF NOT EXISTS diagnoses (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			episode_id UUID NOT NULL REFERENCES episodes(id),
			icd_code VARCHAR(20) NOT NULL,
			icd_name VARCHAR(255) NOT NULL,
			type VARCHAR(50) NOT NULL,
			status VARCHAR(50) DEFAULT 'suspected',
			notes TEXT,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		// Recommendations table
		`CREATE TABLE IF NOT EXISTS recommendations (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			episode_id UUID NOT NULL REFERENCES episodes(id),
			type VARCHAR(50) NOT NULL,
			service_id UUID REFERENCES services(id),
			description TEXT NOT NULL,
			instructions TEXT,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		// Medical files table
		`CREATE TABLE IF NOT EXISTS medical_files (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			episode_id UUID NOT NULL REFERENCES episodes(id),
			file_name VARCHAR(255) NOT NULL,
			file_type VARCHAR(100),
			file_path TEXT NOT NULL,
			file_size INTEGER,
			uploaded_at TIMESTAMP DEFAULT NOW()
		)`,
		// Invoices table
		`CREATE TABLE IF NOT EXISTS invoices (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			patient_id UUID NOT NULL REFERENCES patients(id),
			total_amount DECIMAL(12,2) NOT NULL,
			discount_amount DECIMAL(12,2) DEFAULT 0,
			paid_amount DECIMAL(12,2) DEFAULT 0,
			status VARCHAR(50) DEFAULT 'open',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		// Invoice items table
		`CREATE TABLE IF NOT EXISTS invoice_items (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			invoice_id UUID NOT NULL REFERENCES invoices(id),
			service_name VARCHAR(255) NOT NULL,
			quantity INTEGER DEFAULT 1,
			unit_price DECIMAL(12,2) NOT NULL,
			discount DECIMAL(12,2) DEFAULT 0,
			total_price DECIMAL(12,2) NOT NULL
		)`,
		// Payments table
		`CREATE TABLE IF NOT EXISTS payments (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			invoice_id UUID REFERENCES invoices(id),
			patient_id UUID REFERENCES patients(id),
			amount DECIMAL(12,2) NOT NULL,
			payment_method VARCHAR(50) NOT NULL,
			reference VARCHAR(255),
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		// Deposits table
		`CREATE TABLE IF NOT EXISTS deposits (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			patient_id UUID NOT NULL REFERENCES patients(id),
			amount DECIMAL(12,2) NOT NULL,
			balance_after DECIMAL(12,2) NOT NULL,
			description TEXT,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		// Queues table
		`CREATE TABLE IF NOT EXISTS queues (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(255) NOT NULL,
			queue_type VARCHAR(50) NOT NULL,
			is_active BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		// Queue entries table (updated with clinic_id, branch_id, created_by)
		`CREATE TABLE IF NOT EXISTS queue_entries (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			queue_id UUID NOT NULL REFERENCES queues(id),
			clinic_id UUID NOT NULL,
			branch_id UUID,
			patient_id UUID NOT NULL REFERENCES patients(id),
			appointment_id UUID REFERENCES appointments(id),
			queue_number INTEGER NOT NULL,
			status VARCHAR(50) DEFAULT 'waiting',
			registered_at TIMESTAMP DEFAULT NOW(),
			called_at TIMESTAMP,
			cabinet VARCHAR(20),
			doctor_id UUID REFERENCES staff(id),
			created_by UUID,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		// LIS orders table
		`CREATE TABLE IF NOT EXISTS lis_orders (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			patient_id UUID NOT NULL REFERENCES patients(id),
			doctor_id UUID NOT NULL REFERENCES staff(id),
			episode_id UUID REFERENCES episodes(id),
			status VARCHAR(50) DEFAULT 'pending',
			priority VARCHAR(20) DEFAULT 'normal',
			notes TEXT,
			created_at TIMESTAMP DEFAULT NOW(),
			collected_at TIMESTAMP,
			completed_at TIMESTAMP
		)`,
		// LIS order items table
		`CREATE TABLE IF NOT EXISTS lis_order_items (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			order_id UUID NOT NULL REFERENCES lis_orders(id),
			item_name VARCHAR(255) NOT NULL,
			sample_type VARCHAR(50),
			result TEXT,
			reference_group_id UUID,
			reference_min DECIMAL(10,2),
			reference_max DECIMAL(10,2),
			unit VARCHAR(50),
			is_abnormal BOOLEAN DEFAULT false
		)`,
		// LIS reference groups table
		`CREATE TABLE IF NOT EXISTS lis_reference_groups (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(255) NOT NULL,
			description TEXT
		)`,
		// ICD10 table
		`CREATE TABLE IF NOT EXISTS icd10 (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			code VARCHAR(20) UNIQUE NOT NULL,
			name VARCHAR(500) NOT NULL,
			parent_id UUID REFERENCES icd10(id)
		)`,
		// Territories table
		`CREATE TABLE IF NOT EXISTS territories (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(255) NOT NULL,
			type VARCHAR(50) NOT NULL,
			parent_id UUID REFERENCES territories(id)
		)`,
		// Payment methods table
		`CREATE TABLE IF NOT EXISTS payment_methods (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(100) NOT NULL,
			is_active BOOLEAN DEFAULT true
		)`,
		// Create indexes
		`CREATE INDEX IF NOT EXISTS idx_patients_med_id ON patients(med_id)`,
		`CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id)`,
		`CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone)`,
		`CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id)`,
		`CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id)`,
		`CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)`,
		`CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON appointments(clinic_id)`,
		`CREATE INDEX IF NOT EXISTS idx_appointments_number ON appointments(appointment_number)`,
		`CREATE INDEX IF NOT EXISTS idx_queue_entries_queue ON queue_entries(queue_id)`,
		`CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON queue_entries(status)`,
		`CREATE INDEX IF NOT EXISTS idx_queue_entries_clinic ON queue_entries(clinic_id)`,
		`CREATE INDEX IF NOT EXISTS idx_queue_entries_date ON queue_entries(registered_at)`,
		`CREATE INDEX IF NOT EXISTS idx_episodes_patient ON episodes(patient_id)`,
		`CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id)`,
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`,
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id)`,
	}

	for _, migration := range migrations {
		if _, err := pool.Exec(ctx, migration); err != nil {
			return fmt.Errorf("ошибка миграции: %w", err)
		}
	}

	return nil
}

// FixSchemaCompatibility adds missing columns to existing tables
// This handles cases where the database was initialized with an older schema
func FixSchemaCompatibility(pool *pgxpool.Pool) error {
	ctx := context.Background()

	// List of column additions to make idempotent (IF NOT EXISTS)
	schemaFixes := []struct {
		table  string
		column string
		sql    string
	}{
		{
			table:  "patients",
			column: "med_id",
			sql:    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS med_id VARCHAR(50)`,
		},
		{
			table:  "patients",
			column: "clinic_id",
			sql:    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440001'`,
		},
		{
			table:  "patients",
			column: "branch_id",
			sql:    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS branch_id UUID`,
		},
		{
			table:  "patients",
			column: "created_by",
			sql:    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_by UUID`,
		},
		{
			table:  "patients",
			column: "updated_at",
			sql:    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
		},
		{
			table:  "patients",
			column: "region_id",
			sql:    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS region_id UUID`,
		},
		{
			table:  "patients",
			column: "price_category_id",
			sql:    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS price_category_id UUID`,
		},
		{
			table:  "patients",
			column: "passport",
			sql:    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS passport VARCHAR(50)`,
		},
		{
			table:  "patients",
			column: "notes",
			sql:    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS notes TEXT`,
		},

		// appointments.service_id: allow NULL so appointments can be created without a service
		{
			table:  "appointments",
			column: "service_id",
			sql:    `ALTER TABLE appointments ALTER COLUMN service_id DROP NOT NULL`,
		},
		// appointments.doctor_id: allow NULL so appointments can be created without a doctor
		{
			table:  "appointments",
			column: "doctor_id",
			sql:    `ALTER TABLE appointments ALTER COLUMN doctor_id DROP NOT NULL`,
		},
		// appointments.cancel_reason
		{
			table:  "appointments",
			column: "cancel_reason",
			sql:    `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancel_reason TEXT`,
		},
		// appointments.cancelled_at
		{
			table:  "appointments",
			column: "cancelled_at",
			sql:    `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ`,
		},
		// appointments.cancelled_by
		{
			table:  "appointments",
			column: "cancelled_by",
			sql:    `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_by UUID`,
		},
		// queue_entries.clinic_id — ensure it exists
		{
			table:  "queue_entries",
			column: "clinic_id",
			sql:    `ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS clinic_id UUID`,
		},
		// queue_entries.branch_id
		{
			table:  "queue_entries",
			column: "branch_id",
			sql:    `ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS branch_id UUID`,
		},
	}

	for _, fix := range schemaFixes {
		// Check if column exists first
		var exists bool
		checkSQL := `
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns
				WHERE table_name = $1 AND column_name = $2
			)
		`
		err := pool.QueryRow(ctx, checkSQL, fix.table, fix.column).Scan(&exists)
		if err != nil {
			log.Printf("Warning: could not check column %s.%s: %v", fix.table, fix.column, err)
			continue
		}

		if !exists {
			_, err := pool.Exec(ctx, fix.sql)
			if err != nil {
				log.Printf("Warning: could not add column %s.%s: %v", fix.table, fix.column, err)
			} else {
				log.Printf("Added missing column %s.%s", fix.table, fix.column)
			}
		}
	}

	// Ensure med_id has unique constraint and default value for existing rows
	_, err := pool.Exec(ctx, `
		UPDATE patients SET med_id = 'AMIS-P-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(CAST(COALESCE((SELECT MAX(CAST(SUBSTRING(med_id FROM 'AMIS-P-[0-9]{4}-([0-9]+)') AS INTEGER)) FROM patients WHERE med_id ~ 'AMIS-P-[0-9]{4}-[0-9]+'), 0) + ROW_NUMBER() OVER (ORDER BY id) AS VARCHAR), 6, '0')
		WHERE med_id IS NULL OR med_id = ''
	`)
	if err != nil {
		log.Printf("Warning: could not set med_id for existing patients: %v", err)
	}

	return nil
}

func SeedData(pool *pgxpool.Pool) error {
	ctx := context.Background()

	var exists bool
	err := pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM clinics LIMIT 1)").Scan(&exists)
	if err != nil {
		return fmt.Errorf("ошибка проверки данных: %w", err)
	}

	if exists {
		log.Println("Начальные данные уже существуют, пропускаем seeding")
		return nil
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("ошибка начала транзакции: %w", err)
	}
	defer tx.Rollback(ctx)

	clinicID := "550e8400-e29b-41d4-a716-446655440001"
	branchID := "550e8400-e29b-41d4-a716-446655440002"
	adminUserID := "550e8400-e29b-41d4-a716-446655440003"
	doctorUserID := "550e8400-e29b-41d4-a716-446655440004"
	staffID := "550e8400-e29b-41d4-a716-446655440005"
	doctorStaffID := "550e8400-e29b-41d4-a716-446655440006"

	_, err = tx.Exec(ctx, `
		INSERT INTO clinics (id, name, legal_name, inn, address, phone, email, is_active)
		VALUES ($1, 'Demo Clinic', 'ООО "Демо Клиника"', '12345678901234', 'Ташкент, ул. Примерная, 1', '+998711234567', 'info@demo-clinic.uz', true)
	`, clinicID)
	if err != nil {
		return fmt.Errorf("ошибка вставки клиники: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO branches (id, clinic_id, name, address, phone, is_main, is_active)
		VALUES ($1, $2, 'Главный филиал', 'Ташкент, ул. Примерная, 1', '+998711234568', true, true)
	`, branchID, clinicID)
	if err != nil {
		return fmt.Errorf("ошибка вставки филиала: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO roles (id, clinic_id, name, description, level, permissions, is_system, is_active)
		VALUES
			('660e8400-e29b-41d4-a716-446655440001', NULL, 'super_admin', 'Супер-администратор платформы', 100, '["*"]', true, true),
			('660e8400-e29b-41d4-a716-446655440002', $1, 'clinic_admin', 'Администратор клиники', 80, '["clinics", "branches", "users", "patients", "appointments", "cashier", "analytics"]', true, true),
			('660e8400-e29b-41d4-a716-446655440003', $1, 'director', 'Директор', 70, '["patients", "appointments", "cashier", "analytics", "staff"]', true, true),
			('660e8400-e29b-41d4-a716-446655440004', $1, 'doctor', 'Врач', 50, '["appointments", "medical"]', true, true),
			('660e8400-e29b-41d4-a716-446655440005', $1, 'registrar', 'Регистратор', 30, '["patients", "appointments", "queues"]', true, true),
			('660e8400-e29b-41d4-a716-446655440006', $1, 'cashier', 'Кассир', 30, '["cashier", "deposits"]', true, true),
			('660e8400-e29b-41d4-a716-446655440007', $1, 'lab_tech', 'Лаборант', 40, '["lis"]', true, true)
	`, clinicID)
	if err != nil {
		return fmt.Errorf("ошибка вставки ролей: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO users (id, clinic_id, branch_id, email, password_hash, first_name, last_name, phone, role, is_active)
		VALUES
			($1, $2, $3, 'admin@demo-clinic.uz', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqH1C2p3UX2z5T2L1j6T2p3z5T2L1', 'Админ', 'Админов', '+998711234569', 'clinic_admin', true),
			($4, $2, $3, 'doctor@demo-clinic.uz', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqH1C2p3UX2z5T2L1j6T2p3z5T2L1', 'Иван', 'Иванов', '+998711234570', 'doctor', true)
	`, adminUserID, clinicID, branchID, doctorUserID)
	if err != nil {
		return fmt.Errorf("ошибка вставки пользователей: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO staff (id, clinic_id, branch_id, user_id, first_name, last_name, patronymic, specialty, position, phone, cabinet, is_active)
		VALUES
			($1, $2, $3, $4, 'Админ', 'Админов', 'Админович', 'Администрирование', 'Администратор', '+998711234569', '101', true),
			($5, $2, $3, $6, 'Иван', 'Иванов', 'Иванович', 'Терапевт', 'Врач-терапевт', '+998711234570', '201', true)
	`, staffID, clinicID, branchID, adminUserID, doctorStaffID, doctorUserID)
	if err != nil {
		return fmt.Errorf("ошибка вставки сотрудников: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO price_categories (id, clinic_id, name, priority, discount, is_active)
		VALUES
			('770e8400-e29b-41d4-a716-446655440001', $1, 'Стандарт', 1, 0, true),
			('770e8400-e29b-41d4-a716-446655440002', $1, 'Льготный', 2, 15, true),
			('770e8400-e29b-41d4-a716-446655440003', $1, 'VIP', 3, 0, true)
	`, clinicID)
	if err != nil {
		return fmt.Errorf("ошибка вставки категорий прайс-листа: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO service_groups (id, clinic_id, name, description, icon, sort_order, is_active)
		VALUES
			('880e8400-e29b-41d4-a716-446655440001', $1, 'Консультации', 'Консультации специалистов', 'stethoscope', 1, true),
			('880e8400-e29b-41d4-a716-446655440002', $1, 'Диагностика', 'Диагностические исследования', 'activity', 2, true),
			('880e8400-e29b-41d4-a716-446655440003', $1, 'Лаборатория', 'Лабораторные анализы', 'test-tube', 3, true),
			('880e8400-e29b-41d4-a716-446655440004', $1, 'Процедуры', 'Медицинские процедуры', 'heart', 4, true)
	`, clinicID)
	if err != nil {
		return fmt.Errorf("ошибка вставки групп услуг: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO services (id, clinic_id, group_id, name, description, duration, base_price, is_active)
		VALUES
			('990e8400-e29b-41d4-a716-446655440001', $1, '880e8400-e29b-41d4-a716-446655440001', 'Первичная консультация терапевта', 'Приём терапевта первичный', 30, 150000, true),
			('990e8400-e29b-41d4-a716-446655440002', $1, '880e8400-e29b-41d4-a716-446655440001', 'Повторная консультация терапевта', 'Приём терапевта повторный', 20, 100000, true),
			('990e8400-e29b-41d4-a716-446655440003', $1, '880e8400-e29b-41d4-a716-446655440002', 'УЗИ брюшной полости', 'Ультразвуковое исследование органов брюшной полости', 40, 250000, true),
			('990e8400-e29b-41d4-a716-446655440004', $1, '880e8400-e29b-41d4-a716-446655440003', 'Общий анализ крови', 'ОАК с лейкоцитарной формулой', 10, 50000, true),
			('990e8400-e29b-41d4-a716-446655440005', $1, '880e8400-e29b-41d4-a716-446655440003', 'Биохимический анализ крови', 'БАК - основной профиль', 15, 120000, true),
			('990e8400-e29b-41d4-a716-446655440006', $1, '880e8400-e29b-41d4-a716-446655440004', 'Инъекция внутримышечная', 'Внутримышечная инъекция', 10, 30000, true)
	`, clinicID)
	if err != nil {
		return fmt.Errorf("ошибка вставки услуг: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO service_prices (service_id, price_category_id, price)
		SELECT s.id, pc.id, s.base_price * (1 - pc.discount / 100)
		FROM services s
		CROSS JOIN price_categories pc
		WHERE s.clinic_id = $1
	`, clinicID)
	if err != nil {
		return fmt.Errorf("ошибка вставки цен услуг: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO staff_services (staff_id, service_id)
		SELECT $1, id FROM services WHERE clinic_id = $2
	`, doctorStaffID, clinicID)
	if err != nil {
		return fmt.Errorf("ошибка привязки услуг к врачу: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO territories (id, parent_id, name, type, level) VALUES
			('aa0e8400-e29b-41d4-a716-446655440001', NULL, 'Узбекистан', 'country', 0),
			('aa0e8400-e29b-41d4-a716-446655440002', 'aa0e8400-e29b-41d4-a716-446655440001', 'Ташкент', 'region', 1),
			('aa0e8400-e29b-41d4-a716-446655440003', 'aa0e8400-e29b-41d4-a716-446655440002', 'Ташкент', 'city', 2)
	`)
	if err != nil {
		return fmt.Errorf("ошибка вставки территорий: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO icd10 (id, code, name, parent_id, level) VALUES
			('bb0e8400-e29b-41d4-a716-446655440001', 'A00', 'Инфекционные болезни', NULL, 1),
			('bb0e8400-e29b-41d4-a716-446655440002', 'A00.0', 'Холера', 'bb0e8400-e29b-41d4-a716-446655440001', 2),
			('bb0e8400-e29b-41d4-a716-446655440003', 'J00', 'Острые респираторные инфекции верхних дыхательных путей', NULL, 1),
			('bb0e8400-e29b-41d4-a716-446655440004', 'J00.0', 'Острый назофарингит', 'bb0e8400-e29b-41d4-a716-446655440003', 2),
			('bb0e8400-e29b-41d4-a716-446655440005', 'I10', 'Эссенциальная гипертензия', NULL, 1),
			('bb0e8400-e29b-41d4-a716-446655440006', 'E11', 'Сахарный диабет 2 типа', NULL, 1)
	`)
	if err != nil {
		return fmt.Errorf("ошибка вставки МКБ-10: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("ошибка коммита транзакции: %w", err)
	}

	log.Println("Начальные данные успешно загружены")
	log.Println("Демо-аккаунты:")
	log.Println("  admin@demo-clinic.uz / password123 (Администратор клиники)")
	log.Println("  doctor@demo-clinic.uz / password123 (Врач)")

	return nil
}

// SeedRegistraturaData seeds service_groups, services, and queues for the first clinic.
// Idempotent: only inserts if the respective table is empty.
// Safe to call even if SeedData already seeded these (it checks per-table).
func SeedRegistraturaData(pool *pgxpool.Pool) error {
	ctx := context.Background()

	// Get first clinic ID (must exist from SeedData)
	var clinicID string
	err := pool.QueryRow(ctx, "SELECT id FROM clinics LIMIT 1").Scan(&clinicID)
	if err != nil {
		log.Printf("SeedRegistraturaData: no clinic found, skipping: %v", err)
		return nil
	}

	// --- Seed service_groups ---
	var sgCount int
	pool.QueryRow(ctx, "SELECT COUNT(*) FROM service_groups").Scan(&sgCount)
	if sgCount == 0 {
		log.Println("Seeding service_groups...")
		_, err = pool.Exec(ctx, `
			INSERT INTO service_groups (id, clinic_id, name, description, icon, sort_order, is_active)
			VALUES
				('880e8400-e29b-41d4-a716-446655440001', $1, 'Umumiy qabul', 'Umumiy shifokorlik ko''rigi', 'stethoscope', 1, true),
				('880e8400-e29b-41d4-a716-446655440002', $1, 'Laboratoriya', 'Laboratoriya tekshiruvlari', 'test-tube', 2, true),
				('880e8400-e29b-41d4-a716-446655440003', $1, 'Diagnostika', 'Diagnostik tekshiruvlar', 'activity', 3, true),
				('880e8400-e29b-41d4-a716-446655440004', $1, 'Stomatologiya', 'Stomatologik xizmatlar', 'smile', 4, true)
		`, clinicID)
		if err != nil {
			log.Printf("Warning: service_groups seed failed: %v", err)
		}
	}

	// --- Seed services ---
	var svcCount int
	pool.QueryRow(ctx, "SELECT COUNT(*) FROM services").Scan(&svcCount)
	if svcCount == 0 {
		log.Println("Seeding services...")
		_, err = pool.Exec(ctx, `
			INSERT INTO services (id, clinic_id, group_id, name, description, duration, base_price, is_active)
			VALUES
				('990e8400-e29b-41d4-a716-446655440001', $1, '880e8400-e29b-41d4-a716-446655440001', 'Umumiy konsultatsiya', 'Shifokor bilan birinchi uchrashuv', 30, 150000, true),
				('990e8400-e29b-41d4-a716-446655440002', $1, '880e8400-e29b-41d4-a716-446655440001', 'Takroriy konsultatsiya', 'Shifokor bilan keyingi uchrashuv', 20, 100000, true),
				('990e8400-e29b-41d4-a716-446655440003', $1, '880e8400-e29b-41d4-a716-446655440002', 'Qon tahlili', 'Umumiy qon tahlili (OAK)', 10, 50000, true),
				('990e8400-e29b-41d4-a716-446655440004', $1, '880e8400-e29b-41d4-a716-446655440002', 'Biokimyoviy qon tahlili', 'AST, ALT, bilirubin va boshqalar', 15, 120000, true),
				('990e8400-e29b-41d4-a716-446655440005', $1, '880e8400-e29b-41d4-a716-446655440003', 'Uzi tekshiruvi', 'Qorin bo''shlig''i UZI', 30, 180000, true),
				('990e8400-e29b-41d4-a716-446655440006', $1, '880e8400-e29b-41d4-a716-446655440003', 'EKG tekshiruvi', 'Elektrokardiogramma', 20, 80000, true),
				('990e8400-e29b-41d4-a716-446655440007', $1, '880e8400-e29b-41d4-a716-446655440003', 'Rentgen tekshiruvi', 'Rentgenografiya', 15, 100000, true)
		`, clinicID)
		if err != nil {
			log.Printf("Warning: services seed failed: %v", err)
		}
	}

	// --- Seed queues ---
	var qCount int
	pool.QueryRow(ctx, "SELECT COUNT(*) FROM queues").Scan(&qCount)
	if qCount == 0 {
		log.Println("Seeding queues...")
		// Get the main branch for this clinic
		var branchID string
		branchErr := pool.QueryRow(ctx, "SELECT id FROM branches WHERE clinic_id = $1 AND is_main = true LIMIT 1", clinicID).Scan(&branchID)
		if branchErr != nil {
			// Fallback: use any branch
			branchErr = pool.QueryRow(ctx, "SELECT id FROM branches WHERE clinic_id = $1 LIMIT 1", clinicID).Scan(&branchID)
		}
		if branchErr != nil {
			log.Printf("Warning: queues seed failed — no branch found: %v", branchErr)
		} else {
			_, err = pool.Exec(ctx, `
				INSERT INTO queues (id, clinic_id, branch_id, name, queue_type, is_active)
				VALUES
					('770e8400-e29b-41d4-a716-446655440001', $1, $2, 'Asosiy navbat', 'general', true),
					('770e8400-e29b-41d4-a716-446655440002', $1, $2, 'Shoshilinch navbat', 'emergency', true)
			`, clinicID, branchID)
			if err != nil {
				log.Printf("Warning: queues seed failed: %v", err)
			}
		}
	}

	return nil
}
