'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditPlanPage() {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_monthly: '',
    price_yearly: '',
    max_events_per_month: '',
    max_staff: '',
    features: [''],
    is_active: true,
  });
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const planId = params.id;

  useEffect(() => {
    fetchPlan();
  }, [planId]);

  const fetchPlan = async () => {
    try {
      const response = await api.get(`/admin/plans/${planId}`);
      const plan = response.data.data;
      
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        price_monthly: plan.price_monthly?.toString() || '',
        price_yearly: plan.price_yearly?.toString() || '',
        max_events_per_month: plan.max_events_per_month?.toString() || '',
        max_staff: plan.max_staff?.toString() || '',
        features: plan.features ? (Array.isArray(plan.features) ? plan.features : [plan.features]) : [''],
        is_active: plan.is_active ?? true,
      });
    } catch (error) {
      toast.error('Failed to fetch plan details');
      router.push('/admin/plans');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'price_monthly' || name === 'price_yearly') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.price_monthly) {
      toast.error('Plan name and monthly price are required');
      return;
    }

    // Filter out empty features
    const filteredFeatures = formData.features.filter(feature => feature.trim() !== '');
    
    const submitData = {
      ...formData,
      price_monthly: parseFloat(formData.price_monthly),
      price_yearly: formData.price_yearly ? parseFloat(formData.price_yearly) : parseFloat(formData.price_monthly) * 10,
      max_events_per_month: formData.max_events_per_month ? parseInt(formData.max_events_per_month) : null,
      max_staff: formData.max_staff ? parseInt(formData.max_staff) : null,
      features: filteredFeatures,
    };

    setLoading(true);
    
    try {
      await api.put(`/admin/plans/${planId}`, submitData);
      toast.success('Plan updated successfully');
      router.push('/admin/plans');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update plan');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                href="/admin/plans"
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">Edit Subscription Plan</h1>
                <p className="mt-1 text-sm text-secondary-500">Update subscription plan details</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Plan Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Professional Plan"
                />
              </div>

              <div>
                <label htmlFor="price_monthly" className="block text-sm font-medium text-gray-700">
                  Monthly Price (₹) *
                </label>
                <input
                  type="number"
                  name="price_monthly"
                  id="price_monthly"
                  value={formData.price_monthly}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="999"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe what's included in this plan..."
              />
            </div>

            {/* Pricing Details */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="price_yearly" className="block text-sm font-medium text-gray-700">
                  Yearly Price (₹)
                </label>
                <input
                  type="number"
                  name="price_yearly"
                  id="price_yearly"
                  value={formData.price_yearly}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="9999"
                />
              </div>

              <div>
                <label htmlFor="max_events_per_month" className="block text-sm font-medium text-gray-700">
                  Max Events per Month
                </label>
                <input
                  type="number"
                  name="max_events_per_month"
                  id="max_events_per_month"
                  value={formData.max_events_per_month}
                  onChange={handleChange}
                  min="1"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div>
                <label htmlFor="max_staff" className="block text-sm font-medium text-gray-700">
                  Max Staff Members
                </label>
                <input
                  type="number"
                  name="max_staff"
                  id="max_staff"
                  value={formData.max_staff}
                  onChange={handleChange}
                  min="1"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features
              </label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Up to 100 events per month"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="px-3 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 text-primary-600 border border-primary-300 rounded-md hover:bg-primary-50"
                >
                  Add Feature
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Active (available for new subscriptions)
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Link
                href="/admin/plans"
                className="btn-secondary"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Updating...' : 'Update Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
