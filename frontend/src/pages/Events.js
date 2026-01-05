import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, MapPin, Users, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      let url = `${API_URL}/api/events?upcoming_only=true`;
      if (filter !== 'all') {
        url += `&event_type=${filter}`;
      }
      const response = await axios.get(url, { withCredentials: true });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'meetup', label: 'Meetups' },
    { value: 'playdate', label: 'Playdates' },
    { value: 'field_trip', label: 'Field Trips' },
    { value: 'co-op', label: 'Co-op Activities' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="events-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#264653]">
              Events
            </h1>
            <p className="text-[#5F6F75] mt-1">
              Discover and join local homeschool events
            </p>
          </div>
          <Link to="/events/create">
            <Button className="btn-primary" data-testid="create-event-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48" data-testid="event-type-filter">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
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

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#E0E0E0]">
            <CalendarIcon className="w-16 h-16 text-[#5F6F75]/30 mx-auto mb-4" />
            <h3 className="font-fraunces text-xl text-[#264653] mb-2">No events found</h3>
            <p className="text-[#5F6F75] mb-4">Be the first to create an event in your area!</p>
            <Link to="/events/create">
              <Button className="btn-primary">Create Event</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event, index) => (
              <motion.div
                key={event.event_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/events/${event.event_id}`} data-testid={`event-card-${index}`}>
                  <div className="bg-white rounded-xl border border-[#E0E0E0] p-5 h-full card-hover">
                    <div className={`calendar-event ${event.event_type} inline-block mb-3`}>
                      {event.event_type.replace('_', ' ')}
                    </div>
                    
                    <h3 className="font-fraunces text-lg font-semibold text-[#264653] mb-2">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-[#5F6F75]">
                      <p className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'long',
                          day: 'numeric'
                        })} at {event.event_time}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {event.attendees?.length || 0} attending
                        {event.max_attendees && (
                          <span className="text-[#2A9D8F]">
                            · {event.max_attendees - (event.attendees?.length || 0)} spots left
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-[#E0E0E0]">
                      <p className="text-sm text-[#5F6F75]">
                        Hosted by <span className="font-medium text-[#264653]">{event.host_family_name}</span>
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Events;
