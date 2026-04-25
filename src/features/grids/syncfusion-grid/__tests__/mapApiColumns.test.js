import {describe, expect, it, vi} from "vitest";
import mapApiColumns, {standardizeColumns} from "../features/columns/mapApiColumns.js";

describe("standardizeColumns", () => {
    it("assigns a primary key when none is provided", () => {
        const standardized = standardizeColumns([
            {field: "hiddenId", headerText: "Hidden", visible: false},
            {field: "amount", headerText: "Amount", alignment: "R", format: "0.00"},
        ]);

        expect(standardized[0].isPrimaryKey).toBe(false);
        expect(standardized[1].isPrimaryKey).toBe(true);
    });
});

describe("mapApiColumns", () => {
    it("maps standardized API columns into Syncfusion column props and translates header text ids", () => {
        const intl = {
            formatMessage: vi.fn(({id, defaultMessage}) => `${id}:${defaultMessage}`),
        };

        const mapped = mapApiColumns([
            {
                alias: "invoiceNumber",
                description: "Invoice",
                width: 180,
                visible: true,
                allowColFiltering: false,
                allowColSorting: true,
                isPrimaryKey: true,
                alignment: "R",
                format: "0.00",
                _originalHeaderTextId: "txtInvoice",
            },
        ], intl);

        expect(mapped).toEqual([
            expect.objectContaining({
                field: "invoiceNumber",
                headerText: "txtInvoice:Invoice",
                headerTextId: "txtInvoice",
                width: 180,
                visible: true,
                allowFiltering: false,
                allowSorting: true,
                allowEditing: undefined,
                isPrimaryKey: true,
                textAlign: "Right",
                format: "0.00",
            }),
        ]);
    });

    it("preserves explicit column editability without forcing unspecified columns editable", () => {
        const standardized = standardizeColumns([
            {field: "id", headerText: "ID", allowEditing: false},
            {field: "name", headerText: "Name", allowEditing: true},
            {field: "createdAt", headerText: "Created"},
        ]);

        const mapped = mapApiColumns(standardized);

        expect(mapped[0].allowEditing).toBe(false);
        expect(mapped[1].allowEditing).toBe(true);
        expect(mapped[2].allowEditing).toBeUndefined();
    });
});
