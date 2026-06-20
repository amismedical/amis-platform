-- ===========================================
-- MEDVERSE AN-NAHL / AMIS
-- Supabase Database Migration Script
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- ENUMS
-- ===========================================

CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'registrar', 'cashier', 'lab_tech', 'director');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE queue_entry_status AS ENUM ('waiting', 'called', 'completed', 'cancelled', 'skipped');
CREATE TYPE transaction_type AS ENUM ('payment', 'refund', 'deposit', 'withdrawal');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'deposit');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE record_type AS ENUM ('initial', 'follow_up', 'emergency', 'procedure');
CREATE TYPE diagnosis_type AS ENUM ('primary', 'secondary', 'concomitant');
CREATE TYPE gender AS ENUM ('male', 'female');
CREATE TYPE booking_method AS ENUM ('online', 'phone', 'reception', 'referral');

-- ===========================================
-- TABLES
-- ===========================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    patronymic TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'registrar',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_uz TEXT,
    name_ru TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff (doctors, nurses, etc.)
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    patronymic TEXT,
    position TEXT NOT NULL,
    specialty TEXT,
    cabinet TEXT,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patients
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    patronymic TEXT,
    birth_date DATE NOT NULL,
    gender gender NOT NULL,
    phone TEXT NOT NULL,
    phone_2 TEXT,
    email TEXT,
    citizenship TEXT DEFAULT 'Uzbekistan',
    address TEXT,
    passport_series TEXT,
    deposit_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service Groups
CREATE TABLE IF NOT EXISTS service_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_uz TEXT,
    name_ru TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_uz TEXT,
    name_ru TEXT,
    description TEXT,
    duration INTEGER NOT NULL DEFAULT 30, -- minutes
    base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    service_group_id UUID REFERENCES service_groups(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    booking_method booking_method NOT NULL DEFAULT 'online',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Queues
CREATE TABLE IF NOT EXISTS queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_uz TEXT,
    name_ru TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Queue Entries
CREATE TABLE IF NOT EXISTS queue_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id UUID NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    queue_number INTEGER NOT NULL,
    status queue_entry_status NOT NULL DEFAULT 'waiting',
    cabinet TEXT,
    called_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cashier Transactions
CREATE TABLE IF NOT EXISTS cashier_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_method payment_method NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Medical Records
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    doctor_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    record_type record_type NOT NULL DEFAULT 'initial',
    chief_complaint TEXT,
    anamnesis TEXT,
    diagnosis TEXT,
    treatment TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vitals
CREATE TABLE IF NOT EXISTS vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    temperature DECIMAL(4,1),
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    respiratory_rate INTEGER,
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Diagnoses
CREATE TABLE IF NOT EXISTS diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
    icd_code TEXT,
    diagnosis_text TEXT NOT NULL,
    diagnosis_type diagnosis_type NOT NULL DEFAULT 'primary',
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
    medication TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_created_at ON patients(created_at DESC);

CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_staff_specialty ON staff(specialty);
CREATE INDEX idx_staff_position ON staff(position);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE INDEX idx_queue_entries_queue ON queue_entries(queue_id);
CREATE INDEX idx_queue_entries_patient ON queue_entries(patient_id);
CREATE INDEX idx_queue_entries_status ON queue_entries(status);

CREATE INDEX idx_transactions_patient ON cashier_transactions(patient_id);
CREATE INDEX idx_transactions_created_at ON cashier_transactions(created_at DESC);

CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_doctor ON medical_records(doctor_id);

CREATE INDEX idx_diagnoses_patient ON diagnoses(patient_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit log entry
CREATE OR REPLACE FUNCTION audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
        COALESCE(NEW.created_by, auth.uid()),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT),
        CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Profiles updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Staff updated_at
CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Patients updated_at
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Appointments updated_at
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Medical records updated_at
CREATE TRIGGER update_medical_records_updated_at
    BEFORE UPDATE ON medical_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Settings updated_at
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Audit log trigger
CREATE TRIGGER audit_patients
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION audit_log();

CREATE TRIGGER audit_appointments
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION audit_log();

CREATE TRIGGER audit_cashier_transactions
    AFTER INSERT OR UPDATE OR DELETE ON cashier_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_log();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Departments policies
CREATE POLICY "Departments are viewable by authenticated users"
    ON departments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage departments"
    ON departments FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Staff policies
CREATE POLICY "Staff are viewable by authenticated users"
    ON staff FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage staff"
    ON staff FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
    );

