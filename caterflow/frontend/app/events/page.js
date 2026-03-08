'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, CalendarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const statusColors = {
  inquiry: 'badge-secondary',
  quoted: 'badge-info',
  confirmed: 'badge-success',
  in_progress: 'badge-warning',
  completed: 'badge-success',
  cancelled: 'badge-danger',
};

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const filteredEvents = events.filter(e => 
    filter === '' || e.status === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="mt-1 text-sm text-secondary-500">
            Manage your catering events
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/events/calendar" className="btn-secondary">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Calendar View
          </Link>
          <Link href="/events/new" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Event
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <select
            className="input max-w-xs"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="inquiry">Inquiry</option>
            <option value="quoted">Quoted</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="table-header">Event Name</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Date</th>
                <th className="table-header">Guests</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 bg-white">
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td className="table-cell font-medium text-secondary-900">{event.event_name}</td>
                  <td className="table-cell">{event.customer_first_name} {event.customer_last_name}</td>
                  <td className="table-cell">{format(new Date(event.event_date), 'MMM dd, yyyy')}</td>
                  <td className="table-cell">{event.guest_count}</td>
                  <td className="table-cell">₹{(event.final_amount || 0).toLocaleString()}</td>
                  <td className="table-cell">
                    <span className={statusColors[event.status] || 'badge-secondary'}>
                      {event.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <Link href={`/events/${event.id}`} className="text-primary-600 hover:text-primary-900">
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      <Link href={`/events/${event.id}/edit`} className="text-secondary-600 hover:text-secondary-900">
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredEvents.length === 0 && (
          <div className="text-center py-8 text-secondary-500">
            No events found. <Link href="/events/new" className="text-primary-600">Create one</Link>
          </div>
        )}
      </div>
    </div>
  );
}
