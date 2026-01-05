import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, User, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await register(name, email, password);
      toast.success('Welcome to Village Friends! Let\'s set up your family profile.');
      navigate('/onboarding');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    if (password.length === 0) return { text: '', color: '' };
    if (password.length < 6) return { text: 'Too short', color: 'text-red-500' };
    if (password.length < 8) return { text: 'Weak', color: 'text-yellow-500' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { text: 'Strong', color: 'text-green-500' };
    }
    return { text: 'Medium', color: 'text-yellow-500' };
  };

  return (
    <div className="min-h-screen bg-[#F4F1DE] flex">
      {/* Left side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1763771056917-188ad0f3479a?crop=entropy&cs=srgb&fm=jpg&q=85"
          alt="Family picnic"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#264653]/80 to-transparent" />
        <div className="absolute bottom-12 right-12 max-w-md text-right">
          <h2 className="font-fraunces text-3xl font-bold text-white mb-4">
            Join hundreds of families building community together
          </h2>
          <div className="flex justify-end gap-4">
            <div className="text-center">
              <p className="font-fraunces text-3xl font-bold text-white">500+</p>
              <p className="text-white/80 text-sm">Families</p>
            </div>
            <div className="text-center">
              <p className="font-fraunces text-3xl font-bold text-white">1000+</p>
              <p className="text-white/80 text-sm">Meetups</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-8" data-testid="logo">
            <div className="w-10 h-10 rounded-full bg-[#C8907A] flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-fraunces text-xl font-semibold text-[#264653]">Village Friends</span>
          </Link>

          <h1 className="font-fraunces text-3xl font-bold text-[#264653] mb-2">Create Your Account</h1>
          <p className="text-[#5F6F75] mb-8">Start your 14-day free trial today</p>

          <Button
            type="button"
            variant="outline"
            className="w-full mb-6 h-12 border-[#E0E0E0] hover:bg-[#F4F1DE]"
            onClick={loginWithGoogle}
            data-testid="google-signup-btn"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E0E0E0]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#F4F1DE] text-[#5F6F75]">or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-[#264653]">Full Name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5F6F75]" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 bg-white border-[#E0E0E0] focus:ring-[#2A9D8F] focus:border-[#2A9D8F]"
                  placeholder="Your name"
                  required
                  data-testid="name-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-[#264653]">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5F6F75]" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-white border-[#E0E0E0] focus:ring-[#2A9D8F] focus:border-[#2A9D8F]"
                  placeholder="you@example.com"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-[#264653]">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5F6F75]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-white border-[#E0E0E0] focus:ring-[#2A9D8F] focus:border-[#2A9D8F]"
                  placeholder="At least 6 characters"
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6F75] hover:text-[#264653]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && (
                <p className={`text-sm mt-1 ${passwordStrength().color}`}>
                  Password strength: {passwordStrength().text}
                </p>
              )}
            </div>

            <div className="bg-[#C8907A]/15 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-[#264653]">Your free trial includes:</p>
              {["14 days of full access", "Connect with unlimited families", "Create and join events", "Direct messaging"].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#5F6F75]">
                  <Check className="w-4 h-4 text-[#C8907A]" />
                  {item}
                </div>
              ))}
            </div>

            <Button
              type="submit"
              className="w-full h-12 btn-primary"
              disabled={loading}
              data-testid="register-submit-btn"
            >
              {loading ? (
                <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white" />
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-[#5F6F75]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#C8907A] font-semibold hover:underline" data-testid="login-link">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-[#5F6F75]">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
