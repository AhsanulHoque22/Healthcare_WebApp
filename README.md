# Healthcare Web Application

A comprehensive healthcare management system built with React, Node.js, Express, and MySQL. This application facilitates appointment management, medical records, and patient-doctor interactions.

## Features

### For Patients
- 📅 **Appointment Management**
  - Book appointments with doctors based on their chamber times
  - View, filter, and cancel appointments
  - Real-time appointment status updates
  - Serial number-based queue system

- 👤 **Profile Management**
  - Complete patient profile with medical information
  - Emergency contact details
  - Insurance information
  - Allergy tracking with multi-select dropdown

- 📋 **Medical Records**
  - View all medical records from consultations
  - Filter by record type (consultations, lab results, prescriptions, etc.)
  - Download medical records
  - Detailed record viewing

- 🔍 **Find Doctors**
  - Browse all registered doctors
  - View doctor profiles with qualifications, experience, and awards
  - See doctor chamber times and consultation fees
  - BMDC registration number verification

### For Doctors
- 📊 **Dashboard**
  - Real-time statistics (total appointments, today's appointments, completed, etc.)
  - Patient count tracking

- 📅 **Appointment Management**
  - View and manage appointment requests
  - Accept, reschedule, or decline appointment requests
  - Mark appointments as in-progress or completed
  - Filter appointments by status (requested, scheduled, in-progress, completed, cancelled)
  - Track appointment duration with timestamps

- 👥 **Patient History**
  - View all patients
  - Access comprehensive patient details
  - View patient medical records
  - Track appointment history

- 🩺 **Profile Management**
  - Complete doctor profile with professional details
  - Upload profile image
  - Set chamber times for each day
  - Manage qualifications, degrees, awards
  - Set consultation fees

### For Admin
- 📊 **System Overview**
  - Dashboard with system statistics
  - User management
  - Doctor verification

## Tech Stack

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **React Query** for data fetching and caching
- **React Hook Form** with Yup validation
- **Tailwind CSS** for styling
- **Heroicons** for icons
- **Axios** for API requests
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express
- **MySQL** database
- **Sequelize ORM** for database management
- **JWT** for authentication
- **bcrypt** for password hashing
- **Multer** for file uploads
- **Express Validator** for input validation
- **Helmet** for security headers
- **CORS** for cross-origin requests

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd healthcare-web-app
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
# Environment Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=healthcare_db
DB_USER=root
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Client Configuration
CLIENT_URL=http://localhost:3000
```

### 3. Database Setup

Create the MySQL database:

```sql
CREATE DATABASE healthcare_db;
```

Run migrations:

```bash
cd server
npx sequelize-cli db:migrate
```

### 4. Frontend Setup

```bash
cd client
npm install
```

## Running the Application

### Start the Backend Server

```bash
cd server
npm start
```

The backend server will run on `http://localhost:5000`

### Start the Frontend

```bash
cd client
npm start
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
healthcare-web-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context (Auth)
│   │   ├── pages/         # Page components
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── package.json
│
├── server/                # Express backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── migrations/       # Database migrations
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── uploads/         # File uploads directory
│   ├── index.js         # Entry point
│   └── package.json
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

### Appointments
- `GET /api/appointments` - Get appointments (role-based)
- `POST /api/appointments` - Create appointment (patient)
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id/approve` - Approve appointment (doctor)
- `PUT /api/appointments/:id/decline` - Decline appointment (doctor)
- `PUT /api/appointments/:id/start` - Start appointment (doctor)
- `PUT /api/appointments/:id/complete` - Complete appointment (doctor)

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/profile` - Get current doctor profile
- `PUT /api/doctors/profile` - Update doctor profile
- `POST /api/doctors/upload-image` - Upload profile image
- `GET /api/doctors/:id/dashboard/stats` - Get doctor statistics
- `GET /api/doctors/:id/patients` - Get doctor's patients

### Patients
- `GET /api/patients/profile` - Get current patient profile
- `PUT /api/patients/profile` - Update patient profile
- `GET /api/patients/:id/medical-records` - Get medical records
- `GET /api/patients/:id/dashboard/stats` - Get patient statistics

## Key Features Implementation

### Appointment System
- **Request-based system**: Patients request appointments, doctors approve/decline
- **Serial numbers**: Daily reset serial numbers for queue management
- **Time blocks**: Chamber-based appointment scheduling
- **Status workflow**: requested → scheduled → in_progress → completed
- **Timestamps**: Track start and completion times

### Real-time Updates
- React Query with automatic refetching (5-10 second intervals)
- Dashboard statistics update in real-time
- Appointment status changes reflected immediately

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation on all endpoints
- CORS configuration

## Demo Accounts

You can create demo accounts by registering through the application:

**Patient Account:**
- Register with role: "patient"

**Doctor Account:**
- Register with role: "doctor"
- Complete profile with BMDC registration number

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

For any queries or support, please contact the development team.

---

Built with ❤️ for better healthcare management