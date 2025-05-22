"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaHeart, FaCalendarAlt, FaSpinner, FaSearch, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import useAuth from '@/app/hooks/useAuth';
import SaveServiceButton from '@/app/components/SaveServiceButton';

interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}

export default function SavedServicesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [savedServices, setSavedServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !isAuthenticated) {
      toast.error('Please log in to view your saved services');
      router.push('/login');
      return;
    }

    // Fetch saved services
    const fetchSavedServices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/user/saved-services');

        if (!response.ok) {
          throw new Error('Failed to fetch saved services');
        }

        const data = await response.json();

        if (data.success) {
          setSavedServices(data.savedServices || []);
        } else {
          throw new Error(data.message || 'Failed to fetch saved services');
        }
      } catch (error) {
        console.error('Error fetching saved services:', error);
        setError('Failed to load your saved services. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && !authLoading) {
      fetchSavedServices();
    }
  }, [isAuthenticated, authLoading, router]);

  // Filter services based on search query
  const filteredServices = savedServices.filter(service =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle service removal (updates UI after removal)
  const handleServiceRemoved = (serviceId: string) => {
    setSavedServices(prevServices =>
      prevServices.filter(service => service._id !== serviceId)
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Services</h1>
        <p className="text-gray-600">Your collection of favorite services for easy access.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search your saved services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FaSpinner className="animate-spin text-blue-600 text-4xl mb-4" />
          <p className="text-gray-600">Loading your saved services...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <FaExclamationCircle className="text-red-500 text-3xl mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          {searchQuery ? (
            <>
              <FaSearch className="text-gray-400 text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No matching services found</h3>
              <p className="text-gray-500 mb-4">Try a different search term or clear your search.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <FaHeart className="text-gray-400 text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No saved services yet</h3>
              <p className="text-gray-500 mb-4">Start saving services you're interested in for quick access later.</p>
              <Link
                href="/services"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-block"
              >
                Browse Services
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <motion.div
              key={service._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48">
                <Image
                  src={service.imageUrl}
                  alt={service.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute top-2 right-2">
                  <SaveServiceButton
                    serviceId={service._id}
                    className="bg-white p-2 rounded-full shadow-md"
                    onRemove={() => handleServiceRemoved(service._id)}
                  />
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-bold">₹{service.price}</span>
                  <Link
                    href={`/services/${service._id}`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <FaCalendarAlt className="mr-2" />
                    Book Now
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
