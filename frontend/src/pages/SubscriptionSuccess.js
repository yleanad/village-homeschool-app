import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    pollPaymentStatus();
  }, [sessionId]);

  const pollPaymentStatus = async () => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('pending');
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/api/subscription/status/${sessionId}`,
        { withCredentials: true }
      );

      if (response.data.payment_status === 'paid') {
        setStatus('success');
        refreshUser();
        return;
      } else if (response.data.status === 'expired') {
        setStatus('error');
        return;
      }

      // Continue polling
      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, pollInterval);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1DE] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg"
      >
        {status === 'checking' && (
          <>
            <div className="spinner mx-auto mb-6" />
            <h1 className="font-fraunces text-2xl font-bold text-[#264653] mb-2">
              Processing Your Payment
            </h1>
            <p className="text-[#5F6F75]">Please wait while we confirm your subscription...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[#2A9D8F]" />
            </div>
            <h1 className="font-fraunces text-2xl font-bold text-[#264653] mb-2">
              Welcome to Village Friends!
            </h1>
            <p className="text-[#5F6F75] mb-6">
              Your subscription is now active. Start connecting with homeschool families in your area!
            </p>
            <Link to="/dashboard">
              <Button className="btn-primary w-full" data-testid="go-to-dashboard-btn">
                Go to Dashboard
              </Button>
            </Link>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-20 h-20 rounded-full bg-[#E9C46A]/20 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-[#E9C46A]" />
            </div>
            <h1 className="font-fraunces text-2xl font-bold text-[#264653] mb-2">
              Payment Being Processed
            </h1>
            <p className="text-[#5F6F75] mb-6">
              Your payment is being processed. This may take a moment. Check your email for confirmation.
            </p>
            <Link to="/dashboard">
              <Button className="btn-secondary w-full">
                Go to Dashboard
              </Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 rounded-full bg-[#E76F51]/10 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-[#E76F51]" />
            </div>
            <h1 className="font-fraunces text-2xl font-bold text-[#264653] mb-2">
              Something Went Wrong
            </h1>
            <p className="text-[#5F6F75] mb-6">
              We couldn't confirm your payment. Please try again or contact support.
            </p>
            <div className="space-y-3">
              <Link to="/pricing">
                <Button className="btn-primary w-full">
                  Try Again
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default SubscriptionSuccess;
