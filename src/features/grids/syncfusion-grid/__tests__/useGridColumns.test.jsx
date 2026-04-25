import {act, waitFor} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {renderHookWithProviders} from "../../../../test/renderWithProviders.jsx";

const {
    columnsServiceState,
    toastSuccessMock,
    showErrorToastMock,
} = vi.hoisted(() => ({
    columnsServiceState: {
        columns: [],
        isLoading: false,
        loaded: false,
        isSaving: false,
        isWorking: false,
        error: null,
        updateColumns: vi.fn(),
        deleteColumns: vi.fn(),
        fetchColumns: vi.fn(),
    },
    toastSuccessMock: vi.fn(),
    showErrorToastMock: vi.fn(),
}));

vi.mock("../features/columns/useColumnsService.js", () => ({
    useColumnsService: vi.fn(() => columnsServiceState),
}));

vi.mock("react-hot-toast", () => ({
    toast: {
        success: toastSuccessMock,
    },
}));

vi.mock("../../error-toast/showErrorToast.jsx", () => ({
    showErrorToast: showErrorToastMock,
}));

const {useGridColumns} = await import("../features/columns/useGridColumns.js");

const intlMessages = {
    txtKolumnyZapisane: "Columns saved successfully!",
    txtKolumnyPrzywrocone: "Columns reset to default!",
    txtBladZapisuKolumn: "Error saving columns",
};