-- Patients policies
CREATE POLICY "Patients are viewable by authenticated users"
    ON patients FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can create patients"
    ON patients FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'registrar', 'director'))
    );

CREATE POLICY "Staff can update patients"
    ON patients FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'registrar', 'director'))
    );

CREATE POLICY "Admins can delete patients"
    ON patients FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Services policies
CREATE POLICY "Services are viewable by everyone"
    ON services FOR SELECT USING (true);

CREATE POLICY "Admins can manage services"
    ON services FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Appointments policies
CREATE POLICY "Appointments viewable by related users"
    ON appointments FOR SELECT USING (
        auth.role() = 'authenticated'
    );

CREATE POLICY "Staff can create appointments"
    ON appointments FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'registrar', 'doctor', 'director'))
    );

CREATE POLICY "Staff can update appointments"
    ON appointments FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'registrar', 'doctor', 'director'))
    );

-- Queue entries policies
CREATE POLICY "Queue entries viewable by authenticated users"
    ON queue_entries FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage queue entries"
    ON queue_entries FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'registrar', 'doctor', 'director'))
    );

-- Cashier transactions policies
CREATE POLICY "Cashier transactions viewable by cashier/admin"
    ON cashier_transactions FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'cashier', 'director'))
    );

CREATE POLICY "Cashier can create transactions"
    ON cashier_transactions FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'cashier', 'director'))
    );

-- Medical records policies
CREATE POLICY "Doctors can view patient records"
    ON medical_records FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'director'))
    );

CREATE POLICY "Doctors can create medical records"
    ON medical_records FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'director'))
    );

CREATE POLICY "Doctors can update medical records"
    ON medical_records FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'director'))
    );

-- Vitals policies
CREATE POLICY "Vitals viewable by medical staff"
    ON vitals FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'nurse', 'director'))
    );

CREATE POLICY "Medical staff can manage vitals"
    ON vitals FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'nurse', 'director'))
    );

-- Diagnoses policies
CREATE POLICY "Diagnoses viewable by doctors"
    ON diagnoses FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'director'))
    );

CREATE POLICY "Doctors can manage diagnoses"
    ON diagnoses FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'director'))
    );

-- Prescriptions policies
CREATE POLICY "Prescriptions viewable by doctors and patients"
    ON prescriptions FOR SELECT USING (
        auth.role() = 'authenticated'
    );

CREATE POLICY "Doctors can manage prescriptions"
    ON prescriptions FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'director'))
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Settings policies
CREATE POLICY "Settings viewable by authenticated users"
    ON settings FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage settings"
    ON settings FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ===========================================
