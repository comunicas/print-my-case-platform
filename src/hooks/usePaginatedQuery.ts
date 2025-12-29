import { useState, useCallback } from "react";

export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface PaginationControls {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  setTotalCount: (count: number) => void;
  getRange: () => { from: number; to: number };
}

const DEFAULT_PAGE_SIZE = 50;

/**
 * Hook for managing pagination state
 * Returns pagination controls that can be used with Supabase .range() queries
 */
export function usePagination(initialPageSize = DEFAULT_PAGE_SIZE): PaginationControls {
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const setPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
    setPageState(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPageState(prev => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPageState(prev => prev - 1);
    }
  }, [hasPrevPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPageState(1); // Reset to first page when changing page size
  }, []);

  // Calculate the range for Supabase .range() - 0-indexed
  const getRange = useCallback(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  }, [page, pageSize]);

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage,
    hasPrevPage,
    setPage,
    nextPage,
    prevPage,
    setPageSize,
    setTotalCount,
    getRange,
  };
}
