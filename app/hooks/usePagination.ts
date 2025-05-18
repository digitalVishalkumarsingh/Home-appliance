"use client";

import { useState, useMemo, useCallback } from "react";

interface PaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems: number;
  maxPageButtons?: number;
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  totalItems,
  maxPageButtons = 5,
}: PaginationOptions) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate total pages
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  // Ensure current page is within valid range
  useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Calculate pagination metadata
  const paginationMetadata = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

    return {
      currentPage,
      pageSize,
      totalPages,
      totalItems,
      startIndex,
      endIndex,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages,
      visibleItems: Math.min(pageSize, totalItems - startIndex),
    };
  }, [currentPage, pageSize, totalItems, totalPages]);

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    if (totalPages <= maxPageButtons) {
      // If total pages is less than max buttons, show all pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Calculate range of page numbers to show
    const halfButtons = Math.floor(maxPageButtons / 2);
    let startPage = Math.max(1, currentPage - halfButtons);
    const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }, [currentPage, totalPages, maxPageButtons]);

  // Navigation functions
  const goToPage = useCallback(
    (page: number) => {
      const targetPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(targetPage);
    },
    [totalPages]
  );

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // Change page size
  const changePageSize = useCallback(
    (newPageSize: number) => {
      // Calculate the first item index of the current page
      const firstItemIndex = (currentPage - 1) * pageSize;

      // Calculate what page this item would be on with the new page size
      const newPage = Math.floor(firstItemIndex / newPageSize) + 1;

      setPageSize(newPageSize);
      setCurrentPage(newPage);
    },
    [currentPage, pageSize]
  );

  return {
    ...paginationMetadata,
    pageNumbers,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    changePageSize,
    setCurrentPage,
    setPageSize,
  };
}

export default usePagination;
