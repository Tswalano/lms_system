import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./Pagination";

const noop = () => { };

describe("Pagination", () => {
    it("renders nothing when there are fewer items than the smallest page size", () => {
        const { container } = render(
            <Pagination
                currentPage={1}
                totalPages={1}
                pageSize={5}
                totalItems={3}
                onPageChange={noop}
                onPageSizeChange={noop}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });

    it("shows the current range and total", () => {
        render(
            <Pagination
                currentPage={2}
                totalPages={3}
                pageSize={5}
                totalItems={12}
                onPageChange={noop}
                onPageSizeChange={noop}
            />
        );

        expect(screen.getByText("6–10")).toBeInTheDocument();
        expect(screen.getByText("12")).toBeInTheDocument();
    });

    it("disables Previous on the first page and Next on the last page", () => {
        render(
            <Pagination
                currentPage={1}
                totalPages={1}
                pageSize={5}
                totalItems={5}
                onPageChange={noop}
                onPageSizeChange={noop}
            />
        );

        expect(screen.getByLabelText("Previous page")).toBeDisabled();
        expect(screen.getByLabelText("Next page")).toBeDisabled();
    });

    it("calls onPageChange with the next page number", async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();

        render(
            <Pagination
                currentPage={1}
                totalPages={3}
                pageSize={5}
                totalItems={12}
                onPageChange={onPageChange}
                onPageSizeChange={noop}
            />
        );

        await user.click(screen.getByLabelText("Next page"));

        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("calls onPageChange when a specific page number is clicked", async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();

        render(
            <Pagination
                currentPage={1}
                totalPages={3}
                pageSize={5}
                totalItems={12}
                onPageChange={onPageChange}
                onPageSizeChange={noop}
            />
        );

        await user.click(screen.getByText("3"));

        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it("calls onPageSizeChange when a new page size is selected", async () => {
        const user = userEvent.setup();
        const onPageSizeChange = vi.fn();

        render(
            <Pagination
                currentPage={1}
                totalPages={3}
                pageSize={5}
                totalItems={12}
                onPageChange={noop}
                onPageSizeChange={onPageSizeChange}
            />
        );

        await user.selectOptions(screen.getByRole("combobox"), "10");

        expect(onPageSizeChange).toHaveBeenCalledWith(10);
    });
});
