import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePagination } from "./usePagination";

const makeItems = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

describe("usePagination", () => {
    it("paginates the first page by default", () => {
        const { result } = renderHook(() => usePagination(makeItems(12), 5));

        expect(result.current.page).toBe(1);
        expect(result.current.totalPages).toBe(3);
        expect(result.current.totalItems).toBe(12);
        expect(result.current.paginatedItems).toEqual([1, 2, 3, 4, 5]);
    });

    it("moves to the requested page", () => {
        const { result } = renderHook(() => usePagination(makeItems(12), 5));

        act(() => result.current.setPage(2));

        expect(result.current.page).toBe(2);
        expect(result.current.paginatedItems).toEqual([6, 7, 8, 9, 10]);
    });

    it("clamps page requests above the last page", () => {
        const { result } = renderHook(() => usePagination(makeItems(12), 5));

        act(() => result.current.setPage(99));

        expect(result.current.page).toBe(3);
        expect(result.current.paginatedItems).toEqual([11, 12]);
    });

    it("clamps page requests below the first page", () => {
        const { result } = renderHook(() => usePagination(makeItems(12), 5));

        act(() => result.current.setPage(0));

        expect(result.current.page).toBe(1);
    });

    it("resets to page 1 when the page size changes", () => {
        const { result } = renderHook(() => usePagination(makeItems(12), 5));

        act(() => result.current.setPage(3));
        act(() => result.current.setPageSize(10));

        expect(result.current.page).toBe(1);
        expect(result.current.pageSize).toBe(10);
        expect(result.current.paginatedItems).toEqual(makeItems(12).slice(0, 10));
    });

    it("always reports at least 1 total page, even with no items", () => {
        const { result } = renderHook(() => usePagination(makeItems(0), 5));

        expect(result.current.totalPages).toBe(1);
        expect(result.current.paginatedItems).toEqual([]);
    });

    it("resetPage returns to page 1", () => {
        const { result } = renderHook(() => usePagination(makeItems(12), 5));

        act(() => result.current.setPage(2));
        act(() => result.current.resetPage());

        expect(result.current.page).toBe(1);
    });
});
