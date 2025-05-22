'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import BookingPage from '@/app/components/BookingPage';
import { toast } from 'react-hot-toast';
import { getCallNumber, getWhatsAppLink } from '@/app/utils/contactInfo';
import { services } from '@/app/lib/services';
import DiscountSelector from '@/app/components/DiscountSelector';

// Service interface
interface Service {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  longDescription: string;
  features: string[];
  price: string;
}

interface ServiceDetailsClientProps {
  serviceId: string;
}

export default function ServiceDetailsClient({ serviceId }: ServiceDetailsClientProps) {
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
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);

  // Fetch user profile if logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Check if we're in a browser environment (for localStorage)
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, user not logged in');
          return;
        }

        console.log('Fetching user profile with token');

        // Show loading toast
        const loadingToast = toast.loading('Loading your profile...');

        const response = await fetch('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        if (response.ok) {
          const data = await response.json();
          console.log('User profile fetched successfully');

          if (data.success && data.user) {
            setUserProfile({
              name: data.user.name || '',
              email: data.user.email || '',
              phone: data.user.phone || '',
              address: data.user.address || '',
            });

            // Show success toast
            toast.success('Profile loaded successfully');
          } else {
            console.error('Invalid user data format:', data);
            toast.error('Could not load your profile data');
          }
        } else {
          let errorMessage = 'Failed to fetch user profile';

          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
            console.error('Failed to fetch user profile:', errorMessage);
          } catch (jsonError) {
            console.error('Error parsing error response:', jsonError);
          }

          // Show error toast
          toast.error(errorMessage);

          // If token is invalid, clear it from localStorage
          if (response.status === 401) {
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Network error while loading profile');
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        // Use static services only
        console.log("Trying to find service in static services");

        // Try to find the service in the static services
        const foundStaticService = services.find(s => s.id === serviceId);

        if (foundStaticService) {
          // Transform the service data to match the expected format
          const defaultFeatures = [
            "Comprehensive diagnosis and troubleshooting",
            "Repair and replacement of faulty parts",
            "Regular maintenance and servicing",
            "Installation and setup of new units",
            "Expert advice on optimal usage and care",
          ];

          // Safely extract service properties with fallbacks
          const serviceId = foundStaticService.id || serviceId;
          const serviceTitle = foundStaticService.title || 'Service';
          const serviceDesc = foundStaticService.desc || 'Professional service at your doorstep';
          const serviceImg = foundStaticService.img || '/images/services/default.jpg';
          const serviceDetails = foundStaticService.details || defaultFeatures;

          // Determine price format safely
          let priceDisplay = '₹599 onwards';
          try {
            if (typeof foundStaticService.pricing === 'number') {
              priceDisplay = `₹${foundStaticService.pricing} onwards`;
            } else if (typeof foundStaticService.pricing === 'object' && foundStaticService.pricing !== null) {
              if (foundStaticService.pricing.basic && foundStaticService.pricing.basic.price) {
                priceDisplay = foundStaticService.pricing.basic.price;
              } else if ('price' in foundStaticService.pricing) {
                priceDisplay = `₹${foundStaticService.pricing.price} onwards`;
              }
            } else if (foundStaticService.price) {
              // Direct price property
              priceDisplay = typeof foundStaticService.price === 'string'
                ? foundStaticService.price
                : `₹${foundStaticService.price} onwards`;
            }
          } catch (priceError) {
            console.error('Error parsing price:', priceError);
            // Keep default price
          }

          // Create transformed service object
          setService({
            id: serviceId,
            title: serviceTitle,
            description: serviceDesc,
            imageUrl: serviceImg,
            longDescription: serviceDesc,
            features: serviceDetails,
            price: priceDisplay
          });

          // Set category ID for discount lookup
          try {
            if (foundStaticService.category) {
              setCategoryId(foundStaticService.category);
            } else if (foundStaticService.type) {
              // Map service type to category ID
              const categoryMap: Record<string, string> = {
                'ac': 'ac-services',
                'washingmachine': 'washing-machine-services',
                'refrigerator': 'refrigerator-services',
                'microwave': 'microwave-services',
                'tv': 'tv-services',
                'service': 'general-services'
              };
              setCategoryId(categoryMap[foundStaticService.type] || 'general-services');
            } else {
              // Default to general services
              setCategoryId('general-services');
            }
          } catch (categoryError) {
            console.error('Error setting category:', categoryError);
            setCategoryId('general-services');
          }

          // For testing, set a mock discount
          setAppliedDiscount({
            _id: "mock-discount-1",
            name: "Summer Special",
            discountType: "percentage",
            discountValue: 10,
            discountAmount: 59.9,
            formattedDiscountAmount: "₹59.9",
            discountedPrice: 539.1,
            formattedDiscountedPrice: "₹539.1",
            formattedOriginalPrice: "₹599",
            savings: "Save 10%"
          });

          setLoading(false);
          return;
        } else {
          // Service not found
          console.error(`Service with ID ${serviceId} not found`);
          toast.error('Service not found. Redirecting to home page.');
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching service data:', error);
        toast.error('Something went wrong. Please try again later.');
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [serviceId, router]);

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
          <Link href="/" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md">
            Back to Home
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

            {/* Booking Success Message */}
            {bookingSuccess && paymentDetails && (
              <motion.div
                className="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded-md shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 bg-green-100 rounded-full p-2">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-xl font-bold text-green-800">Booking Confirmed!</h3>
                </div>

                <div className="pl-11">
                  <p className="text-green-700 mb-4">
                    Thank you for booking with Dizit Solutions. Your service request has been confirmed.
                  </p>

                  <div className="bg-white rounded-lg border border-green-200 p-4 mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Booking Details:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Service:</span>
                        <span className="ml-2 font-medium">{service.title}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <span className="ml-2 font-medium">{service.price}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Payment ID:</span>
                        <span className="ml-2 font-medium">{paymentDetails.paymentId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Order ID:</span>
                        <span className="ml-2 font-medium">{paymentDetails.orderId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 text-sm">
                    <div className="bg-blue-50 rounded-md p-3 flex-1">
                      <p className="font-medium text-blue-800 mb-1">What happens next?</p>
                      <p className="text-blue-700">
                        Our team will contact you shortly to confirm the appointment details.
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-md p-3 flex-1">
                      <p className="font-medium text-yellow-800 mb-1">Need help?</p>
                      <p className="text-yellow-700">
                        A confirmation email has been sent to your email address. If you have any questions, please contact our support team.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <motion.div
              className="bg-white rounded-xl shadow-md p-6 mb-8 sticky top-24"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-xl font-bold text-blue-900 mb-4">Book This Service</h3>
              <p className="text-gray-600 mb-4">Get professional service at your doorstep. Book now for:</p>

              {/* Price display with discount */}
              {appliedDiscount ? (
                <div className="mb-6">
                  <div className="flex items-center">
                    <div className="text-2xl font-bold text-blue-600">{appliedDiscount.formattedDiscountedPrice}</div>
                    <div className="ml-2 text-gray-500 line-through text-sm">{appliedDiscount.formattedOriginalPrice}</div>
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    {appliedDiscount.savings} with {appliedDiscount.name}
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-bold text-blue-600 mb-6">{service.price}</div>
              )}

              {/* Discount Selector */}
              {categoryId && (
                <DiscountSelector
                  serviceId={service.id}
                  categoryId={categoryId}
                  originalPrice={parseInt(service.price.replace(/[^0-9]/g, ''))}
                  onDiscountApplied={setAppliedDiscount}
                  isServicePage={true}
                />
              )}

              {/* User Profile Info */}
              {userProfile ? (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <div className="flex items-center mb-2">
                    <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium text-blue-800">Booking as:</span>
                  </div>
                  <div className="text-sm text-gray-700 ml-7 space-y-1">
                    <p><span className="font-medium">Name:</span> {userProfile.name}</p>
                    <p><span className="font-medium">Email:</span> {userProfile.email}</p>
                    <p><span className="font-medium">Phone:</span> {userProfile.phone}</p>
                    {userProfile.address && (
                      <p><span className="font-medium">Address:</span> {userProfile.address}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-600 italic">
                  <p>Sign in to use your saved profile information for booking.</p>
                </div>
              )}

              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 mb-4 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Book Now
              </button>

              <div className="flex space-x-2">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={`tel:${getCallNumber()}`}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Call Now
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
        service={appliedDiscount ? {
          ...service,
          price: appliedDiscount.formattedDiscountedPrice
        } : service}
        serviceType="service" // Generic service type
        onPaymentSuccess={handlePaymentSuccess}
        userProfile={userProfile || undefined}
      />
    </div>
  );
}