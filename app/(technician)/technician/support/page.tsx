"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  FaHeadset,
  FaSpinner,
  FaPaperPlane,
  FaPhone,
  FaWhatsapp,
  FaEnvelope,
  FaComments,
  FaQuestionCircle,
  FaFileAlt,
  FaExclamationCircle,
  FaTools,
  FaUser,
  FaArrowLeft,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaPlus,
  FaSearch,
} from "react-icons/fa";
import Link from "next/link";
import useAuth from "@/app/hooks/useAuth";

interface SupportTicket {
  _id: string;
  subject: string;
  message: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
  responses?: Array<{
    message: string;
    isAdmin: boolean;
    createdAt: string;
  }>;
}

export default function TechnicianSupportPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("tickets");
  const [searchTerm, setSearchTerm] = useState("");

  // Contact information
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER || "9112564731";
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "9112564731";
  const emailAddress = process.env.NEXT_PUBLIC_EMAIL_ADDRESS || "support@dizitsolution.com";

  // Support categories
  const categories = [
    { value: "general", label: "General Support" },
    { value: "technical", label: "Technical Issues" },
    { value: "payment", label: "Payment & Earnings" },
    { value: "booking", label: "Booking Issues" },
    { value: "account", label: "Account Management" },
    { value: "app", label: "App Problems" },
  ];

  // FAQ data for technicians
  const faqData = [
    {
      question: "How do I accept job notifications?",
      answer: "Make sure your availability toggle is ON (green) in the dashboard. You'll receive notifications every 10 seconds when new jobs are available. Click 'Accept Job' within 30 seconds to get the assignment."
    },
    {
      question: "Why am I not receiving job notifications?",
      answer: "Check: 1) Availability toggle is ON, 2) You're logged in properly, 3) Browser notifications are enabled, 4) You're in a service area with available jobs."
    },
    {
      question: "How do I complete a service and get paid?",
      answer: "After accepting a job: 1) Click 'Start Service' when you arrive, 2) Complete the work, 3) Click 'Complete Service', 4) Customer confirms completion, 5) Payment is processed to your earnings."
    },
    {
      question: "How do I update my profile and skills?",
      answer: "Go to Profile page → Edit your personal information, skills, certifications, and working hours. Keep your profile updated to get more relevant job offers."
    },
    {
      question: "How do I withdraw my earnings?",
      answer: "Go to Earnings page → Click 'Request Payout' → Choose payment method → Enter account details → Submit request. Admin will process within 24-48 hours."
    },
    {
      question: "What if a customer cancels or doesn't show up?",
      answer: "If customer cancels after you've started traveling, you may be eligible for compensation. Contact support with booking details for assistance."
    },
    {
      question: "How do I improve my rating?",
      answer: "Provide excellent service, arrive on time, communicate clearly with customers, complete jobs efficiently, and maintain professional behavior."
    },
    {
      question: "Can I work in multiple service areas?",
      answer: "Yes, update your service radius in Profile settings. You'll receive notifications for jobs within your specified radius from your location."
    }
  ];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error("Please login to access support");
      router.push("/login");
      return;
    }

    if (!isLoading && user?.role !== "technician") {
      toast.error("Unauthorized access");
      router.push("/login");
      return;
    }

    if (isAuthenticated && user?.role === "technician") {
      fetchTickets();
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchTickets = async () => {
    try {
      setIsLoadingTickets(true);
      setError(null);

      // For now, return demo tickets since API might not exist
      const demoTickets: SupportTicket[] = [
        {
          _id: "ticket_1",
          subject: "Job notification not working",
          message: "I'm not receiving job notifications even though my availability is ON.",
          category: "technical",
          priority: "high",
          status: "in_progress",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          responses: [
            {
              message: "We're looking into this issue. Please try logging out and back in.",
              isAdmin: true,
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        },
        {
          _id: "ticket_2",
          subject: "Payment not received",
          message: "Completed a job 3 days ago but payment is still pending.",
          category: "payment",
          priority: "medium",
          status: "resolved",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          responses: [
            {
              message: "Payment has been processed. Please check your earnings page.",
              isAdmin: true,
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        }
      ];

      setTickets(demoTickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setError("Failed to load support tickets");
      setTickets([]);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // For now, simulate ticket creation
      const newTicket: SupportTicket = {
        _id: `ticket_${Date.now()}`,
        subject: subject.trim(),
        message: message.trim(),
        category,
        priority,
        status: "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTickets(prev => [newTicket, ...prev]);
      setSubject("");
      setMessage("");
      setCategory("general");
      setPriority("medium");
      setShowNewTicketForm(false);
      toast.success("Support ticket created successfully!");
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create support ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <FaClock className="text-yellow-500" />;
      case "in_progress":
        return <FaSpinner className="text-blue-500" />;
      case "resolved":
        return <FaCheckCircle className="text-green-500" />;
      case "closed":
        return <FaTimesCircle className="text-gray-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaHeadset className="mr-3 text-blue-600" />
            Technician Support Center
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Get help with jobs, payments, and technical issues
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/technician/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaArrowLeft className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("tickets")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "tickets"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaFileAlt className="inline-block mr-2" />
            My Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab("faq")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "faq"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaQuestionCircle className="inline-block mr-2" />
            FAQ
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "contact"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaPhone className="inline-block mr-2" />
            Contact Support
          </button>
        </nav>
      </div>

      {/* Tickets Tab */}
      {activeTab === "tickets" && (
        <div>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowNewTicketForm(!showNewTicketForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPlus className="mr-2" />
              {showNewTicketForm ? "Cancel" : "New Ticket"}
            </button>
          </div>

          {/* New Ticket Form */}
          {showNewTicketForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Support Ticket</h3>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your issue in detail..."
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewTicketForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <FaSpinner className="animate-spin mr-2" />
                    ) : (
                      <FaPaperPlane className="mr-2" />
                    )}
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tickets List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center">
                <FaFileAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "No tickets match your search." : "You haven't created any support tickets yet."}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowNewTicketForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FaPlus className="mr-2" />
                    Create Your First Ticket
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <div key={ticket._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(ticket.status)}
                          <h3 className="text-lg font-medium text-gray-900">{ticket.subject}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{ticket.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Category: {categories.find(c => c.value === ticket.category)?.label}</span>
                          <span>•</span>
                          <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="capitalize">Status: {ticket.status.replace('_', ' ')}</span>
                        </div>
                        {ticket.responses && ticket.responses.length > 0 && (
                          <div className="mt-4 pl-4 border-l-2 border-blue-200">
                            <div className="text-sm">
                              <span className="font-medium text-blue-600">Support Response:</span>
                              <p className="text-gray-600 mt-1">{ticket.responses[ticket.responses.length - 1].message}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === "faq" && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <FaQuestionCircle className="mr-2 text-blue-600" />
              Frequently Asked Questions for Technicians
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {faqData.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <h3 className="text-md font-medium text-gray-900 mb-2 flex items-start">
                    <FaTools className="mr-2 mt-1 text-blue-600 flex-shrink-0" />
                    {faq.question}
                  </h3>
                  <p className="text-sm text-gray-600 ml-6">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === "contact" && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <FaPhone className="mr-2 text-blue-600" />
              Contact Support Team
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a
                href={`tel:${phoneNumber}`}
                className="flex flex-col items-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FaPhone className="text-blue-600 text-3xl mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Call Support</h3>
                <p className="text-gray-600 text-center">{phoneNumber}</p>
                <p className="text-sm text-gray-500 mt-2">Available 24/7</p>
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Email Support</h3>
                <p className="text-gray-600 text-center">{emailAddress}</p>
                <p className="text-sm text-gray-500 mt-2">Detailed assistance</p>
              </a>
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-4">
                <FaComments className="text-blue-600 text-xl mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Emergency Support</h3>
              </div>
              <p className="text-gray-600 mb-4">
                For urgent technical issues that prevent you from working, contact us immediately:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`tel:${phoneNumber}`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FaPhone className="mr-2" />
                  Emergency Call
                </a>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=URGENT: Technician support needed`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaWhatsapp className="mr-2" />
                  Emergency WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
