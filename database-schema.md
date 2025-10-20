# Healthcare Database Schema Documentation

## Overview
The healthcare application uses MySQL as the primary database with Sequelize ORM for data modeling and migrations. The database is designed to support a comprehensive healthcare management system with role-based access control.

## Database Configuration
- **Database Engine**: MySQL 8.0+
- **ORM**: Sequelize
- **Port**: 3306
- **Character Set**: UTF-8
- **Collation**: utf8_general_ci

## Core Tables

### 1. Users Table
**Purpose**: Central user authentication and basic profile information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| firstName | VARCHAR(100) | NOT NULL | User's first name |
| lastName | VARCHAR(100) | NOT NULL | User's last name |
| phone | VARCHAR(20) | NULL | Phone number |
| dateOfBirth | DATE | NULL | Date of birth |
| gender | ENUM('male','female','other') | NULL | Gender |
| address | TEXT | NULL | Physical address |
| role | ENUM('patient','doctor','admin') | NOT NULL, DEFAULT 'patient' | User role |
| isActive | BOOLEAN | DEFAULT TRUE | Account status |
| emailVerified | BOOLEAN | DEFAULT FALSE | Email verification status |
| profileImage | VARCHAR(500) | NULL | Profile image path |
| lastLogin | DATETIME | NULL | Last login timestamp |
| resetPasswordToken | VARCHAR(255) | NULL | Password reset token |
| resetPasswordExpires | DATETIME | NULL | Token expiration |
| createdAt | DATETIME | NOT NULL | Record creation time |
| updatedAt | DATETIME | NOT NULL | Last update time |

### 2. Patients Table
**Purpose**: Extended patient-specific information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Patient ID |
| userId | INT | FOREIGN KEY (users.id), NOT NULL | Reference to users table |
| bloodType | ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') | NULL | Blood type |
| allergies | TEXT | NULL | Known allergies |
| emergencyContact | VARCHAR(100) | NULL | Emergency contact name |
| emergencyPhone | VARCHAR(20) | NULL | Emergency contact phone |
| insuranceProvider | VARCHAR(100) | NULL | Insurance company |
| insuranceNumber | VARCHAR(50) | NULL | Insurance policy number |
| medicalHistory | TEXT | NULL | Past medical history |
| currentMedications | TEXT | NULL | Current medications |

### 3. Doctors Table
**Purpose**: Doctor-specific professional information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Doctor ID |
| userId | INT | FOREIGN KEY (users.id), NOT NULL | Reference to users table |
| bmdcRegistrationNumber | VARCHAR(50) | UNIQUE | BMDC registration number |
| department | VARCHAR(100) | NULL | Medical department/specialty |
| experience | INT | NULL | Years of experience |
| education | TEXT | NULL | Educational background |
| certifications | TEXT | NULL | Professional certifications |
| consultationFee | DECIMAL(10,2) | NULL | Consultation fee in BDT |
| availability | JSON | NULL | Available time slots |
| bio | TEXT | NULL | Professional biography |
| rating | DECIMAL(3,2) | DEFAULT 0.00 | Average rating (0-5) |
| totalReviews | INT | DEFAULT 0 | Total number of reviews |
| isVerified | BOOLEAN | DEFAULT FALSE | Verification status |
| profileImage | VARCHAR(500) | NULL | Profile image path |
| degrees | JSON | NULL | Array of degrees |
| awards | JSON | NULL | Array of awards |
| hospital | VARCHAR(200) | NULL | Primary hospital/clinic |
| location | VARCHAR(300) | NULL | Practice location |
| chamberTimes | JSON | NULL | Chamber schedule |
| languages | JSON | DEFAULT ['English','Bengali'] | Spoken languages |
| services | JSON | NULL | Medical services offered |

