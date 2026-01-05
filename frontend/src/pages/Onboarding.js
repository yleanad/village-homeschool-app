import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MapPin, Heart, Plus, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const INTERESTS = [
  'Nature & Outdoors', 'Arts & Crafts', 'Music', 'Science', 'Reading',
  'Sports', 'Cooking', 'Gardening', 'Animals', 'Travel', 'History',
  'Math', 'Languages', 'Technology', 'Drama/Theater', 'Dance'
];

const Onboarding = () => {
  const { updateFamilyProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    family_name: '',
    bio: '',
    city: '',
    state: '',
    zip_code: '',
    interests: [],
    kids: [],
    search_radius: 25
  });

  const [newKid, setNewKid] = useState({ name: '', age: '', interests: [] });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    if (!newKid.name || !newKid.age) {
      toast.error('Please enter name and age');
      return;
    }
    setFormData(prev => ({
      ...prev,
      kids: [...prev.kids, { ...newKid, age: parseInt(newKid.age) }]
    }));
    setNewKid({ name: '', age: '', interests: [] });
  };

  const removeKid = (index) => {
    setFormData(prev => ({
      ...prev,
      kids: prev.kids.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.family_name || !formData.city || !formData.state || !formData.zip_code) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/family/profile`, formData, {
        withCredentials: true
      });
      
      updateFamilyProfile(response.data);
      toast.success('Family profile created! Welcome to Village Friends!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error(error.response?.data?.detail || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1DE] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-all ${
                s === step ? 'bg-[#2A9D8F] w-8' : s < step ? 'bg-[#2A9D8F]' : 'bg-[#E0E0E0]'
              }`}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl p-8 shadow-sm"
        >
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div data-testid="onboarding-step-1">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#2A9D8F]" />
                </div>
                <h1 className="font-fraunces text-2xl font-bold text-[#264653]">
                  Tell Us About Your Family
                </h1>
                <p className="text-[#5F6F75] mt-2">
                  This helps other families get to know you
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="family_name" className="text-[#264653]">Family Name *</Label>
                  <Input
                    id="family_name"
                    value={formData.family_name}
                    onChange={(e) => handleChange('family_name', e.target.value)}
                    placeholder="The Smith Family"
                    className="mt-1 h-12 border-[#E0E0E0]"
                    data-testid="family-name-input"
                  />
                </div>

                <div>
                  <Label htmlFor="bio" className="text-[#264653]">About Your Family</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Tell other families about your homeschool style, what you enjoy doing together..."
                    className="mt-1 border-[#E0E0E0] min-h-[100px]"
                    data-testid="bio-input"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <Button onClick={() => setStep(2)} className="btn-primary" data-testid="next-step-btn">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div data-testid="onboarding-step-2">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-[#2A9D8F]" />
                </div>
                <h1 className="font-fraunces text-2xl font-bold text-[#264653]">
                  Where Are You Located?
                </h1>
                <p className="text-[#5F6F75] mt-2">
                  We'll help you find families nearby
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-[#264653]">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="Austin"
                      className="mt-1 h-12 border-[#E0E0E0]"
                      data-testid="city-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-[#264653]">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      placeholder="TX"
                      className="mt-1 h-12 border-[#E0E0E0]"
                      data-testid="state-input"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="zip_code" className="text-[#264653]">ZIP Code *</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleChange('zip_code', e.target.value)}
                    placeholder="78701"
                    className="mt-1 h-12 border-[#E0E0E0]"
                    data-testid="zip-input"
                  />
                </div>

                <div>
                  <Label className="text-[#264653]">Search Radius</Label>
                  <p className="text-sm text-[#5F6F75] mb-2">How far are you willing to travel?</p>
                  <div className="flex gap-2">
                    {[10, 25, 50, 100].map((radius) => (
                      <button
                        key={radius}
                        onClick={() => handleChange('search_radius', radius)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          formData.search_radius === radius
                            ? 'bg-[#2A9D8F] text-white'
                            : 'bg-[#F4F1DE] text-[#264653] hover:bg-[#E9C46A]'
                        }`}
                      >
                        {radius} miles
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setStep(1)} className="btn-secondary">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => setStep(3)} className="btn-primary" data-testid="next-step-btn">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Kids & Interests */}
          {step === 3 && (
            <div data-testid="onboarding-step-3">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-[#2A9D8F]" />
                </div>
                <h1 className="font-fraunces text-2xl font-bold text-[#264653]">
                  Your Children & Interests
                </h1>
                <p className="text-[#5F6F75] mt-2">
                  Help us match you with compatible families
                </p>
              </div>

              {/* Kids */}
              <div className="mb-6">
                <Label className="text-[#264653] mb-2 block">Your Children</Label>
                
                {formData.kids.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {formData.kids.map((kid, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#F4F1DE] rounded-lg">
                        <div>
                          <span className="font-medium text-[#264653]">{kid.name}</span>
                          <span className="text-[#5F6F75] ml-2">({kid.age} years old)</span>
                        </div>
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
                    placeholder="Child's name"
                    className="flex-1 h-10 border-[#E0E0E0]"
                    data-testid="kid-name-input"
                  />
                  <Input
                    type="number"
                    value={newKid.age}
                    onChange={(e) => setNewKid(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Age"
                    className="w-20 h-10 border-[#E0E0E0]"
                    data-testid="kid-age-input"
                  />
                  <Button type="button" onClick={addKid} variant="outline" className="h-10" data-testid="add-kid-btn">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Interests */}
              <div>
                <Label className="text-[#264653] mb-2 block">Family Interests</Label>
                <p className="text-sm text-[#5F6F75] mb-3">Select all that apply</p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        formData.interests.includes(interest)
                          ? 'bg-[#2A9D8F] text-white'
                          : 'bg-[#F4F1DE] text-[#264653] hover:bg-[#E9C46A]'
                      }`}
                      data-testid={`interest-${interest.toLowerCase().replace(/[^a-z]/g, '-')}`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setStep(2)} className="btn-secondary">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="btn-primary" 
                  disabled={loading}
                  data-testid="complete-profile-btn"
                >
                  {loading ? (
                    <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white" />
                  ) : (
                    <>Complete Profile <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Onboarding;
