'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaInfoCircle,
  FaArrowRight,
  FaArrowLeft,
  FaSpinner,
  FaCheckCircle,
  FaMoneyBillWave,
  FaCreditCard,
} from 'react-icons/fa';
import useAuth from "../hooks/useAuth";
import LocationFinder from './LocationFinder';

interface ServiceBookingFormProps {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  onSuccess?: () => void;
}

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  date: string;
  time: string;
  notes: string;
  paymentMethod: 'online' | 'cash';
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export default function ServiceBookingForm({
  serviceId,
  serviceName,
  servicePrice,
  onSuccess,
}: ServiceBookingFormProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    date: '',
    time: '',
    notes: '',
    paymentMethod: 'online',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    },
    []
  );

  const handleLocationFound = useCallback(
    (locationData: { lat: number; lng: number; address: string }) => {
      setFormData((prev) => ({
        ...prev,
        location: locationData,
        address: locationData.address,
      }));
      setErrors((prev) => ({ ...prev, location: undefined, address: undefined }));
    },
    []
  );

  const validateStep = useCallback(() => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
      if (!formData.address.trim()) newErrors.address = 'Address is required';
    }

    if (step === 2) {
      if (!formData.location) newErrors.location = 'Please share your location';
    }

    if (step === 3) {
      if (!formData.date) newErrors.date = 'Please select a date';
      if (!formData.time) newErrors.time = 'Please select a time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, step]);

  const handleNextStep = useCallback(() => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  }, [validateStep]);

  const handlePrevStep = useCallback(() => {
    setStep((prev) => prev - 1);
  }, []);

  const getTimeSlots = useCallback(() => [
    '09:00 AM - 11:00 AM',
    '11:00 AM - 01:00 PM',
    '01:00 PM - 03:00 PM',
    '03:00 PM - 05:00 PM',
    '05:00 PM - 07:00 PM',
  ], []);

  const getTomorrowDate = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  const getMaxDate = useCallback(() => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        sessionStorage.setItem(
          'pendingBooking',
          JSON.stringify({ serviceId, serviceName, servicePrice, formData })
        );
        toast.error('Please login to complete your booking');
        router.push('/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/bookings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId,
          serviceName,
          servicePrice,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          address: formData.address,
          location: formData.location,
          scheduledDate: formData.date,
          scheduledTime: formData.time,
          notes: formData.notes,
          paymentMethod: formData.paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create booking: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setBookingSuccess(true);
        setBookingId(data.bookingId);
        sessionStorage.removeItem('pendingBooking');
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.message || 'Failed to create booking');
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100"
          >
            <FaCheckCircle className="h-10 w-10 text-green-600" />
          </motion.div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Booking Successful!</h2>
          <p className="mt-2 text-gray-600">
            Your booking for {serviceName} has been confirmed.
            {bookingId && <span className="block font-medium">Booking ID: {bookingId}</span>}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            We will assign the best technician for your service. You will receive a notification
            once a technician is assigned.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/bookings')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View My Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {stepNumber}
              </div>
              <span className="text-xs mt-2 text-gray-500">
                {stepNumber === 1
                  ? 'Details'
                  : stepNumber === 2
                  ? 'Location'
                  : stepNumber === 3
                  ? 'Schedule'
                  : 'Confirm'}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200"></div>
          <div
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-600 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`pl-10 block w-full sm:text-sm rounded-md border ${
                        errors.name
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="John Doe"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                  </div>
                  {errors.name && (
                    <p id="name-error" className="mt-1 text-sm text-red-600">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`pl-10 block w-full sm:text-sm rounded-md border ${
                        errors.email
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="john@example.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                  </div>
                  {errors.email && (
                    <p id="email-error" className="mt-1 text-sm text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`pl-10 block w-full sm:text-sm rounded-md border ${
                        errors.phone
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="9876543210"
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? 'phone-error' : undefined}
                    />
                  </div>
                  {errors.phone && (
                    <p id="phone-error" className="mt-1 text-sm text-red-600">
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Service Address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`pl-10 block w-full sm:text-sm rounded-md border ${
                        errors.address
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="123 Main St, City, State, PIN"
                      aria-invalid={!!errors.address}
                      aria-describedby={errors.address ? 'address-error' : undefined}
                    />
                  </div>
                  {errors.address && (
                    <p id="address-error" className="mt-1 text-sm text-red-600">
                      {errors.address}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold mb-4">Share Your Location</h2>
              <p className="text-gray-600 mb-4">
                Please share your location to help our technician find you easily.
              </p>
              <LocationFinder onLocationFound={handleLocationFound} className="mb-4" />
              {formData.location && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-start">
                    <FaCheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Location shared successfully</p>
                      <p className="text-xs text-green-700 mt-1">{formData.location.address}</p>
                    </div>
                  </div>
                </div>
              )}
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start">
                  <FaInfoCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Why we need your location</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Your location helps us assign the nearest technician and provide accurate
                      navigation to your address.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold mb-4">Schedule Your Service</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Preferred Date
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={getTomorrowDate()}
                      max={getMaxDate()}
                      className={`pl-10 block w-full sm:text-sm rounded-md border ${
                        errors.date
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      aria-invalid={!!errors.date}
                      aria-describedby={errors.date ? 'date-error' : undefined}
                    />
                  </div>
                  {errors.date && (
                    <p id="date-error" className="mt-1 text-sm text-red-600">
                      {errors.date}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                    Preferred Time Slot
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaClock className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className={`pl-10 block w-full sm:text-sm rounded-md border ${
                        errors.time
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      aria-invalid={!!errors.time}
                      aria-describedby={errors.time ? 'time-error' : undefined}
                    >
                      <option value="">Select a time slot</option>
                      {getTimeSlots().map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.time && (
                    <p id="time-error" className="mt-1 text-sm text-red-600">
                      {errors.time}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Additional Notes (Optional)
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                      className="block w-full sm:text-sm rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Any specific instructions or details about the service..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold mb-4">Confirm Your Booking</h2>
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Service Details</h3>
                <p className="text-gray-700">{serviceName}</p>
                <p className="text-gray-700 font-bold mt-1">
                  ₹{servicePrice.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Contact Information</h3>
                    <p className="text-gray-700">{formData.name}</p>
                    <p className="text-gray-700">{formData.email}</p>
                    <p className="text-gray-700">{formData.phone}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Service Address</h3>
                    <p className="text-gray-700">{formData.address}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Schedule</h3>
                    <p className="text-gray-700">Date: {formData.date}</p>
                    <p className="text-gray-700">Time: {formData.time}</p>
                  </div>
                  {formData.notes && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Additional Notes</h3>
                      <p className="text-gray-700">{formData.notes}</p>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="online"
                        checked={formData.paymentMethod === 'online'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'online' })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 flex items-center">
                        <FaCreditCard className="h-5 w-5 text-blue-500 mr-1" />
                        Pay Online
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={formData.paymentMethod === 'cash'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 flex items-center">
                        <FaMoneyBillWave className="h-5 w-5 text-green-500 mr-1" />
                        Pay Cash
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <FaInfoCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Important Information</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Technician details will be shared with you once assigned. You will receive
                      notifications about your booking status.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Back
            </button>
          ) : (
            <div></div>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next
              <FaArrowRight className="ml-2 h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm Booking
                  <FaCheckCircle className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
