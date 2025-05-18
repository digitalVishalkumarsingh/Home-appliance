'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import BookingPage from '@/app/components/BookingPage';
import { toast } from 'react-hot-toast';
import { getCallNumber, getWhatsAppLink } from '@/app/utils/contactInfo';

// AC Service Data (same as in the main AC repair page)
interface Service {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  longDescription: string;
  features: string[];
  price: string;
}

const services: Service[] = [
  {
    id: 'split-ac-repair',
    title: 'Split AC Repair',
    description: 'Installation, uninstallation, and servicing for indoor & outdoor units. Our expert technicians ensure efficient and long-lasting repair solutions.',
    imageUrl: '/splitacrepair.webp',
    longDescription: 'Our Split AC Repair service covers all aspects of split air conditioner maintenance and repair. We handle everything from installation and uninstallation to comprehensive servicing of both indoor and outdoor units. Our certified technicians are trained to diagnose and fix issues with all major brands and models of split ACs.',
    features: [
      'Complete diagnostics and troubleshooting',
      'Repair of cooling issues and refrigerant leaks',
      'Cleaning of filters, coils, and drainage systems',
      'Electrical component repairs and replacements',
      'Performance optimization and efficiency tuning',
      'Installation and uninstallation services'
    ],
    price: '₹499 onwards'
  },
  {
    id: 'multi-split-ac-repair',
    title: 'Multi-Split AC Repair',
    description: 'Expert repair services for all brands of built-in multi-split AC systems, ensuring optimal cooling for multiple rooms.',
    imageUrl: '/multisplit.webp',
    longDescription: 'Our Multi-Split AC Repair service is designed for homes and offices with multi-zone cooling systems. We provide expert repair and maintenance for all brands of built-in multi-split AC systems, ensuring optimal cooling performance across multiple rooms or zones. Our technicians are specially trained to handle the complexity of these systems.',
    features: [
      'Multi-zone system diagnostics and balancing',
      'Repair of individual indoor units and central outdoor unit',
      'Refrigerant pressure testing and recharging',
      'Control system and thermostat troubleshooting',
      'Ductwork inspection and repair',
      'System efficiency optimization'
    ],
    price: '₹799 onwards'
  },
  {
    id: 'window-ac-repair',
    title: 'Window AC Repair',
    description: 'Installation, uninstallation, and servicing of window AC units. Our technicians will quickly identify and fix any issues.',
    imageUrl: '/windowac.webp',
    longDescription: 'Our Window AC Repair service covers all aspects of window air conditioner maintenance and repair. From installation and uninstallation to comprehensive servicing, our technicians are equipped to handle all window AC models. We quickly identify and resolve issues to restore optimal cooling performance.',
    features: [
      'Complete window AC diagnostics',
      'Cooling system repairs and optimization',
      'Filter and coil cleaning',
      'Drainage system unclogging and repair',
      'Electrical component testing and replacement',
      'Installation and mounting services'
    ],
    price: '₹399 onwards'
  },
  {
    id: 'ac-gas-filling',
    title: 'AC Gas Filling',
    description: 'Professional gas refilling to restore optimal cooling performance using high-quality refrigerants.',
    imageUrl: '/fillinggas.webp',
    longDescription: 'Our AC Gas Filling service ensures your air conditioner performs at its best. We use only high-quality refrigerants appropriate for your specific AC model. Our technicians are trained to safely handle refrigerants, detect and repair leaks, and ensure the correct pressure levels for optimal cooling efficiency.',
    features: [
      'Refrigerant level testing',
      'Leak detection and repair',
      'Complete system evacuation',
      'Precise refrigerant charging',
      'Performance testing after refill',
      'Environmentally responsible handling of refrigerants'
    ],
    price: '₹1,200 onwards'
  },
  {
    id: 'ac-installation',
    title: 'AC Installation',
    description: 'Professional AC installation services for all types of AC units, ensuring precise and safe installation.',
    imageUrl: '/iacinstallation.webp',
    longDescription: 'Our AC Installation service provides professional setup for all types of air conditioning units. We ensure precise and safe installation that maximizes the efficiency and lifespan of your AC. Our technicians handle everything from mounting and electrical connections to system testing and user guidance.',
    features: [
      'Site assessment and preparation',
      'Secure mounting and positioning',
      'Professional electrical connections',
      'Refrigerant line installation',
      'Drainage system setup',
      'Complete system testing and optimization',
      'User operation guidance'
    ],
    price: '₹1,500 onwards'
  },
  {
    id: 'ac-service',
    title: 'AC Service',
    description: 'Expert installation, maintenance, and repair services for all types of air conditioning units.',
    imageUrl: '/ac2.jpeg',
    longDescription: 'Our comprehensive AC Service covers all aspects of air conditioner maintenance and care. We provide expert installation, regular maintenance, and repair services for all types of air conditioning units. Our preventive maintenance programs help extend the life of your AC and maintain optimal cooling efficiency year-round.',
    features: [
      'Comprehensive system inspection',
      'Filter cleaning and replacement',
      'Coil cleaning and sanitization',
      'Refrigerant level check and top-up',
      'Electrical component testing',
      'Performance optimization',
      'Preventive maintenance plans'
    ],
    price: '₹599 onwards'
  },
];

