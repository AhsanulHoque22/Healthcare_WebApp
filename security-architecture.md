# Healthcare Security Architecture

## Security Overview
The healthcare application implements a **multi-layered security architecture** designed to protect sensitive medical data and ensure compliance with healthcare privacy regulations. The system follows **defense-in-depth** principles with security controls at every layer.

## Security Principles
- **Confidentiality**: Protect patient health information (PHI)
- **Integrity**: Ensure data accuracy and prevent unauthorized modifications
- **Availability**: Maintain system uptime and accessibility
- **Accountability**: Comprehensive audit trails for all actions
- **Least Privilege**: Minimal access rights for users and systems

## Authentication Architecture

### 1. JWT-Based Authentication
```javascript
// Token Structure
{
  "userId": 123,
  "role": "patient|doctor|admin",
  "iat": 1640995200,    // Issued at
  "exp": 1643587200     // Expires (30 days)
}

// Token Security Features
- Algorithm: HS256 (HMAC SHA-256)
- Secret Key: 256-bit cryptographically secure
- Expiration: 30 days (configurable)
- Refresh: Automatic on activity
```

### 2. Password Security
```javascript
// Password Hashing
const bcrypt = require('bcryptjs');
const saltRounds = 12;

// Password Requirements
- Minimum 6 characters
- Complexity validation on frontend
- Secure storage with bcrypt hashing
- Salt rounds: 12 (2^12 iterations)

// Password Reset Flow
1. User requests reset → Generate secure token
2. Token expires in 1 hour
3. Email sent with reset link
4. Token validated before password change
5. All sessions invalidated after reset
```

### 3. Multi-Factor Authentication (Future)
```
Planned Implementation:
- SMS-based OTP for doctors
- Email verification for sensitive actions
- TOTP (Time-based One-Time Password) support
- Backup codes for account recovery
```

## Authorization & Access Control

### 1. Role-Based Access Control (RBAC)
```javascript
// Role Hierarchy
Admin > Doctor > Patient

// Permission Matrix
const permissions = {
  patient: [
    'view_own_profile',
    'update_own_profile',
    'view_own_appointments',
    'book_appointments',
    'view_own_medical_records',
    'rate_doctors'
  ],
  doctor: [
    'view_own_profile',
    'update_own_profile',
    'view_assigned_appointments',
    'manage_appointments',
    'view_patient_records',
    'create_prescriptions',
    'order_lab_tests'
  ],
  admin: [
    'view_all_users',
    'manage_users',
    'view_system_stats',
    'manage_lab_tests',
    'verify_doctors',
    'access_audit_logs'
  ]
};
```

### 2. Resource-Level Authorization
```javascript
// Middleware Implementation
const authorizeResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    // Admin has access to all resources
    if (req.user.role === 'admin') {
      return next();
    }

    // Resource ownership validation
    const resourceId = req.params.id;
    const resource = await getResource(resourceType, resourceId);
    
    if (resource.userId === req.user.id) {
      return next();
    }
    
    return res.status(403).json({ 
      message: 'Access denied to this resource' 
    });
  };
};
```

### 3. API Endpoint Security
```javascript
// Route Protection Examples
router.get('/patients/:id/medical-records', 
  authenticateToken,
  authorizeRoles('patient', 'doctor', 'admin'),
  authorizeResourceAccess('patient'),
  getPatientRecords
);

router.post('/prescriptions',
  authenticateToken,
  authorizeRoles('doctor', 'admin'),
  validatePrescriptionData,
  createPrescription
);
```

## Data Protection

### 1. Data Encryption
```javascript
// Data at Rest
- Database: MySQL with TDE (Transparent Data Encryption)
- File Storage: AES-256 encryption for uploaded files
- Backups: Encrypted with separate keys

// Data in Transit
- HTTPS/TLS 1.3 for all communications
- Certificate pinning for mobile apps
- Secure WebSocket connections (WSS)

// Sensitive Field Encryption
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';

function encryptSensitiveData(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}
```

### 2. Personal Health Information (PHI) Protection
```javascript
// PHI Classification
const PHIFields = [
  'medicalHistory',
  'currentMedications',
  'allergies',
  'labResults',
  'diagnosis',
  'prescription',
  'symptoms'
];

// Data Masking for Logs
function maskPHI(data) {
  const masked = { ...data };
  PHIFields.forEach(field => {
    if (masked[field]) {
      masked[field] = '***MASKED***';
    }
  });
  return masked;
}
```

### 3. Data Retention & Deletion
```javascript
// Data Retention Policy
const retentionPolicies = {
  medicalRecords: '7 years',
  appointments: '3 years',
  auditLogs: '5 years',
  userSessions: '30 days',
  temporaryFiles: '24 hours'
};

// Secure Data Deletion
async function secureDelete(filePath) {
  // Overwrite file multiple times before deletion
  const buffer = crypto.randomBytes(1024);
  for (let i = 0; i < 3; i++) {
    await fs.writeFile(filePath, buffer);
  }
  await fs.unlink(filePath);
}
```

## Network Security

### 1. API Security
```javascript
// Rate Limiting
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// Strict Rate Limiting for Auth Endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true
});
```

