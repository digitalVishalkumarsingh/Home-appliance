"use client";

import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from "react-icons/fa";
import { motion } from "framer-motion";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageNumbers: number[];
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPageNumbers?: boolean;
  showPageInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  pageNumbers,
  onPageChange,
  showFirstLast = true,
  showPageNumbers = true,
  showPageInfo = true,
  totalItems,
  itemsPerPage,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 ${className}`}>
      {showPageInfo && totalItems !== undefined && itemsPerPage !== undefined && (
        <div className="text-sm text-gray-700">
          Showing{" "}
          <span className="font-medium">
            {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>{" "}
          of <span className="font-medium">{totalItems}</span> results
        </div>
      )}

      <nav className="flex justify-center sm:justify-end">
        <ul className="flex items-center space-x-1">
          {/* First page button */}
          {showFirstLast && (
            <li>
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label="Go to first page"
              >
                <FaAngleDoubleLeft className="w-4 h-4" />
              </button>
            </li>
          )}

          {/* Previous page button */}
          <li>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-label="Go to previous page"
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
          </li>

          {/* Page numbers */}
          {showPageNumbers &&
            pageNumbers.map((page) => (
              <li key={page}>
                <button
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              </li>
            ))}

          {/* Next page button */}
          <li>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-label="Go to next page"
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </li>

          {/* Last page button */}
          {showFirstLast && (
            <li>
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  currentPage === totalPages
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label="Go to last page"
              >
                <FaAngleDoubleRight className="w-4 h-4" />
              </button>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}

export function PaginationSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
      <div className="h-5 w-64 bg-gray-200 animate-pulse rounded-md"></div>
      <div className="flex justify-center sm:justify-end">
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 w-8 bg-gray-200 animate-pulse rounded-md"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
