package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

/**
 * AMIS - Patient Profile Migrations
 * TASK-001: Patient Profile Foundation
 *
 * Additive migrations only - DO NOT modify existing tables
 * All tables use CREATE TABLE IF NOT EXISTS
 */

func RunPatientProfileMigrations(pool *pgxpool.Pool) error {
	ctx := context.Background()

	migrations := []string{
		// 1. patient_profiles - Basic medical data
		`CREATE TABLE IF NOT EXISTS patient_profiles (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			clinic_id UUID,
			branch_id UUID,
			blood_type VARCHAR(10),
			rh_factor VARCHAR(10),
			height DECIMAL(5,2),
			weight DECIMAL(5,2),
			allergies JSONB,
			chronic_diseases JSONB,
			disabilities TEXT,
			notes TEXT,
			is_active BOOLEAN DEFAULT true,
			created_by UUID,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_by UUID,
			updated_at TIMESTAMP DEFAULT NOW()
		)`,

		// 2. patient_documents - ID documents, certificates
		`CREATE TABLE IF NOT EXISTS patient_documents (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			clinic_id UUID,
			branch_id UUID,
			document_type VARCHAR(100) NOT NULL,
			document_number VARCHAR(100),
			issue_date DATE,
			expiry_date DATE,
			issued_by VARCHAR(255),
			file_name VARCHAR(255),
			file_path TEXT,
			file_size INTEGER,
			mime_type VARCHAR(100),
			is_primary BOOLEAN DEFAULT false,
			is_verified BOOLEAN DEFAULT false,
			notes TEXT,
			created_by UUID,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_by UUID,
			updated_at TIMESTAMP DEFAULT NOW()
		)`,

		// 3. patient_contacts - Emergency and additional contacts
		`CREATE TABLE IF NOT EXISTS patient_contacts (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			clinic_id UUID,
			branch_id UUID,
			contact_name VARCHAR(200) NOT NULL,
			relationship VARCHAR(100),
			phone VARCHAR(50),
			phone_2 VARCHAR(50),
			email VARCHAR(255),
			address TEXT,
			is_emergency BOOLEAN DEFAULT false,
			is_primary BOOLEAN DEFAULT false,
			is_active BOOLEAN DEFAULT true,
			notes TEXT,
			created_by UUID,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_by UUID,
			updated_at TIMESTAMP DEFAULT NOW()
		)`,

		// 4. patient_relatives - Family members, next of kin
		`CREATE TABLE IF NOT EXISTS patient_relatives (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			clinic_id UUID,
			branch_id UUID,
			relative_name VARCHAR(200) NOT NULL,
			relationship VARCHAR(100) NOT NULL,
			birth_date DATE,
			gender VARCHAR(10),
			phone VARCHAR(50),
			email VARCHAR(255),
			address TEXT,
			occupation VARCHAR(200),
			is_emergency_contact BOOLEAN DEFAULT false,
			is_next_of_kin BOOLEAN DEFAULT false,
			is_active BOOLEAN DEFAULT true,
			notes TEXT,
			created_by UUID,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_by UUID,
			updated_at TIMESTAMP DEFAULT NOW()
		)`,

		// 5. patient_allergies - Allergy records
		`CREATE TABLE IF NOT EXISTS patient_allergies (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			clinic_id UUID,
			branch_id UUID,
			allergen VARCHAR(255) NOT NULL,
			allergen_type VARCHAR(50),
			severity VARCHAR(50),
			reaction VARCHAR(255),
			onset_date DATE,
			is_verified BOOLEAN DEFAULT false,
			verified_by UUID,
			verified_at TIMESTAMP,
			is_active BOOLEAN DEFAULT true,
			notes TEXT,
			created_by UUID,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_by UUID,
			updated_at TIMESTAMP DEFAULT NOW()
		)`,

		// 6. patient_deposit_transactions - Deposit transaction history
		`CREATE TABLE IF NOT EXISTS patient_deposit_transactions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			clinic_id UUID,
			branch_id UUID,
			transaction_type VARCHAR(50) NOT NULL,
			amount DECIMAL(12,2) NOT NULL,
			balance_before DECIMAL(12,2) NOT NULL,
			balance_after DECIMAL(12,2) NOT NULL,
			payment_method VARCHAR(50),
			reference VARCHAR(255),
			invoice_id UUID REFERENCES invoices(id),
			description TEXT,
			cashier_id UUID,
			is_reversed BOOLEAN DEFAULT false,
			reversed_at TIMESTAMP,
			reversed_by UUID,
			reverse_reason TEXT,
			created_by UUID,
			created_at TIMESTAMP DEFAULT NOW()
		)`,

		// 7. patient_death_info - Death information
		`CREATE TABLE IF NOT EXISTS patient_death_info (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			clinic_id UUID,
			branch_id UUID,
			death_date TIMESTAMP NOT NULL,
			death_place VARCHAR(255),
			death_cause VARCHAR(500),
			icd_code VARCHAR(20),
			icd_name VARCHAR(255),
			certificate_number VARCHAR(100),
			certificate_issued_by VARCHAR(255),
			certificate_issued_date DATE,
			is_verified BOOLEAN DEFAULT false,
			verified_by UUID,
			verified_at TIMESTAMP,
			notes TEXT,
			created_by UUID,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_by UUID,
			updated_at TIMESTAMP DEFAULT NOW()
		)`,

		// 8. patient_questionnaires - Medical questionnaires
		`CREATE TABLE IF NOT EXISTS patient_questionnaires (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			clinic_id UUID,
			branch_id UUID,
			questionnaire_type VARCHAR(100) NOT NULL,
			questionnaire_name VARCHAR(255),
			responses JSONB NOT NULL,
			score INTEGER,
			risk_level VARCHAR(50),
			completed_at TIMESTAMP,
			completed_by UUID,
			is_critical BOOLEAN DEFAULT false,
			critical_items JSONB,
			notes TEXT,
			is_active BOOLEAN DEFAULT true,
			created_by UUID,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_by UUID,
			updated_at TIMESTAMP DEFAULT NOW()
		)`,

		// Indexes for patient_profiles
		`CREATE INDEX IF NOT EXISTS idx_patient_profiles_patient ON patient_profiles(patient_id)`,
		`CREATE INDEX IF NOT EXISTS idx_patient_profiles_clinic ON patient_profiles(clinic_id)`,

		// Indexes for patient_documents
		`CREATE INDEX IF NOT EXISTS idx_patient_documents_patient ON patient_documents(patient_id)`,
		`CREATE INDEX IF NOT EXISTS idx_patient_documents_type ON patient_documents(document_type)`,
		`CREATE INDEX IF NOT EXISTS idx_patient_documents_clinic ON patient_documents(clinic_id)`,

		// Indexes for patient_contacts
		`CREATE INDEX IF NOT EXISTS idx_patient_contacts_patient ON patient_contacts(patient_id)`,
		`CREATE INDEX IF NOT EXISTS idx_patient_contacts_emergency ON patient_contacts(patient_id, is_emergency)`,

		// Indexes for patient_relatives
		`CREATE INDEX IF NOT EXISTS idx_patient_relatives_patient ON patient_relatives(patient_id)`,
		`CREATE INDEX IF NOT EXISTS idx_patient_relatives_next_of_kin ON patient_relatives(patient_id, is_next_of_kin)`,

		// Indexes for patient_allergies
		`CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient ON patient_allergies(patient_id)`,
		`CREATE INDEX IF NOT EXISTS idx_patient_allergies_allergen ON patient_allergies(allergen)`,
		`CREATE INDEX IF NOT EXISTS idx_patient_allergies_active ON patient_allergies(patient_id, is_active)`,

		// Indexes for patient_deposit_transactions
		`CREATE INDEX IF NOT EXISTS idx_patient_deposit_tx_patient ON patient_deposit_transactions(patient_id)`,
		`CREATE INDEX IF NOT EXISTS idx_patient_deposit_tx_type ON patient_deposit_transactions(transaction_type)`,
		`CREATE INDEX IF NOT EXISTS idx_patient_deposit_tx_date ON patient_deposit_transactions(created_at)`,
		`CREATE INDEX IF NOT EXISTS idx_patient_deposit_tx_clinic ON patient_deposit_transactions(clinic_id)`,

		// Indexes for patient_death_info
		`CREATE INDEX IF NOT EXISTS idx_patient_death_info_patient ON patient_death_info(patient_id)`,

		// Indexes for patient_questionnaires
		`CREATE INDEX IF NOT EXISTS idx_patient_questionnaires_patient ON patient_questionnaires(patient_id)`,
		`CREATE INDEX IF NOT EXISTS idx_patient_questionnaires_type ON patient_questionnaires(questionnaire_type)`,
		`CREATE INDEX IF NOT EXISTS idx_patient_questionnaires_critical ON patient_questionnaires(is_critical)`,
	}

	for _, migration := range migrations {
		if _, err := pool.Exec(ctx, migration); err != nil {
			return fmt.Errorf("migration error: %w", err)
		}
	}

	return nil
}