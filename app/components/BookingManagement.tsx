'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface BookingManagementProps {
  bookingId: string;
  orderId: string;
  currentDate?: string;
  currentTime?: string;
  status: string;
  onRescheduleSuccess: () => void;
  onCancelSuccess: () => void;
}

const BookingManagement: React.FC<BookingManagementProps> = ({
  bookingId,
  orderId,
  currentDate,
  currentTime,
  status,
  onRescheduleSuccess,
  onCancelSuccess
}) => {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [newDate, setNewDate] = useState(currentDate || '');
  const [newTime, setNewTime] = useState(currentTime || '');
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  // Calculate maximum date (3 months from now)
  const maxDate = new Date(today.setMonth(today.getMonth() + 3)).toISOString().split('T')[0];

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDate || !newTime) {
      toast.error('Please select both date and time');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/bookings/reschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          orderId,
          newDate,
          newTime
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Booking rescheduled successfully');
        setIsRescheduling(false);
        onRescheduleSuccess();
      } else {
        toast.error(data.message || 'Failed to reschedule booking');
      }
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      toast.error('An error occurred while rescheduling');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cancelReason) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          orderId,
          reason: cancelReason
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Booking cancelled successfully');
        setIsCancelling(false);
        onCancelSuccess();
      } else {
        toast.error(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('An error occurred while cancelling');
    } finally {
      setLoading(false);
    }
  };

  // Check if booking can be managed (not completed or cancelled)
  const canManageBooking = !['completed', 'cancelled'].includes(status.toLowerCase());

  if (!canManageBooking) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-600 text-sm">
          This booking cannot be modified as it is already {status.toLowerCase()}.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-800">Manage Your Booking</h3>
      </div>

      <div className="p-4">
        {!isRescheduling && !isCancelling ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsRescheduling(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-1"
            >
              Reschedule
            </button>
            <button
              onClick={() => setIsCancelling(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex-1"
            >
              Cancel Booking
            </button>
          </div>
        ) : isRescheduling ? (
          <motion.form 
            onSubmit={handleReschedule}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={minDate}
                max={maxDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a time</option>
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="01:00 PM">01:00 PM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:00 PM">03:00 PM</option>
                <option value="04:00 PM">04:00 PM</option>
                <option value="05:00 PM">05:00 PM</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRescheduling(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Confirm Reschedule'}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.form 
            onSubmit={handleCancel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
                placeholder="Please provide a reason for cancelling this booking"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelling(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Confirm Cancellation'}
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
};

export default BookingManagement;
