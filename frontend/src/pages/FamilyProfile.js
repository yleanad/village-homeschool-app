import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, MessageCircle, Calendar, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const FamilyProfile = () => {
  const { familyId } = useParams();
  const { familyProfile: myProfile } = useAuth();
  const navigate = useNavigate();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meetupOpen, setMeetupOpen] = useState(false);
  const [meetupData, setMeetupData] = useState({
    proposed_date: '',
    proposed_time: '',
    location: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFamily();
  }, [familyId]);

  const fetchFamily = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/family/${familyId}`, {
        withCredentials: true
      });
      setFamily(response.data);
    } catch (error) {
      console.error('Error fetching family:', error);
      toast.error('Family not found');
      navigate('/discover');
    } finally {
      setLoading(false);
    }
  };

  const sendMeetupRequest = async () => {
    if (!meetupData.proposed_date || !meetupData.proposed_time || !meetupData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/meetup-requests`, {
        target_family_id: familyId,
        ...meetupData
      }, { withCredentials: true });
      
      toast.success('Meetup request sent!');
      setMeetupOpen(false);
      setMeetupData({ proposed_date: '', proposed_time: '', location: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </DashboardLayout>
    );
  }

  if (!family) return null;

  const isOwnProfile = myProfile?.family_id === familyId;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto" data-testid="family-profile-page">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 text-[#5F6F75]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-[#2A9D8F]/10 to-[#E9C46A]/10">
            <div className="flex items-start gap-4">
              {family.profile_picture ? (
                <img
                  src={family.profile_picture}
                  alt={family.family_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#2A9D8F] flex items-center justify-center text-white text-2xl font-bold">
                  {family.family_name?.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <h1 className="font-fraunces text-2xl font-bold text-[#264653]">
                  {family.family_name}
                </h1>
                <p className="text-[#5F6F75] flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {family.city}, {family.state}
                  {family.distance && ` · ${family.distance} miles away`}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="badge-verified">
                    <Shield className="w-3 h-3" />
                    Verified Family
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {!isOwnProfile && (
              <div className="flex gap-3 mt-6">
                <Link to={`/messages/${familyId}`} className="flex-1">
                  <Button variant="outline" className="w-full" data-testid="message-btn">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </Link>
                <Dialog open={meetupOpen} onOpenChange={setMeetupOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 btn-primary" data-testid="request-meetup-btn">
                      <Calendar className="w-4 h-4 mr-2" />
                      Request Meetup
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-fraunces text-xl">
                        Request a Meetup with {family.family_name}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Proposed Date *</Label>
                          <Input
                            type="date"
                            value={meetupData.proposed_date}
                            onChange={(e) => setMeetupData(prev => ({ ...prev, proposed_date: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Proposed Time *</Label>
                          <Input
                            type="time"
                            value={meetupData.proposed_time}
                            onChange={(e) => setMeetupData(prev => ({ ...prev, proposed_time: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Location *</Label>
                        <Input
                          value={meetupData.location}
                          onChange={(e) => setMeetupData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="e.g., Central Park Playground"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Message (optional)</Label>
                        <Textarea
                          value={meetupData.message}
                          onChange={(e) => setMeetupData(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Introduce your family and what you'd like to do..."
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={sendMeetupRequest}
                        className="w-full btn-primary"
                        disabled={submitting}
                      >
                        {submitting ? 'Sending...' : 'Send Request'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Bio */}
          {family.bio && (
            <div className="p-6 sm:p-8 border-b border-[#E0E0E0]">
              <h3 className="font-semibold text-[#264653] mb-2">About Us</h3>
              <p className="text-[#5F6F75]">{family.bio}</p>
            </div>
          )}

          {/* Kids */}
          {family.kids?.length > 0 && (
            <div className="p-6 sm:p-8 border-b border-[#E0E0E0]">
              <h3 className="font-semibold text-[#264653] mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2A9D8F]" />
                Children ({family.kids.length})
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {family.kids.map((kid, index) => (
                  <div key={index} className="p-3 bg-[#F4F1DE] rounded-lg">
                    <p className="font-medium text-[#264653]">{kid.name}</p>
                    <p className="text-sm text-[#5F6F75]">{kid.age} years old</p>
                    {kid.interests?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {kid.interests.map((interest, i) => (
                          <span key={i} className="text-xs bg-white px-2 py-0.5 rounded text-[#5F6F75]">
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {family.interests?.length > 0 && (
            <div className="p-6 sm:p-8">
              <h3 className="font-semibold text-[#264653] mb-3">Family Interests</h3>
              <div className="flex flex-wrap gap-2">
                {family.interests.map((interest, index) => (
                  <span key={index} className="interest-tag">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default FamilyProfile;
