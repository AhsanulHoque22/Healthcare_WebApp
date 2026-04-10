const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { authenticateToken } = require('../middleware/auth');

router.post('/message',  authenticateToken, (req, res, next) => chatbotController.handleMessage(req, res, next));
router.post('/voice',    authenticateToken, (req, res, next) => chatbotController.handleVoice(req, res, next));
router.get('/history',   authenticateToken, (req, res, next) => chatbotController.getHistory(req, res, next));
router.get('/sessions',  authenticateToken, (req, res, next) => chatbotController.getSessions(req, res, next));
router.delete('/history',authenticateToken, (req, res, next) => chatbotController.clearHistory(req, res, next));

module.exports = router;
