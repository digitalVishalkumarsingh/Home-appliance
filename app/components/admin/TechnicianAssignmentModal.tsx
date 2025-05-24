"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaUserCog,
  FaSpinner,
  FaCheck,
  FaStar,
  FaSearch,
  FaFilter,
  FaExclamationTriangle,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

interface Technician {
  _id: string;
  name: string;
  phone: string;
  email: string;
  specializations: string[];
  status: string;
  rating?: number;
  completedBookings?: number;
}

interface TechnicianAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  serviceType: string;
  onAssignSuccess: () => void;
}

export default function TechnicianAssignmentModal({
  isOpen,
  onClose,
  bookingId,
  serviceType,
  onAssignSuccess,
}: TechnicianAssignmentModalProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "online">("all");
  const [assigningTechnicianId, setAssigningTechnicianId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableTechnicians();
    }
  }, [isOpen, bookingId, serviceType]);

  useEffect(() => {
    // Filter technicians based on search term and status filter
    let filtered = [...technicians];
    
    if (searchTerm) {
      filtered = filtered.filter(tech => 
        tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.phone.includes(searchTerm)
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(tech => tech.status === statusFilter);
    }
    
    setFilteredTechnicians(filtered);
  }, [technicians, searchTerm, statusFilter]);

  const fetchAvailableTechnicians = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found");
        return;
      }

      const response = await fetch(`/api/admin/technicians/assign?bookingId=${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch technicians: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTechnicians(data.technicians);
        setFilteredTechnicians(data.technicians);
      } else {
        throw new Error(data.message || "Failed to fetch technicians");
      }
    } catch (error: any) {
      console.error("Error fetching technicians:", error);
      setError(error.message || "Failed to load technicians. Please try again.");
      
      // For demo purposes, set mock data if API fails
      const mockTechnicians = [
        {
          _id: "1",
          name: "Rajesh Kumar",
          email: "rajesh@example.com",
          phone: "9876543210",
          specializations: ["AC Repair", "Refrigerator"],
          status: "online",
          rating: 4.8,
          completedBookings: 45
        },
        {
          _id: "2",
          name: "Sunil Verma",
          email: "sunil@example.com",
          phone: "8765432109",
          specializations: ["Washing Machine", "Microwave"],
          status: "active",
          rating: 4.5,
          completedBookings: 32
        },
        {
          _id: "3",
          name: "Amit Singh",
          email: "amit@example.com",
          phone: "7654321098",
          specializations: ["AC Repair", "TV Repair"],
          status: "online",
          rating: 4.2,
          completedBookings: 28
        }
      ];
      
      setTechnicians(mockTechnicians);
      setFilteredTechnicians(mockTechnicians);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTechnician = async (technicianId: string) => {
    try {
      setAssigningTechnicianId(technicianId);
      
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found");
        return;
      }

      const response = await fetch("/api/admin/technicians/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          technicianId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to assign technician: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success("Technician assigned successfully");
        onAssignSuccess();
        onClose();
      } else {
        throw new Error(data.message || "Failed to assign technician");
      }
    } catch (error: any) {
      console.error("Error assigning technician:", error);
      toast.error(error.message || "Failed to assign technician. Please try again.");
    } finally {
      setAssigningTechnicianId(null);
    }
  };

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
                  <h3 className="text-lg font-medium">Assign Technician</h3>
                  <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 focus:outline-none"
                  >
                    <FaTimes className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Service Info */}
                  <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Service Information</h4>
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Booking ID:</span> {bookingId}
                    </p>
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Service Type:</span> {serviceType}
                    </p>
                  </div>

                  {/* Search and Filter */}
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <div className="relative">
                        <input
                          type="text"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Search technicians..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <FaSearch className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <select
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "online")}
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="online">Online</option>
                      </select>
                    </div>
                  </div>

                  {/* Technicians List */}
                  {loading ? (
                    <div className="flex justify-center items-center h-64">
                      <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <FaExclamationTriangle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  ) : filteredTechnicians.length === 0 ? (
                    <div className="text-center py-12">
                      <FaUserCog className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No technicians found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No technicians available for this service type.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredTechnicians.map((technician) => (
                        <div
                          key={technician._id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <FaUserCog className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-gray-900">{technician.name}</h4>
                                <div className="flex items-center mt-1">
                                  <FaStar className="h-3 w-3 text-yellow-400 mr-1" />
                                  <span className="text-xs text-gray-500">
                                    {technician.rating?.toFixed(1) || "N/A"} ({technician.completedBookings || 0} jobs)
                                  </span>
                                </div>
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center text-xs text-gray-500">
                                    <FaPhone className="h-3 w-3 mr-1" />
                                    {technician.phone}
                                  </div>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <FaEnvelope className="h-3 w-3 mr-1" />
                                    {technician.email}
                                  </div>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {technician.specializations.map((spec, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {spec}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                technician.status === "online"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {technician.status}
                            </span>
                          </div>
                          <div className="mt-4">
                            <button
                              onClick={() => handleAssignTechnician(technician._id)}
                              disabled={assigningTechnicianId === technician._id}
                              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                            >
                              {assigningTechnicianId === technician._id ? (
                                <>
                                  <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                                  Assigning...
                                </>
                              ) : (
                                <>
                                  <FaCheck className="mr-2 h-4 w-4" />
                                  Assign
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 text-right">
                  <button
                    onClick={onClose}
                    className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
