import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface BkashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: any | null;
  onPaymentSuccess: () => void;
}

const BkashPaymentModal: React.FC<BkashPaymentModalProps> = ({
  isOpen,
  onClose,
  test,
  onPaymentSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const handlePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    if (!phoneNumber) {
      setError('Please enter your bKash phone number');
      return;
    }

    // Check if total paid amount (including current payment) meets 50% requirement
    const amount = parseFloat(paymentAmount);
    const totalPaidAfterPayment = (test.paidAmount || 0) + amount;
    const minimumRequired = test.price * 0.5;
    
    if (totalPaidAfterPayment < minimumRequired) {
      setError(`Minimum 50% payment required for sample processing. You need to pay at least ৳${(minimumRequired - (test.paidAmount || 0)).toFixed(2)} more.`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create bKash payment
      const response = await axios.post('/bkash/create', {
        amount: parseFloat(paymentAmount),
        orderType: 'prescription',
        orderId: test?.prescriptionId,
        testName: test?.name,
        customerInfo: {
          phone: phoneNumber
        }
      });

      if (response.data.success) {
        // Redirect to bKash payment page
        window.open(response.data.data.bkashURL, '_blank');
        
        // Show success message
        onPaymentSuccess();
        onClose();
        
        // Reset form
        setPaymentAmount('');
        setPhoneNumber('');
      } else {
        setError(response.data.message || 'Failed to create bKash payment');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !test) return null;

  const maxAmount = test.price - (test.paidAmount || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pay with bKash</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Test Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{test?.name || 'Lab Test'}</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Total Amount: ৳{test?.price || 0}</p>
              <p>Paid Amount: ৳{test?.paidAmount || 0}</p>
              <p>Due Amount: ৳{test?.dueAmount || test?.price || 0}</p>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount (৳)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                max={maxAmount}
                min="1"
                step="0.01"
                placeholder={`Maximum: ৳${maxAmount}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum amount: ৳{maxAmount}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                bKash Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your bKash registered mobile number
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* bKash Info */}
            <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">b</span>
                </div>
                <span className="font-medium text-gray-900">bKash Payment</span>
              </div>
              <p className="text-xs text-gray-600">
                You will be redirected to bKash payment gateway to complete your payment securely.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isLoading || !paymentAmount || !phoneNumber}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white rounded-md transition-colors flex items-center space-x-2"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{isLoading ? 'Processing...' : 'Pay with bKash'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BkashPaymentModal;
