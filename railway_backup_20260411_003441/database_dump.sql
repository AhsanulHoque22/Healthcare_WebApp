-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: gondola.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

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
-- Table structure for table `MedicineLogs`
--

DROP TABLE IF EXISTS `MedicineLogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MedicineLogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `medicine_name` varchar(255) NOT NULL,
  `action` enum('Prescribed','Discontinued') NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `MedicineLogs_ibfk_81` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `MedicineLogs_ibfk_82` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MedicineLogs`
--

LOCK TABLES `MedicineLogs` WRITE;
/*!40000 ALTER TABLE `MedicineLogs` DISABLE KEYS */;
INSERT INTO `MedicineLogs` VALUES (1,2,1,'Omidon','Prescribed','2026-04-03 05:40:39','2026-04-03 05:40:39'),(2,2,1,'','Prescribed','2026-04-04 17:14:17','2026-04-04 17:14:17'),(3,2,1,'Napa Extend','Prescribed','2026-04-04 17:53:30','2026-04-04 17:53:30'),(4,2,1,'Azithromycin','Prescribed','2026-04-04 17:53:30','2026-04-04 17:53:30'),(5,2,1,'Tusca Syrup','Prescribed','2026-04-04 17:53:30','2026-04-04 17:53:30');
/*!40000 ALTER TABLE `MedicineLogs` ENABLE KEYS */;
UNLOCK TABLES;

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
  `vital_signs` json DEFAULT NULL,
  `clinical_findings` text,
  PRIMARY KEY (`id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `Prescriptions_ibfk_124` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Prescriptions_ibfk_125` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Prescriptions_ibfk_126` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Prescriptions`
--

LOCK TABLES `Prescriptions` WRITE;
/*!40000 ALTER TABLE `Prescriptions` DISABLE KEYS */;
INSERT INTO `Prescriptions` VALUES (1,2,1,2,'[{\"name\":\"Femodit\",\"dosage\":\"20\",\"unit\":\"mg\",\"type\":\"tablet\",\"morning\":1,\"lunch\":0,\"dinner\":1,\"mealTiming\":\"after\",\"duration\":7,\"notes\":\"\"},{\"name\":\"Imotil\",\"dosage\":\"20\",\"unit\":\"mg\",\"type\":\"tablet\",\"morning\":0,\"lunch\":0,\"dinner\":0,\"mealTiming\":\"after\",\"duration\":7,\"notes\":\"\"}]','[{\"id\":\"1774806306348\",\"description\":\"\"}]','[{\"id\":\"1774803772662\",\"description\":\"Viral Fever\",\"date\":\"2026-03-29\"}]','{\"exercises\":\"\",\"dietaryChanges\":\"\",\"lifestyleModifications\":\"{\\\"exercises\\\":\\\"\\\",\\\"dietaryChanges\\\":\\\"\\\",\\\"lifestyleModifications\\\":\\\"{\\\\\\\"exercises\\\\\\\":\\\\\\\"Take rest, drink plenty of fluids, maintain hygiene and monitor temperature regularly\\\\\\\",\\\\\\\"dietaryChanges\\\\\\\":\\\\\\\"\\\\\\\",\\\\\\\"lifestyleModifications\\\\\\\":\\\\\\\"\\\\\\\"}\\\"}\"}','[{\"id\":\"1774803572557\",\"name\":\"Vitamin D Test\",\"description\":\"Measures vitamin D levels in blood\",\"status\":\"ordered\",\"testId\":16,\"category\":\"Nutrition\",\"price\":\"1200.00\"},{\"id\":\"1774806109502\",\"name\":\"Urine Routine Examination\",\"description\":\"Detects urinary tract infections and kidney disorders\",\"status\":\"ordered\",\"testId\":6,\"category\":\"Pathology\",\"price\":\"200.00\"},{\"id\":\"1774806357067\",\"name\":\"Kidney Function Test (KFT)\",\"description\":\"Evaluates kidney performance\",\"status\":\"ordered\",\"testId\":5,\"category\":\"Biochemistry\",\"price\":\"850.00\"},{\"id\":\"1774806362834\",\"name\":\"Blood Glucose (Fasting)\",\"description\":\"Measures blood sugar levels after fasting\",\"status\":\"ordered\",\"testId\":2,\"category\":\"Biochemistry\",\"price\":\"250.00\"}]','','draft','2026-03-29 17:11:21','2026-03-29 17:46:16',NULL,NULL),(2,1,2,2,'','[{\"id\":\"1774807520666\",\"description\":\"Mental Stocker\"},{\"id\":\"1774807536370\",\"description\":\"No dick energy\"}]','[{\"id\":\"1774807554833\",\"description\":\"Lack Of Girlfriend\",\"date\":\"2026-03-29\"}]','{\"exercises\":\"Get Married Soon\",\"dietaryChanges\":\"Eat Pineapple Milkshake\",\"lifestyleModifications\":\"\"}','[{\"id\":\"1774807644693\",\"name\":\"Calcium Test\",\"description\":\"Checks calcium levels in blood\",\"status\":\"confirmed\",\"testId\":17,\"category\":\"Biochemistry\",\"price\":\"400.00\",\"approvedAt\":\"2026-03-29T18:12:27.483Z\",\"approvedBy\":2,\"payments\":[{\"id\":1774808790949,\"amount\":400,\"paymentMethod\":\"bkash\",\"transactionId\":\"uirhwoieurt3434839\",\"status\":\"completed\",\"paidAt\":\"2026-03-29T18:26:30.949Z\",\"processedBy\":5,\"notes\":\"\"}],\"sampleId\":\"SMP-20260329-0001\",\"testReports\":[{\"filename\":\"prescription-result-1774812736059-832647274.jpg\",\"originalName\":\"CamScanner 09-21-2025 11.29_5.jpg\",\"path\":\"https://res.cloudinary.com/dfnaaukdq/image/upload/v1774812737/prescription_lab_results/jl2wgikzejdu0o121ngy.jpg\",\"publicId\":\"prescription_lab_results/jl2wgikzejdu0o121ngy\",\"uploadedAt\":\"2026-03-29T19:32:18.172Z\"}]},{\"id\":\"1774807662201\",\"name\":\"Blood Glucose (Fasting)\",\"description\":\"Measures blood sugar levels after fasting\",\"status\":\"confirmed\",\"testId\":2,\"category\":\"Biochemistry\",\"price\":\"250.00\",\"approvedAt\":\"2026-03-29T18:12:55.402Z\",\"approvedBy\":2,\"payments\":[{\"id\":1774808983918,\"amount\":158,\"paymentMethod\":\"bkash\",\"transactionId\":\"l;m\'pikjpio\",\"status\":\"completed\",\"paidAt\":\"2026-03-29T18:29:43.918Z\",\"processedBy\":5,\"notes\":\"\"},{\"id\":1774811081748,\"amount\":92,\"paymentMethod\":\"cash\",\"transactionId\":\"CASH-1774811081748\",\"status\":\"completed\",\"paidAt\":\"2026-03-29T19:04:41.748Z\",\"processedBy\":2,\"notes\":\"Cash payment recorded by admin\"}],\"sampleId\":\"SMP-20260329-0002\",\"paymentStatus\":\"paid\",\"testReports\":[{\"filename\":\"prescription-result-1774812800501-225167443.jpg\",\"originalName\":\"CamScanner 09-21-2025 11.29_4.jpg\",\"path\":\"https://res.cloudinary.com/dfnaaukdq/image/upload/v1774812802/prescription_lab_results/xzzaoparfr1rj9zyk7u8.jpg\",\"publicId\":\"prescription_lab_results/xzzaoparfr1rj9zyk7u8\",\"uploadedAt\":\"2026-03-29T19:33:22.483Z\"}]}]','','draft','2026-03-29 18:07:50','2026-03-29 19:33:28',NULL,NULL),(3,3,3,4,'[{\"name\":\"Seroquel\",\"dosage\":\"100\",\"unit\":\"mg\",\"type\":\"tablet\",\"morning\":1,\"lunch\":0,\"dinner\":1,\"mealTiming\":\"after\",\"duration\":30,\"notes\":\"\"},{\"name\":\"Aricept\",\"dosage\":\"500\",\"unit\":\"mg\",\"type\":\"tablet\",\"morning\":1,\"lunch\":1,\"dinner\":1,\"mealTiming\":\"after\",\"duration\":30,\"notes\":\"\"}]','','[{\"id\":\"1774862177041\",\"description\":\"\",\"date\":\"2026-03-30\"}]','{\"exercises\":\"\",\"dietaryChanges\":\"\",\"lifestyleModifications\":\"\"}','','','draft','2026-03-30 09:16:28','2026-03-30 09:16:28',NULL,NULL),(4,6,1,2,'','[{\"id\":\"1775160338630\",\"description\":\"Persistent headache for 5 days\"},{\"id\":\"1775160342103\",\"description\":\"Mild fever (≈ 37.8°C)\"},{\"id\":\"1775160358392\",\"description\":\"Fatigue and body aches\"},{\"id\":\"1775160376103\",\"description\":\"Occasional nausea\"},{\"id\":\"1775160382321\",\"description\":\"Poor sleep\"}]','[{\"id\":\"1775160427761\",\"description\":\"Acute Viral Syndrome with Tension-type Headache\",\"date\":\"2026-04-02\"},{\"id\":\"1775160430268\",\"description\":\"Rule out early sinusitis\",\"date\":\"2026-04-02\"}]','{\"exercises\":\"Light activity only (short walks)\\nAvoid heavy physical exertion\\nEnsure adequate rest (7–8 hours sleep)\",\"dietaryChanges\":\"Increase fluid intake (2.5–3 liters/day)\\nSoft, easily digestible foods (rice, soup, vegetables)\\nAvoid oily, spicy, and processed foods\\nInclude fruits rich in vitamin C (orange, guava)\",\"lifestyleModifications\":\"Maintain regular sleep schedule\\nReduce screen time and stress\\nStay in a well-ventilated environment\\nPractice relaxation techniques (deep breathing)\",\"followUps\":[],\"emergencyInstructions\":[]}','[{\"id\":\"1775160606479\",\"name\":\"Complete Blood Count (CBC)\",\"description\":\"Measures overall health and detects disorders like anemia and infection\",\"status\":\"ordered\",\"testId\":1,\"category\":\"Blood Tests\",\"price\":\"500.00\"}]','','draft','2026-04-02 20:06:20','2026-04-02 20:10:16',NULL,NULL),(5,7,1,2,'[{\"name\":\"Omidon\",\"dosage\":\"25\",\"unit\":\"mg\",\"type\":\"tablet\",\"morning\":1,\"lunch\":1,\"dinner\":1,\"mealTiming\":\"before\",\"duration\":7,\"notes\":\"\"}]','[{\"id\":\"1775194523487\",\"description\":\"Headache\"},{\"id\":\"1775194541863\",\"description\":\"Vomiting\"}]','[{\"id\":\"1775194554142\",\"description\":\"Seasonal Cold\",\"date\":\"2026-04-03\"}]','{\"exercises\":\"\",\"dietaryChanges\":\"Drink Warm water\",\"lifestyleModifications\":\"\",\"followUps\":[],\"emergencyInstructions\":[]}','[{\"id\":\"1775194832813\",\"name\":\"Complete Blood Count (CBC)\",\"description\":\"Measures overall health and detects disorders like anemia and infection\",\"status\":\"ordered\",\"testId\":1,\"category\":\"Blood Tests\",\"price\":\"500.00\"}]','','draft','2026-04-03 04:51:43','2026-04-03 05:40:39','{\"heartRate\": \"72\", \"temperature\": \"98.5\", \"bloodPressure\": \"120/80\", \"respiratoryRate\": \"16\", \"oxygenSaturation\": \"99\"}','body temp high'),(6,8,1,2,'[{\"name\":\"Napa Extend\",\"type\":\"Tablet\",\"dosage\":\"665 mg\",\"morning\":1,\"lunch\":1,\"dinner\":1,\"mealTiming\":\"After Meal\",\"duration\":5,\"instructions\":\"Take three times a day after meals for 5 days.\",\"unit\":\"mg\"},{\"name\":\"Azithromycin\",\"type\":\"Capsule\",\"dosage\":\"500 mg\",\"morning\":1,\"lunch\":0,\"dinner\":0,\"mealTiming\":\"Before Meal\",\"duration\":3,\"instructions\":\"Take one daily in the morning before breakfast for 3 days.\",\"unit\":\"mg\"},{\"name\":\"Tusca Syrup\",\"type\":\"Syrup\",\"dosage\":\"10 ml\",\"morning\":1,\"lunch\":0,\"dinner\":1,\"mealTiming\":\"After Meal\",\"duration\":7,\"instructions\":\"10 milliliters twice daily; no specific meal timing specified.\",\"unit\":\"mg\"}]','[{\"id\":\"17753244028460.021606304862531345\",\"description\":\"persistent cough\"},{\"id\":\"17753244028460.8750680549937552\",\"description\":\"high fever\"},{\"id\":\"17753244028460.7722558732559784\",\"description\":\"dry cough\"},{\"id\":\"17753244028460.9492593498873465\",\"description\":\"chest tightness\"},{\"id\":\"17753244028460.4711419588705803\",\"description\":\"moderate fatigue\"}]','[{\"id\":\"17753244028460.005076094944248322\",\"description\":\"suspected acute bronchitis\",\"date\":\"2026-04-04\"}]','{\"exercises\":\"\",\"dietaryChanges\":\"\",\"lifestyleModifications\":\"\",\"followUps\":[],\"emergencyInstructions\":[]}','[{\"id\":\"17753244028460.3317586658379108\",\"name\":\"Chest X-Ray\",\"description\":\"To rule out pneumonia\",\"status\":\"ordered\",\"category\":\"Others\"},{\"id\":\"17753244028460.9433779458793546\",\"name\":\"Complete Blood Count\",\"description\":\"To check for infection\",\"status\":\"ordered\",\"category\":\"Others\"}]','','draft','2026-04-04 17:14:17','2026-04-04 17:53:30','{\"heartRate\": 92, \"temperature\": \"101.5\", \"bloodPressure\": \"128/84\", \"respiratoryRate\": 22, \"oxygenSaturation\": 97}','Detailed examination shows coarse crackles in the right lower lobe. The patient\'s respiratory rate is slightly elevated at 22 breaths per minute.'),(7,9,2,2,'[{\"name\":\"\",\"dosage\":\"\",\"unit\":\"mg\",\"type\":\"tablet\",\"morning\":0,\"lunch\":0,\"dinner\":0,\"mealTiming\":\"after\",\"duration\":7,\"notes\":\"\"}]','[{\"id\":\"17753607998220.16235635468645115\",\"description\":\"high fever\"}]','[{\"id\":\"17753607998220.20014807921665323\",\"description\":\"Pyrexia\",\"date\":\"2024-05-22\"}]','{\"exercises\":\"\",\"dietaryChanges\":\"\",\"lifestyleModifications\":\"\",\"followUps\":[],\"emergencyInstructions\":[]}','','','draft','2026-04-05 03:47:42','2026-04-05 03:47:42','{\"heartRate\": \"\", \"temperature\": \"102\", \"bloodPressure\": \"85/110\", \"respiratoryRate\": \"\", \"oxygenSaturation\": \"\"}','Patient presents with high fever. Recommended lifestyle modifications include regular morning exercise and consumption of warm water.');
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
INSERT INTO `SequelizeMeta` VALUES ('20250105160000-add-sample-id-to-lab-test-orders.js'),('20250105200000-create-medicines-table.js'),('20250105200001-create-medicine-reminders-table.js'),('20250105200002-create-medicine-dosages-table.js'),('20250106170000-update-medicine-duration-to-integer.js'),('20250109000000-create-patient-reminder-settings.js');
/*!40000 ALTER TABLE `SequelizeMeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `WebsiteReview`
--

DROP TABLE IF EXISTS `WebsiteReview`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `WebsiteReview` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `rating` int NOT NULL,
  `review` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'approved',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `WebsiteReview_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WebsiteReview`
--

LOCK TABLES `WebsiteReview` WRITE;
/*!40000 ALTER TABLE `WebsiteReview` DISABLE KEYS */;
INSERT INTO `WebsiteReview` VALUES (1,5,4,'I was a seamless experience. I would recommend it anyone without any previous experience.','approved','2026-03-30 04:20:16','2026-03-30 04:20:16');
/*!40000 ALTER TABLE `WebsiteReview` ENABLE KEYS */;
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
  `chamber` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `appointments_ibfk_251` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `appointments_ibfk_252` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (1,2,2,'2026-03-28 00:00:00','14:00:00',180,'completed',1,'telemedicine','Cheka diyecho','Buker ba pashe betha',NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-03-28 11:55:55','2026-03-29 18:08:26','2026-03-28 11:52:22','2026-03-29 18:08:26',NULL),(2,2,1,'2026-03-29 00:00:00','09:00:00',180,'completed',1,'in_person','','',NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-03-29 16:58:38','2026-03-29 17:46:46','2026-03-29 15:50:26','2026-03-29 17:46:46',NULL),(3,4,3,'2026-03-31 00:00:00','14:00:00',180,'completed',1,'in_person','PTSD',' Hallucinations, delusions, and a disconnect from reality.',NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-03-30 09:14:32','2026-03-30 09:16:34','2026-03-30 07:47:09','2026-03-30 09:16:34',NULL),(4,4,4,'2026-03-31 00:00:00','09:00:00',180,'completed',1,'in_person','Gastric','Burning sensation in the chest or stomach ',NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-03-30 09:11:23','2026-03-30 09:13:46','2026-03-30 08:51:34','2026-03-30 09:13:46',NULL),(5,4,4,'2026-11-30 00:00:00','14:00:00',180,'completed',1,'telemedicine','Bumps around neck','Bumps around neck',NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-03-30 09:05:10','2026-03-30 09:08:37','2026-03-30 09:03:30','2026-03-30 09:08:37',NULL),(6,2,1,'2026-04-03 00:00:00','14:00:00',180,'completed',1,'telemedicine','Headache','',NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-04-02 19:59:40','2026-04-02 20:40:42','2026-04-02 19:59:11','2026-04-02 20:40:42',NULL),(7,2,1,'2026-04-03 00:00:00','14:00:00',180,'completed',2,'in_person','','',NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-04-02 21:26:31','2026-04-03 05:41:01','2026-04-02 21:25:56','2026-04-03 05:41:01',NULL),(8,2,1,'2026-04-03 00:00:00','14:00:00',180,'completed',3,'in_person','','',NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-04-04 12:39:12','2026-04-04 17:56:27','2026-04-03 15:48:29','2026-04-04 17:56:27',NULL),(9,2,2,'2026-04-05 00:00:00','14:00:00',180,'in_progress',1,'follow_up','','',NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-04-05 01:48:23',NULL,'2026-04-05 01:46:11','2026-04-05 01:48:23',NULL),(10,2,1,'2026-04-06 00:00:00','09:00:00',180,'in_progress',1,'telemedicine','','',NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-04-05 08:29:37',NULL,'2026-04-05 08:24:03','2026-04-05 08:29:37',NULL),(11,2,1,'2026-04-06 00:00:00','09:00:00',180,'requested',2,'in_person','','',NULL,NULL,NULL,NULL,NULL,NULL,'pending',NULL,NULL,'2026-04-06 16:09:14','2026-04-06 16:09:14','Sheba Clinic'),(12,1,1,'2026-04-06 00:00:00','09:00:00',180,'requested',3,'telemedicine','','',NULL,NULL,NULL,NULL,NULL,NULL,'pending',NULL,NULL,'2026-04-06 16:10:23','2026-04-06 16:10:23','Sheba Clinic'),(13,2,2,'2026-04-17 00:00:00','14:00:00',180,'cancelled',NULL,'in_person',NULL,'high blood pressure',NULL,NULL,NULL,NULL,NULL,NULL,'pending',NULL,NULL,'2026-04-10 12:01:17','2026-04-10 14:05:37',NULL),(14,2,2,'2024-06-02 00:00:00','10:00:00',180,'requested',NULL,'in_person',NULL,'fever',NULL,NULL,NULL,NULL,NULL,NULL,'pending',NULL,NULL,'2026-04-10 12:14:12','2026-04-10 12:14:12',NULL),(15,2,2,'2026-04-11 00:00:00','09:00:00',180,'requested',NULL,'in_person',NULL,'heart issue',NULL,NULL,NULL,NULL,NULL,NULL,'pending',NULL,NULL,'2026-04-10 14:05:24','2026-04-10 14:05:24',NULL);
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
-- Table structure for table `chat_histories`
--

DROP TABLE IF EXISTS `chat_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_histories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `role` enum('user','assistant') NOT NULL,
  `content` text NOT NULL,
  `intent` varchar(50) DEFAULT NULL,
  `context` json DEFAULT NULL COMMENT 'Stores extracted entities like symptoms, department, etc.',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `available_doctors` json DEFAULT NULL,
  `booking_details` json DEFAULT NULL,
  `conversation_id` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `chat_histories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=154 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_histories`
--

LOCK TABLES `chat_histories` WRITE;
/*!40000 ALTER TABLE `chat_histories` DISABLE KEYS */;
INSERT INTO `chat_histories` VALUES (151,5,'user','what are my active medicines?',NULL,NULL,'2026-04-10 18:17:02','2026-04-10 18:17:02',NULL,NULL,'su43i9uemnt89wjy','what are my active medicines?'),(152,5,'assistant','It seems like you have 3 active medicines.','GENERAL',NULL,'2026-04-10 18:17:05','2026-04-10 18:17:05',NULL,NULL,'su43i9uemnt89wjy','what are my active medicines?'),(153,5,'user','what are they?',NULL,NULL,'2026-04-10 18:17:13','2026-04-10 18:17:13',NULL,NULL,'su43i9uemnt89wjy',NULL);
/*!40000 ALTER TABLE `chat_histories` ENABLE KEYS */;
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
  UNIQUE KEY `unique_appointment_rating` (`appointmentId`),
  KEY `doctor_ratings_doctor_id` (`doctorId`),
  KEY `doctor_ratings_patient_id` (`patientId`),
  KEY `doctor_ratings_status` (`status`),
  CONSTRAINT `doctor_ratings_ibfk_1` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `doctor_ratings_ibfk_2` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `doctor_ratings_ibfk_3` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_ratings`
--

LOCK TABLES `doctor_ratings` WRITE;
/*!40000 ALTER TABLE `doctor_ratings` DISABLE KEYS */;
INSERT INTO `doctor_ratings` VALUES (1,2,2,1,5,'Very friendly doctor. Helped me cure really fast and gives a lot of time in check up. enjoyed the whole experience',NULL,0,'approved','2026-03-29 19:46:35','2026-03-30 03:38:24'),(2,1,2,2,4,'The doctor is very cooperative and calm. He listened all my problems first then start prescribe me and give proper guideline .',NULL,0,'approved','2026-03-30 05:56:50','2026-04-02 05:16:19'),(3,5,4,4,5,NULL,NULL,0,'approved','2026-04-01 16:41:06','2026-04-02 05:16:17'),(4,3,4,3,5,'Valoi to',NULL,0,'approved','2026-04-01 16:41:20','2026-04-02 05:16:14'),(5,4,4,4,5,'Shei Doctor',NULL,0,'approved','2026-04-01 16:41:33','2026-04-02 05:16:11'),(6,7,2,1,4,NULL,NULL,0,'pending','2026-04-03 08:20:39','2026-04-03 08:20:39');
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
  `consultation_fee` decimal(10,2) DEFAULT NULL,
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
  `signature` varchar(500) DEFAULT NULL COMMENT 'URL or path to doctor digital signature',
  `chambers` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bmdc_registration_number` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_2` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_3` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_4` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_5` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_6` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_7` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_8` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_9` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_10` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_11` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_12` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_13` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_14` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_15` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_16` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_17` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_18` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_19` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_20` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_21` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_22` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_23` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_24` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_25` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_26` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_27` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_28` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_29` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_30` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_31` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_32` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_33` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_34` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_35` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_36` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_37` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_38` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_39` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_40` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_41` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_42` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_43` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_44` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_45` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_46` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_47` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_48` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_49` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_50` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_51` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_52` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_53` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_54` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_55` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_56` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_57` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_58` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_59` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_60` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_61` (`bmdc_registration_number`),
  UNIQUE KEY `bmdc_registration_number_62` (`bmdc_registration_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctors`
--

LOCK TABLES `doctors` WRITE;
/*!40000 ALTER TABLE `doctors` DISABLE KEYS */;
INSERT INTO `doctors` VALUES (1,3,'A124365','gynecology_obstetrics',3,'','',500.00,'{}','',0.00,0,1,'https://res.cloudinary.com/dfnaaukdq/image/upload/v1774794453/doctor_profiles/pwofxd7vvqyajqdq8rxu.jpg','[\"MBBS\", \"MD\", \"FCPS\"]','[]','Parkview Hospital','','{}','[\"English\", \"Bengali\"]','[\"General Consultation\", \"Emergency Care\", \"Surgery\"]','2026-03-28 09:54:59','2026-04-06 14:51:30','https://res.cloudinary.com/dfnaaukdq/image/upload/v1775203293/doctor_profiles/s1jyvflvaaftoppiuwws.png','[{\"id\": \"1775486764102\", \"name\": \"Sheba Clinic\", \"address\": \"120/Kotowali, Chittagong\", \"chamberTimes\": {\"Friday\": [\"10:50 AM - 12:55 PM\"], \"Monday\": [\"09:00 AM - 11:00 AM\"], \"Sunday\": [\"11:45 AM - 03:45 PM\"], \"Tuesday\": [\"12:30 PM - 03:00 PM\"], \"Saturday\": [\"02:00 PM - 04:00 AM\"], \"Thursday\": [\"12:00 PM - 02:00 PM\"], \"Wednesday\": [\"09:00 AM - 11:00 AM\"]}}]'),(2,4,'A143256','cardiology',3,'','',2000.00,'{}','',0.00,0,1,'https://res.cloudinary.com/dfnaaukdq/image/upload/v1774807449/doctor_profiles/ugi7yyag3lznyv3fbbve.jpg','[\"MBBS\", \"MD\", \"FCPS\", \"MS\"]','[]','Evercare Hospital','','{\"Friday\": [\"14:00-17:00\"], \"Monday\": [\"14:00-17:00\"], \"Tuesday\": [\"14:00-17:00\"], \"Wednesday\": [\"14:00-17:00\"]}','[\"English\", \"Bengali\"]','[\"General Consultation\", \"Emergency Care\", \"Surgery\", \"Health Checkup\", \"Follow-up Care\"]','2026-03-28 09:58:27','2026-03-29 18:04:09',NULL,NULL),(3,7,'1234567890','psychiatry',4,'','',500.00,'{}','',0.00,0,1,'https://res.cloudinary.com/dfnaaukdq/image/upload/v1774856411/doctor_profiles/oqmhl1qhouunperrp3p6.jpg','[\"MBBS\", \"FRCS\"]','[]','Evercare Hospital',' Plot No. H1, Anannya CDA Residential Area, Oxygen - Kuwaish Rd, Chattogram 4337','{\"Friday\": [\"14:00-17:00\", \"19:00-22:00\"], \"Monday\": [\"09:00-12:00\", \"19:00-22:00\", \"14:00-17:00\"], \"Sunday\": [\"09:00-12:00\", \"14:00-17:00\", \"19:00-22:00\"], \"Tuesday\": [\"14:00-17:00\", \"19:00-22:00\"], \"Saturday\": [\"14:00-17:00\", \"19:00-22:00\"], \"Thursday\": [\"09:00-12:00\", \"19:00-22:00\", \"14:00-17:00\"], \"Wednesday\": [\"14:00-17:00\", \"19:00-22:00\"]}','[\"English\", \"Bengali\"]','[\"General Consultation\", \"Health Checkup\", \"Follow-up Care\", \"Telemedicine\", \"Home Visit\"]','2026-03-30 07:11:51','2026-03-30 07:43:38',NULL,NULL),(4,8,'123456789','emergency_medicine',2,'','',2000.00,'{}','',0.00,0,1,'https://res.cloudinary.com/dfnaaukdq/image/upload/v1774856006/doctor_profiles/gyga72qozmoiqfkcxyrd.jpg','[\"MBBS\"]','[]','Apollo Imperial Hospital','Zakir Hossain Road, Khulshi, Chattogram, Bangladesh','{\"Friday\": [\"09:00-12:00\", \"14:00-17:00\", \"19:00-22:00\"], \"Monday\": [\"09:00-12:00\", \"14:00-17:00\", \"19:00-22:00\"], \"Sunday\": [\"09:00-12:00\", \"14:00-17:00\", \"19:00-22:00\"], \"Tuesday\": [\"14:00-17:00\"], \"Saturday\": [\"14:00-17:00\"], \"Wednesday\": [\"09:00-12:00\", \"14:00-17:00\", \"19:00-22:00\"]}','[\"English\", \"Bengali\"]','[\"General Consultation\"]','2026-03-30 07:18:49','2026-03-30 07:39:15',NULL,NULL),(5,10,'1234','oncology',6,NULL,NULL,NULL,'{}',NULL,0.00,0,1,'https://res.cloudinary.com/dfnaaukdq/image/upload/v1774893198/doctor_profiles/khfs9mow41medsritbvz.jpg','[]','[]',NULL,NULL,'{}','[\"English\", \"Bengali\"]','[]','2026-03-30 17:44:57','2026-04-02 16:40:28',NULL,NULL);
/*!40000 ALTER TABLE `doctors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_cache`
--

DROP TABLE IF EXISTS `document_cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_cache` (
  `id` int NOT NULL AUTO_INCREMENT,
  `url_hash` varchar(64) NOT NULL,
  `url` longtext NOT NULL,
  `extracted_data` json NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `url_hash` (`url_hash`),
  UNIQUE KEY `url_hash_2` (`url_hash`),
  UNIQUE KEY `url_hash_3` (`url_hash`),
  UNIQUE KEY `url_hash_4` (`url_hash`),
  UNIQUE KEY `url_hash_5` (`url_hash`),
  UNIQUE KEY `url_hash_6` (`url_hash`),
  UNIQUE KEY `url_hash_7` (`url_hash`),
  UNIQUE KEY `url_hash_8` (`url_hash`),
  UNIQUE KEY `url_hash_9` (`url_hash`),
  UNIQUE KEY `url_hash_10` (`url_hash`),
  UNIQUE KEY `url_hash_11` (`url_hash`),
  UNIQUE KEY `url_hash_12` (`url_hash`),
  UNIQUE KEY `url_hash_13` (`url_hash`),
  UNIQUE KEY `url_hash_14` (`url_hash`),
  UNIQUE KEY `url_hash_15` (`url_hash`),
  UNIQUE KEY `url_hash_16` (`url_hash`),
  UNIQUE KEY `url_hash_17` (`url_hash`),
  UNIQUE KEY `url_hash_18` (`url_hash`),
  UNIQUE KEY `url_hash_19` (`url_hash`),
  UNIQUE KEY `url_hash_20` (`url_hash`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_cache`
--

LOCK TABLES `document_cache` WRITE;
/*!40000 ALTER TABLE `document_cache` DISABLE KEYS */;
INSERT INTO `document_cache` VALUES (1,'05c896d3f6094eb349163f4c8acfdc4eb37d84c9e4e606ead9b696a36ca64bd8','https://res.cloudinary.com/dfnaaukdq/image/upload/v1774796099/patient_documents/naoizshbvcibwokxe28r.jpg','{\"diagnoses\": [], \"labResults\": [], \"medications\": [], \"confidence_score\": 0.7, \"fallback_triggered\": false}','2026-04-10 16:54:19','2026-04-10 16:54:19'),(2,'6953dcda10fc8857352bb0e44b82147dfc5493d2fd38a25662ee94928182d476','https://res.cloudinary.com/dfnaaukdq/image/upload/v1774796146/patient_documents/vqvyoqqlmvohheagwbcf.jpg','{\"diagnoses\": [], \"labResults\": [], \"medications\": [], \"confidence_score\": 0.7, \"fallback_triggered\": false}','2026-04-10 16:54:23','2026-04-10 16:54:23');
/*!40000 ALTER TABLE `document_cache` ENABLE KEYS */;
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
  UNIQUE KEY `orderNumber_2` (`orderNumber`),
  UNIQUE KEY `orderNumber_3` (`orderNumber`),
  UNIQUE KEY `orderNumber_4` (`orderNumber`),
  UNIQUE KEY `orderNumber_5` (`orderNumber`),
  UNIQUE KEY `orderNumber_6` (`orderNumber`),
  UNIQUE KEY `orderNumber_7` (`orderNumber`),
  UNIQUE KEY `orderNumber_8` (`orderNumber`),
  UNIQUE KEY `orderNumber_9` (`orderNumber`),
  UNIQUE KEY `orderNumber_10` (`orderNumber`),
  UNIQUE KEY `orderNumber_11` (`orderNumber`),
  UNIQUE KEY `orderNumber_12` (`orderNumber`),
  UNIQUE KEY `orderNumber_13` (`orderNumber`),
  UNIQUE KEY `orderNumber_14` (`orderNumber`),
  UNIQUE KEY `orderNumber_15` (`orderNumber`),
  UNIQUE KEY `orderNumber_16` (`orderNumber`),
  UNIQUE KEY `orderNumber_17` (`orderNumber`),
  UNIQUE KEY `orderNumber_18` (`orderNumber`),
  UNIQUE KEY `orderNumber_19` (`orderNumber`),
  UNIQUE KEY `orderNumber_20` (`orderNumber`),
  UNIQUE KEY `orderNumber_21` (`orderNumber`),
  UNIQUE KEY `orderNumber_22` (`orderNumber`),
  UNIQUE KEY `orderNumber_23` (`orderNumber`),
  UNIQUE KEY `orderNumber_24` (`orderNumber`),
  UNIQUE KEY `orderNumber_25` (`orderNumber`),
  UNIQUE KEY `orderNumber_26` (`orderNumber`),
  UNIQUE KEY `orderNumber_27` (`orderNumber`),
  UNIQUE KEY `orderNumber_28` (`orderNumber`),
  UNIQUE KEY `orderNumber_29` (`orderNumber`),
  UNIQUE KEY `orderNumber_30` (`orderNumber`),
  UNIQUE KEY `orderNumber_31` (`orderNumber`),
  UNIQUE KEY `orderNumber_32` (`orderNumber`),
  UNIQUE KEY `orderNumber_33` (`orderNumber`),
  UNIQUE KEY `orderNumber_34` (`orderNumber`),
  UNIQUE KEY `orderNumber_35` (`orderNumber`),
  UNIQUE KEY `orderNumber_36` (`orderNumber`),
  UNIQUE KEY `orderNumber_37` (`orderNumber`),
  UNIQUE KEY `orderNumber_38` (`orderNumber`),
  UNIQUE KEY `orderNumber_39` (`orderNumber`),
  UNIQUE KEY `orderNumber_40` (`orderNumber`),
  UNIQUE KEY `orderNumber_41` (`orderNumber`),
  UNIQUE KEY `orderNumber_42` (`orderNumber`),
  UNIQUE KEY `orderNumber_43` (`orderNumber`),
  UNIQUE KEY `orderNumber_44` (`orderNumber`),
  UNIQUE KEY `orderNumber_45` (`orderNumber`),
  UNIQUE KEY `orderNumber_46` (`orderNumber`),
  UNIQUE KEY `orderNumber_47` (`orderNumber`),
  UNIQUE KEY `orderNumber_48` (`orderNumber`),
  UNIQUE KEY `orderNumber_49` (`orderNumber`),
  UNIQUE KEY `orderNumber_50` (`orderNumber`),
  UNIQUE KEY `orderNumber_51` (`orderNumber`),
  UNIQUE KEY `orderNumber_52` (`orderNumber`),
  UNIQUE KEY `orderNumber_53` (`orderNumber`),
  UNIQUE KEY `orderNumber_54` (`orderNumber`),
  UNIQUE KEY `orderNumber_55` (`orderNumber`),
  UNIQUE KEY `orderNumber_56` (`orderNumber`),
  UNIQUE KEY `orderNumber_57` (`orderNumber`),
  UNIQUE KEY `orderNumber_58` (`orderNumber`),
  UNIQUE KEY `orderNumber_59` (`orderNumber`),
  KEY `patientId` (`patientId`),
  KEY `doctorId` (`doctorId`),
  KEY `appointmentId` (`appointmentId`),
  KEY `verified_by` (`verified_by`),
  CONSTRAINT `lab_test_orders_ibfk_233` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `lab_test_orders_ibfk_234` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `lab_test_orders_ibfk_235` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `lab_test_orders_ibfk_236` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lab_tests`
--

LOCK TABLES `lab_tests` WRITE;
/*!40000 ALTER TABLE `lab_tests` DISABLE KEYS */;
INSERT INTO `lab_tests` VALUES (1,'Complete Blood Count (CBC)','Measures overall health and detects disorders like anemia and infection','Blood Tests',500.00,'Blood','No special preparation needed',0,1,'2026-03-29 16:15:22','2026-03-29 16:15:22'),(2,'Blood Glucose (Fasting)','Measures blood sugar levels after fasting','Biochemistry',250.00,'Blood','Fast for at least 8-10 hours before test',12,1,'2026-03-29 16:38:35','2026-03-29 16:38:35'),(3,'Lipid Profile','Measures cholesterol and triglycerides levels','Cardiology',800.00,'Blood','Fast for 10-12 hours before sample collection',24,1,'2026-03-29 16:40:09','2026-03-29 16:40:09'),(4,'Liver Function Test (LFT)','Assesses liver health and function','Biochemistry',900.00,'Blood','Avoid alcohol 24 hours before test',24,1,'2026-03-29 16:41:33','2026-03-29 16:41:33'),(5,'Kidney Function Test (KFT)','Evaluates kidney performance','Biochemistry',850.00,'Blood','Drink adequate water before test',24,1,'2026-03-29 16:42:26','2026-03-29 16:42:26'),(6,'Urine Routine Examination','Detects urinary tract infections and kidney disorders','Pathology',200.00,'Urine','Collect first morning urine sample',12,1,'2026-03-29 16:43:15','2026-03-29 16:43:15'),(7,'Thyroid Function Test (TFT)','Measures thyroid hormone levels','Endocrinology',1000.00,'Blood','No fasting required',24,1,'2026-03-29 16:44:00','2026-03-29 16:44:00'),(8,'Hemoglobin A1c (HbA1c)','Average blood sugar levels over 3 months','Diabetes',700.00,'Blood','No fasting required',12,1,'2026-03-29 16:45:29','2026-03-29 16:45:29'),(9,'Dengue NS1 Antigen Test','Detects dengue infection early','Serology',1200.00,'Blood','No preparation required',12,1,'2026-03-29 16:46:21','2026-03-29 16:46:21'),(10,'COVID-19 RT-PCR','Detects COVID-19 infection','Virology',1500.00,'Nasal/Throat Swab','Avoid eating 30 minutes before test',24,1,'2026-03-29 16:47:52','2026-03-29 16:47:52'),(11,'Serum Creatinine','Measures kidney function','Biochemistry',250.00,'Blood','No special preparation needed',12,1,'2026-03-29 16:48:33','2026-03-29 16:48:33'),(12,'C-Reactive Protein (CRP)','Detects inflammation in the body','Immunology',600.00,'Blood','No fasting required',12,1,'2026-03-29 16:49:27','2026-03-29 16:49:27'),(13,'Malaria Parasite Test','Detects malaria infection','Microbiology',400.00,'Blood','No preparation required',12,1,'2026-03-29 16:50:13','2026-03-29 16:50:13'),(14,'Hepatitis B Surface Antigen (HBsAg)','Detects Hepatitis B infection','Serology',900.00,'Blood','No preparation required',24,1,'2026-03-29 16:51:02','2026-03-29 16:51:02'),(15,'Prothrombin Time (PT)','Measures blood clotting time','Hematology',350.00,'Blood','Inform doctor about medications',24,1,'2026-03-29 16:52:29','2026-03-29 16:52:29'),(16,'Vitamin D Test','Measures vitamin D levels in blood','Nutrition',1200.00,'Blood','No fasting required',0,1,'2026-03-29 16:53:16','2026-03-29 16:53:16'),(17,'Calcium Test','Checks calcium levels in blood','Biochemistry',400.00,'Blood','No special preparation',24,1,'2026-03-29 16:54:05','2026-03-29 16:54:05'),(18,'ESR (Erythrocyte Sedimentation Rate)','ESR (Erythrocyte Sedimentation Rate)','Hematology',200.00,'Blood','No special preparation',24,1,'2026-03-29 16:54:43','2026-03-29 16:54:43'),(19,'Stool Examination','Detects digestive tract issues','Pathology',250.00,'stool','Collect fresh sample in sterile container',24,1,'2026-03-29 16:55:44','2026-03-29 16:55:44'),(20,'Stool Examination','Detects digestive tract issues','Pathology',250.00,'Stool','Collect fresh sample in sterile container',24,1,'2026-03-29 16:56:36','2026-03-29 16:56:36');
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_records`
--

LOCK TABLES `medical_records` WRITE;
/*!40000 ALTER TABLE `medical_records` DISABLE KEYS */;
INSERT INTO `medical_records` VALUES (1,2,1,2,'consultation','Appointment - 3/29/2026','APPOINTMENT DETAILS\n==================\n\nDate: 3/29/2026\nTime: 09:00:00\nType: in person\nDuration: 180 minutes\nSerial Number: 1\nStatus: completed\n\nPAYMENT STATUS:\npending\n\nAPPOINTMENT STARTED:\n3/29/2026, 4:58:38 PM\n\nAPPOINTMENT COMPLETED:\n3/29/2026, 5:46:46 PM\n\n',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-29 00:00:00','2026-03-29 17:46:46','2026-03-29 17:46:46'),(2,2,2,1,'consultation','Appointment - 3/28/2026','APPOINTMENT DETAILS\n==================\n\nDate: 3/28/2026\nTime: 14:00:00\nType: telemedicine\nDuration: 180 minutes\nSerial Number: 1\nStatus: completed\n\nREASON FOR VISIT:\nCheka diyecho\n\nSYMPTOMS:\nBuker ba pashe betha\n\nPAYMENT STATUS:\npending\n\nAPPOINTMENT STARTED:\n3/28/2026, 11:55:55 AM\n\nAPPOINTMENT COMPLETED:\n3/29/2026, 6:08:26 PM\n\n',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-28 00:00:00','2026-03-29 18:08:26','2026-03-29 18:08:26'),(3,4,4,5,'consultation','Appointment - 11/30/2026','APPOINTMENT DETAILS\n==================\n\nDate: 11/30/2026\nTime: 14:00:00\nType: telemedicine\nDuration: 180 minutes\nSerial Number: 1\nStatus: completed\n\nREASON FOR VISIT:\nBumps around neck\n\nSYMPTOMS:\nBumps around neck\n\nPAYMENT STATUS:\npending\n\nAPPOINTMENT STARTED:\n3/30/2026, 9:05:10 AM\n\nAPPOINTMENT COMPLETED:\n3/30/2026, 9:08:37 AM\n\n',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-11-30 00:00:00','2026-03-30 09:08:37','2026-03-30 09:08:37'),(4,4,4,4,'consultation','Appointment - 3/31/2026','APPOINTMENT DETAILS\n==================\n\nDate: 3/31/2026\nTime: 09:00:00\nType: in person\nDuration: 180 minutes\nSerial Number: 1\nStatus: completed\n\nREASON FOR VISIT:\nGastric\n\nSYMPTOMS:\nBurning sensation in the chest or stomach \n\nPAYMENT STATUS:\npending\n\nAPPOINTMENT STARTED:\n3/30/2026, 9:11:23 AM\n\nAPPOINTMENT COMPLETED:\n3/30/2026, 9:13:46 AM\n\n',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-31 00:00:00','2026-03-30 09:13:46','2026-03-30 09:13:46'),(5,4,3,3,'consultation','Appointment - 3/31/2026','APPOINTMENT DETAILS\n==================\n\nDate: 3/31/2026\nTime: 14:00:00\nType: in person\nDuration: 180 minutes\nSerial Number: 1\nStatus: completed\n\nREASON FOR VISIT:\nPTSD\n\nSYMPTOMS:\n Hallucinations, delusions, and a disconnect from reality.\n\nPAYMENT STATUS:\npending\n\nAPPOINTMENT STARTED:\n3/30/2026, 9:14:32 AM\n\nAPPOINTMENT COMPLETED:\n3/30/2026, 9:16:34 AM\n\n',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-31 00:00:00','2026-03-30 09:16:34','2026-03-30 09:16:34'),(6,2,1,6,'consultation','Appointment - 4/3/2026','APPOINTMENT DETAILS\n==================\n\nDate: 4/3/2026\nTime: 14:00:00\nType: telemedicine\nDuration: 180 minutes\nSerial Number: 1\nStatus: completed\n\nREASON FOR VISIT:\nHeadache\n\nPAYMENT STATUS:\npending\n\nAPPOINTMENT STARTED:\n4/2/2026, 7:59:40 PM\n\nAPPOINTMENT COMPLETED:\n4/2/2026, 8:40:42 PM\n\n',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-04-03 00:00:00','2026-04-02 20:40:42','2026-04-02 20:40:42'),(7,2,1,7,'consultation','Appointment - 4/3/2026','APPOINTMENT DETAILS\n==================\n\nDate: 4/3/2026\nTime: 14:00:00\nType: in person\nDuration: 180 minutes\nSerial Number: 2\nStatus: completed\n\nPAYMENT STATUS:\npending\n\nAPPOINTMENT STARTED:\n4/2/2026, 9:26:31 PM\n\nAPPOINTMENT COMPLETED:\n4/3/2026, 5:41:01 AM\n\n',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-04-03 00:00:00','2026-04-03 05:41:01','2026-04-03 05:41:01'),(8,2,1,8,'consultation','Appointment - 4/3/2026','APPOINTMENT DETAILS\n==================\n\nDate: 4/3/2026\nTime: 14:00:00\nType: in person\nDuration: 180 minutes\nSerial Number: 3\nStatus: completed\n\nPAYMENT STATUS:\npending\n\nAPPOINTMENT STARTED:\n4/4/2026, 12:39:12 PM\n\nAPPOINTMENT COMPLETED:\n4/4/2026, 5:56:27 PM\n\n',NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-04-03 00:00:00','2026-04-04 17:56:27','2026-04-04 17:56:27');
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
  KEY `medicine_dosages_medicine_id` (`medicineId`),
  KEY `medicine_dosages_patient_id` (`patientId`),
  KEY `medicine_dosages_taken_at` (`takenAt`),
  KEY `medicine_dosages_status` (`status`),
  KEY `medicine_dosages_reminder_id` (`reminderId`),
  CONSTRAINT `medicine_dosages_ibfk_298` FOREIGN KEY (`medicineId`) REFERENCES `medicines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `medicine_dosages_ibfk_299` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `medicine_dosages_ibfk_300` FOREIGN KEY (`reminderId`) REFERENCES `medicine_reminders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicine_dosages`
--

LOCK TABLES `medicine_dosages` WRITE;
/*!40000 ALTER TABLE `medicine_dosages` DISABLE KEYS */;
INSERT INTO `medicine_dosages` VALUES (1,1,2,'2026-03-28 18:16:00','25mgmg','taken','Taken at 00:16 on 2026-03-29',NULL,'2026-03-29 18:16:56','2026-03-29 18:16:56'),(2,2,2,'2026-03-28 18:20:00','75mg','taken','Taken at 00:20 on 2026-03-29',NULL,'2026-03-29 19:36:35','2026-03-29 19:36:35'),(3,2,2,'2026-03-28 18:20:00','75mg','taken','Taken at 00:20 on 2026-03-29',NULL,'2026-03-29 19:36:36','2026-03-29 19:36:36'),(4,3,2,'2026-03-28 18:20:00','20','taken','Taken at 00:20 on 2026-03-29',NULL,'2026-03-29 19:36:38','2026-03-29 19:36:38'),(5,2,2,'2026-03-29 18:20:00','75mg','taken','Taken at 00:20 on 2026-03-30',NULL,'2026-03-30 06:56:17','2026-03-30 06:56:17');
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
  KEY `medicine_reminders_medicine_id` (`medicineId`),
  KEY `medicine_reminders_patient_id` (`patientId`),
  KEY `medicine_reminders_is_active` (`isActive`),
  KEY `medicine_reminders_next_trigger` (`nextTrigger`),
  CONSTRAINT `medicine_reminders_ibfk_199` FOREIGN KEY (`medicineId`) REFERENCES `medicines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `medicine_reminders_ibfk_200` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicine_reminders`
--

LOCK TABLES `medicine_reminders` WRITE;
/*!40000 ALTER TABLE `medicine_reminders` DISABLE KEYS */;
INSERT INTO `medicine_reminders` VALUES (1,7,2,'08:00:00','[0, 1, 2, 3, 4, 5, 6]',0,'2026-04-10 08:00:20','2026-04-11 08:00:00','2026-04-03 05:40:39','2026-04-10 11:05:40'),(2,8,2,'08:00:00','[0, 1, 2, 3, 4, 5, 6]',1,'2026-04-10 08:00:20','2026-04-11 08:00:00','2026-04-04 17:14:17','2026-04-10 08:00:20'),(3,9,2,'08:00:00','[0, 1, 2, 3, 4, 5, 6]',0,'2026-04-10 08:00:20','2026-04-11 08:00:00','2026-04-04 17:53:30','2026-04-10 11:05:40'),(4,10,2,'08:00:00','[0, 1, 2, 3, 4, 5, 6]',0,'2026-04-07 08:01:04','2026-04-08 08:00:00','2026-04-04 17:53:30','2026-04-08 07:04:44'),(5,11,2,'08:00:00','[0, 1, 2, 3, 4, 5, 6]',1,'2026-04-10 08:00:20','2026-04-11 08:00:00','2026-04-04 17:53:30','2026-04-10 08:00:20');
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
  `genericName` varchar(255) DEFAULT NULL,
  `route` varchar(255) DEFAULT NULL COMMENT 'PO, IV, IM, etc.',
  `strength` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medicines_patient_id` (`patientId`),
  KEY `medicines_prescription_id` (`prescriptionId`),
  KEY `medicines_is_active` (`isActive`),
  KEY `medicines_start_date_end_date` (`startDate`,`endDate`),
  KEY `doctorId` (`doctorId`),
  CONSTRAINT `medicines_ibfk_298` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `medicines_ibfk_299` FOREIGN KEY (`prescriptionId`) REFERENCES `Prescriptions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `medicines_ibfk_300` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicines`
--

LOCK TABLES `medicines` WRITE;
/*!40000 ALTER TABLE `medicines` DISABLE KEYS */;
INSERT INTO `medicines` VALUES (1,2,1,'Paracetamol','25mgmg','morning + dinner (after meal)',7,'\n\nMedicine course completed on 4/6/2026. Final adherence: 14%','2026-03-29 17:11:21','2026-04-05 17:11:21',0,NULL,NULL,1,'2026-03-29 17:11:21','2026-04-06 08:56:46',NULL,NULL,NULL),(2,2,1,'Aspirin','75mg','morning + dinner (after meal)',7,'\n\nMedicine course completed on 4/6/2026. Final adherence: 43%','2026-03-29 17:12:31','2026-04-05 17:12:31',0,NULL,NULL,1,'2026-03-29 17:12:31','2026-04-06 08:56:46',NULL,NULL,NULL),(3,2,1,'Femodit','20','morning + dinner (after meal)',7,'','2026-03-29 17:40:37',NULL,1,NULL,NULL,1,'2026-03-29 17:40:37','2026-03-29 17:46:16',NULL,NULL,NULL),(4,2,1,'Imotil','20','As directed',7,'\n\nDiscontinued on 4/2/2026 - Reason: Doctor discontinued during appointment - Notes: Discontinued during prescription review','2026-03-29 17:40:37','2026-04-02 20:25:33',0,NULL,NULL,1,'2026-03-29 17:40:37','2026-04-02 20:25:33',NULL,NULL,NULL),(5,4,3,'Seroquel','100mg','morning + dinner (after meal)',30,'','2026-03-30 09:16:28','2026-04-29 09:16:28',1,NULL,NULL,3,'2026-03-30 09:16:28','2026-03-30 09:16:28',NULL,NULL,NULL),(6,4,3,'Aricept','500mg','morning + lunch + dinner (after meal)',30,'','2026-03-30 09:16:28','2026-04-29 09:16:28',1,NULL,NULL,3,'2026-03-30 09:16:28','2026-03-30 09:16:28',NULL,NULL,NULL),(7,2,5,'Omidon','25','TDS (Three times daily) [before meal]',7,'\n\nMedicine course completed on 4/10/2026. Final adherence: 0%','2026-04-03 05:40:39','2026-04-10 05:40:39',0,NULL,NULL,1,'2026-04-03 05:40:39','2026-04-10 11:05:40',NULL,NULL,NULL),(8,2,6,'','Not specified','0-0-0 [after meal]',7,'','2026-04-04 17:14:17','2026-04-12 03:47:42',1,NULL,NULL,1,'2026-04-04 17:14:17','2026-04-05 03:47:42',NULL,NULL,NULL),(9,2,6,'Napa Extend','665 mg','TDS (Three times daily) [After Meal meal]',5,'Take three times a day after meals for 5 days.\n\nMedicine course completed on 4/10/2026. Final adherence: 0%','2026-04-04 17:53:30','2026-04-09 17:56:23',0,NULL,NULL,1,'2026-04-04 17:53:30','2026-04-10 11:05:40',NULL,NULL,NULL),(10,2,6,'Azithromycin','500 mg','OD (Morning) [Before Meal meal]',3,'Take one daily in the morning before breakfast for 3 days.\n\nMedicine course completed on 4/8/2026. Final adherence: 0%','2026-04-04 17:53:30','2026-04-07 17:56:23',0,NULL,NULL,1,'2026-04-04 17:53:30','2026-04-08 07:04:44',NULL,NULL,NULL),(11,2,6,'Tusca Syrup','10 ml','BD (Morning + Night) [After Meal meal]',7,'10 milliliters twice daily; no specific meal timing specified.','2026-04-04 17:53:30','2026-04-11 17:56:23',1,NULL,NULL,1,'2026-04-04 17:53:30','2026-04-04 17:56:23',NULL,NULL,NULL);
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
  `targetRole` varchar(20) DEFAULT NULL,
  `actionType` varchar(100) DEFAULT NULL,
  `entityId` int DEFAULT NULL,
  `entityType` varchar(50) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id` (`userId`),
  KEY `notifications_user_id_is_read` (`userId`,`isRead`),
  KEY `notifications_created_at` (`createdAt`),
  KEY `notifications_target_role` (`targetRole`),
  KEY `notifications_action_type` (`actionType`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=176 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,'Welcome to HealthCare Pro!','Thank you for joining. Your account has been created. Book appointments and manage your health easily.','success',1,'patient','user_registered',NULL,NULL,'2026-03-28 07:59:45','2026-04-01 13:51:41'),(2,2,'New Patient Registered','Yousha Shamim Khan has registered as a patient.','info',1,'admin','user_registered',2,'user','2026-03-28 09:47:45','2026-03-28 10:00:15'),(3,3,'Welcome, Doctor!','Your account has been created. Complete your profile and submit for verification to start receiving appointments.','success',0,'doctor','user_registered',NULL,NULL,'2026-03-28 09:54:59','2026-03-28 09:54:59'),(4,2,'New Doctor Registered','Zawadul Hoque has registered as a doctor.','info',1,'admin','user_registered',3,'user','2026-03-28 09:54:59','2026-03-28 10:00:15'),(5,2,'New Doctor Verification Request','A new doctor has requested verification. Review in the admin dashboard.','info',1,'admin','doctor_verification_request',NULL,NULL,'2026-03-28 09:54:59','2026-03-28 10:00:15'),(6,4,'Welcome, Doctor!','Your account has been created. Complete your profile and submit for verification to start receiving appointments.','success',1,'doctor','user_registered',NULL,NULL,'2026-03-28 09:58:27','2026-03-28 11:48:42'),(7,2,'New Doctor Registered','Kazi Tayaba Hoque Chaity has registered as a doctor.','info',1,'admin','user_registered',4,'user','2026-03-28 09:58:27','2026-03-28 10:00:15'),(8,2,'New Doctor Verification Request','A new doctor has requested verification. Review in the admin dashboard.','info',1,'admin','doctor_verification_request',NULL,NULL,'2026-03-28 09:58:27','2026-03-28 10:00:15'),(9,4,'Account Verified','Your doctor account has been verified. You can now receive appointment requests.','success',1,'doctor','doctor_verification_changed',2,'doctor','2026-03-28 09:59:31','2026-03-28 11:48:42'),(10,3,'Account Verified','Your doctor account has been verified. You can now receive appointment requests.','success',0,'doctor','doctor_verification_changed',1,'doctor','2026-03-28 09:59:35','2026-03-28 09:59:35'),(11,5,'Welcome to HealthCare Pro!','Thank you for joining. Your account has been created. Book appointments and manage your health easily.','success',1,'patient','user_registered',NULL,NULL,'2026-03-28 11:40:32','2026-03-29 18:15:44'),(12,2,'New Patient Registered','Tasnim Orovi has registered as a patient.','info',0,'admin','user_registered',5,'user','2026-03-28 11:40:32','2026-03-28 11:40:32'),(13,4,'Verification Reverted','Your doctor verification has been reverted. Contact admin for details.','warning',1,'doctor','doctor_verification_changed',2,'doctor','2026-03-28 11:50:11','2026-03-28 11:52:49'),(14,4,'Account Verified','Your doctor account has been verified. You can now receive appointment requests.','success',1,'doctor','doctor_verification_changed',2,'doctor','2026-03-28 11:50:13','2026-03-28 11:52:49'),(15,5,'Appointment Requested','Your appointment request with Kazi Tayaba Hoque Chaity on 3/28/2026 at 14:00 has been submitted. Awaiting doctor approval.','info',1,'patient','appointment_created',1,'appointment','2026-03-28 11:52:22','2026-03-29 18:15:44'),(16,4,'New Appointment Request','You have a new appointment request for 3/28/2026 at 14:00. Please approve or decline.','info',1,'doctor','appointment_request_received',1,'appointment','2026-03-28 11:52:22','2026-03-28 11:52:49'),(17,5,'Appointment Approved','Your appointment with Kazi Tayaba Hoque Chaity on 3/28/2026 has been approved.','success',1,'patient','appointment_approved',1,'appointment','2026-03-28 11:53:05','2026-03-29 18:15:44'),(18,5,'Appointment Started','Your appointment with Kazi Tayaba Hoque Chaity has started at 14:00. The doctor is now seeing you.','info',1,'patient','appointment_started',1,'appointment','2026-03-28 11:55:55','2026-03-29 18:15:44'),(19,4,'Appointment In Progress','Your appointment is now in progress.','info',0,'doctor','appointment_started',1,'appointment','2026-03-28 11:55:55','2026-03-28 11:55:55'),(20,6,'Welcome to HealthCare Pro!','Thank you for joining. Your account has been created. Book appointments and manage your health easily.','success',0,'patient','user_registered',NULL,NULL,'2026-03-29 03:25:48','2026-03-29 03:25:48'),(21,2,'New Patient Registered','Md Ibrahim has registered as a patient.','info',0,'admin','user_registered',6,'user','2026-03-29 03:25:48','2026-03-29 03:25:48'),(22,5,'Appointment Requested','Your appointment request with Zawadul Hoque on 3/29/2026 at 09:00 has been submitted. Awaiting doctor approval.','info',1,'patient','appointment_created',2,'appointment','2026-03-29 15:50:26','2026-03-29 18:15:44'),(23,3,'New Appointment Request','You have a new appointment request for 3/29/2026 at 09:00. Please approve or decline.','info',0,'doctor','appointment_request_received',2,'appointment','2026-03-29 15:50:26','2026-03-29 15:50:26'),(24,5,'Appointment Approved','Your appointment with Zawadul Hoque on 3/29/2026 has been approved.','success',1,'patient','appointment_approved',2,'appointment','2026-03-29 15:51:08','2026-03-29 18:15:44'),(25,5,'Appointment Started','Your appointment with Zawadul Hoque has started at 09:00. The doctor is now seeing you.','info',1,'patient','appointment_started',2,'appointment','2026-03-29 16:58:38','2026-03-29 18:15:44'),(26,3,'Appointment In Progress','Your appointment is now in progress.','info',0,'doctor','appointment_started',2,'appointment','2026-03-29 16:58:38','2026-03-29 16:58:38'),(27,5,'Prescription Ready','Your prescription from Zawadul Hoque is ready. View details in your dashboard.','success',1,'patient','prescription_created',1,'prescription','2026-03-29 17:11:21','2026-03-29 18:15:44'),(28,5,'Prescription Ready','Your prescription from Zawadul Hoque is ready. View details in your dashboard.','success',1,'patient','prescription_created',1,'prescription','2026-03-29 17:12:31','2026-03-29 18:15:44'),(29,5,'Prescription Ready','Your prescription from Zawadul Hoque is ready. View details in your dashboard.','success',1,'patient','prescription_created',1,'prescription','2026-03-29 17:40:37','2026-03-29 18:15:44'),(30,5,'Prescription Ready','Your prescription from Zawadul Hoque is ready. View details in your dashboard.','success',1,'patient','prescription_created',1,'prescription','2026-03-29 17:46:16','2026-03-29 18:15:44'),(31,5,'Prescription Ready','Your prescription from Zawadul Hoque is ready. View details in your dashboard.','success',1,'patient','prescription_created',1,'prescription','2026-03-29 17:46:42','2026-03-29 18:15:44'),(32,5,'Appointment Completed','Your appointment with Zawadul Hoque has been completed. You can view your prescription in your dashboard.','success',1,'patient','appointment_completed',2,'appointment','2026-03-29 17:46:46','2026-03-29 18:15:44'),(33,3,'Appointment Completed','Appointment has been marked as completed.','success',0,'doctor','appointment_completed',2,'appointment','2026-03-29 17:46:46','2026-03-29 17:46:46'),(34,5,'Prescription Ready','Your prescription from Kazi Tayaba Hoque Chaity is ready. View details in your dashboard.','success',1,'patient','prescription_created',2,'prescription','2026-03-29 18:07:50','2026-03-29 18:15:44'),(35,5,'Prescription Ready','Your prescription from Kazi Tayaba Hoque Chaity is ready. View details in your dashboard.','success',1,'patient','prescription_created',2,'prescription','2026-03-29 18:08:16','2026-03-29 18:15:44'),(36,5,'Appointment Completed','Your appointment with Kazi Tayaba Hoque Chaity has been completed. You can view your prescription in your dashboard.','success',1,'patient','appointment_completed',1,'appointment','2026-03-29 18:08:26','2026-03-29 18:15:44'),(37,4,'Appointment Completed','Appointment has been marked as completed.','success',0,'doctor','appointment_completed',1,'appointment','2026-03-29 18:08:26','2026-03-29 18:08:26'),(38,5,'Medicine Reminder','Time to take Test Medicine (1 tablet) at 18:16.','info',1,'patient','medicine_reminder',NULL,'medicine','2026-03-29 18:16:10','2026-03-30 04:46:44'),(39,5,'Medicine Reminder','Time to take Test Medicine (1 tablet) at 18:17.','info',1,'patient','medicine_reminder',NULL,'medicine','2026-03-29 18:17:08','2026-03-30 04:46:44'),(40,5,'Medicine Reminder','Time to take Test Medicine (1 tablet) at 18:23.','info',1,'patient','medicine_reminder',NULL,'medicine','2026-03-29 18:23:08','2026-03-30 04:46:44'),(41,5,'Medicine Reminder','Time to take Test Medicine (1 tablet) at 18:23.','info',1,'patient','medicine_reminder',NULL,'medicine','2026-03-29 18:23:15','2026-03-30 04:46:44'),(42,5,'Lab Results Ready','Your lab test results for Calcium Test are now available for review.','success',1,'patient','lab_results_ready',2,'prescription','2026-03-29 19:32:29','2026-03-30 04:46:44'),(43,5,'Lab Results Ready','Your lab test results for Blood Glucose (Fasting) are now available for review.','success',1,'patient','lab_results_ready',2,'prescription','2026-03-29 19:33:28','2026-03-30 04:46:44'),(44,3,'New Rating Received','You received a 5-star rating. A review was also submitted.','info',0,'doctor','rating_received',1,'rating','2026-03-29 19:46:35','2026-03-29 19:46:35'),(45,2,'New Doctor Rating','A new doctor rating has been submitted. Review for moderation if needed.','info',0,'admin','rating_submitted',1,'rating','2026-03-29 19:46:35','2026-03-29 19:46:35'),(46,4,'New Rating Received','You received a 4-star rating. A review was also submitted.','info',0,'doctor','rating_received',2,'rating','2026-03-30 05:56:50','2026-03-30 05:56:50'),(47,2,'New Doctor Rating','A new doctor rating has been submitted. Review for moderation if needed.','info',0,'admin','rating_submitted',2,'rating','2026-03-30 05:56:50','2026-03-30 05:56:50'),(48,7,'Welcome, Doctor!','Your account has been created. Complete your profile and submit for verification to start receiving appointments.','success',0,'doctor','user_registered',NULL,NULL,'2026-03-30 07:11:51','2026-03-30 07:11:51'),(49,2,'New Doctor Registered','Nurjahan Tilka has registered as a doctor.','info',0,'admin','user_registered',7,'user','2026-03-30 07:11:51','2026-03-30 07:11:51'),(50,2,'New Doctor Verification Request','A new doctor has requested verification. Review in the admin dashboard.','info',0,'admin','doctor_verification_request',NULL,NULL,'2026-03-30 07:11:51','2026-03-30 07:11:51'),(51,7,'Account Verified','Your doctor account has been verified. You can now receive appointment requests.','success',0,'doctor','doctor_verification_changed',3,'doctor','2026-03-30 07:15:07','2026-03-30 07:15:07'),(52,8,'Welcome, Doctor!','Your account has been created. Complete your profile and submit for verification to start receiving appointments.','success',1,'doctor','user_registered',NULL,NULL,'2026-03-30 07:18:49','2026-03-30 07:38:24'),(53,2,'New Doctor Verification Request','A new doctor has requested verification. Review in the admin dashboard.','info',0,'admin','doctor_verification_request',NULL,NULL,'2026-03-30 07:18:49','2026-03-30 07:18:49'),(54,2,'New Doctor Registered','Tashdid Tahsin has registered as a doctor.','info',0,'admin','user_registered',8,'user','2026-03-30 07:18:49','2026-03-30 07:18:49'),(55,9,'Welcome to Livora!','Thank you for joining. Your account has been created. Book appointments and manage your health easily.','success',0,'patient','user_registered',NULL,NULL,'2026-03-30 07:22:32','2026-03-30 07:22:32'),(56,2,'New Patient Registered','Mobasshira Anika has registered as a patient.','info',0,'admin','user_registered',9,'user','2026-03-30 07:22:32','2026-03-30 07:22:32'),(57,8,'Account Verified','Your doctor account has been verified. You can now receive appointment requests.','success',0,'doctor','doctor_verification_changed',4,'doctor','2026-03-30 07:39:15','2026-03-30 07:39:15'),(58,9,'Appointment Requested','Your appointment request with Nurjahan Tilka on 3/31/2026 at 14:00 has been submitted. Awaiting doctor approval.','info',0,'patient','appointment_created',3,'appointment','2026-03-30 07:47:09','2026-03-30 07:47:09'),(59,7,'New Appointment Request','You have a new appointment request for 3/31/2026 at 14:00. Please approve or decline.','info',0,'doctor','appointment_request_received',3,'appointment','2026-03-30 07:47:09','2026-03-30 07:47:09'),(60,9,'Appointment Approved','Your appointment with Nurjahan Tilka on 3/31/2026 has been approved.','success',0,'patient','appointment_approved',3,'appointment','2026-03-30 08:50:05','2026-03-30 08:50:05'),(61,9,'Appointment Requested','Your appointment request with Tashdid Tahsin on 3/31/2026 at 09:00 has been submitted. Awaiting doctor approval.','info',0,'patient','appointment_created',4,'appointment','2026-03-30 08:51:34','2026-03-30 08:51:34'),(62,8,'New Appointment Request','You have a new appointment request for 3/31/2026 at 09:00. Please approve or decline.','info',0,'doctor','appointment_request_received',4,'appointment','2026-03-30 08:51:34','2026-03-30 08:51:34'),(63,9,'Appointment Approved','Your appointment with Tashdid Tahsin on 3/31/2026 has been approved.','success',0,'patient','appointment_approved',4,'appointment','2026-03-30 08:52:44','2026-03-30 08:52:44'),(64,9,'Appointment Requested','Your appointment request with Tashdid Tahsin on 11/30/2026 at 14:00 has been submitted. Awaiting doctor approval.','info',0,'patient','appointment_created',5,'appointment','2026-03-30 09:03:30','2026-03-30 09:03:30'),(65,8,'New Appointment Request','You have a new appointment request for 11/30/2026 at 14:00. Please approve or decline.','info',1,'doctor','appointment_request_received',5,'appointment','2026-03-30 09:03:30','2026-03-30 09:04:58'),(66,9,'Appointment Approved','Your appointment with Tashdid Tahsin on 11/30/2026 has been approved.','success',0,'patient','appointment_approved',5,'appointment','2026-03-30 09:04:04','2026-03-30 09:04:04'),(67,9,'Appointment Started','Your appointment with Tashdid Tahsin has started at 14:00. The doctor is now seeing you.','info',0,'patient','appointment_started',5,'appointment','2026-03-30 09:05:10','2026-03-30 09:05:10'),(68,8,'Appointment In Progress','Your appointment is now in progress.','info',0,'doctor','appointment_started',5,'appointment','2026-03-30 09:05:10','2026-03-30 09:05:10'),(69,9,'Appointment Completed','Your appointment with Tashdid Tahsin has been completed. You can view your prescription in your dashboard.','success',0,'patient','appointment_completed',5,'appointment','2026-03-30 09:08:37','2026-03-30 09:08:37'),(70,8,'Appointment Completed','Appointment has been marked as completed.','success',0,'doctor','appointment_completed',5,'appointment','2026-03-30 09:08:37','2026-03-30 09:08:37'),(71,9,'Appointment Started','Your appointment with Tashdid Tahsin has started at 09:00. The doctor is now seeing you.','info',0,'patient','appointment_started',4,'appointment','2026-03-30 09:11:23','2026-03-30 09:11:23'),(72,8,'Appointment In Progress','Your appointment is now in progress.','info',0,'doctor','appointment_started',4,'appointment','2026-03-30 09:11:23','2026-03-30 09:11:23'),(73,9,'Appointment Completed','Your appointment with Tashdid Tahsin has been completed. You can view your prescription in your dashboard.','success',0,'patient','appointment_completed',4,'appointment','2026-03-30 09:13:46','2026-03-30 09:13:46'),(74,8,'Appointment Completed','Appointment has been marked as completed.','success',0,'doctor','appointment_completed',4,'appointment','2026-03-30 09:13:46','2026-03-30 09:13:46'),(75,9,'Appointment Started','Your appointment with Nurjahan Tilka has started at 14:00. The doctor is now seeing you.','info',0,'patient','appointment_started',3,'appointment','2026-03-30 09:14:32','2026-03-30 09:14:32'),(76,7,'Appointment In Progress','Your appointment is now in progress.','info',0,'doctor','appointment_started',3,'appointment','2026-03-30 09:14:32','2026-03-30 09:14:32'),(77,9,'Prescription Ready','Your prescription from Nurjahan Tilka is ready. View details in your dashboard.','success',1,'patient','prescription_created',3,'prescription','2026-03-30 09:16:28','2026-03-30 09:21:57'),(78,9,'Appointment Completed','Your appointment with Nurjahan Tilka has been completed. You can view your prescription in your dashboard.','success',0,'patient','appointment_completed',3,'appointment','2026-03-30 09:16:34','2026-03-30 09:16:34'),(79,7,'Appointment Completed','Appointment has been marked as completed.','success',0,'doctor','appointment_completed',3,'appointment','2026-03-30 09:16:34','2026-03-30 09:16:34'),(80,10,'Welcome, Doctor!','Your account has been created. Complete your profile and submit for verification to start receiving appointments.','success',0,'doctor','user_registered',NULL,NULL,'2026-03-30 17:44:57','2026-03-30 17:44:57'),(81,2,'New Doctor Registered','YJ Himel has registered as a doctor.','info',0,'admin','user_registered',10,'user','2026-03-30 17:44:57','2026-03-30 17:44:57'),(82,2,'New Doctor Verification Request','A new doctor has requested verification. Review in the admin dashboard.','info',0,'admin','doctor_verification_request',NULL,NULL,'2026-03-30 17:44:57','2026-03-30 17:44:57'),(83,10,'Account Verified','Your doctor account has been verified. You can now receive appointment requests.','success',0,'doctor','doctor_verification_changed',5,'doctor','2026-03-30 17:49:13','2026-03-30 17:49:13'),(84,2,'User Deactivated','User YJ Himel (doctor) has been deactivated.','warning',0,'admin','user_deactivated',10,'user','2026-04-01 16:36:43','2026-04-01 16:36:43'),(85,8,'New Rating Received','You received a 5-star rating. ','info',0,'doctor','rating_received',3,'rating','2026-04-01 16:41:06','2026-04-01 16:41:06'),(86,2,'New Doctor Rating','A new doctor rating has been submitted. Review for moderation if needed.','info',0,'admin','rating_submitted',3,'rating','2026-04-01 16:41:06','2026-04-01 16:41:06'),(87,7,'New Rating Received','You received a 5-star rating. A review was also submitted.','info',0,'doctor','rating_received',4,'rating','2026-04-01 16:41:20','2026-04-01 16:41:20'),(88,2,'New Doctor Rating','A new doctor rating has been submitted. Review for moderation if needed.','info',0,'admin','rating_submitted',4,'rating','2026-04-01 16:41:20','2026-04-01 16:41:20'),(89,8,'New Rating Received','You received a 5-star rating. A review was also submitted.','info',0,'doctor','rating_received',5,'rating','2026-04-01 16:41:33','2026-04-01 16:41:33'),(90,2,'New Doctor Rating','A new doctor rating has been submitted. Review for moderation if needed.','info',0,'admin','rating_submitted',5,'rating','2026-04-01 16:41:33','2026-04-01 16:41:33'),(91,10,'Verification Reverted','Your doctor verification has been reverted. Contact admin for details.','warning',0,'doctor','doctor_verification_changed',5,'doctor','2026-04-02 16:40:24','2026-04-02 16:40:24'),(92,10,'Account Verified ✓','Your doctor account has been verified. You can now receive appointment requests.','success',0,'doctor','doctor_verification_changed',5,'doctor','2026-04-02 16:40:29','2026-04-02 16:40:29'),(93,5,'Appointment Requested','Your appointment request with Zawadul Hoque on Friday, April 3, 2026 at 14:00 has been submitted. Awaiting doctor approval.','info',1,'patient','appointment_created',6,'appointment','2026-04-02 19:59:11','2026-04-03 07:49:37'),(94,3,'New Appointment Request','You have a new appointment request for Friday, April 3, 2026 at 14:00. Please approve or decline.','info',0,'doctor','appointment_request_received',6,'appointment','2026-04-02 19:59:11','2026-04-02 19:59:11'),(95,5,'Appointment Approved ✓','Your appointment with Zawadul Hoque on Friday, April 3, 2026 has been approved.','success',1,'patient','appointment_approved',6,'appointment','2026-04-02 19:59:33','2026-04-03 07:49:37'),(96,5,'Appointment Started','Your appointment with Zawadul Hoque has started at 14:00. The doctor is now seeing you.','info',1,'patient','appointment_started',6,'appointment','2026-04-02 19:59:40','2026-04-03 07:49:37'),(97,3,'Appointment In Progress','Your appointment is now in progress.','info',0,'doctor','appointment_started',6,'appointment','2026-04-02 19:59:40','2026-04-02 19:59:40'),(98,5,'Prescription Ready','Your prescription from Zawadul Hoque is ready. View details in your dashboard.','success',1,'patient','prescription_created',4,'prescription','2026-04-02 20:06:20','2026-04-03 07:49:37'),(99,5,'Prescription Ready','Your prescription from Zawadul Hoque is ready. View details in your dashboard.','success',1,'patient','prescription_created',4,'prescription','2026-04-02 20:06:33','2026-04-03 07:49:37'),(100,5,'Prescription Ready','Your prescription from Zawadul Hoque is ready. View details in your dashboard.','success',1,'patient','prescription_created',4,'prescription','2026-04-02 20:10:16','2026-04-03 07:49:37'),(101,5,'Appointment Completed','Your appointment with Zawadul Hoque has been completed. You can view your prescription in your dashboard.','success',1,'patient','appointment_completed',6,'appointment','2026-04-02 20:40:42','2026-04-03 07:49:37'),(102,3,'Appointment Completed','Appointment has been marked as completed.','success',0,'doctor','appointment_completed',6,'appointment','2026-04-02 20:40:42','2026-04-02 20:40:42'),(103,5,'Appointment Requested','Your appointment request with Zawadul Hoque on Friday, April 3, 2026 at 14:00 has been submitted. Awaiting doctor approval.','info',1,'patient','appointment_created',7,'appointment','2026-04-02 21:25:56','2026-04-03 07:49:37'),(104,3,'New Appointment Request','You have a new appointment request for Friday, April 3, 2026 at 14:00. Please approve or decline.','info',0,'doctor','appointment_request_received',7,'appointment','2026-04-02 21:25:56','2026-04-02 21:25:56'),(105,5,'Appointment Approved ✓','Your appointment with Zawadul Hoque on Friday, April 3, 2026 has been approved.','success',1,'patient','appointment_approved',7,'appointment','2026-04-02 21:26:24','2026-04-03 07:49:37'),(106,5,'Prescription Ready','Your prescription from Zawadul Hoque is ready. View details in your dashboard.','success',1,'patient','prescription_created',5,'prescription','2026-04-03 04:51:43','2026-04-03 07:49:37'),(107,5,'Prescription Ready','Your prescription from Zawadul Hoque is ready. View details in your dashboard.','success',1,'patient','prescription_created',5,'prescription','2026-04-03 05:40:39','2026-04-03 07:49:37'),(108,5,'Appointment Completed','Your appointment with Zawadul Hoque has been completed. You can view your prescription in your dashboard.','success',1,'patient','appointment_completed',7,'appointment','2026-04-03 05:41:01','2026-04-03 07:49:37'),(109,3,'Appointment Completed','Appointment has been marked as completed.','success',0,'doctor','appointment_completed',7,'appointment','2026-04-03 05:41:01','2026-04-03 05:41:01'),(110,5,'Medicine Reminder','Time to take Omidon (25) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-03 08:00:15','2026-04-03 08:00:15'),(111,2,'New Doctor Rating','A new doctor rating has been submitted. Review for moderation if needed.','info',0,'admin','rating_submitted',6,'rating','2026-04-03 08:20:39','2026-04-03 08:20:39'),(112,3,'New Rating Received','You received a 4-star rating. ','info',0,'doctor','rating_received',6,'rating','2026-04-03 08:20:39','2026-04-03 08:20:39'),(113,11,'Welcome to Livora!','Thank you for joining. Your account has been created. Book appointments and manage your health easily.','success',0,'patient','user_registered',NULL,NULL,'2026-04-03 08:36:57','2026-04-03 08:36:57'),(114,2,'New Patient Registered','Shamim Uddin has registered as a patient.','info',0,'admin','user_registered',11,'user','2026-04-03 08:36:57','2026-04-03 08:36:57'),(115,5,'Appointment Requested','Your appointment request with Zawadul Hoque on Friday, April 3, 2026 at 14:00 has been submitted. Awaiting doctor approval.','info',1,'patient','appointment_created',8,'appointment','2026-04-03 15:48:29','2026-04-04 07:02:19'),(116,3,'New Appointment Request','You have a new appointment request for Friday, April 3, 2026 at 14:00. Please approve or decline.','info',0,'doctor','appointment_request_received',8,'appointment','2026-04-03 15:48:29','2026-04-03 15:48:29'),(117,5,'Medicine Reminder','Time to take Omidon (25) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-04 08:04:07','2026-04-04 08:04:07'),(118,5,'Appointment Approved ✓','Your appointment with Zawadul Hoque on Friday, April 3, 2026 has been approved.','success',0,'patient','appointment_approved',8,'appointment','2026-04-04 12:38:59','2026-04-04 12:38:59'),(119,5,'Appointment Started','Your appointment with Zawadul Hoque has started at 14:00. The doctor is now seeing you.','info',0,'patient','appointment_started',8,'appointment','2026-04-04 12:39:12','2026-04-04 12:39:12'),(120,3,'Appointment In Progress','Your appointment is now in progress.','info',0,'doctor','appointment_started',8,'appointment','2026-04-04 12:39:12','2026-04-04 12:39:12'),(121,5,'Prescription Ready','Your prescription from Zawadul Hoque is ready. View details in your dashboard.','success',0,'patient','prescription_created',6,'prescription','2026-04-04 17:14:17','2026-04-04 17:14:17'),(122,5,'Prescription Ready','Your prescription from Zawadul Hoque is ready. View details in your dashboard.','success',0,'patient','prescription_created',6,'prescription','2026-04-04 17:38:33','2026-04-04 17:38:33'),(123,5,'Prescription Ready','Your prescription from Zawadul Hoque is ready. View details in your dashboard.','success',0,'patient','prescription_created',6,'prescription','2026-04-04 17:53:30','2026-04-04 17:53:30'),(124,5,'Prescription Ready','Your prescription from Zawadul Hoque is ready. View details in your dashboard.','success',0,'patient','prescription_created',6,'prescription','2026-04-04 17:56:23','2026-04-04 17:56:23'),(125,5,'Appointment Completed','Your appointment with Zawadul Hoque has been completed. You can view your prescription in your dashboard.','success',0,'patient','appointment_completed',8,'appointment','2026-04-04 17:56:27','2026-04-04 17:56:27'),(126,3,'Appointment Completed','Appointment has been marked as completed.','success',0,'doctor','appointment_completed',8,'appointment','2026-04-04 17:56:27','2026-04-04 17:56:27'),(127,5,'Appointment Requested','Your appointment request with Kazi Tayaba Hoque Chaity on Sunday, April 5, 2026 at 14:00 has been submitted. Awaiting doctor approval.','info',0,'patient','appointment_created',9,'appointment','2026-04-05 01:46:11','2026-04-05 01:46:11'),(128,4,'New Appointment Request','You have a new appointment request for Sunday, April 5, 2026 at 14:00. Please approve or decline.','info',0,'doctor','appointment_request_received',9,'appointment','2026-04-05 01:46:11','2026-04-05 01:46:11'),(129,5,'Appointment Approved ✓','Your appointment with Kazi Tayaba Hoque Chaity on Sunday, April 5, 2026 has been approved.','success',0,'patient','appointment_approved',9,'appointment','2026-04-05 01:48:18','2026-04-05 01:48:18'),(130,5,'Appointment Started','Your appointment with Kazi Tayaba Hoque Chaity has started at 14:00. The doctor is now seeing you.','info',0,'patient','appointment_started',9,'appointment','2026-04-05 01:48:24','2026-04-05 01:48:24'),(131,4,'Appointment In Progress','Your appointment is now in progress.','info',0,'doctor','appointment_started',9,'appointment','2026-04-05 01:48:25','2026-04-05 01:48:25'),(132,5,'Prescription Ready','Your prescription from Kazi Tayaba Hoque Chaity is ready. View details in your dashboard.','success',0,'patient','prescription_created',7,'prescription','2026-04-05 03:47:42','2026-04-05 03:47:42'),(133,5,'Medicine Reminder','Time to take Omidon (25) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-05 08:03:50','2026-04-05 08:03:50'),(134,5,'Medicine Reminder','Time to take  (Not specified) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-05 08:03:50','2026-04-05 08:03:50'),(135,5,'Medicine Reminder','Time to take Napa Extend (665 mg) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-05 08:03:50','2026-04-05 08:03:50'),(136,5,'Medicine Reminder','Time to take Azithromycin (500 mg) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-05 08:03:50','2026-04-05 08:03:50'),(137,5,'Medicine Reminder','Time to take Tusca Syrup (10 ml) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-05 08:03:50','2026-04-05 08:03:50'),(138,5,'Appointment Requested','Your appointment request with Zawadul Hoque on Monday, April 6, 2026 at 09:00 has been submitted. Awaiting doctor approval.','info',0,'patient','appointment_created',10,'appointment','2026-04-05 08:24:03','2026-04-05 08:24:03'),(139,3,'New Appointment Request','You have a new appointment request for Monday, April 6, 2026 at 09:00. Please approve or decline.','info',0,'doctor','appointment_request_received',10,'appointment','2026-04-05 08:24:03','2026-04-05 08:24:03'),(140,5,'Medicine Reminder','Time to take Test Medicine (1 tablet) at 08:24.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-05 08:24:56','2026-04-05 08:24:56'),(141,5,'Appointment Approved ✓','Your appointment with Zawadul Hoque on Monday, April 6, 2026 has been approved.','success',0,'patient','appointment_approved',10,'appointment','2026-04-05 08:29:22','2026-04-05 08:29:22'),(142,5,'Appointment Started','Your appointment with Zawadul Hoque has started at 09:00. The doctor is now seeing you.','info',0,'patient','appointment_started',10,'appointment','2026-04-05 08:29:37','2026-04-05 08:29:37'),(143,3,'Appointment In Progress','Your appointment is now in progress.','info',0,'doctor','appointment_started',10,'appointment','2026-04-05 08:29:37','2026-04-05 08:29:37'),(144,5,'Medicine Reminder','Time to take Omidon (25) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-06 08:03:53','2026-04-06 08:03:53'),(145,5,'Medicine Reminder','Time to take  (Not specified) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-06 08:03:53','2026-04-06 08:03:53'),(146,5,'Medicine Reminder','Time to take Napa Extend (665 mg) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-06 08:03:53','2026-04-06 08:03:53'),(147,5,'Medicine Reminder','Time to take Azithromycin (500 mg) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-06 08:03:53','2026-04-06 08:03:53'),(148,5,'Medicine Reminder','Time to take Tusca Syrup (10 ml) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-06 08:03:53','2026-04-06 08:03:53'),(149,5,'Appointment Requested','Your appointment request with Zawadul Hoque on Monday, April 6, 2026 at 09:00 at Sheba Clinic has been submitted. Awaiting doctor approval.','info',0,'patient','appointment_created',11,'appointment','2026-04-06 16:09:14','2026-04-06 16:09:14'),(150,3,'New Appointment Request','You have a new appointment request for Monday, April 6, 2026 at 09:00. Please approve or decline.','info',0,'doctor','appointment_request_received',11,'appointment','2026-04-06 16:09:14','2026-04-06 16:09:14'),(151,1,'Appointment Requested','Your appointment request with Zawadul Hoque on Monday, April 6, 2026 at 09:00 at Sheba Clinic has been submitted. Awaiting doctor approval.','info',0,'patient','appointment_created',12,'appointment','2026-04-06 16:10:23','2026-04-06 16:10:23'),(152,3,'New Appointment Request','You have a new appointment request for Monday, April 6, 2026 at 09:00. Please approve or decline.','info',0,'doctor','appointment_request_received',12,'appointment','2026-04-06 16:10:23','2026-04-06 16:10:23'),(153,5,'Medicine Reminder','Time to take Omidon (25) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-07 08:01:04','2026-04-07 08:01:04'),(154,5,'Medicine Reminder','Time to take  (Not specified) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-07 08:01:04','2026-04-07 08:01:04'),(155,5,'Medicine Reminder','Time to take Napa Extend (665 mg) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-07 08:01:04','2026-04-07 08:01:04'),(156,5,'Medicine Reminder','Time to take Azithromycin (500 mg) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-07 08:01:04','2026-04-07 08:01:04'),(157,5,'Medicine Reminder','Time to take Tusca Syrup (10 ml) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-07 08:01:04','2026-04-07 08:01:04'),(158,1,'🚨 EMERGENCY ALERT TRIGGERED','Critial symptoms detected via AI Triage: . Emergency contacts have been flagged.','error',0,NULL,'EMERGENCY_TRIAGE',NULL,NULL,'2026-04-08 06:58:55','2026-04-08 06:58:55'),(159,5,'🚨 EMERGENCY ALERT TRIGGERED','Critial symptoms detected via AI Triage: . Emergency contacts have been flagged.','error',0,NULL,'EMERGENCY_TRIAGE',NULL,NULL,'2026-04-08 07:31:02','2026-04-08 07:31:02'),(160,5,'Medicine Reminder','Time to take Omidon (25) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-08 08:03:48','2026-04-08 08:03:48'),(161,5,'Medicine Reminder','Time to take  (Not specified) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-08 08:03:48','2026-04-08 08:03:48'),(162,5,'Medicine Reminder','Time to take Napa Extend (665 mg) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-08 08:03:48','2026-04-08 08:03:48'),(163,5,'Medicine Reminder','Time to take Tusca Syrup (10 ml) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-08 08:03:48','2026-04-08 08:03:48'),(164,5,'Medicine Reminder','Time to take Omidon (25) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-09 08:00:17','2026-04-09 08:00:17'),(165,5,'Medicine Reminder','Time to take  (Not specified) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-09 08:00:17','2026-04-09 08:00:17'),(166,5,'Medicine Reminder','Time to take Napa Extend (665 mg) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-09 08:00:17','2026-04-09 08:00:17'),(167,5,'Medicine Reminder','Time to take Tusca Syrup (10 ml) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-09 08:00:17','2026-04-09 08:00:17'),(168,5,'Medicine Reminder','Time to take Omidon (25) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-10 08:00:20','2026-04-10 08:00:20'),(169,5,'Medicine Reminder','Time to take  (Not specified) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-10 08:00:20','2026-04-10 08:00:20'),(170,5,'Medicine Reminder','Time to take Napa Extend (665 mg) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-10 08:00:20','2026-04-10 08:00:20'),(171,5,'Medicine Reminder','Time to take Tusca Syrup (10 ml) at 08:00.','info',0,'patient','medicine_reminder',NULL,'medicine','2026-04-10 08:00:20','2026-04-10 08:00:20'),(172,5,'Appointment Rescheduled','Your appointment with Kazi Tayaba Hoque Chaity has been rescheduled to Friday, April 17, 2026 at Evercare Hospital.','info',0,'patient','appointment_rescheduled',13,'appointment','2026-04-10 13:27:07','2026-04-10 13:27:07'),(173,4,'Appointment Rescheduled','An appointment has been rescheduled to Friday, April 17, 2026.','info',0,'doctor','appointment_rescheduled',13,'appointment','2026-04-10 13:27:07','2026-04-10 13:27:07'),(174,4,'Appointment Cancelled','An appointment on Friday, April 17, 2026 has been cancelled.','warning',0,'doctor','appointment_cancelled',13,'appointment','2026-04-10 14:05:37','2026-04-10 14:05:37'),(175,5,'🚨 AI EMERGENCY ALERT','Critical symptoms detected: severe heart pain, feeling of losing consciousness','error',0,NULL,NULL,NULL,NULL,'2026-04-10 15:02:53','2026-04-10 15:02:53');
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
  UNIQUE KEY `unique_patient_reminder_settings` (`patient_id`),
  CONSTRAINT `patient_reminder_settings_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_reminder_settings`
--

LOCK TABLES `patient_reminder_settings` WRITE;
/*!40000 ALTER TABLE `patient_reminder_settings` DISABLE KEYS */;
INSERT INTO `patient_reminder_settings` VALUES (1,1,'08:00','12:00','19:00',1,1,15,'2026-03-28 08:00:01','2026-03-28 08:00:01'),(2,2,'00:20','12:00','19:00',1,1,15,'2026-03-28 11:40:53','2026-03-29 18:18:38'),(3,3,'08:00','12:00','19:00',1,1,15,'2026-03-29 03:26:07','2026-03-29 03:26:07'),(4,4,'08:00','12:00','19:00',1,1,15,'2026-03-30 07:30:05','2026-03-30 07:30:05'),(5,5,'08:00','12:00','19:00',1,1,15,'2026-04-03 08:50:34','2026-04-03 08:50:34');
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
  `profile_image` varchar(500) DEFAULT NULL,
  `medical_documents` json DEFAULT NULL,
  `height` decimal(5,2) DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `blood_pressure` varchar(20) DEFAULT NULL,
  `pulse` int DEFAULT NULL,
  `chronic_conditions` text,
  `past_surgeries` text,
  `family_medical_history` text,
  `smoking_status` enum('never','former','current') DEFAULT NULL,
  `alcohol_consumption` enum('never','occasional','regular') DEFAULT NULL,
  `physical_activity` enum('sedentary','moderate','active') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES (1,1,'A+','Peanuts, Milk, Lactose','Md. Mozammel Hoque Bhuiyan','01820223007','CureNet','B-94853',NULL,NULL,'2026-03-28 07:59:45','2026-04-01 16:18:26','https://res.cloudinary.com/dfnaaukdq/image/upload/v1775060179/patient_profiles/tfht7i6yi66lrlancgwz.jpg','[{\"id\": \"1775052483216\", \"url\": \"https://res.cloudinary.com/dfnaaukdq/image/upload/v1775052482/patient_documents/mcfasa6uonnhzmdomaxl.pdf\", \"name\": \"Feet X ray\", \"type\": \"Lab Report\", \"fileName\": \"web report.pdf\", \"uploadDate\": \"2026-04-01T14:08:03.216Z\"}]',190.50,89.00,'110/80',70,NULL,NULL,NULL,'never','never','sedentary'),(2,5,'A+','Peanuts','Ahsanul Hoque','01834123393','Healtheco','Eco373838',NULL,NULL,'2026-03-28 11:40:32','2026-03-29 14:55:47','https://res.cloudinary.com/dfnaaukdq/image/upload/v1774794534/patient_profiles/kefawtcirzcojqmiwy5q.jpg','[{\"id\": \"1774796100535\", \"url\": \"https://res.cloudinary.com/dfnaaukdq/image/upload/v1774796099/patient_documents/naoizshbvcibwokxe28r.jpg\", \"name\": \"Nurology doctor\", \"type\": \"Prescription\", \"fileName\": \"Screenshot_20260322-002935.jpg\", \"uploadDate\": \"2026-03-29T14:55:00.535Z\"}, {\"id\": \"1774796147042\", \"url\": \"https://res.cloudinary.com/dfnaaukdq/image/upload/v1774796146/patient_documents/vqvyoqqlmvohheagwbcf.jpg\", \"name\": \"Nurology prescription\", \"type\": \"Prescription\", \"fileName\": \"IMG_20260322_011943_877.jpg\", \"uploadDate\": \"2026-03-29T14:55:47.042Z\"}]',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-29 03:25:48','2026-03-29 03:25:48',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,9,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-30 07:22:32','2026-03-30 07:22:32',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,11,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-03 08:36:57','2026-04-03 08:36:57',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
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
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `email_31` (`email`),
  UNIQUE KEY `email_32` (`email`),
  UNIQUE KEY `email_33` (`email`),
  UNIQUE KEY `email_34` (`email`),
  UNIQUE KEY `email_35` (`email`),
  UNIQUE KEY `email_36` (`email`),
  UNIQUE KEY `email_37` (`email`),
  UNIQUE KEY `email_38` (`email`),
  UNIQUE KEY `email_39` (`email`),
  UNIQUE KEY `email_40` (`email`),
  UNIQUE KEY `email_41` (`email`),
  UNIQUE KEY `email_42` (`email`),
  UNIQUE KEY `email_43` (`email`),
  UNIQUE KEY `email_44` (`email`),
  UNIQUE KEY `email_45` (`email`),
  UNIQUE KEY `email_46` (`email`),
  UNIQUE KEY `email_47` (`email`),
  UNIQUE KEY `email_48` (`email`),
  UNIQUE KEY `email_49` (`email`),
  UNIQUE KEY `email_50` (`email`),
  UNIQUE KEY `email_51` (`email`),
  UNIQUE KEY `email_52` (`email`),
  UNIQUE KEY `email_53` (`email`),
  UNIQUE KEY `email_54` (`email`),
  UNIQUE KEY `email_55` (`email`),
  UNIQUE KEY `email_56` (`email`),
  UNIQUE KEY `email_57` (`email`),
  UNIQUE KEY `email_58` (`email`),
  UNIQUE KEY `email_59` (`email`),
  UNIQUE KEY `email_60` (`email`),
  UNIQUE KEY `email_61` (`email`),
  UNIQUE KEY `email_62` (`email`),
  UNIQUE KEY `email_63` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'ahsanulhoque22701048@gmail.com','$2a$12$bkoE8b66rvTvH0ijVI4CYeALt0/5vo4b5SPyxFx/SEdY0cACBherS','Ahsanul','Hoque','+8801834123393','1985-03-28','male','123, Bajirao Road, Shukrawar Peth','patient',1,1,'https://res.cloudinary.com/dfnaaukdq/image/upload/v1775060179/patient_profiles/tfht7i6yi66lrlancgwz.jpg','2026-04-06 16:09:42',NULL,NULL,'2026-03-28 07:59:45','2026-04-06 16:09:42'),(2,'yousha948@gmail.com','$2a$12$9eO.HNduPFnx9DFxDKGiyeQ08xHrmuNVqDpkuMFqUGVwmyqMGjX2C','Yousha Shamim','Khan','01860143483','2003-12-07','male','South campus, University of Chittagong, Chittagong, Bangladesh ','admin',1,1,NULL,'2026-04-04 13:11:23',NULL,NULL,'2026-03-28 09:47:45','2026-04-04 13:11:23'),(3,'yousha125@gmail.com','$2a$12$fItJGTT.FgqHPoH4R2Mt7usMJvnxn4A1Fbg2LNbO0JfxA4ARBFsOa','Zawadul','Hoque','01799754367','1998-02-27','male','2no Gate moshjid goli, Chittagong, Bangladesh ','doctor',1,1,'https://res.cloudinary.com/dfnaaukdq/image/upload/v1774794453/doctor_profiles/pwofxd7vvqyajqdq8rxu.jpg','2026-04-08 07:01:01',NULL,NULL,'2026-03-28 09:54:59','2026-04-08 07:01:01'),(4,'22701007@std.cu.ac.bd','$2a$12$87Ucz0pPNqkQfwYmn2q/ieSyQLr/MrEQKBtPeMeTYBFc5mzl0co1C','Kazi Tayaba','Hoque Chaity','01634355753','1998-01-30','female','Sholokbohor, Chittagong, Bangladesh ','doctor',1,1,'https://res.cloudinary.com/dfnaaukdq/image/upload/v1774807449/doctor_profiles/ugi7yyag3lznyv3fbbve.jpg','2026-04-05 01:47:58',NULL,NULL,'2026-03-28 09:58:26','2026-04-05 01:47:58'),(5,'orovitasnimtabassum@gmail.com','$2a$12$.feQ9vpsOdLwFn/HeVlHOeZm7gj1Xf0On7WPXhd9lKq4KkikUWio2','Tasnim','Orovi','01606734873','2002-11-09','female','Chattogram\nOxygen','patient',1,1,'https://res.cloudinary.com/dfnaaukdq/image/upload/v1774794534/patient_profiles/kefawtcirzcojqmiwy5q.jpg','2026-04-10 16:46:33',NULL,NULL,'2026-03-28 11:40:32','2026-04-10 16:46:33'),(6,'ibrahimcsecu@gmail.com','$2a$12$O3iatCwJELyYJmJxX3kS0eFB748tODSWG8ecDNZP19a2TSyukSf8O','Md','Ibrahim','01733438430','2003-09-10','male','Chittagong','patient',1,0,NULL,'2026-03-29 03:26:05',NULL,NULL,'2026-03-29 03:25:48','2026-03-29 03:26:05'),(7,'ttasibulhoque@gmail.com','$2a$12$x09XsYYq2FjiHE9aM5DlueLLNNPUCn1ooD4Hk7197r2v7VIY9W4hy','Nurjahan','Tilka','01817161514','1999-11-09','female','Oxyzen, Chattogram','doctor',1,0,'https://res.cloudinary.com/dfnaaukdq/image/upload/v1774856411/doctor_profiles/oqmhl1qhouunperrp3p6.jpg','2026-03-30 09:22:14',NULL,NULL,'2026-03-30 07:11:51','2026-03-30 09:22:14'),(8,'tasibulhoqueavian4@gmail.com','$2a$12$wEQ45ngnuCA0b.cXmi6NZOS8OBUya/rvhj6QgjUJMeTFTQ3V6uIdW','Tashdid','Tahsin','01817161515','1998-11-09','male','GEC, Chattogram','doctor',1,0,'https://res.cloudinary.com/dfnaaukdq/image/upload/v1774856006/doctor_profiles/gyga72qozmoiqfkcxyrd.jpg','2026-03-30 09:03:49',NULL,NULL,'2026-03-30 07:18:49','2026-03-30 09:03:49'),(9,'ahsanulcsecu@gmail.com','$2a$12$HwL2MdP6Vo8HjibuU0I.EunDJ4lmKxaFXCobs9qNx.FIjXdejF1U2','Mobasshira','Anika','01817161513','1997-11-09','female','Sandwip, Chattogram','patient',1,0,NULL,'2026-04-02 04:43:13',NULL,NULL,'2026-03-30 07:22:32','2026-04-02 04:43:13'),(10,'bleh@gmail.com','$2a$12$KR3rr4Yb9VraZKMeUveeVuPm9B2LLdEw08ZIY3EMMpTX84rGXMaS.','YJ','Himel','+0123456789','2003-12-15','male','Battery Lane, Chattogram ','doctor',1,0,'https://res.cloudinary.com/dfnaaukdq/image/upload/v1774893198/doctor_profiles/khfs9mow41medsritbvz.jpg','2026-03-30 17:45:10',NULL,NULL,'2026-03-30 17:44:57','2026-04-03 04:57:18'),(11,'ratulahr124@gmail.com','$2a$12$627F.K237/HNeZrrg/CPn.gyy.TnL/US7YWsOaqe2AyhL/f4yVn0u','Shamim','Uddin','01834123393','2026-04-14','male',NULL,'patient',1,1,NULL,'2026-04-03 08:50:32',NULL,NULL,'2026-04-03 08:36:57','2026-04-03 08:50:32');
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

-- Dump completed on 2026-04-11  0:36:04
