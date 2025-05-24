"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaSearch,
  FaSpinner,
  FaUserCog,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaStar,
  FaCheck,
  FaTimes,
  FaKey,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Pagination from "@/app/components/admin/Pagination";

interface Technician {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specializations: string[];
  status: "active" | "inactive";
  rating?: number;
  completedBookings?: number;
  createdAt: string;
  stats?: {
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
  };
}

interface PaginationData {
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
}

interface Props {
  initialTechnicians: Technician[];
  initialPagination: PaginationData;
  token: string;
}

export default function TechniciansClient({
  initialTechnicians,
  initialPagination,
  token,
}: Props) {
  const [technicians, setTechnicians] = useState<Technician[]>(initialTechnicians);
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>(initialTechnicians);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [specializationFilter, setSpecializationFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Technician>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pagination, setPagination] = useState<PaginationData>(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resendingPasswordId, setResendingPasswordId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const allSpecializations = technicians.flatMap((tech) => tech.specializations || []);
    const uniqueSpecializations = [...new Set(allSpecializations)];
    setSpecializations(uniqueSpecializations);
  }, [technicians]);

  const fetchTechnicians = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const skip = (currentPage - 1) * pagination.limit;
      const queryParams = new URLSearchParams({
        limit: pagination.limit.toString(),
        skip: skip.toString(),
        sort: sortField,
        order: sortOrder,
      });

      if (searchTerm) queryParams.append("search", searchTerm);
      if (statusFilter !== "all") queryParams.append("status", statusFilter);
      if (specializationFilter !== "all") queryParams.append("specialization", specializationFilter);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${apiUrl}/admin/technicians?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch technicians: ${response.status}`);

      const data = await response.json();
      if (data.success && Array.isArray(data.technicians)) {
        setTechnicians(data.technicians);
        setFilteredTechnicians(data.technicians);
        setPagination({
          total: data.pagination?.total || data.technicians.length,
          limit: data.pagination?.limit || 10,
          skip: data.pagination?.skip || 0,
          hasMore: data.pagination?.hasMore || false,
        });
      } else {
        throw new Error(data.message || "Invalid response from server");
      }
    } catch (error) {
      console.error("Error fetching technicians:", error);
      setError(error instanceof Error ? error.message : "Failed to load technicians.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortField, sortOrder, statusFilter, specializationFilter, searchTerm, token, pagination.limit]);

  useEffect(() => {
    if (currentPage !== 1 || searchTerm || statusFilter !== "all" || specializationFilter !== "all") {
      fetchTechnicians();
    }
  }, [fetchTechnicians, currentPage, searchTerm, statusFilter, specializationFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTechnicians();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: keyof Technician) => {
    setSortField(field);
    setSortOrder(sortField === field && sortOrder === "asc" ? "desc" : "asc");
  };

  const getSortIcon = (field: keyof Technician) => {
    if (sortField !== field) return <FaSort className="ml-1" />;
    return sortOrder === "asc" ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleDeleteTechnician = async (id: string) => {
    try {
      setDeletingId(id);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${apiUrl}/admin/technicians/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete technician: ${response.status}`);
      }

      toast.success("Technician deleted successfully");
      fetchTechnicians();
    } catch (error) {
      console.error("Error deleting technician:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete technician.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleResendPassword = async (id: string) => {
    try {
      setResendingPasswordId(id);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${apiUrl}/admin/technicians/${id}/resend-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`Failed to resend password: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        toast.success(data.emailSent ? "Credentials sent to email" : "Password reset, email failed");
      } else {
        throw new Error(data.message || "Failed to resend password");
      }
    } catch (error) {
      console.error("Error resending password:", error);
      toast.error(error instanceof Error ? error.message : "Failed to resend password.");
    } finally {
      setResendingPasswordId(null);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Technicians</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your service technicians</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/technicians/add"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2 -ml-1 h-5 w-5" />
            Add Technician
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-2">
            <form onSubmit={handleSearch}>
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
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 px-3 flex items-center bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="specialization-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Specialization
            </label>
            <select
              id="specialization-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
            >
              <option value="all">All Specializations</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : filteredTechnicians.length === 0 ? (
          <div className="text-center py-12">
            <FaUserCog className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No technicians found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new technician.</p>
            <div className="mt-6">
              <Link
                href="/admin/technicians/add"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaPlus className="mr-2 -ml-1 h-5 w-5" />
                Add Technician
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Technician {getSortIcon("name")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("specializations")}
                  >
                    <div className="flex items-center">
                      Specializations {getSortIcon("specializations")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status {getSortIcon("status")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("rating")}
                  >
                    <div className="flex items-center">
                      Rating {getSortIcon("rating")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("completedBookings")}
                  >
                    <div className="flex items-center">
                      Bookings {getSortIcon("completedBookings")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTechnicians.map((technician) => (
                  <tr key={technician._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUserCog className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{technician.name}</div>
                          <div className="text-sm text-gray-500">{technician.email}</div>
                          <div className="text-sm text-gray-500">{technician.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {technician.specializations?.map((spec, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          technician.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {technician.status === "active" ? (
                          <FaCheck className="mr-1 h-3 w-3 mt-0.5" />
                        ) : (
                          <FaTimes className="mr-1 h-3 w-3 mt-0.5" />
                        )}
                        {technician.status.charAt(0).toUpperCase() + technician.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaStar className="text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {technician.rating ? technician.rating.toFixed(1) : "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {technician.stats?.totalBookings || 0} total
                      </div>
                      <div className="text-sm text-gray-500">
                        {technician.stats?.completedBookings || 0} completed
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/admin/technicians/${technician._id}`}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100"
                          title="View Details"
                        >
                          <FaEye />
                        </Link>
                        <Link
                          href={`/admin/technicians/${technician._id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-100"
                          title="Edit Technician"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => handleResendPassword(technician._id)}
                          disabled={resendingPasswordId === technician._id}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-100 disabled:opacity-50"
                          title="Resend Password"
                        >
                          {resendingPasswordId === technician._id ? (
                            <FaSpinner className="animate-spin h-4 w-4" />
                          ) : (
                            <FaKey />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteTechnician(technician._id)}
                          disabled={deletingId === technician._id}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100 disabled:opacity-50"
                          title="Delete Technician"
                        >
                          {deletingId === technician._id ? (
                            <FaSpinner className="animate-spin h-4 w-4" />
                          ) : (
                            <FaTrash />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filteredTechnicians.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          maxPageButtons={5}
        />
      )}
    </div>
  );
}