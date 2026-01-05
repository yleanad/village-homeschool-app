import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [familyProfile, setFamilyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: true
        });
        setUser(response.data);
        
        // Fetch family profile
        try {
          const profileResponse = await axios.get(`${API_URL}/api/family/profile`, {
            withCredentials: true
          });
          setFamilyProfile(profileResponse.data);
        } catch (e) {
          // No profile yet
          setFamilyProfile(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, 
      { email, password },
      { withCredentials: true }
    );
    
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    
    // Fetch family profile
    try {
      const profileResponse = await axios.get(`${API_URL}/api/family/profile`, {
        headers: { Authorization: `Bearer ${newToken}` },
        withCredentials: true
      });
      setFamilyProfile(profileResponse.data);
    } catch (e) {
      setFamilyProfile(null);
    }
    
    return userData;
  };

  const register = async (name, email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      name,
      email,
      password
    });
    
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    
    return userData;
  };

  const loginWithGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleGoogleCallback = async (sessionId) => {
    const response = await axios.post(`${API_URL}/api/auth/google/session`, {}, {
      headers: { 'X-Session-ID': sessionId },
      withCredentials: true
    });
    
    setUser(response.data);
    
    // Fetch family profile
    try {
      const profileResponse = await axios.get(`${API_URL}/api/family/profile`, {
        withCredentials: true
      });
      setFamilyProfile(profileResponse.data);
    } catch (e) {
      setFamilyProfile(null);
    }
    
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      // Ignore errors
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setFamilyProfile(null);
  };

  const updateFamilyProfile = (profile) => {
    setFamilyProfile(profile);
  };

  const refreshUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      familyProfile,
      loading,
      token,
      login,
      register,
      loginWithGoogle,
      handleGoogleCallback,
      logout,
      updateFamilyProfile,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
