-- Supabase Initial Schema Migration
-- Generated for Healthcare Web App (Livora)
-- Conversion from MySQL to PostgreSQL (optimized for Supabase)

-- Enable specialized extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "first_name" VARCHAR(100) NOT NULL,
  "last_name" VARCHAR(100) NOT NULL,
  "phone" VARCHAR(20),
  "date_of_birth" DATE,
  "gender" VARCHAR(20) CHECK ("gender" IN ('male', 'female', 'other')),
  "address" TEXT,
  "role" VARCHAR(20) NOT NULL DEFAULT 'patient' CHECK ("role" IN ('patient', 'doctor', 'admin')),
  "is_active" BOOLEAN DEFAULT TRUE,
  "email_verified" BOOLEAN DEFAULT FALSE,
  "profile_image" VARCHAR(500),
  "last_login" TIMESTAMPTZ,
  "reset_password_token" VARCHAR(255),
  "reset_password_expires" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Patients table
CREATE TABLE IF NOT EXISTS "patients" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "blood_type" VARCHAR(5) CHECK ("blood_type" IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  "allergies" TEXT,
  "emergency_contact" VARCHAR(100),
  "emergency_phone" VARCHAR(20),
  "insurance_provider" VARCHAR(100),
  "insurance_number" VARCHAR(50),
  "medical_history" TEXT,
  "current_medications" TEXT,
  "profile_image" VARCHAR(500),
  "medical_documents" JSONB,
  "height" DECIMAL(5,2),
  "weight" DECIMAL(5,2),
  "blood_pressure" VARCHAR(20),
  "pulse" INTEGER,
  "chronic_conditions" TEXT,
  "past_surgeries" TEXT,
  "family_medical_history" TEXT,
  "smoking_status" VARCHAR(50),
  "alcohol_consumption" VARCHAR(50),
  "physical_activity" VARCHAR(50),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Doctors table
CREATE TABLE IF NOT EXISTS "doctors" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "bmdc_registration_number" VARCHAR(50) UNIQUE,
  "department" VARCHAR(100),
  "experience" INTEGER,
  "education" TEXT,
  "certifications" TEXT,
  "consultation_fee" DECIMAL(10,2),
  "availability" JSONB,
  "bio" TEXT,
  "rating" DECIMAL(3,2) DEFAULT 0.00,
  "total_reviews" INTEGER DEFAULT 0,
  "is_verified" BOOLEAN DEFAULT FALSE,
  "profile_image" VARCHAR(500),
  "degrees" JSONB,
  "awards" JSONB,
  "hospital" VARCHAR(200),
  "location" VARCHAR(300),
  "chamber_times" JSONB,
  "languages" JSONB,
  "services" JSONB,
  "signature" VARCHAR(500),
  "chambers" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Appointments table
CREATE TABLE IF NOT EXISTS "appointments" (
  "id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "doctor_id" INTEGER NOT NULL REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "appointment_date" DATE NOT NULL,
  "appointment_time" TIME NOT NULL,
  "duration" INTEGER NOT NULL DEFAULT 180,
  "status" VARCHAR(20) NOT NULL DEFAULT 'requested' CHECK ("status" IN ('requested', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  "serial_number" INTEGER,
  "type" VARCHAR(20) NOT NULL DEFAULT 'in_person' CHECK ("type" IN ('in_person', 'telemedicine', 'follow_up', 'home_visit')),
  "reason" TEXT,
  "symptoms" TEXT,
  "notes" TEXT,
  "prescription" TEXT,
  "diagnosis" TEXT,
  "follow_up_date" DATE,
  "meeting_link" VARCHAR(500),
  "fee" DECIMAL(10,2),
  "payment_status" VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK ("payment_status" IN ('pending', 'paid', 'refunded', 'partial')),
  "started_at" TIMESTAMPTZ,
  "completed_at" TIMESTAMPTZ,
  "chamber" VARCHAR(255),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Prescriptions table
CREATE TABLE IF NOT EXISTS "Prescriptions" (
  "id" SERIAL PRIMARY KEY,
  "appointment_id" INTEGER NOT NULL REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "doctor_id" INTEGER NOT NULL REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "patient_id" INTEGER NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "medicines" TEXT,
  "symptoms" TEXT,
  "diagnosis" TEXT,
  "suggestions" TEXT,
  "tests" TEXT,
  "test_reports" TEXT,
  "status" VARCHAR(20) DEFAULT 'draft' CHECK ("status" IN ('draft', 'completed', 'cancelled')),
  "vital_signs" JSONB,
  "clinical_findings" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Lab Tests table
CREATE TABLE IF NOT EXISTS "lab_tests" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "category" VARCHAR(100) NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "sampleType" VARCHAR(100) NOT NULL,
  "preparationInstructions" TEXT,
  "reportDeliveryTime" INTEGER NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Lab Test Orders table
CREATE TABLE IF NOT EXISTS "lab_test_orders" (
  "id" SERIAL PRIMARY KEY,
  "orderNumber" VARCHAR(50) UNIQUE NOT NULL,
  "patientId" INTEGER NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "doctorId" INTEGER REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "appointmentId" INTEGER REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "testIds" JSONB NOT NULL,
  "totalAmount" DECIMAL(10,2) NOT NULL,
  "paidAmount" DECIMAL(10,2) DEFAULT 0.00,
  "dueAmount" DECIMAL(10,2) NOT NULL,
  "status" VARCHAR(50) DEFAULT 'ordered',
  "paymentMethod" VARCHAR(20) CHECK ("paymentMethod" IN ('online', 'offline', 'mixed')),
  "sampleCollectionDate" TIMESTAMPTZ,
  "expectedResultDate" TIMESTAMPTZ,
  "resultUrl" VARCHAR(255),
  "notes" TEXT,
  "verified_at" TIMESTAMPTZ,
  "verified_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "sampleId" VARCHAR(50),
  "testReports" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Lab Payments
CREATE TABLE IF NOT EXISTS "lab_payments" (
  "id" SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL REFERENCES "lab_test_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "transactionId" VARCHAR(100) UNIQUE,
  "paymentMethod" VARCHAR(50) NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "status" VARCHAR(20) DEFAULT 'pending',
  "gatewayResponse" JSONB,
  "paidAt" TIMESTAMPTZ,
  "processedBy" INTEGER REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. bKash Payments
CREATE TABLE IF NOT EXISTS "bkash_payments" (
  "id" SERIAL PRIMARY KEY,
  "payment_id" VARCHAR(100) NOT NULL UNIQUE,
  "trx_id" VARCHAR(100),
  "order_id" VARCHAR(100) NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
  "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  "transaction_status" VARCHAR(50),
  "customer_msisdn" VARCHAR(20),
  "payment_execute_time" TIMESTAMPTZ,
  "callback_data" JSONB,
  "refund_transaction_id" VARCHAR(100),
  "refund_amount" DECIMAL(10,2),
  "refund_reason" TEXT,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON UPDATE CASCADE,
  "prescription_id" INTEGER REFERENCES "Prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "lab_test_order_id" INTEGER REFERENCES "lab_test_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "test_name" VARCHAR(255),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Medicine table
CREATE TABLE IF NOT EXISTS "medicines" (
  "id" SERIAL PRIMARY KEY,
  "patientId" INTEGER NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "prescriptionId" INTEGER REFERENCES "Prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "medicineName" VARCHAR(255) NOT NULL,
  "dosage" VARCHAR(255) NOT NULL,
  "frequency" VARCHAR(255) NOT NULL,
  "duration" INTEGER,
  "instructions" TEXT,
  "startDate" DATE NOT NULL,
  "endDate" DATE,
  "isActive" BOOLEAN DEFAULT TRUE,
  "totalQuantity" INTEGER,
  "remainingQuantity" INTEGER,
  "doctorId" INTEGER REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "genericName" VARCHAR(255),
  "route" VARCHAR(255),
  "strength" VARCHAR(255),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Medicine Reminders
CREATE TABLE IF NOT EXISTS "medicine_reminders" (
  "id" SERIAL PRIMARY KEY,
  "medicineId" INTEGER NOT NULL REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "patientId" INTEGER NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "reminderTime" TIME NOT NULL,
  "daysOfWeek" JSONB NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "lastTriggered" TIMESTAMPTZ,
  "nextTrigger" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Medicine Dosages
CREATE TABLE IF NOT EXISTS "medicine_dosages" (
  "id" SERIAL PRIMARY KEY,
  "medicineId" INTEGER NOT NULL REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "patientId" INTEGER NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "takenAt" TIMESTAMPTZ NOT NULL,
  "dosage" VARCHAR(255) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'taken' CHECK ("status" IN ('taken', 'missed', 'skipped')),
  "notes" TEXT,
  "reminderId" INTEGER REFERENCES "medicine_reminders"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Medical Records
CREATE TABLE IF NOT EXISTS "medical_records" (
  "id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "doctor_id" INTEGER NOT NULL REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "appointment_id" INTEGER REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "record_type" VARCHAR(50) NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "diagnosis" TEXT,
  "treatment" TEXT,
  "medications" TEXT,
  "vital_signs" JSONB,
  "lab_results" JSONB,
  "attachments" JSONB,
  "is_private" BOOLEAN DEFAULT FALSE,
  "record_date" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Notifications
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "type" VARCHAR(20) NOT NULL DEFAULT 'info' CHECK ("type" IN ('info', 'success', 'warning', 'error')),
  "isRead" BOOLEAN DEFAULT FALSE,
  "targetRole" VARCHAR(20),
  "actionType" VARCHAR(100),
  "entityId" INTEGER,
  "entityType" VARCHAR(50),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Patient Reminder Settings
CREATE TABLE IF NOT EXISTS "patient_reminder_settings" (
  "id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL UNIQUE REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "morning_time" VARCHAR(5) NOT NULL DEFAULT '08:00',
  "lunch_time" VARCHAR(5) NOT NULL DEFAULT '12:00',
  "dinner_time" VARCHAR(5) NOT NULL DEFAULT '19:00',
  "enabled" BOOLEAN DEFAULT TRUE,
  "notification_enabled" BOOLEAN DEFAULT TRUE,
  "reminder_minutes_before" INTEGER DEFAULT 15,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Chat Histories
CREATE TABLE IF NOT EXISTS "chat_histories" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "role" VARCHAR(20) NOT NULL,
  "content" TEXT NOT NULL,
  "intent" VARCHAR(50),
  "context" JSONB,
  "available_doctors" JSONB,
  "booking_details" JSONB,
  "conversation_id" VARCHAR(255),
  "title" VARCHAR(255),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Document Cache
CREATE TABLE IF NOT EXISTS "document_cache" (
  "id" SERIAL PRIMARY KEY,
  "url_hash" VARCHAR(64) NOT NULL,
  "url" TEXT NOT NULL,
  "extracted_data" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Website Review
CREATE TABLE IF NOT EXISTS "WebsiteReview" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "rating" INTEGER NOT NULL,
  "review" TEXT NOT NULL,
  "status" VARCHAR(20) DEFAULT 'approved' CHECK ("status" IN ('pending', 'approved', 'rejected')),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Medicine Logs
CREATE TABLE IF NOT EXISTS "MedicineLogs" (
  "id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "doctor_id" INTEGER NOT NULL REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "medicine_name" VARCHAR(255) NOT NULL,
  "action" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Doctor Ratings (Explicitly mentioned in logs)
CREATE TABLE IF NOT EXISTS "doctor_ratings" (
  "id" SERIAL PRIMARY KEY,
  "appointmentId" INTEGER NOT NULL UNIQUE REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "patientId" INTEGER NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "doctorId" INTEGER NOT NULL REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "rating" INTEGER NOT NULL,
  "review" TEXT,
  "feedback" TEXT,
  "isAnonymous" BOOLEAN DEFAULT FALSE,
  "status" VARCHAR(20) DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected')),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add some useful indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_doctor ON appointments(patient_id, doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON "Prescriptions"(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medicines_patient ON medicines("patientId");
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications("userId") WHERE "isRead" = FALSE;
CREATE INDEX IF NOT EXISTS idx_chat_histories_conversation ON chat_histories(conversation_id);