### 4. Appointments Table
**Purpose**: Appointment scheduling and management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Appointment ID |
| patientId | INT | FOREIGN KEY (patients.id), NOT NULL | Patient reference |
| doctorId | INT | FOREIGN KEY (doctors.id), NOT NULL | Doctor reference |
| appointmentDate | DATE | NOT NULL | Appointment date |
| appointmentTime | TIME | NOT NULL | Appointment time |
| duration | INT | NOT NULL, DEFAULT 180 | Duration in minutes |
| status | ENUM | NOT NULL, DEFAULT 'requested' | Appointment status |
| serialNumber | INT | NULL | Daily serial number |
| type | ENUM('in_person','telemedicine','follow_up') | DEFAULT 'in_person' | Appointment type |
| reason | TEXT | NULL | Reason for visit |
| symptoms | TEXT | NULL | Patient symptoms |
| notes | TEXT | NULL | Doctor's notes |
| prescription | TEXT | NULL | Prescription details |
| diagnosis | TEXT | NULL | Medical diagnosis |
| followUpDate | DATE | NULL | Follow-up date |
| meetingLink | VARCHAR(500) | NULL | Video consultation link |
| fee | DECIMAL(10,2) | NULL | Consultation fee |
| paymentStatus | ENUM('pending','paid','refunded') | DEFAULT 'pending' | Payment status |
| startedAt | DATETIME | NULL | Appointment start time |
| completedAt | DATETIME | NULL | Appointment completion time |

**Status Values**: 'requested', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'

### 5. Medical Records Table
**Purpose**: Store comprehensive medical records and consultation history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Medical record ID |
| patientId | INT | FOREIGN KEY (patients.id), NOT NULL | Patient reference |
| doctorId | INT | FOREIGN KEY (doctors.id), NOT NULL | Doctor reference |
| appointmentId | INT | FOREIGN KEY (appointments.id), NULL | Related appointment |
| recordType | ENUM | NOT NULL | Record type |
| title | VARCHAR(200) | NOT NULL | Record title |
| description | TEXT | NULL | Detailed description |
| diagnosis | TEXT | NULL | Medical diagnosis |
| treatment | TEXT | NULL | Treatment plan |
| medications | TEXT | NULL | Prescribed medications |
| vitalSigns | JSON | NULL | Vital signs data |
| labResults | JSON | NULL | Laboratory results |
| attachments | JSON | NULL | File attachments |
| isPrivate | BOOLEAN | DEFAULT FALSE | Privacy flag |
| recordDate | DATETIME | NOT NULL, DEFAULT NOW | Record date |

**Record Types**: 'consultation', 'lab_result', 'imaging', 'prescription', 'vaccination', 'surgery'

### 6. Prescriptions Table
**Purpose**: Digital prescription management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Prescription ID |
| appointmentId | INT | FOREIGN KEY (appointments.id), NOT NULL | Appointment reference |
| doctorId | INT | FOREIGN KEY (doctors.id), NOT NULL | Doctor reference |
| patientId | INT | FOREIGN KEY (patients.id), NOT NULL | Patient reference |
| medicines | TEXT | NULL | Medicine details |
| symptoms | TEXT | NULL | Patient symptoms |
| diagnosis | TEXT | NULL | Medical diagnosis |
| suggestions | TEXT | NULL | Doctor suggestions |
| tests | TEXT | NULL | Recommended tests |
| testReports | TEXT | NULL | Test report details |
| status | ENUM | DEFAULT 'draft' | Prescription status |
| createdAt | DATETIME | NOT NULL | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |

**Status Values**: 'draft', 'completed', 'cancelled'

### 7. Medicines Table
**Purpose**: Individual medicine tracking and management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Medicine ID |
| patientId | INT | FOREIGN KEY (patients.id), NOT NULL | Patient reference |
| prescriptionId | INT | FOREIGN KEY (Prescriptions.id), NULL | Prescription reference |
| doctorId | INT | FOREIGN KEY (doctors.id), NULL | Doctor reference |
| medicineName | VARCHAR(255) | NOT NULL | Medicine name |
| dosage | VARCHAR(255) | NOT NULL | Dosage information |
| frequency | VARCHAR(255) | NOT NULL | Frequency schedule |
| duration | INT | NULL | Duration in days |
| instructions | TEXT | NULL | Special instructions |
| startDate | DATE | NOT NULL | Start date |
| endDate | DATE | NULL | End date |
| isActive | BOOLEAN | DEFAULT TRUE | Active status |
| totalQuantity | INT | NULL | Total quantity |
| remainingQuantity | INT | NULL | Remaining quantity |
| createdAt | DATETIME | NOT NULL | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |

