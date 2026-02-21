mysqldump: [Warning] Using a password on the command line interface can be insecure.
-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: healthcare_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Prescriptions`
--

DROP TABLE IF EXISTS `Prescriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Prescriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `appointment_id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `patient_id` int NOT NULL,
  `medicines` text,
  `symptoms` text,
  `diagnosis` text,
  `suggestions` text,
  `tests` text,
  `test_reports` text,
  `status` enum('draft','completed','cancelled') DEFAULT 'draft',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `Prescriptions_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Prescriptions_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Prescriptions_ibfk_3` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Prescriptions`
--

LOCK TABLES `Prescriptions` WRITE;
/*!40000 ALTER TABLE `Prescriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `Prescriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SequelizeMeta`
--

LOCK TABLES `SequelizeMeta` WRITE;
/*!40000 ALTER TABLE `SequelizeMeta` DISABLE KEYS */;
/*!40000 ALTER TABLE `SequelizeMeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `appointment_date` datetime NOT NULL,
  `appointment_time` time NOT NULL,
  `duration` int NOT NULL DEFAULT '180',
  `status` enum('requested','scheduled','confirmed','in_progress','completed','cancelled','no_show') NOT NULL DEFAULT 'requested',
  `serial_number` int DEFAULT NULL COMMENT 'Daily serial number for this doctor on this date',
  `type` enum('in_person','telemedicine','follow_up') NOT NULL DEFAULT 'in_person',
  `reason` text,
  `symptoms` text,
  `notes` text,
  `prescription` text,
  `diagnosis` text,
  `follow_up_date` datetime DEFAULT NULL,
  `meeting_link` varchar(500) DEFAULT NULL,
  `fee` decimal(10,2) DEFAULT NULL,
  `payment_status` enum('pending','paid','refunded') NOT NULL DEFAULT 'pending',
  `started_at` datetime DEFAULT NULL COMMENT 'Timestamp when appointment was started (in_progress)',
  `completed_at` datetime DEFAULT NULL COMMENT 'Timestamp when appointment was completed',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bkash_payments`
--

DROP TABLE IF EXISTS `bkash_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bkash_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_id` varchar(100) NOT NULL COMMENT 'bKash payment ID',
  `trx_id` varchar(100) DEFAULT NULL COMMENT 'bKash transaction ID',
  `order_id` varchar(100) NOT NULL COMMENT 'Our internal order ID',
  `amount` decimal(10,2) NOT NULL COMMENT 'Payment amount in BDT',
  `currency` varchar(3) NOT NULL DEFAULT 'BDT',
  `status` enum('PENDING','COMPLETED','FAILED','CANCELLED','REFUNDED','PARTIAL_REFUND') NOT NULL DEFAULT 'PENDING',
  `transaction_status` varchar(50) DEFAULT NULL COMMENT 'bKash transaction status',
  `customer_msisdn` varchar(20) DEFAULT NULL COMMENT 'Customer mobile number',
  `payment_execute_time` datetime DEFAULT NULL COMMENT 'Payment execution time from bKash',
  `callback_data` json DEFAULT NULL COMMENT 'Callback data from bKash',
  `refund_transaction_id` varchar(100) DEFAULT NULL COMMENT 'Refund transaction ID if refunded',
  `refund_amount` decimal(10,2) DEFAULT NULL COMMENT 'Refund amount',
  `refund_reason` text COMMENT 'Reason for refund',
  `user_id` int NOT NULL,
  `prescription_id` int DEFAULT NULL,
  `lab_test_order_id` int DEFAULT NULL,
  `test_name` varchar(255) DEFAULT NULL COMMENT 'Name of the lab test',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_id` (`payment_id`),
  KEY `prescription_id` (`prescription_id`),
  KEY `lab_test_order_id` (`lab_test_order_id`),
  KEY `bkash_payments_payment_id` (`payment_id`),
  KEY `bkash_payments_order_id` (`order_id`),
  KEY `bkash_payments_user_id` (`user_id`),
  KEY `bkash_payments_status` (`status`),
  CONSTRAINT `bkash_payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `bkash_payments_ibfk_2` FOREIGN KEY (`prescription_id`) REFERENCES `Prescriptions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `bkash_payments_ibfk_3` FOREIGN KEY (`lab_test_order_id`) REFERENCES `lab_test_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bkash_payments`
--

LOCK TABLES `bkash_payments` WRITE;
/*!40000 ALTER TABLE `bkash_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `bkash_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_ratings`
--

DROP TABLE IF EXISTS `doctor_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `appointmentId` int NOT NULL,
  `patientId` int NOT NULL,
  `doctorId` int NOT NULL,
  `rating` int NOT NULL,
  `review` text,
  `feedback` text,
  `isAnonymous` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `doctor_ratings_appointment_id` (`appointmentId`),
  KEY `doctor_ratings_doctor_id` (`doctorId`),
  KEY `doctor_ratings_patient_id` (`patientId`),
  KEY `doctor_ratings_status` (`status`),
  CONSTRAINT `doctor_ratings_ibfk_1` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `doctor_ratings_ibfk_2` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `doctor_ratings_ibfk_3` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_ratings`
--

LOCK TABLES `doctor_ratings` WRITE;
/*!40000 ALTER TABLE `doctor_ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `doctor_ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctors`
--

DROP TABLE IF EXISTS `doctors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `bmdc_registration_number` varchar(50) DEFAULT NULL COMMENT 'BMDC Registration Number - unique identifier for doctors',
  `department` varchar(100) DEFAULT NULL,
  `experience` int DEFAULT NULL,
  `education` text,
  `certifications` text,
  `consultation_fee` decimal(10,2) DEFAULT NULL COMMENT 'Consultation fee in BDT',
  `availability` json DEFAULT NULL,
  `bio` text,
  `rating` decimal(3,2) DEFAULT '0.00',
  `total_reviews` int DEFAULT '0',
  `is_verified` tinyint(1) DEFAULT '0',
  `profile_image` varchar(500) DEFAULT NULL COMMENT 'URL or path to doctor profile image',
  `degrees` json DEFAULT NULL COMMENT 'Array of degrees and qualifications',
  `awards` json DEFAULT NULL COMMENT 'Array of awards and recognitions',
  `hospital` varchar(200) DEFAULT NULL COMMENT 'Primary hospital or clinic name',
  `location` varchar(300) DEFAULT NULL COMMENT 'Hospital/clinic address',
  `chamber_times` json DEFAULT NULL COMMENT 'Available chamber times for each day',
  `languages` json DEFAULT NULL COMMENT 'Languages spoken by doctor',
  `services` json DEFAULT NULL COMMENT 'Medical services offered',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bmdc_registration_number` (`bmdc_registration_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctors`
--

LOCK TABLES `doctors` WRITE;
/*!40000 ALTER TABLE `doctors` DISABLE KEYS */;
/*!40000 ALTER TABLE `doctors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lab_payments`
--

DROP TABLE IF EXISTS `lab_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lab_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `transactionId` varchar(100) DEFAULT NULL,
  `paymentMethod` enum('bkash','bank_transfer','offline_cash','offline_card') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `gatewayResponse` json DEFAULT NULL COMMENT 'Payment gateway response data',
  `paidAt` datetime DEFAULT NULL,
  `processedBy` int DEFAULT NULL COMMENT 'Admin who processed offline payment',
  `notes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transactionId` (`transactionId`),
  KEY `orderId` (`orderId`),
  KEY `processedBy` (`processedBy`),
  CONSTRAINT `lab_payments_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `lab_test_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `lab_payments_ibfk_2` FOREIGN KEY (`processedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lab_payments`
--

LOCK TABLES `lab_payments` WRITE;
/*!40000 ALTER TABLE `lab_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `lab_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lab_test_orders`
--

DROP TABLE IF EXISTS `lab_test_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lab_test_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderNumber` varchar(50) NOT NULL,
  `patientId` int NOT NULL,
  `doctorId` int DEFAULT NULL,
  `appointmentId` int DEFAULT NULL,
  `testIds` json NOT NULL COMMENT 'Array of test IDs',
  `totalAmount` decimal(10,2) NOT NULL,
  `paidAmount` decimal(10,2) DEFAULT '0.00',
  `dueAmount` decimal(10,2) NOT NULL,
  `status` enum('ordered','verified','payment_pending','payment_partial','payment_completed','sample_collection_scheduled','sample_collected','processing','results_ready','completed','cancelled') DEFAULT 'ordered',
  `paymentMethod` enum('online','offline','mixed') DEFAULT NULL,
  `sampleCollectionDate` datetime DEFAULT NULL,
  `expectedResultDate` datetime DEFAULT NULL,
  `resultUrl` varchar(255) DEFAULT NULL,
  `notes` text,
  `verified_at` datetime DEFAULT NULL,
  `verified_by` int DEFAULT NULL,
  `sampleId` varchar(50) DEFAULT NULL COMMENT 'Unique sample ID for lab processing',
  `testReports` json DEFAULT NULL COMMENT 'Array of uploaded test report files with metadata',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orderNumber` (`orderNumber`),
  KEY `patientId` (`patientId`),
  KEY `doctorId` (`doctorId`),
  KEY `appointmentId` (`appointmentId`),
  KEY `verified_by` (`verified_by`),
  CONSTRAINT `lab_test_orders_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `lab_test_orders_ibfk_2` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `lab_test_orders_ibfk_3` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `lab_test_orders_ibfk_4` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lab_test_orders`
--

LOCK TABLES `lab_test_orders` WRITE;
/*!40000 ALTER TABLE `lab_test_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `lab_test_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lab_tests`
--

DROP TABLE IF EXISTS `lab_tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lab_tests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text,
  `category` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `sampleType` varchar(100) NOT NULL,
  `preparationInstructions` text,
  `reportDeliveryTime` int NOT NULL COMMENT 'Hours required for report',
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lab_tests`
--

LOCK TABLES `lab_tests` WRITE;
/*!40000 ALTER TABLE `lab_tests` DISABLE KEYS */;
INSERT INTO `lab_tests` VALUES (1,'Complete Blood Count (CBC)','Comprehensive blood analysis including RBC, WBC, platelets, hemoglobin levels','Hematology',800.00,'Blood','No special preparation required. Fasting not necessary.',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(2,'Lipid Profile','Cholesterol, triglycerides, HDL, LDL analysis for cardiovascular health','Biochemistry',1200.00,'Blood','12-hour fasting required. Only water allowed.',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(3,'Liver Function Test (LFT)','ALT, AST, bilirubin, alkaline phosphatase to assess liver health','Biochemistry',1000.00,'Blood','8-hour fasting recommended.',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(4,'Kidney Function Test (KFT)','Creatinine, urea, uric acid to evaluate kidney function','Biochemistry',900.00,'Blood','No special preparation required.',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(5,'Thyroid Function Test (TFT)','TSH, T3, T4 levels to assess thyroid gland function','Endocrinology',1500.00,'Blood','No special preparation required. Take morning sample.',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(6,'Diabetes Panel (HbA1c + Glucose)','HbA1c and fasting glucose for diabetes monitoring','Endocrinology',1100.00,'Blood','8-hour fasting required for glucose test.',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(7,'Urine Routine Examination','Complete urine analysis including protein, glucose, microscopy','Urology',300.00,'Urine','Collect first morning urine sample in sterile container.',12,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(8,'Stool Routine Examination','Microscopic examination for parasites, bacteria, blood','Microbiology',400.00,'Stool','Collect fresh sample in sterile container. Avoid contamination.',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(9,'Hepatitis B Surface Antigen (HBsAg)','Screening test for Hepatitis B virus infection','Serology',600.00,'Blood','No special preparation required.',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(10,'HIV Screening Test','Antibody test for HIV-1 and HIV-2','Serology',800.00,'Blood','No special preparation required. Confidential testing.',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(11,'Vitamin D (25-OH)','25-hydroxyvitamin D level to assess vitamin D status','Endocrinology',2000.00,'Blood','No special preparation required.',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(12,'Vitamin B12','Serum vitamin B12 level measurement','Biochemistry',1800.00,'Blood','No special preparation required.',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(13,'C-Reactive Protein (CRP)','Inflammatory marker to detect infection or inflammation','Immunology',700.00,'Blood','No special preparation required.',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(14,'Erythrocyte Sedimentation Rate (ESR)','Non-specific test for inflammation and infection','Hematology',200.00,'Blood','No special preparation required.',2,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(15,'Prostate Specific Antigen (PSA)','Screening test for prostate health in men','Oncology',1500.00,'Blood','Avoid ejaculation 48 hours before test.',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(16,'Pregnancy Test (Beta hCG)','Quantitative pregnancy hormone test','Endocrinology',500.00,'Blood','No special preparation required. Best done after missed period.',12,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(17,'Blood Group & Rh Typing','ABO blood group and Rh factor determination','Hematology',300.00,'Blood','No special preparation required.',2,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(18,'Dengue NS1 Antigen','Early detection test for dengue fever','Serology',1200.00,'Blood','No special preparation required. Best within first 7 days of fever.',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(19,'Malaria Parasite (MP)','Microscopic examination for malaria parasites','Microbiology',400.00,'Blood','No special preparation required. Best during fever episode.',2,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(20,'Widal Test','Serological test for typhoid fever','Serology',350.00,'Blood','No special preparation required.',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(21,'A1C test','Measures average blood sugar over 2-3 months','Blood Tests',150.00,'Blood','No special preparation required',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(22,'ACE blood test','Angiotensin converting enzyme test','Blood Tests',200.00,'Blood','No special preparation required',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(23,'ACTH blood test','Adrenocorticotropic hormone test','Blood Tests',300.00,'Blood','Fasting may be required',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(24,'Alanine transaminase (ALT) blood test','Liver function test','Blood Tests',120.00,'Blood','No special preparation required',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(25,'Albumin blood (serum) test','Protein level measurement','Blood Tests',100.00,'Blood','No special preparation required',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(26,'Basic metabolic panel','Comprehensive blood chemistry panel','Blood Tests',250.00,'Blood','Fasting 8-12 hours required',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(27,'CBC blood test','Complete blood count','Blood Tests',180.00,'Blood','No special preparation required',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(28,'Comprehensive metabolic panel','Extended blood chemistry panel','Blood Tests',350.00,'Blood','Fasting 8-12 hours required',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(29,'Abdominal CT scan','Computed tomography of abdomen','Imaging Tests',800.00,'N/A','Fasting 4-6 hours, contrast may be required',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(30,'Abdominal MRI scan','Magnetic resonance imaging of abdomen','Imaging Tests',1200.00,'N/A','No metal objects, contrast may be required',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(31,'Abdominal ultrasound','Ultrasound examination of abdomen','Imaging Tests',400.00,'N/A','Fasting 6-8 hours for better visualization',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(32,'Chest CT','Computed tomography of chest','Imaging Tests',750.00,'N/A','No special preparation required',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(33,'Chest MRI','Magnetic resonance imaging of chest','Imaging Tests',1100.00,'N/A','No metal objects, contrast may be required',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(34,'Chest x-ray','Radiographic examination of chest','Imaging Tests',150.00,'N/A','Remove jewelry and metal objects',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(35,'Urinalysis','Complete urine analysis','Urine Tests',80.00,'Urine','Clean catch midstream sample',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(36,'Urine culture','Bacterial culture of urine','Urine Tests',120.00,'Urine','Clean catch midstream sample',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(37,'24-hour urine protein','24-hour urine protein collection','Urine Tests',200.00,'Urine','24-hour collection with preservative',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(38,'Electrocardiogram','ECG/EKG heart rhythm test','Cardiac Tests',200.00,'N/A','No special preparation required',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(39,'Echocardiogram','Ultrasound of the heart','Cardiac Tests',600.00,'N/A','No special preparation required',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(40,'Stress echocardiography','Exercise stress test with echo','Cardiac Tests',800.00,'N/A','Avoid caffeine, wear comfortable clothes',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(41,'TSH test','Thyroid stimulating hormone','Hormone Tests',150.00,'Blood','No special preparation required',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(42,'T3 test','Triiodothyronine test','Hormone Tests',180.00,'Blood','No special preparation required',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(43,'T4 test','Thyroxine test','Hormone Tests',180.00,'Blood','No special preparation required',24,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(44,'CA-125 blood test','Ovarian cancer marker','Cancer Screening',300.00,'Blood','No special preparation required',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(45,'PSA blood test','Prostate specific antigen','Cancer Screening',250.00,'Blood','No ejaculation 48 hours before test',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01'),(46,'Mammogram','Breast cancer screening','Cancer Screening',400.00,'N/A','No deodorant or powder on day of test',48,1,'2026-02-15 08:08:01','2026-02-15 08:08:01');
/*!40000 ALTER TABLE `lab_tests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_records`
--

DROP TABLE IF EXISTS `medical_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `appointment_id` int DEFAULT NULL,
  `record_type` enum('consultation','lab_result','imaging','prescription','vaccination','surgery') NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `diagnosis` text,
  `treatment` text,
  `medications` text,
  `vital_signs` json DEFAULT NULL,
  `lab_results` json DEFAULT NULL,
  `attachments` json DEFAULT NULL,
  `is_private` tinyint(1) DEFAULT '0',
  `record_date` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `appointment_id` (`appointment_id`),
  CONSTRAINT `medical_records_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `medical_records_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `medical_records_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_records`
--

LOCK TABLES `medical_records` WRITE;
/*!40000 ALTER TABLE `medical_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicine_dosages`
--

DROP TABLE IF EXISTS `medicine_dosages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicine_dosages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `medicineId` int NOT NULL,
  `patientId` int NOT NULL,
  `takenAt` datetime NOT NULL,
  `dosage` varchar(255) NOT NULL,
  `status` enum('taken','missed','skipped') NOT NULL DEFAULT 'taken',
  `notes` text,
  `reminderId` int DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medicineId` (`medicineId`),
  KEY `patientId` (`patientId`),
  KEY `reminderId` (`reminderId`),
  CONSTRAINT `medicine_dosages_ibfk_1` FOREIGN KEY (`medicineId`) REFERENCES `medicines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `medicine_dosages_ibfk_2` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `medicine_dosages_ibfk_3` FOREIGN KEY (`reminderId`) REFERENCES `medicine_reminders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicine_dosages`
--

LOCK TABLES `medicine_dosages` WRITE;
/*!40000 ALTER TABLE `medicine_dosages` DISABLE KEYS */;
/*!40000 ALTER TABLE `medicine_dosages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicine_reminders`
--

DROP TABLE IF EXISTS `medicine_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicine_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `medicineId` int NOT NULL,
  `patientId` int NOT NULL,
  `reminderTime` time NOT NULL,
  `daysOfWeek` json NOT NULL COMMENT 'Array of days (0-6, Sunday-Saturday) when reminder should be active',
  `isActive` tinyint(1) DEFAULT '1',
  `lastTriggered` datetime DEFAULT NULL,
  `nextTrigger` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medicineId` (`medicineId`),
  KEY `patientId` (`patientId`),
  CONSTRAINT `medicine_reminders_ibfk_1` FOREIGN KEY (`medicineId`) REFERENCES `medicines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `medicine_reminders_ibfk_2` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicine_reminders`
--

LOCK TABLES `medicine_reminders` WRITE;
/*!40000 ALTER TABLE `medicine_reminders` DISABLE KEYS */;
/*!40000 ALTER TABLE `medicine_reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicines`
--

DROP TABLE IF EXISTS `medicines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patientId` int NOT NULL,
  `prescriptionId` int DEFAULT NULL,
  `medicineName` varchar(255) NOT NULL,
  `dosage` varchar(255) NOT NULL,
  `frequency` varchar(255) NOT NULL,
  `duration` int DEFAULT NULL COMMENT 'Duration in days',
  `instructions` text,
  `startDate` datetime NOT NULL,
  `endDate` datetime DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `totalQuantity` int DEFAULT NULL,
  `remainingQuantity` int DEFAULT NULL,
  `doctorId` int DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `patientId` (`patientId`),
  KEY `prescriptionId` (`prescriptionId`),
  KEY `doctorId` (`doctorId`),
  CONSTRAINT `medicines_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `medicines_ibfk_2` FOREIGN KEY (`prescriptionId`) REFERENCES `Prescriptions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `medicines_ibfk_3` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicines`
--

LOCK TABLES `medicines` WRITE;
/*!40000 ALTER TABLE `medicines` DISABLE KEYS */;
/*!40000 ALTER TABLE `medicines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','error') NOT NULL DEFAULT 'info',
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id` (`userId`),
  KEY `notifications_user_id_is_read` (`userId`,`isRead`),
  KEY `notifications_created_at` (`createdAt`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_reminder_settings`
--

DROP TABLE IF EXISTS `patient_reminder_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_reminder_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `morning_time` varchar(5) NOT NULL DEFAULT '08:00',
  `lunch_time` varchar(5) NOT NULL DEFAULT '12:00',
  `dinner_time` varchar(5) NOT NULL DEFAULT '19:00',
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `notification_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `reminder_minutes_before` int NOT NULL DEFAULT '15',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `patient_reminder_settings_patient_id` (`patient_id`),
  CONSTRAINT `patient_reminder_settings_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_reminder_settings`
--

LOCK TABLES `patient_reminder_settings` WRITE;
/*!40000 ALTER TABLE `patient_reminder_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `patient_reminder_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `allergies` text,
  `emergency_contact` varchar(100) DEFAULT NULL,
  `emergency_phone` varchar(20) DEFAULT NULL,
  `insurance_provider` varchar(100) DEFAULT NULL,
  `insurance_number` varchar(50) DEFAULT NULL,
  `medical_history` text,
  `current_medications` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES (1,4,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-15 07:57:36','2026-02-15 07:57:36'),(2,9,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-15 08:08:54','2026-02-15 08:08:54');
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `address` text,
  `role` enum('patient','doctor','admin') NOT NULL DEFAULT 'patient',
  `is_active` tinyint(1) DEFAULT '1',
  `email_verified` tinyint(1) DEFAULT '0',
  `profile_image` varchar(500) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `reset_password_token` varchar(255) DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@healthcare.com','$2a$10$CjEDzHm2oAuChLZNYCMXkOHE.kYYQvgxJPzE.QZQNhY/sWi50d8O2','Admin','User',NULL,NULL,NULL,NULL,'admin',1,0,NULL,NULL,NULL,NULL,'2026-02-15 07:30:46','2026-02-15 07:30:46'),(2,'doctor@healthcare.com','$2a$10$CjEDzHm2oAuChLZNYCMXkOHE.kYYQvgxJPzE.QZQNhY/sWi50d8O2','Dr','Smith',NULL,NULL,NULL,NULL,'doctor',1,0,NULL,NULL,NULL,NULL,'2026-02-15 07:30:46','2026-02-15 07:30:46'),(3,'patient@healthcare.com','$2a$10$CjEDzHm2oAuChLZNYCMXkOHE.kYYQvgxJPzE.QZQNhY/sWi50d8O2','John','Doe',NULL,NULL,NULL,NULL,'patient',1,0,NULL,NULL,NULL,NULL,'2026-02-15 07:30:46','2026-02-15 07:30:46'),(4,'testuser@test.com','$2a$12$bIT4NnuPq6qDNCUmtLokoeAXtMkSXgPesNyJJvaua0ctRAqbmWuSe','Test','User',NULL,NULL,NULL,NULL,'patient',1,0,NULL,'2026-02-15 07:57:44',NULL,NULL,'2026-02-15 07:57:35','2026-02-15 07:57:44'),(9,'test@healthcare.com','$2a$12$VM0ptH/DOomt89HVFKP.ze4jtn/eoXpybzG1IGOtwWN9TDmc/6VwS','Test','User',NULL,NULL,NULL,NULL,'patient',1,0,NULL,'2026-02-15 08:08:59',NULL,NULL,'2026-02-15 08:08:53','2026-02-15 08:08:59');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-15  8:25:51
