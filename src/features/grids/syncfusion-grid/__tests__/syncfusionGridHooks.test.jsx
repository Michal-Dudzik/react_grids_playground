import {act, renderHook} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {useGridEventHandlers, useGridSearchProps} from "../syncfusionGridHooks.js";

describe("syncfusionGridHooks", () => {
    it("exposes stable search props and forwards them to the parent callback", () => {
        const onSearchPropsChange = vi.fn();

        const {result, rerender} = renderHook((props) => useGridSearchProps(props), {
            initialProps: {
                inputValue: "alice",
                setInputValue: vi.fn(),
                executeSearch: vi.fn(),
                clearSearch: vi.fn(),
                isSearching: false,
                onSearchPropsChange,
            },
        });

        expect(onSearchPropsChange).toHaveBeenCalledWith(expect.objectContaining({
            inputValue: "alice",
            isSearching: false,
        }));

        const firstSearchProps = result.current;
        rerender({
            inputValue: "alice",
            setInputValue: result.current.onInputChange,
            executeSearch: result.current.onSearch,
            clearSearch: result.current.onClear,
            isSearching: false,
            onSearchPropsChange,
        });

        expect(result.current).toBe(firstSearchProps);
    });

    it("wires selection and double-click handlers through the grid api", () => {
        const onSelectionChange = vi.fn();
        const onRowDoubleClick = vi.fn();
        const setSelectionCount = vi.fn();

        const gridRef = {
            current: {
                getSelectedRecords: vi.fn(() => [{id: 2}]),
            },
        };

        const {result} = renderHook(() => useGridEventHandlers({
            gridRef,
            disabledMap: {"custom.delete": true},
            onSelectionChange,
            onRowDoubleClick,
            setSelectionCount,
        }));

        act(() => {
            result.current.handleRowSelectionChange();
            result.current.handleRowDoubleClick({rowData: {id: 1}});
        });

        expect(setSelectionCount).toHaveBeenCalledWith(1);
        expect(onSelectionChange).toHaveBeenCalledWith([{id: 2}]);
        expect(onRowDoubleClick).toHaveBeenCalledWith({id: 1});
    });
});
