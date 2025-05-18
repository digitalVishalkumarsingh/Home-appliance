"use client";

import React from 'react';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';

const AuthFooter = () => {
  const currentYear = new Date().getFullYear();

  // Sample customer reviews
  const reviews = [
    {
      id: 1,
      name: "Rahul Sharma",
      text: "Excellent service! The technician was very professional and fixed my AC in no time.",
      rating: 5,
    },
    {
      id: 2,
      name: "Priya Patel",
      text: "Very reliable and affordable service. Will definitely recommend to friends and family.",
      rating: 5,
    },
    {
      id: 3,
      name: "Amit Kumar",
      text: "Prompt service and excellent customer support. My washing machine works like new now!",
      rating: 4,
    },
  ];

  return (
    <footer className="bg-gray-800 text-white py-6 mt-6">
      <div className="container mx-auto px-4">
        {/* Customer Reviews Section */}
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2 text-center">Customer Reviews</h3>
          <h4 className="text-base font-medium mb-4 text-center text-gray-300">What Our Customers Say</h4>

          {/* Mobile Carousel for Reviews */}
          <div className="block md:hidden">
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex space-x-4" style={{ minWidth: 'min-content' }}>
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-gray-700 p-4 rounded-lg shadow-md flex-shrink-0"
                    style={{ width: 'calc(100vw - 64px)' }}
                  >
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={i < review.rating ? "text-yellow-400" : "text-gray-500"}
                        />
                      ))}
                    </div>
                    <div className="mb-3">
                      <FaQuoteLeft className="text-indigo-400 mb-2" />
                      <p className="text-gray-300 text-sm">{review.text}</p>
                    </div>
                    <p className="font-medium text-sm">- {review.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Grid for Reviews */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-700 p-4 rounded-lg shadow-md">
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={i < review.rating ? "text-yellow-400" : "text-gray-500"}
                    />
                  ))}
                </div>
                <div className="mb-3">
                  <FaQuoteLeft className="text-indigo-400 mb-2" />
                  <p className="text-gray-300 text-sm">{review.text}</p>
                </div>
                <p className="font-medium text-sm">- {review.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Company Info */}
        <div className="text-center pt-4 border-t border-gray-700">
          <p className="mb-2 text-gray-400 text-sm">Providing quality home appliance services in Varanasi</p>
          <p className="text-xs text-gray-500">© {currentYear} Dizit Solutions. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default AuthFooter;
