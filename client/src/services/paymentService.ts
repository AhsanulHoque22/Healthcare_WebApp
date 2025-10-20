// Payment Gateway Integration Service
// This is a simplified implementation for demonstration purposes
// In production, you would integrate with actual payment gateways

export interface PaymentRequest {
  amount: number;
  orderId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  paymentMethod: 'bkash' | 'bank_transfer';
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  gatewayResponse?: any;
}

// Simulated bKash Payment Gateway
export const processBkashPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate payment processing
  const success = Math.random() > 0.1; // 90% success rate for demo
  
  if (success) {
    return {
      success: true,
      transactionId: `BK${Date.now()}${Math.floor(Math.random() * 1000)}`,
      message: 'Payment successful via bKash',
      gatewayResponse: {
        gateway: 'bkash',
        status: 'completed',
        amount: request.amount,
        currency: 'BDT',
        timestamp: new Date().toISOString()
      }
    };
  } else {
    return {
      success: false,
      message: 'Payment failed. Please try again.',
      gatewayResponse: {
        gateway: 'bkash',
        status: 'failed',
        error: 'Insufficient balance or network error'
      }
    };
  }
};

// Simulated Bank Transfer Payment Gateway
export const processBankPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Simulate payment processing
  const success = Math.random() > 0.05; // 95% success rate for demo
  
  if (success) {
    return {
      success: true,
      transactionId: `BT${Date.now()}${Math.floor(Math.random() * 1000)}`,
      message: 'Payment successful via Bank Transfer',
      gatewayResponse: {
        gateway: 'bank_transfer',
        status: 'completed',
        amount: request.amount,
        currency: 'BDT',
        timestamp: new Date().toISOString(),
        bankReference: `REF${Math.floor(Math.random() * 1000000)}`
      }
    };
  } else {
    return {
      success: false,
      message: 'Bank transfer failed. Please check your account details.',
      gatewayResponse: {
        gateway: 'bank_transfer',
        status: 'failed',
        error: 'Invalid account or insufficient funds'
      }
    };
  }
};

// Main payment processor
export const processPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  try {
    switch (request.paymentMethod) {
      case 'bkash':
        return await processBkashPayment(request);
      case 'bank_transfer':
        return await processBankPayment(request);
      default:
        return {
          success: false,
          message: 'Unsupported payment method'
        };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Payment processing error. Please try again.',
      gatewayResponse: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
};

// Payment status checker (for polling payment status)
export const checkPaymentStatus = async (transactionId: string): Promise<{
  status: 'pending' | 'completed' | 'failed';
  message: string;
}> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate status check
  const statuses = ['pending', 'completed', 'failed'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)] as 'pending' | 'completed' | 'failed';
  
  return {
    status: randomStatus,
    message: `Payment ${randomStatus}`
  };
};

// Get supported payment methods
export const getSupportedPaymentMethods = () => {
  return [
    {
      id: 'bkash',
      name: 'bKash',
      description: 'Pay with bKash mobile banking',
      icon: '💳',
      processingTime: '2-3 minutes',
      fees: '1.5% + ৳5'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank account transfer',
      icon: '🏦',
      processingTime: '5-10 minutes',
      fees: '৳10 flat fee'
    }
  ];
};

// Validate payment amount
export const validatePaymentAmount = (amount: number): { valid: boolean; message?: string } => {
  if (amount <= 0) {
    return { valid: false, message: 'Amount must be greater than 0' };
  }
  
  if (amount < 10) {
    return { valid: false, message: 'Minimum payment amount is ৳10' };
  }
  
  if (amount > 100000) {
    return { valid: false, message: 'Maximum payment amount is ৳100,000' };
  }
  
  return { valid: true };
};

// Format currency for display
export const formatCurrency = (amount: number): string => {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
