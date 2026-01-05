import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, MessageCircle, Plus, Bell, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const { user, familyProfile } = useAuth();
  const [nearbyFamilies, setNearbyFamilies] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [meetupRequests, setMeetupRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [familiesRes, eventsRes, requestsRes] = await Promise.all([
        axios.get(`${API_URL}/api/families/nearby?radius=25`, { withCredentials: true }),
        axios.get(`${API_URL}/api/events/my`, { withCredentials: true }),
        axios.get(`${API_URL}/api/meetup-requests`, { withCredentials: true })
      ]);
      
      setNearbyFamilies(familiesRes.data.slice(0, 4));
      setUpcomingEvents([...eventsRes.data.hosted, ...eventsRes.data.attending].slice(0, 3));
      setMeetupRequests(requestsRes.data.incoming.filter(r => r.status === 'pending'));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrialDaysLeft = () => {
    if (!user?.trial_ends_at) return 0;
    const trialEnd = new Date(user.trial_ends_at);
    const now = new Date();
    const diff = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  if (!familyProfile) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-20 h-20 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-[#2A9D8F]" />
          </div>
          <h1 className="font-fraunces text-3xl font-bold text-[#264653] mb-4">
            Welcome to Village Friends!
          </h1>
          <p className="text-[#5F6F75] mb-8">
            Let's set up your family profile so you can start connecting with other homeschool families in your area.
          </p>
          <Link to="/onboarding">
            <Button className="btn-primary" data-testid="setup-profile-btn">
              Set Up Your Family Profile
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="dashboard">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#264653]">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-[#5F6F75] mt-1">
              Here's what's happening in your village
            </p>
          </div>
          <Link to="/events/create">
            <Button className="btn-primary" data-testid="create-event-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Trial/Subscription Status */}
          {user?.subscription_status === 'trial' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#E9C46A]/20 rounded-xl p-4 border border-[#E9C46A]/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#E9C46A]/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#b8860b]" />
                </div>
                <div>
                  <p className="text-sm text-[#b8860b] font-medium">Free Trial</p>
                  <p className="text-lg font-bold text-[#264653]">{getTrialDaysLeft()} days left</p>
                </div>
              </div>
              <Link to="/pricing" className="text-sm text-[#2A9D8F] font-medium mt-2 inline-block hover:underline">
                Upgrade now →
              </Link>
            </motion.div>
          )}

          {/* Verification Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 border border-[#E0E0E0]"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${user?.id_verified ? 'bg-[#2A9D8F]/10' : 'bg-[#E76F51]/10'}`}>
                <Shield className={`w-5 h-5 ${user?.id_verified ? 'text-[#2A9D8F]' : 'text-[#E76F51]'}`} />
              </div>
              <div>
                <p className="text-sm text-[#5F6F75]">Verification</p>
                <p className="font-semibold text-[#264653]">
                  {user?.id_verified ? 'Verified' : 'Pending'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Nearby Families Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 border border-[#E0E0E0]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2A9D8F]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#2A9D8F]" />
              </div>
              <div>
                <p className="text-sm text-[#5F6F75]">Nearby Families</p>
                <p className="font-semibold text-[#264653]">{nearbyFamilies.length}+ found</p>
              </div>
            </div>
          </motion.div>

          {/* Pending Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-4 border border-[#E0E0E0]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E76F51]/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#E76F51]" />
              </div>
              <div>
                <p className="text-sm text-[#5F6F75]">Meetup Requests</p>
                <p className="font-semibold text-[#264653]">{meetupRequests.length} pending</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Nearby Families */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-fraunces text-xl font-semibold text-[#264653]">
                  Families Near You
                </h2>
                <Link to="/discover" className="text-[#2A9D8F] text-sm font-medium hover:underline">
                  View all →
                </Link>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="spinner" />
                </div>
              ) : nearbyFamilies.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-[#5F6F75]/30 mx-auto mb-3" />
                  <p className="text-[#5F6F75]">No families found nearby yet</p>
                  <p className="text-sm text-[#5F6F75]/70">Check back soon or expand your search radius</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {nearbyFamilies.map((family, index) => (
                    <motion.div
                      key={family.family_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link to={`/family/${family.family_id}`} data-testid={`family-card-${index}`}>
                        <div className="family-card p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center text-[#2A9D8F] font-semibold">
                              {family.family_name?.charAt(0) || 'F'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-[#264653] truncate">
                                {family.family_name}
                              </h3>
                              <p className="text-sm text-[#5F6F75] flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {family.city}, {family.state}
                                {family.distance && ` · ${family.distance}mi`}
                              </p>
                              {family.kids?.length > 0 && (
                                <p className="text-xs text-[#5F6F75] mt-1">
                                  {family.kids.length} {family.kids.length === 1 ? 'child' : 'children'}
                                </p>
                              )}
                            </div>
                          </div>
                          {family.interests?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {family.interests.slice(0, 3).map((interest, i) => (
                                <span key={i} className="interest-tag text-xs">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-fraunces text-xl font-semibold text-[#264653]">
                  Upcoming Events
                </h2>
                <Link to="/events" className="text-[#2A9D8F] text-sm font-medium hover:underline">
                  View all →
                </Link>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="spinner" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-[#5F6F75]/30 mx-auto mb-3" />
                  <p className="text-[#5F6F75]">No upcoming events</p>
                  <Link to="/events/create" className="text-sm text-[#2A9D8F] font-medium hover:underline">
                    Create one →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event, index) => (
                    <motion.div
                      key={event.event_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link to={`/events/${event.event_id}`} data-testid={`event-card-${index}`}>
                        <div className="p-3 rounded-lg border border-[#E0E0E0] hover:border-[#2A9D8F] transition-colors">
                          <div className={`calendar-event ${event.event_type} mb-2`}>
                            {event.event_type}
                          </div>
                          <h4 className="font-semibold text-[#264653] text-sm">{event.title}</h4>
                          <p className="text-xs text-[#5F6F75] mt-1">
                            {new Date(event.event_date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })} at {event.event_time}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 mt-6">
              <h2 className="font-fraunces text-xl font-semibold text-[#264653] mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Link to="/discover" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F4F1DE] transition-colors" data-testid="quick-discover">
                  <MapPin className="w-5 h-5 text-[#2A9D8F]" />
                  <span className="text-[#264653]">Find Families</span>
                </Link>
                <Link to="/events" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F4F1DE] transition-colors" data-testid="quick-events">
                  <Calendar className="w-5 h-5 text-[#2A9D8F]" />
                  <span className="text-[#264653]">Browse Events</span>
                </Link>
                <Link to="/messages" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F4F1DE] transition-colors" data-testid="quick-messages">
                  <MessageCircle className="w-5 h-5 text-[#2A9D8F]" />
                  <span className="text-[#264653]">Messages</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
