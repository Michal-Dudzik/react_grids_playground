import {act, fireEvent, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {renderWithProviders} from "../../../../test/renderWithProviders.jsx";

const {
    gridApi,
    gridColumnsState,
} = vi.hoisted(() => ({
    gridApi: {
        getSelectedRecords: vi.fn(() => []),
        refresh: vi.fn(),
    },
    gridColumnsState: {
        isReadyToRender: true,
        error: null,
    },
}));

vi.mock("../GridBase.jsx", async () => {
    const React = await vi.importActual("react");

    const MockGridBase = React.forwardRef((props, ref) => {
        React.useImperativeHandle(ref, () => gridApi, []);

        return (
            <div data-testid="grid-base">
                <div data-testid="allow-filtering">{String(props.allowFiltering)}</div>
                <div data-testid="row-height">{String(props.rowHeight)}</div>
                <div data-testid="header-cell-info-type">{typeof props.headerCellInfo}</div>
                <div data-testid="grid-rows">
                    {props.data.map((row) => (
                        <div key={row.id}>{row.name}</div>
                    ))}
                </div>
                <button type="button" onClick={() => props.rowSelected?.({})}>
                    trigger-select
                </button>
                <button
                    type="button"
                    onClick={() => props.recordDoubleClick?.({rowData: props.data[0]})}
                >
                    trigger-double-click
                </button>
            </div>
        );
    });

    MockGridBase.displayName = "MockGridBase";

    return {
        default: MockGridBase,
    };
});

vi.mock("../GridErrorBoundary.jsx", () => ({
    default: ({children}) => children,
}));

vi.mock("../features/columns/useGridColumns.js", () => ({
    useGridColumns: ({defaultColumns}) => ({
        columns: defaultColumns,
        columnsState: defaultColumns,
        error: gridColumnsState.error,
        settingsModalOpen: false,
        setSettingsModalOpen: vi.fn(),
        saveColumns: vi.fn(),
        savingColumns: false,
        resetColumns: vi.fn(),
        isReadyToRender: gridColumnsState.isReadyToRender,
    }),
}));

vi.mock("../features/exportExcel/useGridExport.jsx", () => ({
    useGridExport: () => ({
        exportToExcel: vi.fn(),
        ExportLoadingModal: () => null,
    }),
}));

vi.mock("../features/print/usePrintGrid.jsx", () => ({
    usePrintGrid: () => ({
        printAll: vi.fn(),
        printCurrentPage: vi.fn(),
        printSelected: vi.fn(),
        getSelectedRowsCount: vi.fn(() => 0),
        hasSelectedRows: vi.fn(() => false),
    }),
}));

vi.mock("../features/aggregation/useAggregationSync.js", () => ({
    useAggregationSync: () => ({
        columnWidths: [],
        gridContentWidth: 0,
    }),
}));

vi.mock("../features/aggregation/AggregationBar.jsx", () => ({
    default: () => <div data-testid="aggregation-bar" />,
}));

vi.mock("../features/columns/ColumnSettingsModal.jsx", () => ({
    default: () => null,
}));

vi.mock("../features/presentation/GridPresentationModal.jsx", () => ({
    default: () => null,
}));

const {default: SyncfusionGrid} = await import("../SyncfusionGrid.jsx");

describe("SyncfusionGrid", () => {
    const data = [
        {id: 1, name: "Alice", code: "INV-100"},
        {id: 2, name: "Bob", code: "ALPHA-200"},
    ];

    const columns = [
        {field: "name", headerText: "Name", orderID: 1},
        {field: "code", headerText: "Code", orderID: 2},
    ];

    beforeEach(() => {
        gridApi.getSelectedRecords.mockReset();
        gridApi.getSelectedRecords.mockReturnValue([]);
        gridApi.refresh.mockClear();
        gridColumnsState.isReadyToRender = true;
        gridColumnsState.error = null;
    });

    it("filters rendered rows through the exposed search props", () => {
        vi.useFakeTimers();

        let latestSearchProps;

        renderWithProviders(
            <SyncfusionGrid
                data={data}
                columns={columns}
                searchFields={["name"]}
                footerConfig={{showFooter: false}}
                onSearchPropsChange={(searchProps) => {
                    latestSearchProps = searchProps;
                }}
            />
        );

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();

        act(() => {
            latestSearchProps.onInputChange("alice");
            latestSearchProps.onSearch("alice");
            vi.advanceTimersByTime(100);
        });

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    });

    it("emits selected rows and double-clicked row data through callbacks", () => {
        const onSelectionChange = vi.fn();
        const onRowDoubleClick = vi.fn();

        gridApi.getSelectedRecords.mockReturnValue([data[1]]);

        renderWithProviders(
            <SyncfusionGrid
                data={data}
                columns={columns}
                footerConfig={{showFooter: false}}
                onSelectionChange={onSelectionChange}
                onRowDoubleClick={onRowDoubleClick}
            />
        );

        fireEvent.click(screen.getByRole("button", {name: "trigger-select"}));
        fireEvent.click(screen.getByRole("button", {name: "trigger-double-click"}));

        expect(onSelectionChange).toHaveBeenCalledWith([data[1]]);
        expect(onRowDoubleClick).toHaveBeenCalledWith(data[0]);
    });

    it("waits for columns to be ready before rendering the grid", () => {
        gridColumnsState.isReadyToRender = false;

        const {rerender} = renderWithProviders(
            <SyncfusionGrid
                data={data}
                columns={columns}
                footerConfig={{showFooter: false}}
            />
        );

        expect(screen.queryByTestId("grid-base")).not.toBeInTheDocument();

        gridColumnsState.isReadyToRender = true;

        rerender(
            <SyncfusionGrid
                data={data}
                columns={columns}
                footerConfig={{showFooter: false}}
            />
        );

        expect(screen.getByTestId("grid-base")).toBeInTheDocument();
    });

    it("does not trigger an extra imperative refresh when rendering or rerendering columns", () => {
        const {rerender} = renderWithProviders(
            <SyncfusionGrid
                data={data}
                columns={columns}
                footerConfig={{showFooter: false}}
            />
        );

        rerender(
            <SyncfusionGrid
                data={data}
                columns={[
                    {field: "name", headerText: "Name", orderID: 1, width: 180},
                    {field: "code", headerText: "Code", orderID: 2},
                ]}
                footerConfig={{showFooter: false}}
            />
        );

        expect(gridApi.refresh).not.toHaveBeenCalled();
    });

    it("renders with ready columns even when the columns service reports an error", () => {
        gridColumnsState.error = new Error("Columns failed");

        renderWithProviders(
            <SyncfusionGrid
                data={data}
                columns={columns}
                footerConfig={{showFooter: false}}
            />
        );

        expect(screen.getByTestId("grid-base")).toBeInTheDocument();
    });

    it("uses an explicit rowHeight prop for paging calculations and grid rendering", () => {
        renderWithProviders(
            <SyncfusionGrid
                data={data}
                columns={columns}
                rowHeight={60}
                footerConfig={{showFooter: false}}
            />
        );

        expect(screen.getByTestId("row-height")).toHaveTextContent("60");
    });

    it("passes header decoration handlers through to the underlying grid", () => {
        renderWithProviders(
            <SyncfusionGrid
                data={data}
                columns={columns}
                decoration={{
                    getColumnDecoration: () => ({className: "header-class"}),
                }}
                footerConfig={{showFooter: false}}
            />
        );

        expect(screen.getByTestId("header-cell-info-type")).toHaveTextContent("function");
    });
});
