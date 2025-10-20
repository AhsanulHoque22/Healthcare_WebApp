const express = require('express');
const { User } = require('../models');
const { Op } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all users (for dropdowns, etc.)
const getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    
    const whereClause = { isActive: true };
    if (role) whereClause.role = role;
    
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      limit: 50
    });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

// Update user role (admin only)
const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.update({ role });
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        userId: user.id,
        email: user.email,
        newRole: role
      }
    });
  } catch (error) {
    next(error);
  }
};

// All routes require authentication
router.use(authenticateToken);

router.get('/', getUsers);
router.put('/:userId/role', updateUserRole);

module.exports = router;
