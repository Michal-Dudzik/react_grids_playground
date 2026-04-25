import {renderHook} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {useSyncfusionGridPresentation} from "../syncfusionGridPresentation.js";

vi.mock("../features/decoration/useDecoration.js", () => ({
    useDecoration: vi.fn(() => ({
        queryCellInfo: "queryCellInfo",
        rowDataBound: "rowDataBound",
        columnHeaderBound: "columnHeaderBound",
    })),
}));

describe("useSyncfusionGridPresentation", () => {
    it("derives selection settings, context menu items, columns, and aggregates", () => {
        const baseColumns = [
            {field: "name", orderID: 1, width: 120, visible: true},
            {field: "amount", orderID: 2, width: 180, visible: true},
        ];

        const template = vi.fn();

        const {result} = renderHook(() => useSyncfusionGridPresentation({
            baseColumns,
            decoration: {},
            appliedSearchTerm: "alice",
            searchFields: ["name"],
            templateRules: [{match: (col) => col.field === "amount", template}],
            enableSelectionColumn: true,
            selectionSettingsProp: undefined,
            contextMenuItems: [{id: "custom.edit", text: "Edit"}],
            showAggregates: true,
            pagedData: [{name: "Alice", amount: 100}],
            filteredData: [{name: "Alice", amount: 100}],
            aggregationConfig: [],
        }));

        expect(result.current.queryCellInfo).toBe("queryCellInfo");
        expect(result.current.rowDataBound).toBe("rowDataBound");
        expect(result.current.columnHeaderBound).toBe("columnHeaderBound");
        expect(result.current.selectionSettings).toEqual(expect.objectContaining({
            type: "Multiple",
            checkboxOnly: true,
        }));
        expect(result.current.finalColumns).toHaveLength(2);
        expect(result.current.gridKey).toContain("name-true-120-1");
        expect(result.current.mergedContextMenuItems).toEqual(expect.arrayContaining([
            expect.objectContaining({id: "custom.edit", text: "Edit"}),
        ]));
        expect(result.current.customAggregates).toEqual(expect.any(Array));
    });
});
