const express = require('express');
const router = express.Router();
const bkashController = require('../controllers/bkashController');
const { authenticateToken } = require('../middleware/auth');

// bKash payment routes
router.post('/create', authenticateToken, bkashController.createPayment);
router.post('/execute', authenticateToken, bkashController.executePayment);
router.get('/query/:paymentId', authenticateToken, bkashController.queryPayment);
router.get('/user-payments', authenticateToken, bkashController.getUserPayments);
router.post('/refund/:paymentId', authenticateToken, bkashController.refundPayment);

module.exports = router;
