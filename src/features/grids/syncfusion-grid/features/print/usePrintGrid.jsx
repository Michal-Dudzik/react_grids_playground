import {useCallback} from 'react';
import {printGridData} from './customPrintUtils.jsx';

export const usePrintGrid = (gridRef, columns = [], data = [], pagedData = [], actualColumnWidths = null) => {

    const printAll = useCallback(() => {
        printGridData({
            gridRef,
            columns,
            actualColumnWidths,
            data: data,
            mode: 'all',
            title: 'All Data'
        });
    }, [gridRef, columns, actualColumnWidths, data]);

    const printCurrentPage = useCallback(() => {
        printGridData({
            gridRef,
            columns,
            actualColumnWidths,
            data: pagedData,
            mode: 'current',
            title: 'Current Page'
        });
    }, [gridRef, columns, actualColumnWidths, pagedData]);

    const printSelected = useCallback(() => {
        printGridData({
            gridRef,
            columns,
            actualColumnWidths,
            data: data,
            mode: 'selected',
            title: 'Selected Rows'
        });
    }, [gridRef, columns, actualColumnWidths, data]);

    const getSelectedRowsCount = useCallback(() => {
        if (!gridRef?.current?.getSelectedRecords) return 0;
        const selectedRecords = gridRef.current.getSelectedRecords();
        return Array.isArray(selectedRecords) ? selectedRecords.length : 0;
    }, [gridRef]);

    const hasSelectedRows = useCallback(() => {
        const count = getSelectedRowsCount();
        return count > 0;
    }, [getSelectedRowsCount]);

    return {
        printAll,
        printCurrentPage,
        printSelected,
        getSelectedRowsCount,
        hasSelectedRows
    };
};
