const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          association: 'patientProfile',
          required: false
        },
        {
          association: 'doctorProfile',
          required: false
        }
      ]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    // Add patientId and doctorId for easy access
    if (user.patientProfile) {
      user.patientId = user.patientProfile.id;
    }
    if (user.doctorProfile) {
      user.doctorId = user.doctorProfile.id;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

const authorizeResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const { User, Patient, Doctor } = require('../models');
      
      if (req.user.role === 'admin') {
        return next();
      }

      let resource;
      const resourceId = req.params.id || req.params.patientId || req.params.doctorId;

      if (resourceType === 'patient') {
        resource = await Patient.findByPk(resourceId);
        if (resource && resource.userId === req.user.id) {
          return next();
        }
      } else if (resourceType === 'doctor') {
        resource = await Doctor.findByPk(resourceId);
        if (resource && resource.userId === req.user.id) {
          return next();
        }
      }

      return res.status(403).json({ message: 'Access denied to this resource' });
    } catch (error) {
      return res.status(500).json({ message: 'Authorization error' });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeResourceAccess
};
