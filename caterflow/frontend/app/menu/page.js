'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState('items');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Menu Management</h1>
          <p className="mt-1 text-sm text-secondary-500">
            Manage your menu categories, items, and packages
          </p>
        </div>
        <Link href="/menu/new" className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Item
        </Link>
      </div>

      <div className="card">
        <div className="border-b border-secondary-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {['items', 'categories', 'packages'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          <div className="text-center py-12 text-secondary-500">
            <p>Menu management interface coming soon.</p>
            <p className="text-sm mt-2">This page will include:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Menu categories (Starters, Main Course, Desserts, Beverages)</li>
              <li>• Menu items with pricing and ingredients</li>
              <li>• Menu packages for events</li>
              <li>• Dietary information and tags</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
