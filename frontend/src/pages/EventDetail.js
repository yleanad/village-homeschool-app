import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, ArrowLeft, Check, X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EventDetail = () => {
  const { eventId } = useParams();
  const { familyProfile } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/events/${eventId}`, {
        withCredentials: true
      });
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Event not found');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const isAttending = event?.attendees?.some(a => a.family_id === familyProfile?.family_id);
  const isHost = event?.host_family_id === familyProfile?.family_id;
  const isFull = event?.max_attendees && event.attendees?.length >= event.max_attendees;

  const handleRSVP = async () => {
    setRsvpLoading(true);
    try {
      if (isAttending) {
        await axios.delete(`${API_URL}/api/events/${eventId}/rsvp`, { withCredentials: true });
        toast.success('RSVP cancelled');
      } else {
        await axios.post(`${API_URL}/api/events/${eventId}/rsvp`, {}, { withCredentials: true });
        toast.success('RSVP confirmed! See you there!');
      }
      fetchEvent();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update RSVP');
    } finally {
      setRsvpLoading(false);
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

  if (!event) return null;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto" data-testid="event-detail-page">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 text-[#5F6F75]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-[#E0E0E0]">
            <div className={`calendar-event ${event.event_type} inline-block mb-3`}>
              {event.event_type.replace('_', ' ')}
            </div>
            
            <h1 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#264653] mb-2">
              {event.title}
            </h1>
            
            <p className="text-[#5F6F75]">
              Hosted by{' '}
              <Link 
                to={`/family/${event.host_family_id}`}
                className="text-[#2A9D8F] font-medium hover:underline"
              >
                {event.host_family_name}
              </Link>
            </p>
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#2A9D8F]/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-[#2A9D8F]" />
              </div>
              <div>
                <p className="font-medium text-[#264653]">
                  {new Date(event.event_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-[#5F6F75]">{event.event_time}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#2A9D8F]/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[#2A9D8F]" />
              </div>
              <div>
                <p className="font-medium text-[#264653]">{event.location}</p>
                <p className="text-[#5F6F75]">{event.city}, {event.state} {event.zip_code}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#2A9D8F]/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[#2A9D8F]" />
              </div>
              <div>
                <p className="font-medium text-[#264653]">
                  {event.attendees?.length || 0} {event.attendees?.length === 1 ? 'family' : 'families'} attending
                </p>
                {event.max_attendees && (
                  <p className="text-[#5F6F75]">
                    {event.max_attendees - (event.attendees?.length || 0)} spots remaining
                  </p>
                )}
                {event.age_range && (
                  <p className="text-[#5F6F75]">Suggested ages: {event.age_range}</p>
                )}
              </div>
            </div>

            {event.description && (
              <div className="pt-4 border-t border-[#E0E0E0]">
                <h3 className="font-semibold text-[#264653] mb-2">About this event</h3>
                <p className="text-[#5F6F75] whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 sm:p-8 bg-[#F4F1DE] flex flex-col sm:flex-row gap-4">
            {isHost ? (
              <div className="flex items-center gap-2 text-[#2A9D8F]">
                <Check className="w-5 h-5" />
                <span className="font-medium">You're hosting this event</span>
              </div>
            ) : (
              <Button
                onClick={handleRSVP}
                disabled={rsvpLoading || (isFull && !isAttending)}
                className={isAttending ? 'btn-secondary' : 'btn-primary'}
                data-testid="rsvp-btn"
              >
                {rsvpLoading ? (
                  <div className="spinner w-5 h-5 border-2" />
                ) : isAttending ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel RSVP
                  </>
                ) : isFull ? (
                  'Event Full'
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    RSVP to Attend
                  </>
                )}
              </Button>
            )}
            
            {!isHost && (
              <Link to={`/messages/${event.host_family_id}`}>
                <Button variant="outline" className="w-full sm:w-auto">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Host
                </Button>
              </Link>
            )}
          </div>

          {/* Attendees */}
          {event.attendees?.length > 0 && (
            <div className="p-6 sm:p-8 border-t border-[#E0E0E0]">
              <h3 className="font-semibold text-[#264653] mb-4">Who's Coming</h3>
              <div className="flex flex-wrap gap-3">
                {event.attendees.map((attendee) => (
                  <Link
                    key={attendee.family_id}
                    to={`/family/${attendee.family_id}`}
                    className="flex items-center gap-2 px-3 py-2 bg-[#F4F1DE] rounded-lg hover:bg-[#E9C46A]/30 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2A9D8F]/10 flex items-center justify-center text-[#2A9D8F] text-sm font-medium">
                      {attendee.family_name?.charAt(0)}
                    </div>
                    <span className="text-[#264653] font-medium text-sm">{attendee.family_name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default EventDetail;
