import {renderHook} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {useColumnWidthAdjustment} from "../features/footer/useColumnWidthAdjustment.js";

describe("useColumnWidthAdjustment", () => {
    it("restores original widths after toggling filters on and off", () => {
        vi.useFakeTimers();

        const columns = [
            {field: "name", width: 120},
            {field: "amount", width: 180},
            {type: "checkbox", width: 35},
        ];

        const gridRef = {
            current: {
                element: document.createElement("div"),
                getColumns: vi.fn(() => columns),
                refreshColumns: vi.fn(),
            },
        };

        const {rerender} = renderHook(
            ({filtering}) => useColumnWidthAdjustment(gridRef, filtering),
            {initialProps: {filtering: false}}
        );

        rerender({filtering: true});
        vi.advanceTimersByTime(100);

        expect(columns[0].width).toBe(140);
        expect(columns[1].width).toBe(200);
        expect(columns[2].width).toBe(35);

        rerender({filtering: false});
        vi.advanceTimersByTime(100);

        expect(columns[0].width).toBe(120);
        expect(columns[1].width).toBe(180);
        expect(gridRef.current.refreshColumns).toHaveBeenCalledTimes(2);
    });

    it("preserves manual resizing that happens while filters are enabled", () => {
        vi.useFakeTimers();

        const columns = [
            {field: "name", width: 120},
        ];

        const gridRef = {
            current: {
                element: document.createElement("div"),
                getColumns: vi.fn(() => columns),
                refreshColumns: vi.fn(),
            },
        };

        const {rerender} = renderHook(
            ({filtering}) => useColumnWidthAdjustment(gridRef, filtering),
            {initialProps: {filtering: false}}
        );

        rerender({filtering: true});
        vi.advanceTimersByTime(100);
        expect(columns[0].width).toBe(140);

        columns[0].actualWidth = 260;
        columns[0].width = 260;

        rerender({filtering: false});
        vi.advanceTimersByTime(100);

        expect(columns[0].width).toBe(240);
    });
});
