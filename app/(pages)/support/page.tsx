"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaHeadset, FaSpinner, FaPaperPlane, FaPhone, FaWhatsapp, FaEnvelope, FaComments, FaQuestionCircle, FaFileAlt, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import useAuth from '@/app/hooks/useAuth';
import AdminRedirect from '@/app/components/AdminRedirect';

interface SupportTicket {
  _id: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export default function SupportPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets', 'faq', 'contact'

  // Get phone number from environment variable or use default
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER || '9112564731';
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '9112564731';
  const emailAddress = process.env.NEXT_PUBLIC_EMAIL_ADDRESS || 'support@dizitsolution.com';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error('Please log in to access support');
      router.push('/login');
      return;
    }

    if (isAuthenticated && user) {
      fetchTickets();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const fetchTickets = async () => {
    try {
      setIsLoadingTickets(true);
      setError(null);

      const response = await fetch('/api/user/support/tickets');

      if (!response.ok) {
        throw new Error('Failed to fetch support tickets');
      }

      const data = await response.json();

      if (data.success) {
        setTickets(data.tickets || []);
      } else {
        throw new Error(data.message || 'Failed to fetch support tickets');
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      setError('Failed to load your support tickets. Please try again later.');
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/user/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, message }),
      });

      if (!response.ok) {
        throw new Error('Failed to create support ticket');
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Support ticket created successfully');
        setSubject('');
        setMessage('');
        setShowNewTicketForm(false);
        fetchTickets();
      } else {
        throw new Error(data.message || 'Failed to create support ticket');
      }
    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast.error('Failed to create support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || isLoadingTickets) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-600 text-4xl mx-auto mb-4" />
          <p className="text-gray-600">Loading support center...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminRedirect />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Center</h1>
          <p className="text-gray-600">Get help with your bookings and services</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tickets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaFileAlt className="inline-block mr-2" />
              My Tickets
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'faq'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaQuestionCircle className="inline-block mr-2" />
              FAQ
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contact'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaPhone className="inline-block mr-2" />
              Contact Us
            </button>
          </nav>
        </div>

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div>
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => setShowNewTicketForm(!showNewTicketForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {showNewTicketForm ? 'Cancel' : 'New Ticket'}
              </button>
            </div>

            {showNewTicketForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-lg shadow-md overflow-hidden mb-8"
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Create New Support Ticket</h2>
                </div>
                <form onSubmit={handleSubmitTicket} className="p-6">
                  <div className="mb-4">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Please provide details about your issue"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane className="mr-2" />
                          Submit Ticket
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {error ? (
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <FaExclamationCircle className="text-red-500 text-3xl mx-auto mb-2" />
                <p className="text-red-700">{error}</p>
                <p className="text-gray-600 mt-2 mb-4">Support tickets are managed by our admin team. Please try again later or use one of the contact methods below.</p>
                <button
                  onClick={fetchTickets}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FaHeadset className="text-gray-400 text-4xl mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">No support tickets</h3>
                <p className="text-gray-500 mb-4">You haven't created any support tickets yet.</p>
                <button
                  onClick={() => setShowNewTicketForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Your First Ticket
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <li key={ticket._id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{ticket.subject}</h3>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{ticket.message}</p>
                          <p className="mt-2 text-xs text-gray-500">Created on {formatDate(ticket.createdAt)}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Frequently Asked Questions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900">How do I book a service?</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    You can book a service by browsing our services page, selecting the service you need, and following the booking process. You'll need to select a date and time, provide your address, and complete the payment.
                  </p>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">How can I reschedule my booking?</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    You can reschedule your booking by going to the "My Bookings" page, finding the booking you want to reschedule, and clicking on the "Reschedule" button. You'll be able to select a new date and time.
                  </p>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">What is your cancellation policy?</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    You can cancel your booking up to 24 hours before the scheduled service time for a full refund. Cancellations made less than 24 hours before the service time may be subject to a cancellation fee.
                  </p>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">How do I get an invoice for my service?</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Invoices are automatically generated for completed services. You can download your invoice from the "Order History" page by clicking on the download button next to your order.
                  </p>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">What payment methods do you accept?</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    We accept various payment methods including credit/debit cards, UPI, and net banking through our secure payment gateway.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Contact Us</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a
                  href={`tel:${phoneNumber}`}
                  className="flex flex-col items-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FaPhone className="text-blue-600 text-3xl mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Call Us</h3>
                  <p className="text-gray-600 text-center">{phoneNumber}</p>
                  <p className="text-sm text-gray-500 mt-2">Available 9 AM - 8 PM</p>
                </a>

                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <FaWhatsapp className="text-green-600 text-3xl mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">WhatsApp</h3>
                  <p className="text-gray-600 text-center">{whatsappNumber}</p>
                  <p className="text-sm text-gray-500 mt-2">Quick responses</p>
                </a>

                <a
                  href={`mailto:${emailAddress}`}
                  className="flex flex-col items-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <FaEnvelope className="text-purple-600 text-3xl mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Email</h3>
                  <p className="text-gray-600 text-center">{emailAddress}</p>
                  <p className="text-sm text-gray-500 mt-2">24/7 support</p>
                </a>
              </div>

              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-4">
                  <FaComments className="text-blue-600 text-xl mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Live Chat</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Need immediate assistance? Start a live chat with our support team.
                </p>
                <button
                  onClick={() => window.open('https://tawk.to/chat/YOUR_TAWK_TO_ID/default', '_blank')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Start Live Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