describe("useGridColumns", () => {
    beforeEach(() => {
        columnsServiceState.columns = [];
        columnsServiceState.isLoading = false;
        columnsServiceState.loaded = false;
        columnsServiceState.isSaving = false;
        columnsServiceState.isWorking = false;
        columnsServiceState.error = null;
        columnsServiceState.updateColumns.mockReset();
        columnsServiceState.deleteColumns.mockReset();
        columnsServiceState.fetchColumns.mockReset();
        toastSuccessMock.mockReset();
        showErrorToastMock.mockReset();
    });

    it("maps, transforms, sorts, and filters visible columns from the API response", () => {
        columnsServiceState.columns = [
            {
                alias: "amount",
                description: "Amount",
                orderID: 2,
                visible: true,
                alignment: "R",
                format: "0.00",
            },
            {
                alias: "code",
                description: "Code",
                orderID: 1,
                visible: false,
            },
        ];
        columnsServiceState.loaded = true;

        const {result} = renderHookWithProviders(() => useGridColumns({
            fetchColumns: true,
            appId: 10,
            gridId: 20,
            transformColumnsFn: (mappedColumns) => mappedColumns.map((column) => ({
                ...column,
                width: column.field === "amount" ? 250 : column.width,
            })),
        }), {withRouter: false, messages: intlMessages});

        expect(result.current.columns).toEqual([
            expect.objectContaining({
                field: "amount",
                headerText: "Amount",
                width: 250,
                orderID: 2,
            }),
        ]);
        expect(result.current.columnsState.map((column) => column.field)).toEqual(["code", "amount"]);
        expect(result.current.isReadyToRender).toBe(true);
    });

    it("uses fallback default columns while API columns are still loading", () => {
        columnsServiceState.columns = [];
        columnsServiceState.isLoading = true;
        columnsServiceState.loaded = false;

        const defaultColumns = [
            {field: "fallbackName", headerText: "Fallback Name", orderID: 1},
        ];

        const {result} = renderHookWithProviders(() => useGridColumns({
            fetchColumns: true,
            appId: 10,
            gridId: 20,
            defaultColumns,
        }), {withRouter: false, messages: intlMessages});

        expect(result.current.columns).toEqual([
            expect.objectContaining({
                field: "fallbackName",
                headerText: "Fallback Name",
            }),
        ]);
        expect(result.current.isReadyToRender).toBe(false);
    });

    it("treats completed empty API responses as ready to render", () => {
        columnsServiceState.columns = [];
        columnsServiceState.isLoading = false;
        columnsServiceState.loaded = true;

        const {result} = renderHookWithProviders(() => useGridColumns({
            fetchColumns: true,
            appId: 10,
            gridId: 20,
            defaultColumns: [],
        }), {withRouter: false, messages: intlMessages});

        expect(result.current.columns).toEqual([]);
        expect(result.current.isReadyToRender).toBe(true);
    });

    it("saves columns, refreshes data, closes the modal, and shows a success toast", async () => {
        columnsServiceState.updateColumns.mockResolvedValue({success: true});
        columnsServiceState.fetchColumns.mockResolvedValue([{alias: "amount"}]);

        const {result} = renderHookWithProviders(() => useGridColumns({
            fetchColumns: true,
            appId: 10,
            gridId: 20,
            defaultColumns: [{field: "amount", headerText: "Amount"}],
        }), {withRouter: false, messages: intlMessages});

        act(() => {
            result.current.setSettingsModalOpen(true);
        });

        await act(async () => {
            await result.current.saveColumns([{alias: "amount"}]);
        });

        expect(columnsServiceState.updateColumns).toHaveBeenCalledWith([{alias: "amount"}]);
        expect(columnsServiceState.fetchColumns).toHaveBeenCalled();
        expect(toastSuccessMock).toHaveBeenCalledWith("Columns saved successfully!");
        expect(result.current.settingsModalOpen).toBe(false);
    });

    it("applies column changes locally when API-backed columns are disabled", async () => {
        const defaultColumns = [
            {field: "code", headerText: "Code", width: 80, visible: true, orderID: 1},
            {field: "description", headerText: "Description", width: 180, visible: true, orderID: 2},
        ];

        const {result} = renderHookWithProviders(() => useGridColumns({
            fetchColumns: false,
            defaultColumns,
        }), {withRouter: false, messages: intlMessages});

        act(() => {
            result.current.setSettingsModalOpen(true);
        });

        await act(async () => {
            await result.current.saveColumns([
                {field: "description", headerText: "Description", width: 240, visible: true, orderID: 1},
                {field: "code", headerText: "Code", width: 80, visible: false, orderID: 2},
            ]);
        });

        expect(result.current.columns).toEqual([
            expect.objectContaining({
                field: "description",
                width: 240,
                visible: true,
                orderID: 1,
            }),
            expect.objectContaining({
                field: "code",
                visible: false,
                orderID: 2,
            }),
        ]);
        expect(columnsServiceState.updateColumns).not.toHaveBeenCalled();
        expect(result.current.settingsModalOpen).toBe(false);
    });

    it("shows an error toast when saving columns fails", async () => {
        const error = new Error("Save failed");
        columnsServiceState.updateColumns.mockRejectedValue(error);

        const {result} = renderHookWithProviders(() => useGridColumns({
            fetchColumns: true,
            appId: 10,
            gridId: 20,
            defaultColumns: [{field: "amount", headerText: "Amount"}],
        }), {withRouter: false, messages: intlMessages});

        await act(async () => {
            await result.current.saveColumns([{alias: "amount"}]);
        });

        await waitFor(() => {
            expect(showErrorToastMock).toHaveBeenCalledWith(expect.objectContaining({
                title: "Error saving columns",
                error,
                location: "useGridColumns.saveColumns",
            }));
        });
    });

    it("resets columns, refreshes data, and shows a success toast", async () => {
        columnsServiceState.deleteColumns.mockResolvedValue({success: true});
        columnsServiceState.fetchColumns.mockResolvedValue([]);

        const {result} = renderHookWithProviders(() => useGridColumns({
            fetchColumns: true,
            appId: 10,
            gridId: 20,
            defaultColumns: [{field: "amount", headerText: "Amount"}],
        }), {withRouter: false, messages: intlMessages});

        await act(async () => {
            await result.current.resetColumns();
        });

        expect(columnsServiceState.deleteColumns).toHaveBeenCalled();
        expect(columnsServiceState.fetchColumns).toHaveBeenCalled();
        expect(toastSuccessMock).toHaveBeenCalledWith("Columns reset to default!");
    });

    it("resets locally edited columns back to defaults", async () => {
        const defaultColumns = [
            {field: "code", headerText: "Code", width: 80, visible: true, orderID: 1},
            {field: "description", headerText: "Description", width: 180, visible: true, orderID: 2},
        ];

        const {result} = renderHookWithProviders(() => useGridColumns({
            fetchColumns: false,
            defaultColumns,
        }), {withRouter: false, messages: intlMessages});

        await act(async () => {
            await result.current.saveColumns([
                {field: "description", headerText: "Description", width: 240, visible: true, orderID: 1},
                {field: "code", headerText: "Code", width: 80, visible: false, orderID: 2},
            ]);
        });

        await act(async () => {
            await result.current.resetColumns();
        });

        expect(result.current.columns).toEqual([
            expect.objectContaining({field: "code", visible: true, orderID: 1}),
            expect.objectContaining({field: "description", visible: true, orderID: 2}),
        ]);
        expect(columnsServiceState.deleteColumns).not.toHaveBeenCalled();
    });
});
