import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Home, MapPin, Calendar, MessageCircle, Users, Settings, LogOut, Menu, X, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

const DashboardLayout = ({ children }) => {
  const { user, familyProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isPremium = user?.subscription_status === 'active';

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/discover', icon: MapPin, label: 'Discover' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/groups', icon: Users, label: 'Groups', premium: true },
    { path: '/calendar', icon: Calendar, label: 'My Calendar' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/profile', icon: Users, label: 'My Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#F4F1DE]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E0E0E0] h-16 px-4 flex items-center justify-between">
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="p-2 text-[#264653]"
          data-testid="mobile-menu-btn"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#C8907A] flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="font-fraunces font-semibold text-[#264653]">Village Friends</span>
        </Link>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 bg-white border-r border-[#E0E0E0] ${sidebarOpen ? 'open' : ''}`}>
        <div className="p-6">
          {/* Mobile Close Button */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 text-[#264653]"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8" data-testid="sidebar-logo">
            <div className="w-10 h-10 rounded-full bg-[#C8907A] flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-fraunces text-xl font-semibold text-[#264653]">Village Friends</span>
          </Link>

          {/* User Info */}
          <div className="mb-6 p-3 bg-[#F4F1DE] rounded-xl">
            <div className="flex items-center gap-3">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#2A9D8F] flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#264653] text-sm truncate">{user?.name}</p>
                {familyProfile && (
                  <p className="text-xs text-[#5F6F75] truncate">{familyProfile.family_name}</p>
                )}
              </div>
            </div>
            {user?.subscription_status === 'trial' && (
              <div className="mt-2">
                <span className="badge-trial text-xs">Free Trial</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-[#C8907A] text-white'
                    : 'text-[#5F6F75] hover:bg-[#F5F3EE] hover:text-[#2C3E50]'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.premium && !isPremium && (
                  <Crown className="w-4 h-4 text-[#D4B896]" />
                )}
              </Link>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="absolute bottom-6 left-6 right-6">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-[#5F6F75] hover:text-[#E76F51] hover:bg-[#E76F51]/10"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Log Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content - Add bottom padding for mobile nav */}
      <main className="lg:ml-64 pt-20 lg:pt-8 pb-24 md:pb-8 px-4 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
