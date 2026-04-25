import {act} from "@testing-library/react";
import {renderHook} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {
    calculateOptimalPageSize,
    useGridPaging,
} from "../features/paging/useGridPaging.js";

describe("calculateOptimalPageSize", () => {
    it("returns the default page size when the grid content cannot be measured", () => {
        const pageSize = calculateOptimalPageSize({
            containerRef: {current: null},
            rowHeight: 42,
        });

        expect(pageSize).toBe(50);
    });

    it("calculates the best page size from the available grid height", () => {
        const container = document.createElement("div");
        const content = document.createElement("div");

        content.className = "syncfusion-grid-content";
        content.getBoundingClientRect = () => ({height: 570});
        container.appendChild(content);

        const pageSize = calculateOptimalPageSize({
            containerRef: {current: container},
            rowHeight: 42,
        });

        expect(pageSize).toBe(12);
    });
});

describe("useGridPaging", () => {
    it("returns only the rows for the active page and resets to page 1 when page size changes", () => {
        const filteredData = [
            {id: 1},
            {id: 2},
            {id: 3},
            {id: 4},
            {id: 5},
        ];

        const {result} = renderHook(() => useGridPaging(
            filteredData,
            {pageSize: 2, pageSizes: [2, 4]},
            false,
            {autoCalculatePageSize: false}
        ));

        expect(result.current.pagedData).toEqual([{id: 1}, {id: 2}]);

        act(() => {
            result.current.handlePageChange(2);
        });

        expect(result.current.pagedData).toEqual([{id: 3}, {id: 4}]);

        act(() => {
            result.current.handlePageSizeChange(4);
        });

        expect(result.current.currentPage).toBe(1);
        expect(result.current.pageSize).toBe(4);
        expect(result.current.pagedData).toEqual([{id: 1}, {id: 2}, {id: 3}, {id: 4}]);
    });

    it("returns the full data set when paging is disabled", () => {
        const filteredData = [{id: 1}, {id: 2}, {id: 3}];

        const {result} = renderHook(() => useGridPaging(
            filteredData,
            {pageSize: 2},
            true,
            {autoCalculatePageSize: false}
        ));

        expect(result.current.pagedData).toEqual(filteredData);
    });

    it("resets back to the first page when the filtered result no longer has the active page", () => {
        const initialData = [{id: 1}, {id: 2}, {id: 3}, {id: 4}];

        const {result, rerender} = renderHook(
            ({filteredData}) => useGridPaging(
                filteredData,
                {pageSize: 2, pageSizes: [2, 4]},
                false,
                {autoCalculatePageSize: false}
            ),
            {initialProps: {filteredData: initialData}}
        );

        act(() => {
            result.current.handlePageChange(2);
        });

        expect(result.current.currentPage).toBe(2);
        expect(result.current.pagedData).toEqual([{id: 3}, {id: 4}]);

        act(() => {
            rerender({filteredData: []});
        });

        expect(result.current.currentPage).toBe(1);
        expect(result.current.pagedData).toEqual([]);
    });
});
