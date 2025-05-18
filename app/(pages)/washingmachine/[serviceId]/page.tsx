'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import BookingPage from '@/app/components/BookingPage';
import DiscountSelector from '@/app/components/DiscountSelector';
import { toast } from 'react-hot-toast';
import { getCallNumber, getWhatsAppLink } from '@/app/utils/contactInfo';

// Washing Machine Service Data
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
    id: 'washing-machine-repair',
    title: 'Washing Machine Repair',
    description: 'Expert repair services for all types and brands of washing machines. We fix common issues like leaking, not spinning, or not draining.',
    imageUrl: '/washing-machine-repair.jpg',
    longDescription: 'Our Washing Machine Repair service covers all types of washing machines including top load, front load, semi-automatic, and fully automatic models. Our technicians are trained to diagnose and fix a wide range of issues including leaking, not spinning, not draining, excessive noise, and more. We service all major brands including Samsung, LG, Whirlpool, IFB, Bosch, and others.',
    features: [
      'Comprehensive diagnosis of washing machine issues',
      'Repair of mechanical and electrical components',
      'Replacement of faulty parts with genuine spares',
      'Water inlet and drain system repairs',
      'Motor and pump repairs',
      'Control panel and PCB repairs'
    ],
    price: '₹399 onwards'
  },
  {
    id: 'washing-machine-installation',
    title: 'Washing Machine Installation',
    description: 'Professional installation services for all types of washing machines, ensuring proper setup and optimal performance.',
    imageUrl: '/washing-machine-installation.jpg',
    longDescription: 'Our Washing Machine Installation service ensures your new washing machine is set up correctly for optimal performance and longevity. Our technicians handle everything from unpacking and positioning to connecting water inlets, drain pipes, and electrical connections. We also provide a demonstration of basic operations and maintenance tips.',
    features: [
      'Unpacking and inspection of new washing machine',
      'Proper positioning and leveling',
      'Water inlet and drain pipe connections',
      'Electrical connections and testing',
      'Initial test run to ensure proper functioning',
      'Basic operation demonstration and maintenance tips'
    ],
    price: '₹499 onwards'
  },
  {
    id: 'washing-machine-service',
    title: 'Washing Machine Service',
    description: 'Regular maintenance and servicing to keep your washing machine running efficiently and extend its lifespan.',
    imageUrl: '/washing-machine-service.jpg',
    longDescription: 'Our Washing Machine Service is a comprehensive maintenance package designed to keep your washing machine running efficiently and extend its lifespan. Regular servicing helps prevent common issues, reduces energy consumption, and ensures optimal washing performance. Our technicians perform a thorough cleaning, inspection, and tune-up of all components.',
    features: [
      'Thorough cleaning of drum, filter, and detergent drawer',
      'Inspection and cleaning of water inlet filters',
      'Drain pump cleaning and inspection',
      'Belt tension check and adjustment',
      'Inspection of door seal and hinges',
      'Comprehensive performance testing'
    ],
    price: '₹599 onwards'
  },
  {
    id: 'washing-machine-drain-cleaning',
    title: 'Washing Machine Drain Cleaning',
    description: 'Specialized service to clean and unclog washing machine drains, preventing water backup and drainage issues.',
    imageUrl: '/washing-machine-drain.jpg',
    longDescription: 'Our Washing Machine Drain Cleaning service addresses one of the most common issues with washing machines - clogged drains and water backup. Over time, lint, detergent residue, and small items can accumulate in the drain system, causing slow draining or complete blockages. Our technicians use specialized tools and techniques to thoroughly clean the entire drain system.',
    features: [
      'Removal and cleaning of drain pump filter',
      'Drain hose inspection and cleaning',
      'Drain pump inspection and cleaning',
      'Removal of foreign objects causing blockages',
      'Drain pipe unclogging',
      'Testing of drainage system after cleaning'
    ],
    price: '₹349 onwards'
  },
  {
    id: 'washing-machine-parts-replacement',
    title: 'Washing Machine Parts Replacement',
    description: 'Replacement of faulty washing machine parts with genuine spares to restore optimal functionality.',
    imageUrl: '/washing-machine-parts.jpg',
    longDescription: 'Our Washing Machine Parts Replacement service provides professional replacement of faulty components with genuine spare parts. Whether it\'s a worn-out belt, damaged pump, faulty motor, or malfunctioning control panel, our technicians can quickly identify the issue and replace the necessary parts to restore your washing machine to optimal functionality.',
    features: [
      'Comprehensive diagnosis to identify faulty parts',
      'Genuine spare parts from authorized suppliers',
      'Professional replacement of damaged components',
      'Replacement of belts, pumps, motors, and PCBs',
      'Door seal and gasket replacement',
      'Thorough testing after parts replacement'
    ],
    price: '₹499 onwards (excluding parts cost)'
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
        // Redirect to main washing machine page if service not found
        router.push('/washingmachine');
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
          <Link href="/washingmachine" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md">
            Back to Washing Machine Services
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

              {/* Available Offers Section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Available Offers</h3>
                <DiscountSelector
                  serviceId={service.id}
                  categoryId="washing-machine-services"
                  originalPrice={service.price.replace(/[^0-9.]/g, '')}
                  isServicePage={true}
                />
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
                    href="/washingmachine"
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
        serviceType="washingmachine"
        onPaymentSuccess={handlePaymentSuccess}
        userProfile={userProfile || undefined}
      />
    </div>
  );
}
