
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { logger } from "../config/logger";

interface PaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems: number;
  maxPageButtons?: number;
}

interface PaginationResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  visibleItems: number;
  pageNumbers: number[];
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  changePageSize: (newPageSize: number) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  totalItems,
  maxPageButtons = 5,
}: PaginationOptions): PaginationResult {
  const validatedInitialPage = Math.max(1, initialPage);
  const validatedPageSize = Math.max(1, initialPageSize);
  const validatedTotalItems = Math.max(0, totalItems);
  const validatedMaxPageButtons = Math.max(1, maxPageButtons);

  const [currentPage, setCurrentPage] = useState(validatedInitialPage);
  const [pageSize, setPageSize] = useState(validatedPageSize);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(validatedTotalItems / pageSize)),
    [validatedTotalItems, pageSize]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      logger.info("Adjusted currentPage to totalPages", { currentPage, totalPages });
    } else if (currentPage < 1) {
      setCurrentPage(1);
      logger.info("Adjusted currentPage to 1", { currentPage });
    }
  }, [currentPage, totalPages]);

  const paginationMetadata = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, validatedTotalItems - 1);

    return {
      currentPage,
      pageSize,
      totalPages,
      totalItems: validatedTotalItems,
      startIndex,
      endIndex,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages,
      visibleItems: Math.min(pageSize, validatedTotalItems - startIndex),
    };
  }, [currentPage, pageSize, validatedTotalItems, totalPages]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= validatedMaxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfButtons = Math.floor(validatedMaxPageButtons / 2);
    let startPage = Math.max(1, currentPage - halfButtons);
    const endPage = Math.min(totalPages, startPage + validatedMaxPageButtons - 1);

    if (endPage - startPage + 1 < validatedMaxPageButtons) {
      startPage = Math.max(1, endPage - validatedMaxPageButtons + 1);
    }

    const numbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    logger.debug("Generated page numbers", { pageNumbers: numbers });
    return numbers;
  }, [currentPage, totalPages, validatedMaxPageButtons]);

  const goToPage = useCallback(
    (page: number) => {
      const targetPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(targetPage);
      logger.info("Navigated to page", { targetPage });
    },
    [totalPages]
  );

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      logger.info("Navigated to next page", { newPage: currentPage + 1 });
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      logger.info("Navigated to previous page", { newPage: currentPage - 1 });
    }
  }, [currentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
    logger.info("Navigated to first page");
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
    logger.info("Navigated to last page", { totalPages });
  }, [totalPages]);

  const changePageSize = useCallback(
    (newPageSize: number) => {
      const validatedNewPageSize = Math.max(1, newPageSize);
      const firstItemIndex = (currentPage - 1) * pageSize;
      const newPage = Math.floor(firstItemIndex / validatedNewPageSize) + 1;

      setPageSize(validatedNewPageSize);
      setCurrentPage(newPage);
      logger.info("Changed page size", { newPageSize: validatedNewPageSize, newPage });
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
