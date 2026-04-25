import {describe, expect, it, vi} from "vitest";

vi.mock("../features/print/PrintDropdown.jsx", () => ({
    default: ({selectedRowsCount}) => <div data-testid="print-dropdown">print-{selectedRowsCount}</div>,
}));

const {getFooterButtons} = await import("../features/footer/footerButtons.jsx");

describe("getFooterButtons", () => {
    const intl = {
        formatMessage: ({id, defaultMessage}) => defaultMessage || id,
    };

    it("creates default footer actions including aggregation and API settings", () => {
        const setFiltering = vi.fn();
        const exportToExcel = vi.fn();
        const onToggleAggregation = vi.fn();
        const onColumnSettingsClick = vi.fn();
        const onPresentationSettingsClick = vi.fn();

        const buttons = getFooterButtons({
            showFilter: true,
            showPrint: true,
            showExportExcel: true,
            showColumnsSettings: true,
            showPresentationSettings: true,
            filtering: false,
            setFiltering,
            exportToExcel,
            intl,
            showAggregation: false,
            onToggleAggregation,
            columns: [{field: "amount", alignment: "R", format: "0.00"}],
            showApiColumnSettings: true,
            onColumnSettingsClick,
            onPresentationSettingsClick,
            columnSettingsActive: true,
            presentationSettingsActive: true,
            printMethods: {printAll: vi.fn()},
            hasSelectedRows: true,
            selectedRowsCount: 3,
        });

        expect(buttons.map((button) => button.key)).toEqual([
            "toggle-filter",
            "toggle-aggregation",
            "print-dropdown",
            "export-excel",
            "columns-settings",
            "presentation-settings",
        ]);

        buttons.find((button) => button.key === "toggle-filter").onClick();
        expect(setFiltering).toHaveBeenCalled();

        buttons.find((button) => button.key === "toggle-aggregation").onClick();
        expect(onToggleAggregation).toHaveBeenCalled();

        buttons.find((button) => button.key === "export-excel").onClick();
        expect(exportToExcel).toHaveBeenCalled();

        buttons.find((button) => button.key === "columns-settings").onClick();
        expect(onColumnSettingsClick).toHaveBeenCalled();
        expect(buttons.find((button) => button.key === "columns-settings").className).toBe("active");

        buttons.find((button) => button.key === "presentation-settings").onClick();
        expect(onPresentationSettingsClick).toHaveBeenCalled();
        expect(buttons.find((button) => button.key === "presentation-settings").className).toBe("active");

        expect(buttons.find((button) => button.key === "print-dropdown").isCustomComponent).toBe(true);
    });

    it("lets custom buttons override defaults with the same key", () => {
        const customButton = {key: "export-excel", title: "Custom export"};

        const buttons = getFooterButtons({
            showFilter: false,
            showPrint: false,
            showExportExcel: true,
            showColumnsSettings: false,
            filtering: false,
            setFiltering: vi.fn(),
            exportToExcel: vi.fn(),
            intl,
            footerButtons: [customButton],
            columns: [],
        });

        expect(buttons).toEqual([customButton]);
    });
});
