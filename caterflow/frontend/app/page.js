'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">
                🍽 CaterFlow
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-secondary-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                Features
              </Link>
              <Link href="#pricing" className="text-secondary-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                Pricing
              </Link>
              <Link href="/login" className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
                Login
              </Link>
              <Link href="/register" className="bg-secondary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary-700">
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-secondary-600 hover:text-primary-600 p-2"
              >
                <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="#features" className="text-secondary-600 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                Features
              </Link>
              <Link href="#pricing" className="text-secondary-600 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                Pricing
              </Link>
              <Link href="/login" className="text-secondary-600 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                Login
              </Link>
              <Link href="/register" className="bg-primary-600 text-white block px-3 py-2 rounded-md text-base font-medium">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-secondary-900 sm:text-5xl md:text-6xl">
              <span className="block">Transform Your</span>
              <span className="block text-primary-600">Catering Business</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-secondary-500">
              Complete SaaS platform for managing events, customers, inventory, staff, and billing - all in one place.
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <Link
                href="/register"
                className="bg-primary-600 text-white px-8 py-3 rounded-md text-base font-medium hover:bg-primary-700 transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="/login"
                className="bg-secondary-100 text-secondary-700 px-8 py-3 rounded-md text-base font-medium hover:bg-secondary-200 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              Features
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-secondary-900">
              Everything you need to manage your catering business
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-3">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-2H8a3 3 0 00-5.356 2H4m0 0V8a3 3 0 015.356-2H8a3 3 0 015.356 2h13m0 0v10m-5 0h-5" />
                  </svg>
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-secondary-900">Event Management</p>
                <p className="mt-2 ml-16 text-base text-secondary-500">
                  Complete event lifecycle from inquiry to completion with staff assignments and timeline tracking.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1m0 0v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-secondary-900">Customer Management</p>
                <p className="mt-2 ml-16 text-base text-secondary-500">
                  Track customer preferences, event history, and manage relationships effectively.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-secondary-900">Menu Planning</p>
                <p className="mt-2 ml-16 text-base text-secondary-500">
                  Create custom menus, packages, and manage ingredients with recipe calculations.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m0 6l8 4m8-4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0l-8-4m-8 4v10a2 2 0 002 2h8a2 2 0 002-2V7z" />
                  </svg>
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-secondary-900">Inventory Control</p>
                <p className="mt-2 ml-16 text-base text-secondary-500">
                  Real-time stock tracking, low stock alerts, and automatic consumption calculations.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-2H8a3 3 0 00-5.356 2H4m0 0V8a3 3 0 015.356-2H8a3 3 0 015.356 2h13m0 0v10m-5 0h-5" />
                  </svg>
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-secondary-900">Staff Scheduling</p>
                <p className="mt-2 ml-16 text-base text-secondary-500">
                  Manage staff assignments, track availability, and prevent scheduling conflicts.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v8m0-8c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-secondary-900">Billing & Invoices</p>
                <p className="mt-2 ml-16 text-base text-secondary-500">
                  Professional invoicing, payment tracking, and automated billing workflows.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              Pricing Plans
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-secondary-900">
              Choose the perfect plan for your business
            </p>
          </div>

          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
              <div className="p-6">
                <h3 className="text-2xl font-semibold text-secondary-900">Free Trial</h3>
                <p className="mt-4 text-sm text-secondary-500">
                  Perfect for getting started
                </p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-secondary-900">₹0</span>
                  <span className="text-base font-medium text-secondary-500">/14 days</span>
                </p>
                <Link
                  href="/register"
                  className="mt-8 block w-full bg-secondary-100 text-secondary-700 border border-secondary-200 rounded-md py-2 text-sm font-semibold hover:bg-secondary-200 transition-colors text-center"
                >
                  Start Free Trial
                </Link>
              </div>
              <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-secondary-900">Pro</h3>
                  <p className="mt-4 text-sm text-secondary-500">
                    Best for growing businesses
                  </p>
                  <p className="mt-8">
                    <span className="text-4xl font-extrabold text-secondary-900">₹999</span>
                    <span className="text-base font-medium text-secondary-500">/month</span>
                  </p>
                  <Link
                    href="/register"
                    className="mt-8 block w-full bg-primary-600 text-white border border-transparent rounded-md py-2 text-sm font-semibold hover:bg-primary-700 transition-colors text-center"
                  >
                  Get Started
                  </Link>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
                <div className="p-6 relative">
                  <h3 className="text-2xl font-semibold text-secondary-900">Business</h3>
                  <p className="mt-4 text-sm text-secondary-500">
                    For established catering companies
                  </p>
                  <p className="mt-8">
                    <span className="text-4xl font-extrabold text-secondary-900">₹2999</span>
                    <span className="text-base font-medium text-secondary-500">/month</span>
                  </p>
                  <Link
                    href="/register"
                    className="mt-8 block w-full bg-primary-600 text-white border border-transparent rounded-md py-2 text-sm font-semibold hover:bg-primary-700 transition-colors text-center"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Ready to transform your catering business?
          </h2>
          <p className="mt-4 text-xl text-primary-100">
            Join thousands of caterers who trust CaterFlow to manage their operations.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex bg-white text-primary-600 px-8 py-3 rounded-md text-base font-medium hover:bg-primary-50 transition-colors"
            >
              Start Your Free Trial
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-secondary-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Product</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="#features" className="text-base text-secondary-300 hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="text-base text-secondary-300 hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Company</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="#" className="text-base text-secondary-300 hover:text-white">About</Link></li>
                <li><Link href="#" className="text-base text-secondary-300 hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Support</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="#" className="text-base text-secondary-300 hover:text-white">Help Center</Link></li>
                <li><Link href="#" className="text-base text-secondary-300 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="#" className="text-base text-secondary-300 hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="text-base text-secondary-300 hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-secondary-700 pt-8">
            <p className="text-base text-secondary-400">
              &copy; 2024 CaterFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
