import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

const AuthCallback = () => {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      try {
        // Extract session_id from URL hash
        const hash = window.location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (!sessionIdMatch) {
          toast.error('Authentication failed: No session ID');
          navigate('/login');
          return;
        }

        const sessionId = sessionIdMatch[1];
        
        // Exchange session_id for user data
        await handleGoogleCallback(sessionId);
        
        toast.success('Welcome to Village Friends!');
        
        // Clear the hash and redirect
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/dashboard', { replace: true });
        
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      }
    };

    processCallback();
  }, [handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen bg-[#F4F1DE] flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-[#264653] font-medium">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
