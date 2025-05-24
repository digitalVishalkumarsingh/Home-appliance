"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './footer';
import ReviewCarousel from './Review';


interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * MainLayout component that conditionally renders the Header, Footer, and ReviewCarousel
 * based on the current path.
 *
 * It will not render these components on admin or technician pages.
 * ReviewCarousel will only be shown on specific pages (home, about, contact, service pages).
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Check if the current path is an admin or technician page
  const isAdminPage = pathname?.startsWith('/admin') || false;
  const isTechnicianPage = pathname?.startsWith('/technician') || false;

  // Check user role on client side
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUserRole(userData.role);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    }
  }, []);

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
  const isServiceDetailPage = pathname?.startsWith('/servicedetails/') ||
                             pathname?.startsWith('/acrepair/') ||
                             pathname?.startsWith('/refrigeratorrepair/') ||
                             pathname?.startsWith('/washingmachine/') ||
                             false;

  // Determine if the ReviewCarousel should be shown
  const showReviewCarousel = reviewCarouselPaths.includes(pathname || '') || isServiceDetailPage;

  // Don't render the Header, Footer, and ReviewCarousel on admin or technician pages
  if (isAdminPage || isTechnicianPage) {
    return <>{children}</>;
  }

  // Render the full layout with Header, Footer, and conditionally the ReviewCarousel
  // These components are shown on all pages except admin and technician dashboard pages
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
       
          {children}
      
        {showReviewCarousel && <ReviewCarousel />}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