### 8. Medicine Reminders Table
**Purpose**: Automated medicine reminder system

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Reminder ID |
| medicineId | INT | FOREIGN KEY (medicines.id), NOT NULL | Medicine reference |
| patientId | INT | FOREIGN KEY (patients.id), NOT NULL | Patient reference |
| reminderTime | TIME | NOT NULL | Reminder time |
| daysOfWeek | JSON | NOT NULL | Active days array |
| isActive | BOOLEAN | DEFAULT TRUE | Active status |
| lastTriggered | DATETIME | NULL | Last trigger time |
| nextTrigger | DATETIME | NULL | Next trigger time |
| createdAt | DATETIME | NOT NULL | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |

### 9. Medicine Dosages Table
**Purpose**: Track individual medicine doses taken

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Dosage ID |
| medicineId | INT | FOREIGN KEY (medicines.id), NOT NULL | Medicine reference |
| patientId | INT | FOREIGN KEY (patients.id), NOT NULL | Patient reference |
| reminderId | INT | FOREIGN KEY (medicine_reminders.id), NULL | Reminder reference |
| takenAt | DATETIME | NOT NULL | Time taken |
| dosage | VARCHAR(255) | NOT NULL | Dosage amount |
| status | ENUM | DEFAULT 'taken' | Dosage status |
| notes | TEXT | NULL | Additional notes |
| createdAt | DATETIME | NOT NULL | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |

**Status Values**: 'taken', 'missed', 'skipped'

### 10. Patient Reminder Settings Table
**Purpose**: Patient-specific reminder preferences

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Settings ID |
| patientId | INT | FOREIGN KEY (patients.id), NOT NULL, UNIQUE | Patient reference |
| morningTime | VARCHAR(5) | NOT NULL, DEFAULT '08:00' | Morning reminder time |
| lunchTime | VARCHAR(5) | NOT NULL, DEFAULT '12:00' | Lunch reminder time |
| dinnerTime | VARCHAR(5) | NOT NULL, DEFAULT '19:00' | Dinner reminder time |
| enabled | BOOLEAN | NOT NULL, DEFAULT TRUE | Reminders enabled |
| notificationEnabled | BOOLEAN | NOT NULL, DEFAULT TRUE | Notifications enabled |
| reminderMinutesBefore | INT | NOT NULL, DEFAULT 15 | Minutes before reminder |
| createdAt | DATETIME | NOT NULL | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |

### 11. Lab Tests Table
**Purpose**: Available laboratory tests catalog

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Lab test ID |
| name | VARCHAR(200) | NOT NULL | Test name |
| description | TEXT | NULL | Test description |
| category | VARCHAR(100) | NOT NULL | Test category |
| price | DECIMAL(10,2) | NOT NULL | Test price |
| sampleType | VARCHAR(100) | NOT NULL | Sample type required |
| preparationInstructions | TEXT | NULL | Preparation instructions |
| reportDeliveryTime | INT | NOT NULL | Hours for report delivery |
| isActive | BOOLEAN | DEFAULT TRUE | Active status |
| createdAt | DATETIME | NOT NULL | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |

### 12. Lab Test Orders Table
**Purpose**: Patient lab test orders and tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Order ID |
| orderNumber | VARCHAR(50) | NOT NULL, UNIQUE | Unique order number |
| patientId | INT | FOREIGN KEY (patients.id), NOT NULL | Patient reference |
| doctorId | INT | FOREIGN KEY (doctors.id), NULL | Doctor reference |
| appointmentId | INT | FOREIGN KEY (appointments.id), NULL | Appointment reference |
| testIds | JSON | NOT NULL | Array of test IDs |
| totalAmount | DECIMAL(10,2) | NOT NULL | Total order amount |
| paidAmount | DECIMAL(10,2) | DEFAULT 0 | Amount paid |
| dueAmount | DECIMAL(10,2) | NOT NULL | Amount due |
| status | ENUM | DEFAULT 'ordered' | Order status |
| paymentMethod | ENUM | NULL | Payment method |
| sampleCollectionDate | DATE | NULL | Sample collection date |
| expectedResultDate | DATE | NULL | Expected result date |
| resultUrl | VARCHAR(500) | NULL | Result file URL |
| notes | TEXT | NULL | Additional notes |
| verifiedAt | DATETIME | NULL | Verification timestamp |
| verifiedBy | INT | FOREIGN KEY (users.id), NULL | Verified by user |
| sampleId | VARCHAR(50) | NULL | Lab sample ID |
| testReports | JSON | NULL | Test report files |
| createdAt | DATETIME | NOT NULL | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |

