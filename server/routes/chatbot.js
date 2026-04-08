const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { authenticateToken } = require('../middleware/auth');

router.post('/message', authenticateToken, (req, res, next) => chatbotController.handleMessage(req, res, next));
router.post('/voice', authenticateToken, (req, res, next) => chatbotController.handleVoice(req, res, next));

module.exports = router;
