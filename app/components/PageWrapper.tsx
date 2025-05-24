// "use client";

// import React from 'react';
// import { usePathname } from 'next/navigation';

// interface PageWrapperProps {
//   children: React.ReactNode;
// }

// /**
//  * PageWrapper component that adds consistent spacing from the fixed header
//  * for all pages in the application.
//  *
//  * Special handling for home page to have minimal spacing.
//  */
// const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
//   const pathname = usePathname();
//   // Add pages with minimal spacing
//   const isSpecialPage = pathname === '/about' ||
//                        pathname === '/acrepair' ||
//                        pathname === '/contact' ||
//                        pathname === '/services' ||
//                        pathname === '/refrigeratorrepair' ||
//                        pathname === '/washingmachinerepair' ||
//                        pathname.startsWith('/servicedetails/');

//   // For the home page, we need to add minimal padding to account for the fixed header
//   const isHomePage = pathname === '/';

//   return (
//     <div className={
//       isHomePage
       
//       {children}
//     </div>
//   );
// };

// export default PageWrapper;
