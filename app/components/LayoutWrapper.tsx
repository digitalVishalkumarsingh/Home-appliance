"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './footer';
import ReviewCarousel from './Review';
import PageWrapper from './PageWrapper';
import UserNavBar from './UserNavBar';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

/**
 * LayoutWrapper component that conditionally renders the Header, Footer, and ReviewCarousel
 * based on the current path.
 *
 * It will not render these components on admin pages.
 * ReviewCarousel will only be shown on specific pages (home, about, contact, service pages).
 */
const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
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
    '/washingmachinerepair' // Washing machine repair service page
  ];

  // Check if the current path starts with any of the service detail paths
  const isServiceDetailPage = pathname?.startsWith('/acrepair/') ||
                             pathname?.startsWith('/refrigeratorrepair/') ||
                             pathname?.startsWith('/washingmachinerepair/') ||
                             false;

  // Determine if the ReviewCarousel should be shown
  const showReviewCarousel = reviewCarouselPaths.includes(pathname || '') || isServiceDetailPage;

  // Don't render the Header, Footer, and ReviewCarousel on admin pages
  if (isAdminPage) {
    return <>{children}</>;
  }

  // Render the full layout on user pages, conditionally showing the ReviewCarousel
  return (
    <>
      <Header />
      {/* UserNavBar removed as per client request */}
      <PageWrapper>
        {children}
      </PageWrapper>
      {showReviewCarousel && <ReviewCarousel />}
      <Footer />
    </>
  );
};

export default LayoutWrapper;
