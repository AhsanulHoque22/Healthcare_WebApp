# Healthcare API Specification

## Base Configuration
- **Base URL**: `http://localhost:5000/api`
- **Protocol**: HTTP/HTTPS
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer Token
- **Rate Limiting**: 100 requests per 15 minutes per IP

## Authentication

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Token Format
```json
{
  "userId": 123,
  "role": "patient|doctor|admin",
  "iat": 1640995200,
  "exp": 1643587200
}
```

## API Endpoints

### 1. Authentication Endpoints

#### POST /auth/register
**Purpose**: Register a new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "01712345678",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "address": "123 Main St, Dhaka",
  "role": "patient"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 123,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/login
**Purpose**: Authenticate user and get access token

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 123,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET /auth/profile
**Purpose**: Get current user profile
**Authentication**: Required

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "patientProfile": {
        "id": 456,
        "bloodType": "A+",
        "allergies": "Penicillin"
      }
    }
  }
}
```

### 2. Appointment Endpoints

#### POST /appointments
**Purpose**: Create a new appointment request
**Authentication**: Required (Patient/Admin)

**Request Body**:
```json
{
  "patientId": 123,
  "doctorId": 456,
  "appointmentDate": "2025-01-15",
  "timeBlock": "09:00-12:00",
  "type": "in_person",
  "reason": "Regular checkup",
  "symptoms": "Mild headache"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Appointment request created successfully",
  "data": {
    "appointment": {
      "id": 789,
      "patientId": 123,
      "doctorId": 456,
      "appointmentDate": "2025-01-15",
      "status": "requested",
      "serialNumber": null
    }
  }
}
```

#### GET /appointments
**Purpose**: Get appointments based on user role
**Authentication**: Required

**Query Parameters**:
- `status`: Filter by status (requested, scheduled, completed, etc.)
- `date`: Filter by date (YYYY-MM-DD)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": 789,
        "appointmentDate": "2025-01-15",
        "appointmentTime": "09:00:00",
        "status": "scheduled",
        "serialNumber": 1,
        "patient": {
          "id": 123,
          "user": {
            "firstName": "John",
            "lastName": "Doe"
          }
        },
        "doctor": {
          "id": 456,
          "user": {
            "firstName": "Dr. Smith",
            "lastName": "Johnson"
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### PUT /appointments/:id/approve
**Purpose**: Approve appointment request
**Authentication**: Required (Doctor/Admin)

**Response (200)**:
```json
{
  "success": true,
  "message": "Appointment approved successfully",
  "data": {
    "appointment": {
      "id": 789,
      "status": "scheduled",
      "serialNumber": 1
    }
  }
}
```

### 3. Doctor Endpoints

#### GET /doctors
**Purpose**: Get list of all doctors
**Authentication**: Required

**Query Parameters**:
- `department`: Filter by department
- `search`: Search by name
- `verified`: Filter verified doctors only

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "id": 456,
        "user": {
          "firstName": "Dr. Smith",
          "lastName": "Johnson",
          "profileImage": "/uploads/doctor-profile-123.jpg"
        },
        "department": "Cardiology",
        "experience": 10,
        "consultationFee": 1500.00,
        "rating": 4.5,
        "totalReviews": 120,
        "isVerified": true,
        "chamberTimes": {
          "monday": ["09:00-12:00", "14:00-17:00"],
          "tuesday": ["09:00-12:00"]
        }
      }
    ]
  }
}
```

#### GET /doctors/profile
**Purpose**: Get current doctor's profile
**Authentication**: Required (Doctor)

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "doctor": {
      "id": 456,
      "bmdcRegistrationNumber": "BMDC-12345",
      "department": "Cardiology",
      "experience": 10,
      "education": "MBBS, MD",
      "consultationFee": 1500.00,
      "bio": "Experienced cardiologist...",
      "chamberTimes": {
        "monday": ["09:00-12:00", "14:00-17:00"]
      },
      "user": {
        "firstName": "Dr. Smith",
        "lastName": "Johnson"
      }
    }
  }
}
```

### 4. Patient Endpoints

#### GET /patients/profile
**Purpose**: Get current patient's profile
**Authentication**: Required (Patient)

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "patient": {
      "id": 123,
      "bloodType": "A+",
      "allergies": "Penicillin",
      "emergencyContact": "Jane Doe",
      "emergencyPhone": "01712345679",
      "insuranceProvider": "Delta Life",
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  }
}
```