-- STORAGE BUCKETS
-- ===========================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('patients', 'patients', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('lab-results', 'lab-results', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-images', 'medical-images', false) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar upload for authenticated users"
    ON storage.objects FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND auth.role() = 'authenticated'
    );

CREATE POLICY "Avatar update for owner"
    ON storage.objects FOR UPDATE USING (
        bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Patient documents for authenticated users"
    ON storage.objects FOR SELECT USING (
        bucket_id = 'patients' AND auth.role() = 'authenticated'
    );

CREATE POLICY "Patient document upload"
    ON storage.objects FOR INSERT WITH CHECK (
        bucket_id = 'patients' AND auth.role() = 'authenticated'
    );

-- ===========================================
-- INITIAL DATA
-- ===========================================

-- Default departments
INSERT INTO departments (name, name_uz, name_ru) VALUES
    ('General', 'Umumiy', 'Общее'),
    ('Cardiology', 'Kardiologiya', 'Кардиология'),
    ('Neurology', 'Nevrologiya', 'Неврология'),
    ('Pediatrics', 'Pediatriya', 'Педиатрия'),
    ('Surgery', 'Jarrohlik', 'Хирургия'),
    ('Laboratory', 'Laboratoriya', 'Лаборатория'),
    ('Diagnostics', 'Diagnostika', 'Диагностика')
ON CONFLICT DO NOTHING;

-- Default service groups
INSERT INTO service_groups (name, name_uz, name_ru) VALUES
    ('Consultations', 'Konsultatsiyalar', 'Консультации'),
    ('Diagnostics', 'Diagnostika', 'Диагностика'),
    ('Laboratory', 'Laboratoriya', 'Лаборатория'),
    ('Procedures', 'Protseduralar', 'Процедуры'),
    ('Surgery', 'Jarrohlik', 'Хирургия')
ON CONFLICT DO NOTHING;

-- Default services
INSERT INTO services (name, name_uz, name_ru, duration, base_price, service_group_id) VALUES
    ('General Consultation', 'Umumiy konsultatsiya', 'Общая консультация', 30, 50000,
        (SELECT id FROM service_groups WHERE name = 'Consultations')),
    ('Cardiology Consultation', 'Kardiologiya konsultatsiyasi', 'Консультация кардиолога', 45, 80000,
        (SELECT id FROM service_groups WHERE name = 'Consultations')),
    ('Neurology Consultation', 'Nevrologiya konsultatsiyasi', 'Консультация невролога', 45, 75000,
        (SELECT id FROM service_groups WHERE name = 'Consultations')),
    ('Pediatrics Consultation', 'Pediatriya konsultatsiyasi', 'Консультация педиатра', 30, 60000,
        (SELECT id FROM service_groups WHERE name = 'Consultations')),
    ('ECG', 'EKG', 'ЭКГ', 20, 35000,
        (SELECT id FROM service_groups WHERE name = 'Diagnostics')),
    ('Ultrasound', 'Ultrazvuk', 'УЗИ', 30, 60000,
        (SELECT id FROM service_groups WHERE name = 'Diagnostics')),
    ('X-Ray', 'Rentgen', 'Рентген', 15, 45000,
        (SELECT id FROM service_groups WHERE name = 'Diagnostics')),
    ('Blood Test', 'Qon tahlili', 'Анализ крови', 10, 25000,
        (SELECT id FROM service_groups WHERE name = 'Laboratory')),
    ('Urinalysis', 'Siydik tahlili', 'Анализ мочи', 10, 20000,
        (SELECT id FROM service_groups WHERE name = 'Laboratory'))
ON CONFLICT DO NOTHING;

-- Default queues
INSERT INTO queues (name, name_uz, name_ru) VALUES
    ('General Queue', 'Umumiy navbat', 'Общая очередь'),
    ('Cardiology Queue', 'Kardiologiya navbati', 'Кардиология очередь'),
    ('Pediatrics Queue', 'Pediatriya navbati', 'Педиатрия очередь')
ON CONFLICT DO NOTHING;

-- ===========================================
-- REALTIME SUBSCRIPTIONS
-- ===========================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE queue_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE cashier_transactions;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE patients IS 'Patient records';
COMMENT ON TABLE appointments IS 'Appointment scheduling';
COMMENT ON TABLE queue_entries IS 'Queue management system';
COMMENT ON TABLE cashier_transactions IS 'Financial transactions';
COMMENT ON TABLE medical_records IS 'Patient medical history';
COMMENT ON TABLE diagnoses IS 'Patient diagnoses';
COMMENT ON TABLE prescriptions IS 'Patient prescriptions';

-- ===========================================
-- DEFAULT ADMIN USER
-- ===========================================
-- This creates the default admin user for testing
-- IMPORTANT: Run this AFTER the user is created in Supabase Auth Dashboard
-- Or use the SQL function below to create the user

-- Option 1: If you already created the user in Supabase Auth, update their profile:
-- UPDATE profiles SET role = 'admin', first_name = 'Admin', last_name = 'User'
-- WHERE email = 'admin@amis.uz';

-- Option 2: Create user via SQL (requires secure password hash)
-- For Supabase, use: SELECT auth.sign_up('{ "email": "admin@amis.uz", "password": "Admin123456" }');

-- ===========================================
-- FUNCTION TO CREATE DEFAULT ADMIN
-- ===========================================
CREATE OR REPLACE FUNCTION create_default_admin_user()
RETURNS VOID AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Create auth user (this will fail if user already exists)
    -- Use Supabase Dashboard > Authentication > Users to create manually instead

    -- For existing user, update their role:
    UPDATE profiles
    SET role = 'admin',
        first_name = 'Admin',
        last_name = 'User',
        is_active = true
    WHERE email = 'admin@amis.uz';

    -- If no profile exists, log a warning
    IF NOT FOUND THEN
        RAISE NOTICE 'Admin profile not found. Please create user in Supabase Auth Dashboard first.';
    ELSE
        RAISE NOTICE 'Admin user profile updated successfully.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;