**Status Values**: 'ordered', 'verified', 'payment_pending', 'payment_partial', 'payment_completed', 'sample_collection_scheduled', 'sample_collected', 'processing', 'results_ready', 'completed', 'cancelled'

**Payment Methods**: 'online', 'offline', 'mixed'

### 13. Lab Payments Table
**Purpose**: Lab test payment tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Payment ID |
| orderId | INT | FOREIGN KEY (lab_test_orders.id), NOT NULL | Order reference |
| transactionId | VARCHAR(100) | NULL, UNIQUE | Transaction ID |
| paymentMethod | ENUM | NOT NULL | Payment method |
| amount | DECIMAL(10,2) | NOT NULL | Payment amount |
| status | ENUM | DEFAULT 'pending' | Payment status |
| gatewayResponse | JSON | NULL | Gateway response data |
| paidAt | DATETIME | NULL | Payment timestamp |
| processedBy | INT | FOREIGN KEY (users.id), NULL | Processed by admin |
| notes | TEXT | NULL | Payment notes |
| createdAt | DATETIME | NOT NULL | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |

**Payment Methods**: 'bkash', 'bank_transfer', 'offline_cash', 'offline_card'

**Status Values**: 'pending', 'completed', 'failed', 'refunded'

### 14. bKash Payments Table
**Purpose**: bKash payment gateway integration

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Payment ID |
| paymentId | VARCHAR(100) | NOT NULL, UNIQUE | bKash payment ID |
| trxId | VARCHAR(100) | NULL | bKash transaction ID |
| orderId | VARCHAR(100) | NOT NULL | Internal order ID |
| amount | DECIMAL(10,2) | NOT NULL | Payment amount |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'BDT' | Currency code |
| status | ENUM | NOT NULL, DEFAULT 'PENDING' | Payment status |
| transactionStatus | VARCHAR(50) | NULL | bKash transaction status |
| customerMsisdn | VARCHAR(20) | NULL | Customer mobile number |
| paymentExecuteTime | DATETIME | NULL | Payment execution time |
| callbackData | JSON | NULL | bKash callback data |
| refundTransactionId | VARCHAR(100) | NULL | Refund transaction ID |
| refundAmount | DECIMAL(10,2) | NULL | Refund amount |
| refundReason | TEXT | NULL | Refund reason |
| userId | INT | FOREIGN KEY (users.id), NOT NULL | User reference |
| prescriptionId | INT | FOREIGN KEY (Prescriptions.id), NULL | Prescription reference |
| labTestOrderId | INT | FOREIGN KEY (lab_test_orders.id), NULL | Lab order reference |
| testName | VARCHAR(255) | NULL | Lab test name |
| createdAt | DATETIME | NOT NULL | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |

**Status Values**: 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIAL_REFUND'

### 15. Doctor Ratings Table
**Purpose**: Patient ratings and reviews for doctors

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Rating ID |
| appointmentId | INT | FOREIGN KEY (appointments.id), NOT NULL, UNIQUE | Appointment reference |
| patientId | INT | FOREIGN KEY (patients.id), NOT NULL | Patient reference |
| doctorId | INT | FOREIGN KEY (doctors.id), NOT NULL | Doctor reference |
| rating | INT | NOT NULL, CHECK (1-5) | Rating score |
| review | TEXT | NULL, MAX 1000 chars | Patient review |
| feedback | TEXT | NULL, MAX 1000 chars | Additional feedback |
| isAnonymous | BOOLEAN | NOT NULL, DEFAULT FALSE | Anonymous review flag |
| status | ENUM | NOT NULL, DEFAULT 'pending' | Review status |
| createdAt | DATETIME | NOT NULL | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |

**Status Values**: 'pending', 'approved', 'rejected'

### 16. Notifications Table
**Purpose**: System notifications for users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Notification ID |
| userId | INT | FOREIGN KEY (users.id), NOT NULL | User reference |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| type | ENUM | NOT NULL, DEFAULT 'info' | Notification type |
| isRead | BOOLEAN | NOT NULL, DEFAULT FALSE | Read status |
| createdAt | DATETIME | NOT NULL | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |

**Notification Types**: 'info', 'success', 'warning', 'error'

## Complete Database Summary

The healthcare database consists of **16 core tables** organized into the following functional groups:

