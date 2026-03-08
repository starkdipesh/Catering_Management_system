'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
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
          <h1 className="page-title">Customers</h1>
          <p className="mt-1 text-sm text-secondary-500">
            Manage your customer database
          </p>
        </div>
        <Link href="/customers/new" className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Customer
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <input
            type="text"
            placeholder="Search customers..."
            className="input max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Type</th>
                <th className="table-header">Events</th>
                <th className="table-header">Total Revenue</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 bg-white">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="table-cell">
                    <div className="font-medium text-secondary-900">
                      {customer.first_name} {customer.last_name}
                    </div>
                    {customer.company_name && (
                      <div className="text-sm text-secondary-500">{customer.company_name}</div>
                    )}
                  </td>
                  <td className="table-cell">
                    <div>{customer.phone}</div>
                    <div className="text-sm text-secondary-500">{customer.email}</div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge-${customer.customer_type === 'corporate' ? 'info' : 'secondary'}`}>
                      {customer.customer_type}
                    </span>
                  </td>
                  <td className="table-cell">{customer.total_events || 0}</td>
                  <td className="table-cell">₹{(customer.total_revenue || 0).toLocaleString()}</td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <Link href={`/customers/${customer.id}`} className="text-primary-600 hover:text-primary-900">
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      <Link href={`/customers/${customer.id}/edit`} className="text-secondary-600 hover:text-secondary-900">
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCustomers.length === 0 && (
          <div className="text-center py-8 text-secondary-500">
            No customers found. <Link href="/customers/new" className="text-primary-600">Add one</Link>
          </div>
        )}
      </div>
    </div>
  );
}
