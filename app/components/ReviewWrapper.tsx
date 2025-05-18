"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import ReviewCarousel from './Review';

interface ReviewWrapperProps {
  children?: React.ReactNode;
}

/**
 * ReviewWrapper component that conditionally renders the ReviewCarousel
 * based on the current path.
 * 
 * It will not render the ReviewCarousel on admin pages.
 */
const ReviewWrapper: React.FC<ReviewWrapperProps> = () => {
  const pathname = usePathname();
  
  // Check if the current path is an admin page
  const isAdminPage = pathname?.startsWith('/admin') || false;
  
  // Don't render the ReviewCarousel on admin pages
  if (isAdminPage) {
    return null;
  }
  
  // Render the ReviewCarousel on user pages
  return <ReviewCarousel />;
};

export default ReviewWrapper;
