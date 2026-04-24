const express = require('express');
const router = express.Router();
const escalationController = require('../controllers/escalationController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/',     authenticateToken, (req, res, next) => escalationController.createEscalation(req, res, next));
router.get('/',      authenticateToken, authorizeRoles('admin'), (req, res, next) => escalationController.getEscalations(req, res, next));
router.patch('/:id', authenticateToken, authorizeRoles('admin'), (req, res, next) => escalationController.updateEscalation(req, res, next));

module.exports = router;
