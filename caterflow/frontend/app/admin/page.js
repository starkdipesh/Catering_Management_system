'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BuildingOfficeIcon,
  UsersIcon,
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, tenantsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/tenants'),
      ]);
      setStats(statsRes.data.data);
      setTenants(tenantsRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch admin data');
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

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">CaterFlow</h1>
              <span className="ml-4 text-sm text-secondary-500">Super Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-secondary-600">{user?.fullName}</span>
              <Link href="/dashboard" className="text-primary-600 hover:text-primary-500">
                Exit Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-500">Total Tenants</p>
                <p className="text-2xl font-bold text-secondary-900">{stats?.total_tenants || 0}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-500">Active Subscriptions</p>
                <p className="text-2xl font-bold text-secondary-900">{stats?.active_subscriptions || 0}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center">
              <CurrencyRupeeIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-500">Monthly Revenue</p>
                <p className="text-2xl font-bold text-secondary-900">₹{(stats?.monthly_revenue || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-500">Total Revenue</p>
                <p className="text-2xl font-bold text-secondary-900">₹{(stats?.total_revenue || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tenants Table */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-medium text-secondary-900">All Tenants</h2>
            <div className="flex space-x-3">
              <Link href="/admin/plans" className="btn-secondary">
                Manage Plans
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="table-header">Business</th>
                  <th className="table-header">Owner</th>
                  <th className="table-header">Plan</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Created</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 bg-white">
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="table-cell">
                      <div className="font-medium text-secondary-900">{tenant.business_name}</div>
                      <div className="text-sm text-secondary-500">{tenant.tenant_id}</div>
                    </td>
                    <td className="table-cell">{tenant.owner_name}</td>
                    <td className="table-cell">{tenant.plan_name}</td>
                    <td className="table-cell">
                      <span className={`badge-${
                        tenant.subscription_status === 'active' ? 'success' :
                        tenant.subscription_status === 'trial' ? 'info' : 'warning'
                      }`}>
                        {tenant.subscription_status}
                      </span>
                    </td>
                    <td className="table-cell">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      <Link href={`/admin/tenants/${tenant.id}`} className="text-primary-600 hover:text-primary-900">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