#### GET /patients/:id/medical-records
**Purpose**: Get patient's medical records
**Authentication**: Required (Patient/Doctor/Admin)

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 789,
        "recordType": "consultation",
        "title": "Regular Checkup",
        "description": "Patient visited for routine checkup",
        "diagnosis": "Healthy",
        "recordDate": "2025-01-15",
        "doctor": {
          "user": {
            "firstName": "Dr. Smith",
            "lastName": "Johnson"
          }
        }
      }
    ]
  }
}
```

### 5. Prescription Endpoints

#### POST /prescriptions
**Purpose**: Create prescription for appointment
**Authentication**: Required (Doctor)

**Request Body**:
```json
{
  "appointmentId": 789,
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "schedule": "1+0+1",
      "timing": "after meal",
      "duration": 7,
      "notes": "Take with water"
    }
  ],
  "symptoms": ["Headache", "Fever"],
  "diagnosis": [
    {
      "condition": "Viral Fever",
      "date": "2025-01-15"
    }
  ],
  "testsOrdered": [
    {
      "testName": "Blood Test",
      "description": "Complete Blood Count",
      "status": "pending"
    }
  ],
  "recommendations": {
    "exercises": "Light walking",
    "followUpInstructions": ["Take rest", "Drink plenty of water"],
    "emergencyInstructions": ["Contact doctor if fever persists"]
  }
}
```

### 6. Lab Test Endpoints

#### GET /lab-tests
**Purpose**: Get available lab tests
**Authentication**: Required

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "tests": [
      {
        "id": 1,
        "name": "Complete Blood Count",
        "category": "Blood Test",
        "price": 800.00,
        "sampleType": "Blood",
        "reportDeliveryTime": 24
      }
    ]
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **429**: Rate Limit Exceeded
- **500**: Internal Server Error

## Validation Rules

### Email Validation
- Must be valid email format
- Required for registration
- Unique across system

### Password Validation
- Minimum 6 characters
- Required for registration and login

### Phone Validation
- 10-15 digits only
- Optional field
- Can be used for login

### Date Validation
- ISO 8601 format (YYYY-MM-DD)
- Future dates for appointments
- Past dates for birth dates

## Rate Limiting
- **Global**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes per IP
- **File Upload**: 10 uploads per hour per user

## File Upload Specifications

### Profile Images
- **Max Size**: 5MB
- **Formats**: JPG, PNG, GIF
- **Dimensions**: Max 2048x2048px
- **Path**: `/uploads/doctor-profile-{timestamp}-{random}.{ext}`

### Lab Reports
- **Max Size**: 10MB
- **Formats**: PDF, JPG, PNG
- **Path**: `/uploads/lab-results/{orderId}/`

## Additional API Endpoints

### 7. Medicine Management

#### POST /medicines
**Purpose**: Add medicine to patient's regimen
**Authentication**: Required (Doctor)

**Request Body**:
```json
{
  "patientId": 123,
  "prescriptionId": 456,
  "medicineName": "Paracetamol",
  "dosage": "500mg",
  "frequency": "1+0+1",
  "duration": 7,
  "instructions": "Take after meal",
  "startDate": "2025-01-15",
  "totalQuantity": 21
}
```

#### GET /medicines/patient/:patientId
**Purpose**: Get patient's current medicines
**Authentication**: Required (Patient/Doctor)

### 8. Notification Endpoints

#### GET /notifications
**Purpose**: Get user notifications
**Authentication**: Required

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 123,
        "title": "Appointment Reminder",
        "message": "You have an appointment tomorrow at 9 AM",
        "type": "appointment",
        "isRead": false,
        "createdAt": "2025-01-14T10:00:00Z"
      }
    ]
  }
}
```

#### PUT /notifications/:id/read
**Purpose**: Mark notification as read
**Authentication**: Required

### 9. Payment Endpoints

#### POST /bkash/create-payment
**Purpose**: Create bKash payment
**Authentication**: Required

**Request Body**:
```json
{
  "amount": 1500.00,
  "prescriptionId": 456,
  "intent": "sale"
}
```

### 10. Rating Endpoints

#### POST /ratings
**Purpose**: Rate a doctor after appointment
**Authentication**: Required (Patient)

**Request Body**:
```json
{
  "appointmentId": 789,
  "doctorId": 456,
  "rating": 5,
  "review": "Excellent service and care"
}
```

## WebSocket Events

### Real-time Notifications
- **Connection**: `ws://localhost:5000`
- **Authentication**: JWT token in query parameter

### Events
- `notification`: New notification received
- `appointment_update`: Appointment status changed
- `medicine_reminder`: Medicine reminder alert

## Security Headers

### Required Headers
```
Helmet Security Headers:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
```

### CORS Configuration
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```
