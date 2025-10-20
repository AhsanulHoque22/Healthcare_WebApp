const { BkashPayment, User, Prescription, LabTestOrder } = require('../models');
const BkashService = require('../services/bkashService');

// Create bKash payment
const createPayment = async (req, res, next) => {
  try {
    const { amount, orderType, orderId, testName, customerInfo } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!amount || !orderType || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Amount, order type, and order ID are required'
      });
    }

    // Validate amount
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Generate unique order ID
    const uniqueOrderId = `${orderType.toUpperCase()}-${orderId}-${Date.now()}`;

    // Create bKash payment
    const bkashService = new BkashService();
    const bkashResponse = await bkashService.createPayment(
      parseFloat(amount),
      uniqueOrderId,
      customerInfo
    );

    if (!bkashResponse.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create bKash payment'
      });
    }

    // Save payment record to database
    const bkashPayment = await BkashPayment.create({
      paymentId: bkashResponse.paymentID,
      orderId: uniqueOrderId,
      amount: parseFloat(amount),
      status: 'PENDING',
      userId: userId,
      prescriptionId: orderType === 'prescription' ? (parseInt(orderId) || null) : null,
      labTestOrderId: orderType === 'lab_order' ? (parseInt(orderId) || null) : null,
      testName: testName || null
    });

    res.status(200).json({
      success: true,
      message: 'Payment created successfully',
      data: {
        paymentId: bkashResponse.paymentID,
        bkashURL: bkashResponse.bkashURL,
        callbackURL: bkashResponse.callbackURL,
        orderId: uniqueOrderId,
        amount: parseFloat(amount)
      }
    });

  } catch (error) {
    console.error('Error creating bKash payment:', error);
    next(error);
  }
};

// Execute payment (callback from bKash)
const executePayment = async (req, res, next) => {
  try {
    const { paymentID } = req.query;

    if (!paymentID) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    // Find payment record
    const bkashPayment = await BkashPayment.findOne({
      where: { paymentId: paymentID }
    });

    if (!bkashPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Execute payment with bKash
    const bkashService = new BkashService();
    const bkashResponse = await bkashService.executePayment(paymentID);

    if (!bkashResponse.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to execute bKash payment'
      });
    }

    // Update payment record
    const updateData = {
      trxId: bkashResponse.trxID,
      transactionStatus: bkashResponse.transactionStatus,
      customerMsisdn: bkashResponse.customerMsisdn,
      paymentExecuteTime: bkashResponse.paymentExecuteTime,
      callbackData: bkashResponse
    };

    // Determine final status
    if (bkashResponse.transactionStatus === 'Completed') {
      updateData.status = 'COMPLETED';
    } else if (bkashResponse.transactionStatus === 'Failed') {
      updateData.status = 'FAILED';
    } else {
      updateData.status = 'PENDING';
    }

    await bkashPayment.update(updateData);

    // If payment is completed, update the related lab payment
    if (updateData.status === 'COMPLETED') {
      await updateRelatedPayment(bkashPayment);
    }

    res.status(200).json({
      success: true,
      message: 'Payment executed successfully',
      data: {
        paymentId: bkashResponse.paymentID,
        transactionStatus: bkashResponse.transactionStatus,
        trxId: bkashResponse.trxID,
        amount: bkashResponse.amount,
        status: updateData.status
      }
    });

  } catch (error) {
    console.error('Error executing bKash payment:', error);
    next(error);
  }
};

