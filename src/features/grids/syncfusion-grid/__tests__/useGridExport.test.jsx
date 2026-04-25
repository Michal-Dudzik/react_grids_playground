import {act} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {renderHookWithProviders} from "../../../../test/renderWithProviders.jsx";

const {
    toastSuccessMock,
    showErrorToastMock,
} = vi.hoisted(() => ({
    toastSuccessMock: vi.fn(),
    showErrorToastMock: vi.fn(),
}));

vi.mock("../features/exportExcel/ExportModal.jsx", () => ({
    ExportModal: () => null,
}));

vi.mock("react-hot-toast", () => ({
    toast: {
        success: toastSuccessMock,
    },
}));

vi.mock("../../error-toast/showErrorToast.jsx", () => ({
    showErrorToast: showErrorToastMock,
}));

const {useGridExport} = await import("../features/exportExcel/useGridExport.jsx");

const intlMessages = {
    txtEksportZakonczonySukcesem: "Export completed successfully",
    txtBladEksportu: "Export error",
};

describe("useGridExport", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        toastSuccessMock.mockReset();
        showErrorToastMock.mockReset();
    });

    it("restores aggregates after a successful export", async () => {
        const originalAggregates = [{type: "sum"}];
        const gridRef = {
            current: {
                aggregates: originalAggregates,
                excelExport: vi.fn().mockResolvedValue(undefined),
            },
        };

        const {result} = renderHookWithProviders(() => useGridExport(gridRef, [{id: 1}]), {
            withRouter: false,
            messages: intlMessages,
        });

        await act(async () => {
            const exportPromise = result.current.exportToExcel();
            await vi.runAllTimersAsync();
            await exportPromise;
        });

        expect(gridRef.current.excelExport).toHaveBeenCalledWith(expect.objectContaining({
            dataSource: [{id: 1}],
        }));
        expect(gridRef.current.aggregates).toBe(originalAggregates);
        expect(toastSuccessMock).toHaveBeenCalledWith("Export completed successfully");
    });

    it("restores aggregates and reports an error when export fails", async () => {
        const exportError = new Error("Export failed");
        const originalAggregates = [{type: "sum"}];
        const gridRef = {
            current: {
                aggregates: originalAggregates,
                excelExport: vi.fn().mockRejectedValue(exportError),
            },
        };

        const {result} = renderHookWithProviders(() => useGridExport(gridRef, [{id: 1}]), {
            withRouter: false,
            messages: intlMessages,
        });

        await act(async () => {
            const exportPromise = result.current.exportToExcel();
            await vi.runAllTimersAsync();
            await exportPromise;
        });

        expect(gridRef.current.aggregates).toBe(originalAggregates);
        expect(showErrorToastMock).toHaveBeenCalledWith(expect.objectContaining({
            title: "Export error",
            error: exportError,
            location: "syncfusion-grid: export to Excel",
        }));
    });
});
