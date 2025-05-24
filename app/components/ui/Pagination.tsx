"use client";

import { useCallback } from "react";
import Button from "./Button";

/**
 * Props for the Pagination component.
 */
interface PaginationProps {
  /** Total number of items to paginate. */
  totalItems: number;
  /** Number of items per page. */
  itemsPerPage: number;
  /** Current active page (1-based index). */
  currentPage: number;
  /** Callback function to handle page changes. */
  onPageChange: (page: number) => void;
  /** Maximum number of page buttons to show before using ellipsis (default: 5). */
  maxPagesToShow?: number;
}

/**
 * A reusable pagination component for navigating through pages of items.
 * @param props - The component props.
 */
export default function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  maxPagesToShow = 5,
}: PaginationProps) {
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Ensure currentPage is within valid bounds
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Generate page numbers to display
  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];
    const halfMax = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, safeCurrentPage - halfMax);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust startPage if endPage is at totalPages
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("...");
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  }, [safeCurrentPage, totalPages, maxPagesToShow]);

  // Handle previous and next page clicks
  const handlePrevious = () => {
    if (safeCurrentPage > 1) {
      onPageChange(safeCurrentPage - 1);
    }
  };

  const handleNext = () => {
    if (safeCurrentPage < totalPages) {
      onPageChange(safeCurrentPage + 1);
    }
  };

  return (
    <nav className="flex items-center justify-center space-x-2 py-4" aria-label="Pagination">
      {/* Previous Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handlePrevious}
        disabled={safeCurrentPage === 1}
      >
        Previous
      </Button>

      {/* Page Numbers */}
      {getPageNumbers().map((page, index) => (
        <Button
          key={`${page}-${index}`}
          variant={page === safeCurrentPage ? "primary" : "secondary"}
          size="sm"
          onClick={() => typeof page === "number" && onPageChange(page)}
          disabled={typeof page !== "number"}
        >
          {page}
        </Button>
      ))}

      {/* Next Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleNext}
        disabled={safeCurrentPage === totalPages}
      >
        Next
      </Button>
    </nav>
  );
}