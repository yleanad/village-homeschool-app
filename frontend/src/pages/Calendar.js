import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchCalendarEvents();
  }, [month, year]);

  const fetchCalendarEvents = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/calendar/events?month=${month + 1}&year=${year}`,
        { withCredentials: true }
      );
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = [];

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 bg-gray-50" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.event_date === dateStr);
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

    days.push(
      <div
        key={day}
        className={`h-24 sm:h-32 p-1 sm:p-2 border-t border-[#E0E0E0] ${
          isToday ? 'bg-[#2A9D8F]/5' : 'bg-white'
        }`}
      >
        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-[#2A9D8F]' : 'text-[#264653]'}`}>
          {day}
        </div>
        <div className="space-y-1 overflow-y-auto max-h-16 sm:max-h-20">
          {dayEvents.map((event) => (
            <Link key={event.event_id} to={`/events/${event.event_id}`}>
              <div className={`calendar-event ${event.event_type} truncate`}>
                {event.title}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="calendar-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#264653]">
            My Calendar
          </h1>
          <Link to="/events/create">
            <Button className="btn-primary" data-testid="create-event-btn">
              + Create Event
            </Button>
          </Link>
        </div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden"
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-[#E0E0E0]">
            <Button variant="ghost" onClick={prevMonth} data-testid="prev-month-btn">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="font-fraunces text-xl font-semibold text-[#264653]">
              {monthNames[month]} {year}
            </h2>
            <Button variant="ghost" onClick={nextMonth} data-testid="next-month-btn">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b border-[#E0E0E0]">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-[#5F6F75] bg-[#F4F1DE]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
          ) : (
            <div className="grid grid-cols-7">{days}</div>
          )}
        </motion.div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#2A9D8F]" />
            <span className="text-[#5F6F75]">Meetup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#E76F51]" />
            <span className="text-[#5F6F75]">Playdate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#E9C46A]" />
            <span className="text-[#5F6F75]">Field Trip</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Calendar;