### User Management (3 tables)
- **Users**: Central authentication and basic profiles
- **Patients**: Patient-specific medical information
- **Doctors**: Doctor professional profiles and credentials

### Appointment System (2 tables)
- **Appointments**: Appointment booking and management
- **Medical Records**: Consultation history and medical records

### Prescription & Medicine Management (5 tables)
- **Prescriptions**: Digital prescription management
- **Medicines**: Individual medicine tracking
- **Medicine Reminders**: Automated reminder system
- **Medicine Dosages**: Dose tracking and compliance
- **Patient Reminder Settings**: Patient reminder preferences

### Laboratory System (3 tables)
- **Lab Tests**: Available test catalog
- **Lab Test Orders**: Patient test orders and tracking
- **Lab Payments**: Lab payment processing

### Payment System (1 table)
- **bKash Payments**: Payment gateway integration

### Feedback & Communication (2 tables)
- **Doctor Ratings**: Patient reviews and ratings
- **Notifications**: System notifications

## Indexes and Performance

### Primary Indexes
- All tables have primary key indexes on `id` columns
- Unique indexes on `email` (users), `bmdcRegistrationNumber` (doctors)

### Foreign Key Indexes
- `patients.userId` → `users.id`
- `doctors.userId` → `users.id`
- `appointments.patientId` → `patients.id`
- `appointments.doctorId` → `doctors.id`
- `medical_records.patientId` → `patients.id`
- `medical_records.doctorId` → `doctors.id`
- `medical_records.appointmentId` → `appointments.id`
- `prescriptions.appointmentId` → `appointments.id`
- `prescriptions.doctorId` → `doctors.id`
- `prescriptions.patientId` → `patients.id`
- `medicines.patientId` → `patients.id`
- `medicines.prescriptionId` → `prescriptions.id`
- `medicines.doctorId` → `doctors.id`
- `medicine_reminders.medicineId` → `medicines.id`
- `medicine_reminders.patientId` → `patients.id`
- `medicine_dosages.medicineId` → `medicines.id`
- `medicine_dosages.patientId` → `patients.id`
- `medicine_dosages.reminderId` → `medicine_reminders.id`
- `patient_reminder_settings.patientId` → `patients.id`
- `lab_test_orders.patientId` → `patients.id`
- `lab_test_orders.doctorId` → `doctors.id`
- `lab_test_orders.appointmentId` → `appointments.id`
- `lab_payments.orderId` → `lab_test_orders.id`
- `lab_payments.processedBy` → `users.id`
- `bkash_payments.userId` → `users.id`
- `bkash_payments.prescriptionId` → `prescriptions.id`
- `bkash_payments.labTestOrderId` → `lab_test_orders.id`
- `doctor_ratings.appointmentId` → `appointments.id`
- `doctor_ratings.patientId` → `patients.id`
- `doctor_ratings.doctorId` → `doctors.id`
- `notifications.userId` → `users.id`

### Performance Indexes
```sql
-- Appointment queries
CREATE INDEX idx_appointments_date_doctor ON appointments(appointmentDate, doctorId);
CREATE INDEX idx_appointments_patient_status ON appointments(patientId, status);
CREATE INDEX idx_appointments_doctor_status ON appointments(doctorId, status);

-- User authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- Doctor search
CREATE INDEX idx_doctors_department ON doctors(department);
CREATE INDEX idx_doctors_verified ON doctors(isVerified);

-- Medical records
CREATE INDEX idx_medical_records_patient_date ON medical_records(patientId, recordDate);
CREATE INDEX idx_medical_records_doctor_date ON medical_records(doctorId, recordDate);
CREATE INDEX idx_medical_records_type ON medical_records(recordType);

-- Prescription queries
CREATE INDEX idx_prescriptions_patient_date ON prescriptions(patientId, createdAt);
CREATE INDEX idx_prescriptions_doctor_date ON prescriptions(doctorId, createdAt);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);

-- Medicine tracking
CREATE INDEX idx_medicines_patient_active ON medicines(patientId, isActive);
CREATE INDEX idx_medicines_start_end_date ON medicines(startDate, endDate);
CREATE INDEX idx_medicine_reminders_patient_active ON medicine_reminders(patientId, isActive);
CREATE INDEX idx_medicine_dosages_patient_date ON medicine_dosages(patientId, takenAt);

-- Lab test queries
CREATE INDEX idx_lab_tests_category_active ON lab_tests(category, isActive);
CREATE INDEX idx_lab_test_orders_patient_status ON lab_test_orders(patientId, status);
CREATE INDEX idx_lab_test_orders_doctor_date ON lab_test_orders(doctorId, createdAt);
CREATE INDEX idx_lab_test_orders_order_number ON lab_test_orders(orderNumber);

-- Payment tracking
CREATE INDEX idx_lab_payments_order_status ON lab_payments(orderId, status);
CREATE INDEX idx_bkash_payments_user_status ON bkash_payments(userId, status);
CREATE INDEX idx_bkash_payments_order_id ON bkash_payments(orderId);
CREATE INDEX idx_bkash_payments_payment_id ON bkash_payments(paymentId);

-- Rating and feedback
CREATE INDEX idx_doctor_ratings_doctor_status ON doctor_ratings(doctorId, status);
CREATE INDEX idx_doctor_ratings_patient ON doctor_ratings(patientId);
CREATE UNIQUE INDEX idx_doctor_ratings_appointment ON doctor_ratings(appointmentId);

-- Notifications
CREATE INDEX idx_notifications_user_read ON notifications(userId, isRead);
CREATE INDEX idx_notifications_user_date ON notifications(userId, createdAt);
CREATE INDEX idx_notifications_type ON notifications(type);
```