### 2. Security Headers
```javascript
// Helmet.js Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "https:"],
      frameSrc: ["'self'", "meet.jit.si"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 3. CORS Configuration
```javascript
// Strict CORS Policy
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://healthcare-app.com',
      'https://app.healthcare-app.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Input Validation & Sanitization

### 1. Request Validation
```javascript
// Express Validator Implementation
const { body, validationResult } = require('express-validator');

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  
  body('password')
    .isLength({ min: 6 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must contain only letters'),
  
  body('phone')
    .optional()
    .isMobilePhone('bn-BD')
    .withMessage('Valid Bangladesh phone number required')
];
```

### 2. SQL Injection Prevention
```javascript
// Sequelize ORM with Parameterized Queries
const user = await User.findOne({
  where: {
    email: req.body.email // Automatically parameterized
  }
});

// Raw Query Protection (when needed)
const results = await sequelize.query(
  'SELECT * FROM users WHERE email = :email',
  {
    replacements: { email: userEmail },
    type: QueryTypes.SELECT
  }
);
```

### 3. XSS Prevention
```javascript
// Content Security Policy
// HTML Sanitization for user inputs
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

function sanitizeHTML(dirty) {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
}
```

## Audit & Monitoring

### 1. Audit Logging
```javascript
// Comprehensive Audit Trail
const auditLogger = {
  logUserAction: async (userId, action, resource, details) => {
    await AuditLog.create({
      userId,
      action,
      resource,
      details: JSON.stringify(details),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    });
  }
};

// Audit Events
- User login/logout
- Data access (view, create, update, delete)
- Permission changes
- Failed authentication attempts
- System configuration changes
```

### 2. Security Monitoring
```javascript
// Real-time Security Alerts
const securityMonitor = {
  // Multiple failed login attempts
  detectBruteForce: (ip, attempts) => {
    if (attempts > 5) {
      alertSecurity('Brute force detected', { ip, attempts });
      blockIP(ip, '1 hour');
    }
  },
  
  // Unusual access patterns
  detectAnomalousAccess: (userId, location, time) => {
    // Check for access from new locations
    // Detect off-hours access
    // Monitor bulk data access
  },
  
  // System health monitoring
  monitorSystemHealth: () => {
    // Database connection health
    // API response times
    // Error rates
    // Resource utilization
  }
};
```

## Compliance & Standards

### 1. Healthcare Compliance
```
Compliance Framework:
- HIPAA (Health Insurance Portability and Accountability Act)
- HITECH (Health Information Technology for Economic and Clinical Health)
- Local healthcare regulations (Bangladesh Medical & Dental Council)

Key Requirements:
- Patient consent for data processing
- Right to data portability
- Right to data deletion
- Breach notification procedures
- Regular security assessments
```

### 2. Data Privacy Rights
```javascript
// GDPR-style Data Rights Implementation
const dataRights = {
  // Right to Access
  exportUserData: async (userId) => {
    const userData = await User.findByPk(userId, {
      include: ['patientProfile', 'appointments', 'medicalRecords']
    });
    return sanitizeForExport(userData);
  },
  
  // Right to Deletion
  deleteUserData: async (userId) => {
    // Anonymize instead of delete for medical records
    await anonymizeUserData(userId);
    await User.update({ isActive: false }, { where: { id: userId } });
  },
  
  // Right to Rectification
  updateUserData: async (userId, updates) => {
    const validatedUpdates = validateUserUpdates(updates);
    await User.update(validatedUpdates, { where: { id: userId } });
    auditLogger.logUserAction(userId, 'DATA_UPDATE', 'user', updates);
  }
};
```

## Incident Response

### 1. Security Incident Response Plan
```
Phase 1: Detection & Analysis
- Automated monitoring alerts
- Manual security reviews
- User reports

Phase 2: Containment
- Isolate affected systems
- Preserve evidence
- Prevent further damage

Phase 3: Eradication & Recovery
- Remove threats
- Patch vulnerabilities
- Restore services

Phase 4: Post-Incident
- Document lessons learned
- Update security measures
- Notify stakeholders if required
```

### 2. Breach Notification
```javascript
// Automated Breach Detection
const breachDetection = {
  detectDataBreach: async (event) => {
    const severity = assessBreachSeverity(event);
    
    if (severity === 'HIGH') {
      // Immediate notification
      await notifySecurityTeam(event);
      await notifyLegalTeam(event);
      
      // Regulatory notification (within 72 hours)
      scheduleRegulatoryNotification(event);
    }
    
    // Log all potential breaches
    await logSecurityIncident(event);
  }
};
```

## Security Testing

### 1. Automated Security Testing
```javascript
// Security Test Suite
const securityTests = {
  // Authentication tests
  testAuthenticationBypass: () => {
    // Test for auth bypass vulnerabilities
  },
  
  // Authorization tests
  testPrivilegeEscalation: () => {
    // Test for privilege escalation
  },
  
  // Input validation tests
  testSQLInjection: () => {
    // Test for SQL injection vulnerabilities
  },
  
  // Session management tests
  testSessionSecurity: () => {
    // Test session fixation, hijacking
  }
};
```

### 2. Penetration Testing
```
Regular Security Assessments:
- Quarterly automated vulnerability scans
- Annual penetration testing by third-party
- Code security reviews for major releases
- Infrastructure security assessments

Testing Scope:
- Web application security
- API security
- Database security
- Network security
- Social engineering resistance
```
