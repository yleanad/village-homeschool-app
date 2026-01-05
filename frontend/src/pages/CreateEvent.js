import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    city: '',
    state: '',
    zip_code: '',
    max_attendees: '',
    age_range: '',
    event_type: 'meetup'
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.event_date || !formData.event_time || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null
      };
      
      const response = await axios.post(`${API_URL}/api/events`, payload, {
        withCredentials: true
      });
      
      toast.success('Event created successfully!');
      navigate(`/events/${response.data.event_id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error.response?.data?.detail || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const eventTypes = [
    { value: 'meetup', label: 'General Meetup' },
    { value: 'playdate', label: 'Playdate' },
    { value: 'field_trip', label: 'Field Trip' },
    { value: 'co-op', label: 'Co-op Activity' },
    { value: 'workshop', label: 'Workshop/Class' },
    { value: 'sports', label: 'Sports Activity' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto" data-testid="create-event-page">
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
          className="bg-white rounded-xl border border-[#E0E0E0] p-6 sm:p-8"
        >
          <h1 className="font-fraunces text-2xl font-bold text-[#264653] mb-2">
            Create an Event
          </h1>
          <p className="text-[#5F6F75] mb-6">
            Invite other homeschool families to join your activity
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Type */}
            <div>
              <Label className="text-[#264653]">Event Type *</Label>
              <Select value={formData.event_type} onValueChange={(v) => handleChange('event_type', v)}>
                <SelectTrigger className="mt-1" data-testid="event-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-[#264653]">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Park Playdate at Zilker"
                className="mt-1 h-11 border-[#E0E0E0]"
                data-testid="event-title-input"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-[#264653]">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Tell families what to expect..."
                className="mt-1 border-[#E0E0E0] min-h-[100px]"
                data-testid="event-description-input"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event_date" className="text-[#264653]">Date *</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6F75]" />
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => handleChange('event_date', e.target.value)}
                    className="pl-10 h-11 border-[#E0E0E0]"
                    data-testid="event-date-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="event_time" className="text-[#264653]">Time *</Label>
                <div className="relative mt-1">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6F75]" />
                  <Input
                    id="event_time"
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => handleChange('event_time', e.target.value)}
                    className="pl-10 h-11 border-[#E0E0E0]"
                    data-testid="event-time-input"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location" className="text-[#264653]">Location/Venue *</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6F75]" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g., Zilker Park Playground"
                  className="pl-10 h-11 border-[#E0E0E0]"
                  data-testid="event-location-input"
                />
              </div>
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city" className="text-[#264653]">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Austin"
                  className="mt-1 h-11 border-[#E0E0E0]"
                  data-testid="event-city-input"
                />
              </div>
              <div>
                <Label htmlFor="state" className="text-[#264653]">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="TX"
                  className="mt-1 h-11 border-[#E0E0E0]"
                  data-testid="event-state-input"
                />
              </div>
              <div>
                <Label htmlFor="zip_code" className="text-[#264653]">ZIP</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => handleChange('zip_code', e.target.value)}
                  placeholder="78701"
                  className="mt-1 h-11 border-[#E0E0E0]"
                  data-testid="event-zip-input"
                />
              </div>
            </div>

            {/* Max Attendees & Age Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_attendees" className="text-[#264653]">Max Families</Label>
                <div className="relative mt-1">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6F75]" />
                  <Input
                    id="max_attendees"
                    type="number"
                    value={formData.max_attendees}
                    onChange={(e) => handleChange('max_attendees', e.target.value)}
                    placeholder="No limit"
                    className="pl-10 h-11 border-[#E0E0E0]"
                    data-testid="event-max-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="age_range" className="text-[#264653]">Suggested Ages</Label>
                <Input
                  id="age_range"
                  value={formData.age_range}
                  onChange={(e) => handleChange('age_range', e.target.value)}
                  placeholder="e.g., 5-10 years"
                  className="mt-1 h-11 border-[#E0E0E0]"
                  data-testid="event-age-input"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 btn-primary"
                disabled={loading}
                data-testid="submit-event-btn"
              >
                {loading ? (
                  <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white" />
                ) : (
                  'Create Event'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default CreateEvent;
