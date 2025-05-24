"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaUserCog,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaEdit,
  FaArrowLeft,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaStar,
  FaClipboardList,
  FaTools,
  FaClock,
  FaExclamationTriangle,
  FaKey,
  FaLock,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

interface Technician {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specializations: string[];
  status: "active" | "inactive";
  availability?: {
    monday?: { available: boolean; hours?: string };
    tuesday?: { available: boolean; hours?: string };
    wednesday?: { available: boolean; hours?: string };
    thursday?: { available: boolean; hours?: string };
    friday?: { available: boolean; hours?: string };
    saturday?: { available: boolean; hours?: string };
    sunday?: { available: boolean; hours?: string };
  };
  address?: string;
  notes?: string;
  rating?: number;
  completedBookings?: number;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
  };
}

interface Booking {
  _id: string;
  id?: string;
  bookingId?: string;
  customerName: string;
  service: string;
  date: string;
  time?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  amount: number;
  createdAt: string;
}

export default function TechnicianDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [resendingPassword, setResendingPassword] = useState(false);
  const [passwordInfo, setPasswordInfo] = useState<{password: string, email: string} | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchTechnicianDetails();
    }
  }, [params.id]);

  const fetchTechnicianDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found");
        return;
      }

      const response = await fetch(`/api/admin/technicians/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch technician details: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTechnician(data.technician);

        // Fetch recent bookings for this technician
        const bookingsResponse = await fetch(`/api/admin/technicians/${params.id}/bookings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          if (bookingsData.success) {
            setRecentBookings(bookingsData.bookings);
          }
        }
      } else {
        throw new Error(data.message || "Failed to fetch technician details");
      }
    } catch (error: any) {
      console.error("Error fetching technician details:", error);
      setError(error.message || "Failed to load technician details. Please try again.");

      // For demo purposes, set mock data if API fails
      if (!technician) {
        setTechnician({
          _id: params.id as string,
          name: "Rajesh Kumar",
          email: "rajesh@example.com",
          phone: "9876543210",
          specializations: ["AC Repair", "Refrigerator"],
          status: "active",
          availability: {
            monday: { available: true, hours: "9:00 AM - 6:00 PM" },
            tuesday: { available: true, hours: "9:00 AM - 6:00 PM" },
            wednesday: { available: true, hours: "9:00 AM - 6:00 PM" },
            thursday: { available: true, hours: "9:00 AM - 6:00 PM" },
            friday: { available: true, hours: "9:00 AM - 6:00 PM" },
            saturday: { available: true, hours: "9:00 AM - 6:00 PM" },
            sunday: { available: false, hours: "" },
          },
          address: "123 Main Street, Varanasi, UP",
          notes: "Experienced technician with 5+ years in AC and refrigerator repair.",
          rating: 4.8,
          completedBookings: 45,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stats: {
            totalBookings: 50,
            completedBookings: 45,
            pendingBookings: 2,
            confirmedBookings: 3
          }
        });

        setRecentBookings([
          {
            _id: "1",
            bookingId: "BK001",
            customerName: "Amit Sharma",
            service: "AC Repair",
            date: new Date().toISOString(),
            time: "10:00 AM",
            status: "completed",
            amount: 1200,
            createdAt: new Date().toISOString(),
          },
          {
            _id: "2",
            bookingId: "BK002",
            customerName: "Priya Patel",
            service: "Refrigerator Repair",
            date: new Date().toISOString(),
            time: "2:30 PM",
            status: "confirmed",
            amount: 800,
            createdAt: new Date().toISOString(),
          },
          {
            _id: "3",
            bookingId: "BK003",
            customerName: "Rahul Singh",
            service: "AC Service",
            date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            time: "11:00 AM",
            status: "pending",
            amount: 600,
            createdAt: new Date().toISOString(),
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!technician) return;

    try {
      setStatusUpdating(true);

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found");
        return;
      }

      const newStatus = technician.status === "active" ? "inactive" : "active";

      const response = await fetch(`/api/admin/technicians/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update technician status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTechnician({
          ...technician,
          status: newStatus,
        });
        toast.success(`Technician status updated to ${newStatus}`);
      } else {
        throw new Error(data.message || "Failed to update technician status");
      }
    } catch (error: any) {
      console.error("Error updating technician status:", error);
      toast.error(error.message || "Failed to update status. Please try again.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleResendPassword = async () => {
    if (!technician) return;

    try {
      setResendingPassword(true);
      setPasswordInfo(null); // Clear any previous password info

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found");
        return;
      }

      const response = await fetch(`/api/admin/technicians/${params.id}/resend-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to resend password: ${response.status}`);
      }

      const data = await response.json();
      console.log("Resend password response:", data);

      if (data.success) {
        // Check if debug info with password is available
        if (data.debug && data.debug.password) {
          setPasswordInfo({
            password: data.debug.password,
            email: technician.email
          });

          toast.success("Password reset successfully. See below for login credentials.");
        } else if (data.emailSent) {
          toast.success("Login credentials sent to technician's email successfully");
        } else {
          toast.error("Password reset successfully but failed to send email");
        }
      } else {
        throw new Error(data.message || "Failed to resend password");
      }
    } catch (error: any) {
      console.error("Error resending password:", error);
      toast.error(error.message || "Failed to resend password. Please try again.");
    } finally {
      setResendingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (error || !technician) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || "Failed to load technician details"}</p>
            </div>
            <div className="mt-4">
              <Link
                href="/admin/technicians"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaArrowLeft className="mr-2 -ml-1 h-4 w-4" />
                Back to Technicians
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Technician Details</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage technician information
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            href="/admin/technicians"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaArrowLeft className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
            Back to List
          </Link>
          <button
            onClick={handleResendPassword}
            disabled={resendingPassword}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 mr-3"
          >
            {resendingPassword ? (
              <FaSpinner className="animate-spin mr-2 -ml-1 h-5 w-5" />
            ) : (
              <FaKey className="mr-2 -ml-1 h-5 w-5" />
            )}
            Resend Password
          </button>
          <Link
            href={`/admin/technicians/${technician._id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaEdit className="mr-2 -ml-1 h-5 w-5" />
            Edit Technician
          </Link>
        </div>
      </div>

      {/* Password Information Card (only shown when password is available) */}
      {passwordInfo && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaKey className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Login Credentials</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="mb-1">The technician's password has been reset. Please provide these credentials to the technician:</p>
                <div className="bg-white p-3 rounded border border-yellow-200 font-mono text-sm">
                  <p><strong>Email:</strong> {passwordInfo.email}</p>
                  <p><strong>Password:</strong> {passwordInfo.password}</p>
                </div>
                <p className="mt-2 text-xs">Note: This information is only displayed once for security reasons.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Technician Profile Card */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Technician Profile</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and information.</p>
          </div>
          <div>
            <button
              onClick={handleStatusToggle}
              disabled={statusUpdating}
              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm ${
                technician.status === "active"
                  ? "text-white bg-green-600 hover:bg-green-700"
                  : "text-white bg-red-600 hover:bg-red-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
            >
              {statusUpdating ? (
                <FaSpinner className="animate-spin mr-1.5 h-3 w-3" />
              ) : technician.status === "active" ? (
                <FaCheck className="mr-1.5 h-3 w-3" />
              ) : (
                <FaTimes className="mr-1.5 h-3 w-3" />
              )}
              {technician.status === "active" ? "Active" : "Inactive"}
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <FaUserCog className="h-5 w-5 text-blue-600" />
                </div>
                {technician.name}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="flex items-center">
                  <FaEnvelope className="h-4 w-4 text-gray-400 mr-2" />
                  <a href={`mailto:${technician.email}`} className="text-blue-600 hover:text-blue-800">
                    {technician.email}
                  </a>
                </div>
                <div className="mt-1 text-xs text-gray-500 flex items-center">
                  <FaLock className="h-3 w-3 text-gray-400 mr-1" />
                  <span>Login credentials can be sent to this email using the "Resend Password" button</span>
                </div>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phone number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                <FaPhone className="h-4 w-4 text-gray-400 mr-2" />
                <a href={`tel:${technician.phone}`} className="text-blue-600 hover:text-blue-800">
                  {technician.phone}
                </a>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-start">
                <FaMapMarkerAlt className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                {technician.address || "No address provided"}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Specializations</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {technician.specializations?.map((spec, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      <FaTools className="mr-1 h-3 w-3" />
                      {spec}
                    </span>
                  ))}
                  {(!technician.specializations || technician.specializations.length === 0) && (
                    <span className="text-gray-500">No specializations listed</span>
                  )}
                </div>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Performance</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-blue-500 uppercase font-semibold">Rating</div>
                    <div className="mt-1 flex items-center">
                      <FaStar className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-lg font-semibold">{technician.rating?.toFixed(1) || "N/A"}</span>
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs text-green-500 uppercase font-semibold">Completed</div>
                    <div className="mt-1 flex items-center">
                      <FaCheck className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-lg font-semibold">{technician.stats?.completedBookings || 0}</span>
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="text-xs text-indigo-500 uppercase font-semibold">Total Bookings</div>
                    <div className="mt-1 flex items-center">
                      <FaClipboardList className="h-4 w-4 text-indigo-500 mr-1" />
                      <span className="text-lg font-semibold">{technician.stats?.totalBookings || 0}</span>
                    </div>
                  </div>
                </div>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Availability</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="space-y-2">
                  {technician.availability && Object.entries(technician.availability).map(([day, { available, hours }]) => (
                    <div key={day} className="flex items-center">
                      <span className="w-24 capitalize">{day}:</span>
                      {available ? (
                        <span className="flex items-center text-green-600">
                          <FaCheck className="h-3 w-3 mr-1" />
                          {hours || "Available"}
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <FaTimes className="h-3 w-3 mr-1" />
                          Not Available
                        </span>
                      )}
                    </div>
                  ))}
                  {!technician.availability && (
                    <span className="text-gray-500">No availability information</span>
                  )}
                </div>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {technician.notes || "No additional notes"}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Registered on</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                <FaCalendarAlt className="h-4 w-4 text-gray-400 mr-2" />
                {formatDate(technician.createdAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Bookings</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest service bookings assigned to this technician.</p>
        </div>
        <div className="border-t border-gray-200">
          {recentBookings.length === 0 ? (
            <div className="px-4 py-5 text-center text-gray-500">
              No bookings found for this technician
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <Link href={`/admin/bookings/${booking._id}`}>
                          {booking.bookingId || booking._id.substring(0, 8)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.service}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(booking.date)}
                        {booking.time && `, ${booking.time}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "confirmed"
                              ? "bg-blue-100 text-blue-800"
                              : booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{booking.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
