const axios = require('axios');

class BkashService {
  constructor() {
    // bKash API Configuration
    this.baseURL = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';
    this.username = process.env.BKASH_USERNAME || 'sandboxTokenizedUser02';
    this.password = process.env.BKASH_PASSWORD || 'sandboxTokenizedUser02@12345';
    this.appKey = process.env.BKASH_APP_KEY || '4f6o0cjiki2rfm34kfdadl1eqq';
    this.appSecret = process.env.BKASH_APP_SECRET || '2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b';
    this.callbackURL = process.env.BKASH_CALLBACK_URL || 'http://localhost:3000/payment/callback';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get access token from bKash
  async getAccessToken() {
    try {
      // Check if token is still valid
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const response = await axios.post(`${this.baseURL}/tokenized/checkout/token/grant`, {
        app_key: this.appKey,
        app_secret: this.appSecret
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'username': this.username,
          'password': this.password
        }
      });

      if (response.data && response.data.id_token) {
        this.accessToken = response.data.id_token;
        // Token expires in 1 hour, set expiry 5 minutes earlier for safety
        this.tokenExpiry = Date.now() + (55 * 60 * 1000);
        console.log('bKash access token obtained successfully');
        return this.accessToken;
      } else {
        throw new Error('Failed to get bKash access token');
      }
    } catch (error) {
      console.error('Error getting bKash access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with bKash');
    }
  }

  // Create payment
  async createPayment(amount, orderId, customerInfo = {}) {
    try {
      console.log('Creating bKash payment with:', { amount, orderId, customerInfo });
      
      // Mock implementation for now
      const mockPaymentId = `BKASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Mock bKash payment created:', mockPaymentId);
      return {
        success: true,
        paymentID: mockPaymentId,
        bkashURL: `https://sandbox.pay.bka.sh/v1.2.0-beta/checkout/payment?paymentID=${mockPaymentId}`,
        callbackURL: this.callbackURL
      };
    } catch (error) {
      console.error('Error creating bKash payment:', error);
      throw new Error('Failed to create bKash payment');
    }
  }

  // Execute payment (after user completes payment)
  async executePayment(paymentID) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.post(`${this.baseURL}/tokenized/checkout/payment/execute/${paymentID}`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token,
          'X-APP-Key': this.appKey
        }
      });

      if (response.data) {
        console.log('bKash payment executed:', response.data);
        return {
          success: true,
          transactionStatus: response.data.transactionStatus,
          paymentID: response.data.paymentID,
          trxID: response.data.trxID,
          amount: response.data.amount,
          currency: response.data.currency,
          paymentExecuteTime: response.data.paymentExecuteTime,
          customerMsisdn: response.data.customerMsisdn
        };
      } else {
        throw new Error('Failed to execute bKash payment');
      }
    } catch (error) {
      console.error('Error executing bKash payment:', error.response?.data || error.message);
      throw new Error('Failed to execute bKash payment');
    }
  }

  // Query payment status
  async queryPayment(paymentID) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/tokenized/checkout/payment/query/${paymentID}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token,
          'X-APP-Key': this.appKey
        }
      });

      if (response.data) {
        return {
          success: true,
          transactionStatus: response.data.transactionStatus,
          paymentID: response.data.paymentID,
          trxID: response.data.trxID,
          amount: response.data.amount,
          currency: response.data.currency,
          paymentExecuteTime: response.data.paymentExecuteTime
        };
      } else {
        throw new Error('Failed to query bKash payment');
      }
    } catch (error) {
      console.error('Error querying bKash payment:', error.response?.data || error.message);
      throw new Error('Failed to query bKash payment');
    }
  }

  // Refund payment
  async refundPayment(paymentID, amount, reason = 'Customer request') {
    try {
      const token = await this.getAccessToken();
      
      const refundData = {
        paymentID: paymentID,
        amount: amount.toString(),
        reason: reason,
        sku: 'healthcare-refund'
      };

      const response = await axios.post(`${this.baseURL}/tokenized/checkout/payment/refund`, refundData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token,
          'X-APP-Key': this.appKey
        }
      });

      if (response.data) {
        return {
          success: true,
          refundTransactionID: response.data.refundTransactionID,
          originalTrxID: response.data.originalTrxID,
          refundAmount: response.data.refundAmount,
          refundReason: response.data.refundReason
        };
      } else {
        throw new Error('Failed to refund bKash payment');
      }
    } catch (error) {
      console.error('Error refunding bKash payment:', error.response?.data || error.message);
      throw new Error('Failed to refund bKash payment');
    }
  }
}

module.exports = BkashService;
