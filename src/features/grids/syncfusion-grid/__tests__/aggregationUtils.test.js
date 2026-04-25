import {describe, expect, it} from "vitest";
import {getCustomAggregates} from "../features/aggregation/aggregationUtils.js";

describe("getCustomAggregates", () => {
    it("computes configured aggregates for page data and total data", () => {
        const columns = [
            {field: "amount", headerText: "Amount", alignment: "R", format: "0.00"},
            {field: "code", headerText: "Code"},
        ];

        const pagedData = [
            {amount: 10},
            {amount: 15.5},
            {amount: "not-a-number"},
        ];

        const totalData = [
            ...pagedData,
            {amount: 20},
        ];

        const [aggregate] = getCustomAggregates(columns, pagedData, totalData, [
            {field: "amount", types: ["sum", "avg", "max"]},
        ]);

        expect(aggregate).toMatchObject({
            field: "amount",
            headerText: "Amount",
            aggregates: {
                sum: {page: 25.5, total: 45.5},
                avg: {page: 12.75, total: 15.166666666666666},
                max: {page: 15.5, total: 20},
            },
        });
    });

    it("uses custom aggregate functions when configured", () => {
        const columns = [
            {field: "amount", headerText: "Amount"},
        ];

        const customFn = (rows) => rows.length;

        const [aggregate] = getCustomAggregates(columns, [{amount: 1}], [{amount: 1}, {amount: 2}], [
            {field: "amount", types: ["custom"], customFn},
        ]);

        expect(aggregate.aggregates.custom).toEqual({
            page: 1,
            total: 2,
        });
    });
});
