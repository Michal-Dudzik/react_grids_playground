import {act} from "@testing-library/react";
import {renderHook} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {useGridSearch} from "../features/search/useGridSearch.jsx";

describe("useGridSearch", () => {
    it("filters only the configured fields after executing a search", () => {
        vi.useFakeTimers();

        const data = [
            {id: 1, name: "Alice", code: "INV-100"},
            {id: 2, name: "Bob", code: "ALPHA-200"},
        ];

        const {result} = renderHook(() => useGridSearch(data, ["name"]));

        act(() => {
            result.current.setInputValue("alice");
            result.current.executeSearch("alice");
        });

        expect(result.current.appliedSearchTerm).toBe("alice");
        expect(result.current.isSearching).toBe(true);
        expect(result.current.filteredData).toEqual([data[0]]);

        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(result.current.isSearching).toBe(false);
    });

    it("searches across every field when no searchFields are provided", () => {
        vi.useFakeTimers();

        const data = [
            {id: 1, name: "Alice", code: "INV-100"},
            {id: 2, name: "Bob", code: "ALPHA-200"},
        ];

        const {result} = renderHook(() => useGridSearch(data, []));

        act(() => {
            result.current.executeSearch("alpha");
            vi.advanceTimersByTime(100);
        });

        expect(result.current.filteredData).toEqual([data[1]]);
    });

    it("clears both the input and applied search term", () => {
        vi.useFakeTimers();

        const data = [
            {id: 1, name: "Alice"},
            {id: 2, name: "Bob"},
        ];

        const {result} = renderHook(() => useGridSearch(data, ["name"]));

        act(() => {
            result.current.setInputValue("alice");
            result.current.executeSearch("alice");
            vi.advanceTimersByTime(100);
        });

        act(() => {
            result.current.clearSearch();
        });

        expect(result.current.inputValue).toBe("");
        expect(result.current.appliedSearchTerm).toBe("");
        expect(result.current.filteredData).toEqual(data);
        expect(result.current.isFiltered).toBe(false);
    });
});
