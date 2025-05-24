"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaSpinner,
  FaStar,
  FaExclamationTriangle,
  FaFilter,
  FaSearch,
  FaCalendarAlt,
  FaUser,
  FaQuoteLeft,
  FaQuoteRight,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

// Define Review interface
interface Review {
  _id: string;
  bookingId: string;
  userId: string;
  technicianId: string;
  rating: number;
  comment: string;
  service: string;
  createdAt: string;
  customerName?: string;
}

// Define Rating Summary interface
interface RatingSummary {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function TechnicianReviews() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<RatingSummary>({
    averageRating: 0,
    totalRatings: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      toast.error("Please login to access your reviews");
      router.push("/login");
      return;
    }

    // Parse user data
    try {
      const user = JSON.parse(userStr);
      if (user.role !== "technician") {
        toast.error("Unauthorized access");
        router.push("/login");
        return;
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      toast.error("Authentication error. Please login again.");
      router.push("/login");
      return;
    }

    fetchReviews();
  }, [router]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const userStr = localStorage.getItem("user");
      if (!userStr) {
        throw new Error("User data not found");
      }

      const user = JSON.parse(userStr);
      const technicianId = user._id || user.id;

      if (!technicianId) {
        throw new Error("Technician ID not found");
      }

      // Fetch reviews from API
      const response = await fetch(`/api/technicians/ratings?technicianId=${technicianId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Add customer names to reviews if they're missing
        const reviewsWithNames = data.ratings.map((review: Review) => {
          if (!review.customerName) {
            return {
              ...review,
              customerName: "Customer"
            };
          }
          return review;
        });

        setReviews(reviewsWithNames);
        setFilteredReviews(reviewsWithNames);
        setSummary(data.summary);
      } else {
        throw new Error(data.message || "Failed to fetch reviews");
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setError("Failed to fetch reviews. Please try again later.");


    } finally {
      setLoading(false);
    }
  };

  // Filter reviews based on rating and search query
  useEffect(() => {
    let filtered = reviews;

    // Apply rating filter
    if (ratingFilter !== "all") {
      const ratingValue = parseInt(ratingFilter);
      filtered = filtered.filter(review => review.rating === ratingValue);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(review =>
        (review.customerName ?? "Customer").toLowerCase().includes(query) ||
        review.service.toLowerCase().includes(query) ||
        review.comment.toLowerCase().includes(query)
      );
    }

    setFilteredReviews(filtered);
  }, [ratingFilter, searchQuery, reviews]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Render stars based on rating
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <FaStar
        key={index}
        className={`h-4 w-4 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          See what customers are saying about your service
        </p>
      </div>

      {/* Rating Summary */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-4">
              <FaStar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">Overall Rating</h2>
              <div className="flex items-center mt-1">
                <span className="text-3xl font-bold text-gray-900 mr-2">{summary.averageRating.toFixed(1)}</span>
                <div className="flex">
                  {renderStars(Math.round(summary.averageRating))}
                </div>
                <span className="ml-2 text-sm text-gray-500">({summary.totalRatings} reviews)</span>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex items-center">
              <div className="w-32">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 w-8">5★</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-yellow-400 rounded-full"
                      style={{ width: `${summary.totalRatings > 0 ? (summary.ratingDistribution[5] / summary.totalRatings) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">
                    {summary.ratingDistribution[5]}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-sm font-medium text-gray-600 w-8">4★</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-yellow-400 rounded-full"
                      style={{ width: `${(reviews.filter(r => r.rating === 4).length / reviews.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">
                    {reviews.filter(r => r.rating === 4).length}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-sm font-medium text-gray-600 w-8">3★</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-yellow-400 rounded-full"
                      style={{ width: `${(reviews.filter(r => r.rating === 3).length / reviews.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">
                    {reviews.filter(r => r.rating === 3).length}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-sm font-medium text-gray-600 w-8">2★</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-yellow-400 rounded-full"
                      style={{ width: `${(reviews.filter(r => r.rating === 2).length / reviews.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">
                    {reviews.filter(r => r.rating === 2).length}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-sm font-medium text-gray-600 w-8">1★</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-yellow-400 rounded-full"
                      style={{ width: `${(reviews.filter(r => r.rating === 1).length / reviews.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">
                    {reviews.filter(r => r.rating === 1).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <label htmlFor="rating-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Rating Filter
              </label>
              <div className="relative">
                <select
                  id="rating-filter"
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <FaFilter className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Reviews
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Search by name, service, or comment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <FaExclamationTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchReviews}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
          >
            Try again
          </button>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <FaStar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No reviews found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || ratingFilter !== "all"
              ? "Try changing your filters or search query"
              : "You don't have any reviews yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredReviews.map((review) => (
            <div key={review._id} className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {review.service}
                    </h3>
                    <div className="mt-1 flex items-center">
                      <div className="flex">
                        {renderStars(review.rating)}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaUser className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {review.customerName}
                    </span>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600 italic">
                  <FaQuoteLeft className="h-3 w-3 text-gray-400 inline mr-1" />
                  {review.comment}
                  <FaQuoteRight className="h-3 w-3 text-gray-400 inline ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
