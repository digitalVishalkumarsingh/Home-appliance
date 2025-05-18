"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

interface PageWrapperProps {
  children: React.ReactNode;
}

/**
 * PageWrapper component that adds consistent spacing from the fixed header
 * for all pages in the application.
 *
 * Special handling for home page to have minimal spacing.
 */
const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  const pathname = usePathname();
  // Add AC service page to the list of pages with minimal spacing
  const isSpecialPage = pathname === '/' ||
                       pathname === '/about' ||
                       pathname === '/acrepair';

  return (
    <div className={isSpecialPage ? "pt-4 mt-2" : "pt-14 md:pt-16 mt-4"}>
      {children}
    </div>
  );
};

export default PageWrapper;