// Query payment status
const queryPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    // Find payment record
    const bkashPayment = await BkashPayment.findOne({
      where: { paymentId: paymentId },
      include: [
        { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }
      ]
    });

    if (!bkashPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Query payment status from bKash
    const bkashService = new BkashService();
    const bkashResponse = await bkashService.queryPayment(paymentId);

    if (bkashResponse.success) {
      // Update local record if status changed
      if (bkashResponse.transactionStatus !== bkashPayment.transactionStatus) {
        const updateData = {
          trxId: bkashResponse.trxID,
          transactionStatus: bkashResponse.transactionStatus,
          paymentExecuteTime: bkashResponse.paymentExecuteTime
        };

        if (bkashResponse.transactionStatus === 'Completed') {
          updateData.status = 'COMPLETED';
        } else if (bkashResponse.transactionStatus === 'Failed') {
          updateData.status = 'FAILED';
        }

        await bkashPayment.update(updateData);

        // If payment is completed, update the related lab payment
        if (updateData.status === 'COMPLETED') {
          await updateRelatedPayment(bkashPayment);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        paymentId: bkashPayment.paymentId,
        orderId: bkashPayment.orderId,
        amount: bkashPayment.amount,
        status: bkashPayment.status,
        transactionStatus: bkashPayment.transactionStatus,
        trxId: bkashPayment.trxId,
        paymentExecuteTime: bkashPayment.paymentExecuteTime,
        testName: bkashPayment.testName,
        user: bkashPayment.user
      }
    });

  } catch (error) {
    console.error('Error querying bKash payment:', error);
    next(error);
  }
};

// Get user's bKash payments
const getUserPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    const payments = await BkashPayment.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [
        { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        payments: payments.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(payments.count / limit),
          totalRecords: payments.count,
          hasNext: parseInt(page) * parseInt(limit) < payments.count,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error getting user payments:', error);
    next(error);
  }
};

// Refund payment (admin only)
const refundPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Find payment record
    const bkashPayment = await BkashPayment.findOne({
      where: { paymentId: paymentId }
    });

    if (!bkashPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    if (bkashPayment.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    const refundAmount = amount || bkashPayment.amount;

    // Process refund with bKash
    const bkashService = new BkashService();
    const bkashResponse = await bkashService.refundPayment(
      paymentId,
      refundAmount,
      reason || 'Customer request'
    );

    if (!bkashResponse.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to process refund'
      });
    }

    // Update payment record
    await bkashPayment.update({
      refundTransactionId: bkashResponse.refundTransactionID,
      refundAmount: refundAmount,
      refundReason: reason || 'Customer request',
      status: refundAmount >= bkashPayment.amount ? 'REFUNDED' : 'PARTIAL_REFUND'
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        paymentId: bkashPayment.paymentId,
        refundTransactionId: bkashResponse.refundTransactionID,
        refundAmount: refundAmount,
        status: bkashPayment.status
      }
    });

  } catch (error) {
    console.error('Error refunding payment:', error);
    next(error);
  }
};

// Helper function to update related lab payment
const updateRelatedPayment = async (bkashPayment) => {
  try {
    const { LabPayment } = require('../models');

    if (bkashPayment.prescriptionId) {
      // Update prescription lab payment
      await LabPayment.create({
        prescriptionId: bkashPayment.prescriptionId,
        testName: bkashPayment.testName,
        amount: bkashPayment.amount,
        paymentMethod: 'bkash',
        transactionId: bkashPayment.trxId,
        status: 'completed',
        processedBy: bkashPayment.userId,
        notes: `bKash Payment ID: ${bkashPayment.paymentId}`
      });
    } else if (bkashPayment.labTestOrderId) {
      // Update regular lab order payment
      await LabPayment.create({
        orderId: bkashPayment.labTestOrderId,
        amount: bkashPayment.amount,
        paymentMethod: 'bkash',
        transactionId: bkashPayment.trxId,
        status: 'completed',
        processedBy: bkashPayment.userId,
        notes: `bKash Payment ID: ${bkashPayment.paymentId}`
      });
    }

    console.log('Related lab payment updated successfully');
  } catch (error) {
    console.error('Error updating related lab payment:', error);
  }
};

module.exports = {
  createPayment,
  executePayment,
  queryPayment,
  getUserPayments,
  refundPayment
};
