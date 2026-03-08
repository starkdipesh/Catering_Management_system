'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  CalendarIcon,
  UsersIcon,
  ShoppingBagIcon,
  ArchiveBoxIcon,
  ReceiptPercentIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Events', href: '/events', icon: CalendarIcon },
  { name: 'Customers', href: '/customers', icon: UsersIcon },
  { name: 'Menu', href: '/menu', icon: ShoppingBagIcon },
  { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon },
  { name: 'Invoices', href: '/invoices', icon: ReceiptPercentIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-secondary-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent pathname={pathname} />
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <SidebarContent pathname={pathname} />
      </div>

      {/* Main content */}
      <div className="flex flex-col md:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow-sm">
          <button
            type="button"
            className="border-r border-secondary-200 px-4 text-secondary-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 justify-between px-4 sm:px-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-xl font-semibold text-secondary-900">
                {user?.tenantName || 'CaterFlow'}
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6 gap-4">
              {/* User dropdown */}
              <div className="relative flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-secondary-900">{user?.fullName}</p>
                  <p className="text-xs text-secondary-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <UserCircleIcon className="h-6 w-6 text-primary-600" />
                </div>
                <button
                  onClick={logout}
                  className="text-secondary-400 hover:text-secondary-500"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ pathname }) {
  const { user } = useAuth();

  // Filter navigation based on role
  const filteredNav = navigation.filter((item) => {
    if (user?.role === 'staff') {
      return ['Dashboard', 'Events'].includes(item.name);
    }
    return true;
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col border-r border-secondary-200 bg-white">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <div className="flex flex-shrink-0 items-center px-4">
          <h1 className="text-2xl font-bold text-primary-600">CaterFlow</h1>
        </div>
        <nav className="mt-5 flex-1 space-y-1 px-2">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-shrink-0 border-t border-secondary-200 p-4">
        <div className="flex items-center">
          <div>
            <p className="text-sm font-medium text-secondary-900">{user?.fullName}</p>
            <p className="text-xs text-secondary-500">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