export default function ServiceDetails() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    paymentId: string;
    orderId: string;
  } | null>(null);
  const [userProfile, setUserProfile] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  } | null>(null);

  // Fetch user profile from localStorage if available
  useEffect(() => {
    const getUserProfile = () => {
      try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          setUserProfile({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    getUserProfile();
  }, []);

  useEffect(() => {
    if (params.serviceId) {
      const serviceId = Array.isArray(params.serviceId)
        ? params.serviceId[0]
        : params.serviceId;

      const foundService = services.find(s => s.id === serviceId);

      if (foundService) {
        setService(foundService);
      } else {
        // Redirect to main AC repair page if service not found
        router.push('/acrepair');
      }

      setLoading(false);
    }
  }, [params.serviceId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700">Service not found</h2>
          <p className="mt-2 text-gray-600">The service you're looking for doesn't exist.</p>
          <Link href="/acrepair" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md">
            Back to AC Services
          </Link>
        </div>
      </div>
    );
  }

  const handlePaymentSuccess = (paymentId: string, orderId: string) => {
    setPaymentDetails({ paymentId, orderId });
    setBookingSuccess(true);
    toast.success('Payment successful! Your service has been booked.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-blue-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <Image
            src={service.imageUrl}
            alt={service.title}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        <div className="relative container mx-auto px-4 py-16 z-10">
          <motion.h1
            className="text-3xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {service.title}
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {service.description}
          </motion.p>
        </div>
      </div>

      {/* Service Details */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <motion.div
              className="bg-white rounded-xl shadow-md p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-blue-900 mb-4">About This Service</h2>
              <p className="text-gray-700 mb-6">{service.longDescription}</p>

              <h3 className="text-xl font-semibold text-blue-800 mb-3">What's Included</h3>
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl shadow-md p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Why Choose Us</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Fast Response</h3>
                    <p className="text-sm text-gray-600">Same-day service in most cases</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">90-Day Warranty</h3>
                    <p className="text-sm text-gray-600">On all repairs and parts</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Expert Technicians</h3>
                    <p className="text-sm text-gray-600">Certified and experienced</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Transparent Pricing</h3>
                    <p className="text-sm text-gray-600">No hidden fees or charges</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <motion.div
              className="bg-white rounded-xl shadow-md p-6 sticky top-24"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Starting Price</h3>
                <p className="text-3xl font-bold text-blue-600">{service.price}</p>
                <p className="text-sm text-gray-500 mt-1">Final price may vary based on specific requirements</p>
              </div>

              {bookingSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h3 className="text-green-800 font-semibold">Booking Confirmed!</h3>
                  </div>
                  <p className="text-green-700 text-sm mb-2">Your service has been booked successfully.</p>
                  <p className="text-xs text-green-600">Payment ID: {paymentDetails?.paymentId}</p>
                  <p className="text-xs text-green-600">Order ID: {paymentDetails?.orderId}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 text-center"
                  >
                    Book & Pay Online
                  </button>

                  <a
                    href={`tel:${getCallNumber()}`}
                    className="block w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 text-center"
                  >
                    Call to Book: {getCallNumber()}
                  </a>

                  <a
                    href={getWhatsAppLink(`I'm interested in booking your ${service.title} service. Please provide more information.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 text-center"
                  >
                    WhatsApp Booking
                  </a>

                  <Link
                    href="/acrepair"
                    className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-md transition-colors duration-300 text-center"
                  >
                    Back to Services
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">Have Questions?</h3>
                <p className="text-sm text-gray-600 mb-4">Our customer service team is here to help you with any questions about our services.</p>
                <a
                  href={`tel:${getCallNumber()}`}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {getCallNumber()}
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Full-screen Booking Page */}
      <BookingPage
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        service={service}
        serviceType="ac"
        onPaymentSuccess={handlePaymentSuccess}
        userProfile={userProfile || undefined}
      />
    </div>
  );
}
