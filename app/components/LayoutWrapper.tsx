"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './footer';
import ReviewCarousel from './Review';
import PageWrapper from './PageWrapper';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

/**
 * LayoutWrapper component that conditionally renders the Header, Footer, and ReviewCarousel
 * based on the current path.
 * 
 * It will not render these components on admin pages.
 */
const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const pathname = usePathname();
  
  // Check if the current path is an admin page
  const isAdminPage = pathname?.startsWith('/admin') || false;
  
  // Don't render the Header, Footer, and ReviewCarousel on admin pages
  if (isAdminPage) {
    return <>{children}</>;
  }
  
  // Render the full layout on user pages
  return (
    <>
      <Header />
      <PageWrapper>
        {children}
      </PageWrapper>
      <ReviewCarousel />
      <Footer />
    </>
  );
};

export default LayoutWrapper;
