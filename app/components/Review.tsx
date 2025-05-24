"use client";
import React, { useEffect, useRef } from "react";

const ReviewCarousel = () => {
  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Load Elfsight script dynamically
    const script = document.createElement("script");
    script.src = "https://static.elfsight.com/platform/platform.js";
    script.async = true;
    document.body.appendChild(script);

    // Auto-scroll every 5 seconds
    const intervalId = setInterval(() => {
      scrollRight();
    }, 5000); // Changed to 5000ms (5 seconds) for better UX

    return () => {
      clearInterval(intervalId);
      document.body.removeChild(script); // Cleanup script
    };
  }, []);

  const scrollLeft = () => {
    carouselRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    carouselRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-4 mt-4">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Customer Reviews
      </h2>
      <div className="relative w-full overflow-hidden">
        <div
          ref={carouselRef}
          className="flex space-x-6 no-scrollbar snap-x snap-mandatory scrollbar-hide"
        >
          {/* Elfsight Google Reviews Widget */}
          <div
            className="elfsight-app-d9ec9cc4-5b7a-44a8-a67d-c3cba9d82979 min-w-[300px] h-[400px]"
            data-elfsight-app-lazy
          ></div>
          {/* Add more review widgets here if needed */}
        </div>
        <div className="mt-4 flex justify-center space-x-4">
          <button
            onClick={scrollLeft}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ← Previous
          </button>
          <button
            onClick={scrollRight}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewCarousel;