'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUserShield, FaSignInAlt, FaUserPlus, FaTachometerAlt, FaCog, FaChartBar } from 'react-icons/fa';
import Link from 'next/link';

export default function AdminPortalPage() {
  const router = useRouter();

  // Check if user is already logged in as admin
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include', // Include cookies in the request
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user?.role === 'admin') {
            console.log('Admin already logged in, redirecting to dashboard');
            router.replace('/admin/dashboard');
          }
        }
      } catch (error) {
        console.error('Error checking existing auth:', error);
      }
    };

    checkExistingAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <FaUserShield className="text-white text-2xl mr-3" />
              <h1 className="text-white text-xl font-bold">Admin Portal</h1>
            </div>
            <Link
              href="/"
              className="text-white/80 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="bg-white/10 backdrop-blur-sm w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaUserShield className="text-white text-4xl" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Admin Portal
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Secure access to administrative dashboard and management tools
            </p>
          </motion.div>

          {/* Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-6 mb-12"
          >
            {/* Login Card */}
            <Link href="/admin/login">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 group cursor-pointer">
                <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/30 transition-colors">
                  <FaSignInAlt className="text-blue-300 text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Sign In</h3>
                <p className="text-white/70">
                  Access your admin dashboard with existing credentials
                </p>
              </div>
            </Link>

            {/* Signup Card */}
            <Link href="/admin/signup">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 group cursor-pointer">
                <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/30 transition-colors">
                  <FaUserPlus className="text-green-300 text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Create Account</h3>
                <p className="text-white/70">
                  Set up a new admin account with proper authorization
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <FaTachometerAlt className="text-blue-400 text-3xl mx-auto mb-4" />
              <h4 className="text-white font-semibold mb-2">Dashboard</h4>
              <p className="text-white/60 text-sm">
                Comprehensive overview of system metrics and activities
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <FaCog className="text-green-400 text-3xl mx-auto mb-4" />
              <h4 className="text-white font-semibold mb-2">Management</h4>
              <p className="text-white/60 text-sm">
                Manage users, services, bookings, and system settings
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <FaChartBar className="text-purple-400 text-3xl mx-auto mb-4" />
              <h4 className="text-white font-semibold mb-2">Analytics</h4>
              <p className="text-white/60 text-sm">
                Detailed reports and insights for business intelligence
              </p>
            </div>
          </motion.div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12"
          >
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-yellow-200 text-sm">
                🔒 This is a secure administrative area. All access attempts are logged and monitored.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