## Data Relationships

### One-to-One Relationships
- `users` ↔ `patients` (userId)
- `users` ↔ `doctors` (userId)
- `appointments` ↔ `prescriptions` (appointmentId)
- `patients` ↔ `patient_reminder_settings` (patientId)
- `appointments` ↔ `doctor_ratings` (appointmentId)

### One-to-Many Relationships
- `patients` → `appointments` (patientId)
- `doctors` → `appointments` (doctorId)
- `patients` → `medical_records` (patientId)
- `doctors` → `medical_records` (doctorId)
- `appointments` → `medical_records` (appointmentId)
- `prescriptions` → `medicines` (prescriptionId)
- `patients` → `medicines` (patientId)
- `doctors` → `medicines` (doctorId)
- `medicines` → `medicine_reminders` (medicineId)
- `patients` → `medicine_reminders` (patientId)
- `medicines` → `medicine_dosages` (medicineId)
- `patients` → `medicine_dosages` (patientId)
- `medicine_reminders` → `medicine_dosages` (reminderId)
- `patients` → `lab_test_orders` (patientId)
- `doctors` → `lab_test_orders` (doctorId)
- `appointments` → `lab_test_orders` (appointmentId)
- `lab_test_orders` → `lab_payments` (orderId)
- `users` → `bkash_payments` (userId)
- `prescriptions` → `bkash_payments` (prescriptionId)
- `lab_test_orders` → `bkash_payments` (labTestOrderId)
- `patients` → `doctor_ratings` (patientId)
- `doctors` → `doctor_ratings` (doctorId)
- `users` → `notifications` (userId)

### Many-to-Many Relationships
- `doctors` ↔ `patients` (through appointments)
- `lab_tests` ↔ `lab_test_orders` (through JSON testIds)
- `medicines` ↔ `prescriptions` (through medicine details)

## Data Validation Rules

### Email Validation
- Must be valid email format
- Unique across all users
- Required for registration

### Password Security
- Minimum 6 characters
- Hashed using bcrypt with salt rounds = 12
- Never stored in plain text

### Phone Number Validation
- 10-15 digits only
- Optional field
- Can be used for login

### BMDC Registration
- Unique per doctor
- Required for doctor verification
- Format validation on frontend

### Appointment Constraints
- Duration: 60-240 minutes for chamber appointments
- Serial numbers reset daily per doctor
- No overlapping appointments for same doctor

## Backup and Recovery

### Backup Strategy
- Daily automated backups at 2 AM
- Weekly full database dumps
- Transaction log backups every 15 minutes
- Retention period: 30 days

### Recovery Procedures
- Point-in-time recovery available
- Automated failover to standby server
- Data integrity checks after recovery

## Security Considerations

### Data Encryption
- Passwords: bcrypt hashing
- Sensitive data: AES-256 encryption
- Database connections: SSL/TLS

### Access Control
- Role-based permissions
- Principle of least privilege
- Regular access audits

### Audit Trail
- All data modifications logged
- User activity tracking
- Compliance with healthcare regulations
