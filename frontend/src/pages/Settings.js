import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Shield, CreditCard, Bell, Plus, X, Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const INTERESTS = [
  'Nature & Outdoors', 'Arts & Crafts', 'Music', 'Science', 'Reading',
  'Sports', 'Cooking', 'Gardening', 'Animals', 'Travel', 'History',
  'Math', 'Languages', 'Technology', 'Drama/Theater', 'Dance'
];

const Settings = () => {
  const { user, familyProfile, updateFamilyProfile, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    family_name: familyProfile?.family_name || '',
    bio: familyProfile?.bio || '',
    city: familyProfile?.city || '',
    state: familyProfile?.state || '',
    zip_code: familyProfile?.zip_code || '',
    interests: familyProfile?.interests || [],
    kids: familyProfile?.kids || [],
    search_radius: familyProfile?.search_radius || 25
  });

  const [newKid, setNewKid] = useState({ name: '', age: '' });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const response = await axios.post(
            `${API_URL}/api/family/profile/photo`,
            { image_data: reader.result },
            { withCredentials: true }
          );
          
          // Update the family profile with new photo URL
          updateFamilyProfile({
            ...familyProfile,
            profile_picture: response.data.photo_url
          });
          
          toast.success('Profile photo updated!');
        } catch (error) {
          toast.error(error.response?.data?.detail || 'Failed to upload photo');
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to read image file');
      setUploadingPhoto(false);
    }
  };

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const addKid = () => {
    if (!newKid.name || !newKid.age) return;
    setFormData(prev => ({
      ...prev,
      kids: [...prev.kids, { ...newKid, age: parseInt(newKid.age) }]
    }));
    setNewKid({ name: '', age: '' });
  };

  const removeKid = (index) => {
    setFormData(prev => ({
      ...prev,
      kids: prev.kids.filter((_, i) => i !== index)
    }));
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_URL}/api/family/profile`, formData, {
        withCredentials: true
      });
      updateFamilyProfile(response.data);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const submitIdVerification = async () => {
    try {
      await axios.post(`${API_URL}/api/verification/submit-id`, {}, { withCredentials: true });
      toast.success('ID verification submitted! We\'ll review it shortly.');
      refreshUser();
    } catch (error) {
      toast.error('Failed to submit verification');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto" data-testid="settings-page">
        <h1 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#264653] mb-6">
          Settings
        </h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border border-[#E0E0E0]">
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#2A9D8F] data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="verification" className="data-[state=active]:bg-[#2A9D8F] data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              Verification
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-[#2A9D8F] data-[state=active]:text-white">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscription
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-[#E0E0E0] p-6"
            >
              <h2 className="font-fraunces text-xl font-semibold text-[#264653] mb-6">
                Family Profile
              </h2>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <Label>Family Name</Label>
                  <Input
                    value={formData.family_name}
                    onChange={(e) => handleChange('family_name', e.target.value)}
                    className="mt-1"
                    data-testid="settings-family-name"
                  />
                </div>

                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    className="mt-1"
                    data-testid="settings-bio"
                  />
                </div>

                {/* Location */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>ZIP Code</Label>
                    <Input
                      value={formData.zip_code}
                      onChange={(e) => handleChange('zip_code', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Kids */}
                <div>
                  <Label className="mb-2 block">Children</Label>
                  {formData.kids.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {formData.kids.map((kid, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-[#F4F1DE] rounded">
                          <span>{kid.name} ({kid.age} years)</span>
                          <button onClick={() => removeKid(index)} className="text-[#E76F51]">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={newKid.name}
                      onChange={(e) => setNewKid(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Name"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={newKid.age}
                      onChange={(e) => setNewKid(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Age"
                      className="w-20"
                    />
                    <Button type="button" onClick={addKid} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <Label className="mb-2 block">Family Interests</Label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1 rounded-full text-sm transition ${
                          formData.interests.includes(interest)
                            ? 'bg-[#2A9D8F] text-white'
                            : 'bg-[#F4F1DE] text-[#264653]'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={saveProfile} className="btn-primary" disabled={loading} data-testid="save-profile-btn">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-[#E0E0E0] p-6 space-y-6"
            >
              <h2 className="font-fraunces text-xl font-semibold text-[#264653]">
                Verification Status
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F4F1DE] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user?.email_verified ? 'bg-[#2A9D8F]/10' : 'bg-[#E76F51]/10'}`}>
                      <Shield className={`w-5 h-5 ${user?.email_verified ? 'text-[#2A9D8F]' : 'text-[#E76F51]'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-[#264653]">Email Verification</p>
                      <p className="text-sm text-[#5F6F75]">{user?.email}</p>
                    </div>
                  </div>
                  <span className={`badge-${user?.email_verified ? 'verified' : 'trial'}`}>
                    {user?.email_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F4F1DE] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user?.id_verified ? 'bg-[#2A9D8F]/10' : 'bg-[#E76F51]/10'}`}>
                      <Shield className={`w-5 h-5 ${user?.id_verified ? 'text-[#2A9D8F]' : 'text-[#E76F51]'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-[#264653]">ID Verification</p>
                      <p className="text-sm text-[#5F6F75]">Verify your identity for trust</p>
                    </div>
                  </div>
                  {user?.id_verified ? (
                    <span className="badge-verified">Verified</span>
                  ) : (
                    <Button onClick={submitIdVerification} size="sm" className="bg-[#2A9D8F]">
                      Verify Now
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#2A9D8F]/10 rounded-lg">
                <h4 className="font-medium text-[#264653] mb-2">Why Verify?</h4>
                <ul className="text-sm text-[#5F6F75] space-y-1">
                  <li>• Build trust with other families</li>
                  <li>• Get a verified badge on your profile</li>
                  <li>• Access all community features</li>
                </ul>
              </div>
            </motion.div>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-[#E0E0E0] p-6 space-y-6"
            >
              <h2 className="font-fraunces text-xl font-semibold text-[#264653]">
                Subscription
              </h2>

              <div className="p-4 bg-[#F4F1DE] rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#264653]">Current Plan</p>
                    <p className="text-2xl font-bold text-[#2A9D8F] font-fraunces">
                      {user?.subscription_status === 'active' ? 'Active Member' : 'Free Trial'}
                    </p>
                  </div>
                  {user?.subscription_status === 'trial' && user?.trial_ends_at && (
                    <div className="text-right">
                      <p className="text-sm text-[#5F6F75]">Trial ends</p>
                      <p className="font-medium text-[#264653]">
                        {new Date(user.trial_ends_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {user?.subscription_status === 'trial' && (
                <Link to="/pricing">
                  <Button className="w-full btn-primary" data-testid="upgrade-btn">
                    Upgrade Now
                  </Button>
                </Link>
              )}

              {user?.subscription_status === 'active' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5F6F75]">Plan</span>
                    <span className="font-medium text-[#264653]">
                      {user?.subscription_plan === 'annual' ? 'Annual' : 'Monthly'}
                    </span>
                  </div>
                  {user?.subscription_ends_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#5F6F75]">Renews</span>
                      <span className="font-medium text-[#264653]">
                        {new Date(user.subscription_ends_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
