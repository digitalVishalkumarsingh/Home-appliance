"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { FaHome, FaChevronRight } from "react-icons/fa";

interface Breadcrumb {
  title: string;
  href: string;
  segment: string;
}

export default function BreadcrumbNavigation() {
  const pathname = usePathname();

  // Skip breadcrumbs if pathname is null or home page
  if (!pathname || pathname === "/") {
    return null;
  }

  // Generate breadcrumb segments
  const segments: Breadcrumb[] = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      // Convert segment to Title Case (handle kebab-case and single words)
      const title = segment
        .replace(/-/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

      return {
        title,
        href: `/${segment}`,
        segment,
      };
    });

  // Build paths for each segment, skipping dynamic segments (e.g., [id])
  const breadcrumbs: Breadcrumb[] = segments.map((segment, index) => {
    const href = `/${segments
      .slice(0, index + 1)
      .map((s) => s.segment)
      .join("/")}`;
    return { ...segment, href };
  });

  return (
    <nav
      className="flex items-center text-sm py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4"
      aria-label="Breadcrumb navigation"
    >
      <Link
        href="/"
        className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <FaHome className="mr-1" aria-hidden="true" />
        <span>Home</span>
      </Link>

      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center">
          <FaChevronRight className="mx-2 text-gray-400" aria-hidden="true" />
          {index === breadcrumbs.length - 1 ? (
            <span
              className="text-blue-600 dark:text-blue-400 font-medium"
              aria-current="page"
            >
              {breadcrumb.title}
            </span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {breadcrumb.title}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}