"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaTag, FaPercent, FaRupeeSign, FaArrowRight } from "react-icons/fa";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
  order: number;
}

interface Discount {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function ServicesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [discounts, setDiscounts] = useState<Record<string, Discount[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch service categories
      const response = await fetch("/api/services/categories");
      
      if (!response.ok) {
        throw new Error("Failed to fetch service categories");
      }
      
      const data = await response.json();
      
      if (data.success && data.categories) {
        setCategories(data.categories);
        
        // Fetch discounts for each category
        const discountPromises = data.categories.map((category: Category) => 
          fetchDiscountsForCategory(category._id, category.slug)
        );
        
        await Promise.all(discountPromises);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load service categories. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscountsForCategory = async (categoryId: string, slug: string) => {
    try {
      const response = await fetch(`/api/discounts/category/${slug}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.discounts && data.discounts.length > 0) {
          setDiscounts(prev => ({
            ...prev,
            [categoryId]: data.discounts
          }));
        }
      }
    } catch (error) {
      console.error(`Error fetching discounts for category ${categoryId}:`, error);
    }
  };

  // Get default image for a category
  const getCategoryImage = (category: Category) => {
    if (category.imageUrl) return category.imageUrl;
    
    const defaultImages: Record<string, string> = {
      'ac-services': '/images/services/ac-service.jpg',
      'washing-machine-services': '/images/services/washing-machine.jpg',
      'refrigerator-services': '/images/services/refrigerator.jpg',
      'microwave-services': '/images/services/microwave.jpg',
      'tv-services': '/images/services/tv.jpg'
    };
    
    return defaultImages[category.slug] || '/images/services/default.jpg';
  };

  // Format discount for display
  const formatDiscount = (discount: Discount) => {
    if (discount.discountType === 'percentage') {
      return `${discount.discountValue}% OFF`;
    } else {
      return `₹${discount.discountValue} OFF`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Our Services
          </motion.h1>
          <motion.p
            className="text-lg text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Explore our range of professional services designed to meet all your home appliance needs
          </motion.p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category._id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="relative h-48">
                <Image
                  src={getCategoryImage(category)}
                  alt={category.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition-transform duration-300 hover:scale-105"
                />
                
                {/* Discount Badge */}
                {discounts[category._id] && discounts[category._id].length > 0 && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 rounded-bl-lg font-medium flex items-center">
                    <FaTag className="mr-1" />
                    <span>{formatDiscount(discounts[category._id][0])}</span>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                
                {/* Discount Info */}
                {discounts[category._id] && discounts[category._id].length > 0 && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-md">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        {discounts[category._id][0].discountType === 'percentage' ? (
                          <FaPercent className="text-green-600 h-4 w-4" />
                        ) : (
                          <FaRupeeSign className="text-green-600 h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">{discounts[category._id][0].name}</p>
                        <p className="text-xs text-green-700">
                          {formatDiscount(discounts[category._id][0])} on all {category.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <Link href={`/services/${category.slug}`}>
                  <div className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-800">
                    View Services <FaArrowRight className="ml-2" />
                  </div>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
