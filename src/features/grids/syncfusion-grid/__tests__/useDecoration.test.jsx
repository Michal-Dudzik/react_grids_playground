import {renderHook} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {
    cellLockClass,
    dateClass,
    monetaryClass,
    rowAttentionClass,
    useDecoration,
} from "../features/decoration/useDecoration.js";

describe("useDecoration", () => {
    it("applies cell class, style, icon, and tooltip from granular and unified callbacks", () => {
        const {result} = renderHook(() => useDecoration({
            getCellClassName: () => "granular-cell",
            getCellStyle: () => ({color: "red"}),
            getCellTooltip: () => "tooltip from granular",
            getCellDecoration: () => ({
                className: "unified-cell",
                style: {fontWeight: "700"},
                icon: "<strong>!</strong>",
                tooltip: "tooltip from unified",
            }),
        }));

        const cell = document.createElement("td");

        result.current.queryCellInfo({
            data: {id: 1},
            column: {field: "amount"},
            cell,
        });

        expect(cell.classList.contains("granular-cell")).toBe(true);
        expect(cell.classList.contains("unified-cell")).toBe(true);
        expect(cell.style.color).toBe("red");
        expect(cell.style.fontWeight).toBe("700");
        expect(cell.title).toBe("tooltip from unified");
        expect(cell.querySelector(".cell-icon")).not.toBeNull();
    });

    it("applies row and header decoration", () => {
        const {result} = renderHook(() => useDecoration({
            getRowClassName: () => "row-class",
            getRowStyle: () => ({backgroundColor: "yellow"}),
            getRowDecoration: () => ({className: "row-decoration", style: {fontWeight: "700"}}),
            getColumnDecoration: () => ({className: "header-class", style: {textAlign: "right"}}),
        }));

        const row = document.createElement("tr");
        const headerCell = document.createElement("th");

        result.current.rowDataBound({data: {id: 1}, row});
        result.current.columnHeaderBound({column: {field: "amount"}, cell: headerCell});

        expect(row.classList.contains("row-class")).toBe(true);
        expect(row.classList.contains("row-decoration")).toBe(true);
        expect(row.style.backgroundColor).toBe("yellow");
        expect(row.style.fontWeight).toBe("700");
        expect(headerCell.classList.contains("header-class")).toBe(true);
        expect(headerCell.style.textAlign).toBe("right");
    });
});

describe("decoration helpers", () => {
    it("returns the expected helper class names", () => {
        expect(monetaryClass()).toBe("cell-monetary");
        expect(dateClass()).toBe("cell-date");
        expect(cellLockClass(true)).toBe("cell-locked");
        expect(cellLockClass(false)).toBe("");
        expect(rowAttentionClass(true)).toBe("row-requires-attention");
        expect(rowAttentionClass(false)).toBe("");
    });
});
