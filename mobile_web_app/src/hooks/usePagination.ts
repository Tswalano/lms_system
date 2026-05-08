import { useState } from "react";

export interface PaginationState<T> {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    paginatedItems: T[];
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    resetPage: () => void;
}

export function usePagination<T>(items: T[], defaultPageSize = 5): PaginationState<T> {
    const [page, setPageState] = useState(1);
    const [pageSize, setPageSizeState] = useState(defaultPageSize);

    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    // Clamp without a state update — safe to compute inline
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);

    const setPage = (p: number) => setPageState(Math.max(1, Math.min(p, totalPages)));
    const setPageSize = (size: number) => { setPageSizeState(size); setPageState(1); };
    const resetPage = () => setPageState(1);

    return { page: safePage, pageSize, totalPages, totalItems: items.length, paginatedItems, setPage, setPageSize, resetPage };
}
