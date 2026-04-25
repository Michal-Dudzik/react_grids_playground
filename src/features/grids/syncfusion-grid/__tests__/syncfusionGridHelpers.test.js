import {describe, expect, it, vi} from "vitest";
import {
    buildDefaultSelectionSettings,
    buildFallbackFilterScope,
    buildFilterStorageKey,
    buildGridKey,
    buildSearchTemplateRules,
} from "../syncfusionGridHelpers.js";

describe("syncfusionGridHelpers", () => {
    it("builds a stable fallback filter scope from available column identifiers", () => {
        expect(buildFallbackFilterScope([
            {field: "name"},
            {alias: "amount"},
            {headerTextId: "txtCode"},
        ])).toBe("name|amount|txtCode");
    });

    it("uses app and grid ids when building the filter storage key", () => {
        expect(buildFilterStorageKey({
            appId: 5,
            gridId: 9,
            fallbackFilterScope: "name|amount",
        })).toBe("syncfusionGrid_filter_5_9");

        expect(buildFilterStorageKey({
            appId: null,
            gridId: null,
            fallbackFilterScope: "name|amount",
        })).toBe("syncfusionGrid_filter_name|amount");
    });

    it("creates search template rules from explicit search fields or visible columns", () => {
        const createSearchHighlightTemplate = vi.fn((term, field) => `${term}:${field}`);

        const fieldRules = buildSearchTemplateRules({
            appliedSearchTerm: "alice",
            searchFields: ["name"],
            baseColumns: [{field: "name"}, {field: "code"}],
            createSearchHighlightTemplate,
        });

        expect(fieldRules).toHaveLength(1);
        expect(fieldRules[0].template).toBe("alice:name");

        const allColumnRules = buildSearchTemplateRules({
            appliedSearchTerm: "inv",
            searchFields: [],
            baseColumns: [{field: "name"}, {field: "code"}],
            createSearchHighlightTemplate,
        });

        expect(allColumnRules).toHaveLength(2);
        expect(allColumnRules.map((rule) => rule.template)).toEqual(["inv:name", "inv:code"]);
    });

    it("builds default selection settings and the grid key", () => {
        expect(buildDefaultSelectionSettings(true)).toEqual({
            mode: "Row",
            type: "Multiple",
            checkboxOnly: true,
            persistSelection: false,
            enableToggle: false,
        });

        expect(buildGridKey([
            {field: "name", visible: true, width: 120, orderID: 1},
            {field: "code", visible: false, width: 150, orderID: 2},
        ])).toBe("name-true-120-1|code-false-150-2");
    });
});
