'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarIcon,
  UsersIcon,
  CurrencyRupeeIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Events',
      value: stats?.stats?.totalEvents || 0,
      icon: CalendarIcon,
      change: `${stats?.stats?.upcomingEvents || 0} upcoming`,
      changeType: 'neutral',
      href: '/events',
    },
    {
      name: 'Total Customers',
      value: stats?.stats?.totalCustomers || 0,
      icon: UsersIcon,
      change: 'Active clients',
      changeType: 'neutral',
      href: '/customers',
    },
    {
      name: 'Monthly Revenue',
      value: `₹${(stats?.stats?.monthlyRevenue || 0).toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      change: `${stats?.stats?.completedEvents || 0} completed events`,
      changeType: 'positive',
      href: '/invoices',
    },
    {
      name: 'Outstanding',
      value: `₹${(stats?.stats?.outstandingAmount || 0).toLocaleString()}`,
      icon: ExclamationTriangleIcon,
      change: `${stats?.stats?.overdueInvoices || 0} overdue invoices`,
      changeType: stats?.stats?.overdueInvoices > 0 ? 'negative' : 'positive',
      href: '/invoices?overdue=true',
    },
  ];

  // Revenue chart data
  const revenueChartData = {
    labels: stats?.monthlyRevenue?.map(r => format(new Date(r.month + '-01'), 'MMM yyyy')) || [],
    datasets: [
      {
        label: 'Revenue',
        data: stats?.monthlyRevenue?.map(r => r.revenue) || [],
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Event types chart data
  const eventTypesData = {
    labels: stats?.eventTypes?.map(t => t.event_type) || [],
    datasets: [
      {
        data: stats?.eventTypes?.map(t => t.count) || [],
        backgroundColor: [
          'rgba(249, 115, 22, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="mt-1 text-sm text-secondary-500">
          Welcome back, {user?.firstName}! Here's what's happening with your catering business.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.name} href={stat.href} className="card hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-secondary-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-secondary-500 truncate">{stat.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-secondary-900">{stat.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className={`mt-3 text-sm ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'negative' ? 'text-red-600' : 'text-secondary-500'
              }`}>
                {stat.change}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-secondary-900">Monthly Revenue</h3>
          </div>
          <div className="card-body">
            <div className="h-64">
              {stats?.monthlyRevenue?.length > 0 ? (
                <Bar
                  data={revenueChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => '₹' + value.toLocaleString(),
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-secondary-400">
                  No revenue data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Event Types Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-secondary-900">Event Types Distribution</h3>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center">
              {stats?.eventTypes?.length > 0 ? (
                <Doughnut
                  data={eventTypesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-secondary-400">No event data available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-lg font-medium text-secondary-900">Upcoming Events</h3>
          <Link href="/events" className="text-sm text-primary-600 hover:text-primary-500">
            View all
          </Link>
        </div>
        <div className="card-body">
          {stats?.upcomingEvents?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead>
                  <tr>
                    <th className="table-header">Event Name</th>
                    <th className="table-header">Customer</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Guests</th>
                    <th className="table-header">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-200">
                  {stats.upcomingEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="table-cell font-medium text-secondary-900">{event.event_name}</td>
                      <td className="table-cell">{event.customer_first_name} {event.customer_last_name}</td>
                      <td className="table-cell">{format(new Date(event.event_date), 'MMM dd, yyyy')}</td>
                      <td className="table-cell">{event.guest_count}</td>
                      <td className="table-cell">
                        <span className={`badge-${
                          event.status === 'confirmed' ? 'success' :
                          event.status === 'pending' ? 'warning' : 'secondary'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-secondary-500">
              No upcoming events. <Link href="/events/new" className="text-primary-600">Create one</Link>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {stats?.lowStockAlerts?.length > 0 && (
        <div className="card border-red-200">
          <div className="card-header bg-red-50">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-red-800">Low Stock Alerts</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {stats.lowStockAlerts.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-900">{item.name}</p>
                    <p className="text-sm text-secondary-500">{item.category_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600 font-medium">{item.quantity} {item.unit}</p>
                    <p className="text-xs text-secondary-500">Min: {item.min_threshold}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/inventory?low_stock=true" className="text-sm text-primary-600 hover:text-primary-500">
                View all low stock items →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
