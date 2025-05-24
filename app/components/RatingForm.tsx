"use client";

import { useState, useEffect } from "react";
import { FaStar, FaSpinner } from "react-icons/fa";
import { toast } from "react-hot-toast";

interface RatingFormProps {
  bookingId: string;
  onRatingSubmitted?: () => void;
  className?: string;
}

export default function RatingForm({ bookingId, onRatingSubmitted, className = "" }: RatingFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [existingRating, setExistingRating] = useState<any>(null);

  useEffect(() => {
    // Check if the booking has already been rated
    const checkExistingRating = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`/api/bookings/rating?bookingId=${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.rating) {
            setExistingRating(data.rating);
            setRating(data.rating.rating);
            setComment(data.rating.comment);
            setHasRated(true);
          }
        }
      } catch (error) {
        console.error("Error checking existing rating:", error);
      }
    };

    if (bookingId) {
      checkExistingRating();
    }
  }, [bookingId]);

  const handleRatingClick = (value: number) => {
    if (!hasRated) {
      setRating(value);
    }
  };

  const handleRatingHover = (value: number) => {
    if (!hasRated) {
      setHoverRating(value);
    }
  };

  const handleRatingLeave = () => {
    setHoverRating(0);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!hasRated) {
      setComment(e.target.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasRated) {
      toast.error("You have already rated this booking");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setIsSubmitting(true);

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to submit a rating");
        return;
      }

      const response = await fetch("/api/bookings/rating", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId,
          rating,
          comment
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Rating submitted successfully");
        setHasRated(true);
        if (onRatingSubmitted) {
          onRatingSubmitted();
        }
      } else {
        toast.error(data.message || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("An error occurred while submitting your rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStar = (value: number) => {
    const filled = (hoverRating || rating) >= value;
    return (
      <FaStar
        key={value}
        className={`h-8 w-8 cursor-pointer transition-colors ${
          filled ? "text-yellow-400" : "text-gray-300"
        } ${hasRated ? "cursor-not-allowed" : "hover:text-yellow-400"}`}
        onClick={() => handleRatingClick(value)}
        onMouseEnter={() => handleRatingHover(value)}
        onMouseLeave={handleRatingLeave}
      />
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {hasRated ? "Your Rating" : "Rate Your Experience"}
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate the technician's service?
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map(renderStar)}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            id="comment"
            rows={4}
            value={comment}
            onChange={handleCommentChange}
            disabled={hasRated}
            placeholder="Share your experience with the technician..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        {!hasRated && (
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin h-5 w-5 mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Rating"
            )}
          </button>
        )}

        {hasRated && (
          <div className="text-center text-sm text-gray-500">
            Thank you for your feedback! Your rating has been submitted.
          </div>
        )}
      </form>
    </div>
  );
}
