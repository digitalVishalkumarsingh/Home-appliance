"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { FaTag, FaPercent, FaRupeeSign, FaArrowRight, FaArrowLeft } from "react-icons/fa";
import DiscountSelector from "@/app/components/DiscountSelector";

interface Service {
  _id: string;
  id: string;
  title: string;
  desc: string;
  img: string;
  pricing?: any;
  details?: string[];
  categoryId?: string;
  type?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  imageUrl?: string;
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

export default function CategoryServicesPage() {
  const params = useParams();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.categorySlug) {
      fetchCategoryData();
    }
  }, [params.categorySlug]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const categorySlug = Array.isArray(params.categorySlug) 
        ? params.categorySlug[0] 
        : params.categorySlug;
      
      // Fetch category details
      const categoryResponse = await fetch(`/api/services/categories/${categorySlug}`);
      
      if (!categoryResponse.ok) {
        throw new Error("Failed to fetch category details");
      }
      
      const categoryData = await categoryResponse.json();
      
      if (!categoryData.success || !categoryData.category) {
        throw new Error("Category not found");
      }
      
      setCategory(categoryData.category);
      
      // Fetch services for this category
      const servicesResponse = await fetch(`/api/services/categories/${categorySlug}/services`);
      
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        
        if (servicesData.success && servicesData.services) {
          setServices(servicesData.services);
        } else {
          setServices([]);
        }
      } else {
        setServices([]);
      }
      
      // Fetch discounts for this category
      const discountsResponse = await fetch(`/api/discounts/category/${categorySlug}`);
      
      if (discountsResponse.ok) {
        const discountsData = await discountsResponse.json();
        
        if (discountsData.success && discountsData.discounts) {
          setDiscounts(discountsData.discounts);
        } else {
          setDiscounts([]);
        }
      } else {
        setDiscounts([]);
      }
    } catch (error) {
      console.error("Error fetching category data:", error);
      setError("Failed to load category data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Get price display for a service
  const getPriceDisplay = (service: Service) => {
    if (typeof service.pricing === 'number') {
      return `₹${service.pricing} onwards`;
    } else if (typeof service.pricing === 'object' && service.pricing !== null) {
      if (service.pricing.basic?.price) {
        return service.pricing.basic.price;
      } else if (service.pricing.price) {
        return `₹${service.pricing.price} onwards`;
      }
    }
    return '₹599 onwards';
  };

  // Format discount for display
  const formatDiscount = (discount: Discount) => {
    if (discount.discountType === 'percentage') {
      return `${discount.discountValue}% OFF`;
    } else {
      return `₹${discount.discountValue} OFF`;
    }
  };

  // Calculate discounted price
  const getDiscountedPrice = (originalPrice: number, discount: Discount) => {
    if (discount.discountType === 'percentage') {
      const discountAmount = (originalPrice * discount.discountValue) / 100;
      return originalPrice - discountAmount;
    } else {
      return originalPrice - discount.discountValue;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error || "Category not found"}</p>
              </div>
            </div>
          </div>
          <Link href="/services">
            <div className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <FaArrowLeft className="mr-2" /> Back to Services
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Link href="/services">
            <div className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              <FaArrowLeft className="mr-2" /> Back to Services
            </div>
          </Link>
          
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {category.name}
          </motion.h1>
          
          <motion.p
            className="text-lg text-gray-600 max-w-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {category.description}
          </motion.p>
        </div>

        {/* Discount Banner */}
        {discounts.length > 0 && (
          <motion.div
            className="mb-8 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center">
              <FaTag className="text-white mr-3 h-6 w-6" />
              <div>
                <h3 className="text-xl font-bold">Special Offer!</h3>
                <p className="text-white text-opacity-90">
                  {discounts[0].name}: {formatDiscount(discounts[0])} on all {category.name}
                </p>
                {discounts[0].description && (
                  <p className="text-sm text-white text-opacity-80 mt-1">{discounts[0].description}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Services Grid */}
        {services.length === 0 ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">No services found for this category. Please check back later.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const priceDisplay = getPriceDisplay(service);
              const numericPrice = parseInt(priceDisplay.replace(/[^0-9]/g, ''));
              const hasDiscount = discounts.length > 0;
              const discountedPrice = hasDiscount 
                ? getDiscountedPrice(numericPrice, discounts[0]) 
                : numericPrice;
              
              return (
                <motion.div
                  key={service._id || service.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="relative h-48">
                    <Image
                      src={service.img || '/images/services/default.jpg'}
                      alt={service.title}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="transition-transform duration-300 hover:scale-105"
                    />
                    
                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 rounded-bl-lg font-medium flex items-center">
                        <FaTag className="mr-1" />
                        <span>{formatDiscount(discounts[0])}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600 mb-4">{service.desc}</p>
                    
                    {/* Price Display */}
                    <div className="mb-4">
                      {hasDiscount ? (
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-blue-600">₹{discountedPrice}</span>
                          <span className="ml-2 text-gray-500 line-through">₹{numericPrice}</span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-blue-600">{priceDisplay}</span>
                      )}
                    </div>
                    
                    <Link href={`/servicedetails/${service.id || service._id}`}>
                      <div className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-800">
                        View Details <FaArrowRight className="ml-2" />
                      </div>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
