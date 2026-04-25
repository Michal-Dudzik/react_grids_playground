import {act, renderHook} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {useFilterState} from "../features/footer/useFilterState.js";

describe("useFilterState", () => {
    it("reads the initial value from localStorage when present", () => {
        localStorage.setItem("grid-filter", JSON.stringify(false));

        const {result} = renderHook(() => useFilterState("grid-filter", true));

        expect(result.current[0]).toBe(false);
    });

    it("persists updates back to localStorage", () => {
        const {result} = renderHook(() => useFilterState("grid-filter", true));

        act(() => {
            result.current[1](false);
        });

        expect(JSON.parse(localStorage.getItem("grid-filter"))).toBe(false);
    });

    it("reloads state from storage when the key changes instead of carrying over the previous grid state", () => {
        localStorage.setItem("grid-filter-a", JSON.stringify(false));
        localStorage.setItem("grid-filter-b", JSON.stringify(true));

        const {result, rerender} = renderHook(
            ({storageKey}) => useFilterState(storageKey, false),
            {initialProps: {storageKey: "grid-filter-a"}}
        );

        expect(result.current[0]).toBe(false);

        act(() => {
            rerender({storageKey: "grid-filter-b"});
        });

        expect(result.current[0]).toBe(true);
        expect(JSON.parse(localStorage.getItem("grid-filter-b"))).toBe(true);
    });
});
