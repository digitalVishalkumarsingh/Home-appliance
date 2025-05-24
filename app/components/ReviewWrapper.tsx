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
 * ReviewCarousel will only be shown on specific pages (home, about, contact, service pages).
 */
const ReviewWrapper: React.FC<ReviewWrapperProps> = () => {
  const pathname = usePathname();

  // Check if the current path is an admin page
  const isAdminPage = pathname?.startsWith('/admin') || false;

  // List of paths where the ReviewCarousel should be displayed
  const reviewCarouselPaths = [
    '/',                    // Home page
    '/about',               // About page
    '/contact',             // Contact page
    '/services',            // Services main page
    '/acrepair',            // AC repair service page
    '/refrigeratorrepair',  // Refrigerator repair service page
    '/washingmachine' // Washing machine repair service page
  ];

  // Check if the current path starts with any of the service detail paths
  const isServiceDetailPage = pathname?.startsWith('/acrepair/') ||
                             pathname?.startsWith('/refrigeratorrepair/') ||
                             pathname?.startsWith('/washingmachine/') ||
                             false;

  // Determine if the ReviewCarousel should be shown
  const showReviewCarousel = reviewCarouselPaths.includes(pathname || '') || isServiceDetailPage;

  // Don't render the ReviewCarousel on admin pages or non-specified pages
  if (isAdminPage || !showReviewCarousel) {
    return null;
  }

  // Render the ReviewCarousel only on specified pages
  return <ReviewCarousel />;
};

export default ReviewWrapper;
