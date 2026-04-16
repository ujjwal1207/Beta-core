import React, { useState, useEffect } from 'react';
import { X, CreditCard, Loader } from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../services/api';

const PaymentModal = ({ isOpen, onClose, call, onPaymentSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState(null);

  useEffect(() => {
    if (isOpen && call) {
      createPaymentOrder();
    }
  }, [isOpen, call]);

  const createPaymentOrder = async () => {
    try {
      const response = await api.post('/calls/bookings/create-payment-order', {
        booking_id: call.id
      });
      setRazorpayOrder(response.data);
    } catch (error) {
      console.error('Failed to create payment order:', error);
      // Handle error - maybe show toast
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
      document.head.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!razorpayOrder) return;

    setIsProcessing(true);

    // Load Razorpay script dynamically if not already loaded
    if (!window.Razorpay) {
      try {
        await loadRazorpayScript();
      } catch (error) {
        console.error('Failed to load Razorpay script:', error);
        setIsProcessing(false);
        return;
      }
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SDGZjrifBkwgRk', // Use test key
      amount: razorpayOrder.price * 100, // Razorpay expects amount in paisa
      currency: 'INR',
      name: 'Listenlink',
      description: `Consultation with ${call.host?.full_name || 'Professional'}`,
      order_id: razorpayOrder.razorpay_order_id,
      handler: async function (response) {
        try {
          // Verify payment on backend
          const verifyResponse = await api.post('/calls/bookings/verify-payment', {
            booking_id: call.id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });

          onPaymentSuccess(verifyResponse.data);
          onClose();
        } catch (error) {
          console.error('Payment verification failed:', error);
          // Handle verification error
        } finally {
          setIsProcessing(false);
        }
      },
      prefill: {
        name: '', // Could populate with user name
        email: '', // Could populate with user email
        contact: '' // Could populate with user phone
      },
      theme: {
        color: '#6366f1' // Indigo color to match the app theme
      },
      modal: {
        ondismiss: function() {
          setIsProcessing(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (!isOpen || !call) return null;

  const callPrice = call.price || 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-extrabold text-slate-800">Complete Payment</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Call Details */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-indigo-700 mb-3">Consultation Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Super Listener:</span>
                <span className="font-medium text-slate-700">{call.host_name || 'Professional'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Duration:</span>
                <span className="font-medium text-slate-700">{call.duration_minutes || 30} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Rate:</span>
                <span className="font-medium text-slate-700">₹{call.pay_rate_per_min || 0}/session</span>
              </div>
              <hr className="border-indigo-200 my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-indigo-700">Total Amount:</span>
                <span className="text-indigo-700">₹{callPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="font-bold text-slate-700 mb-3">Payment Method</h3>
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-indigo-600" />
                <div>
                  <div className="font-medium text-slate-700">Credit/Debit Card</div>
                  <div className="text-sm text-slate-500">Secure payment via Razorpay</div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
            <div className="text-sm text-green-700">
              <span className="font-medium">🔒 Secure Payment</span>
              <br />
              Your payment is processed securely. Full refund if call is cancelled by the Super Listener.
            </div>
          </div>

          {/* Payment Button */}
          <Button 
            onClick={handlePayment} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay ₹{callPrice.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;