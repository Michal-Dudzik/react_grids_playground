import { useCallback, useMemo } from 'react';
import { getColumnDisplayText } from '../../lib/tableDisplay';
import {
  buildCsvContent,
  buildCsvValue,
  copyText,
  downloadCsvFile,
  openPrintWindow,
} from '../../lib/tableUtils';

export function useGridExportPrint({
  matchingRows = [],
  selectedRows = [],
  visibleExportColumns = [],
  visibleRows = [],
} = {}) {
  const exportFilteredRows = useCallback(() => {
    const csvContent = buildCsvContent(visibleExportColumns, matchingRows);
    downloadCsvFile('tanstack-table-export.csv', csvContent);
  }, [visibleExportColumns, matchingRows]);

  const printRows = useCallback(
    (mode) => {
      const modeConfig = {
        selected: { rows: selectedRows, title: 'TanStack Table - Selected Rows' },
        all: { rows: matchingRows, title: 'TanStack Table - All Filtered Rows' },
        page: { rows: visibleRows, title: 'TanStack Table - Current Page' },
      };
      const { rows: printableRows, title: printTitle } = modeConfig[mode] ?? modeConfig.page;

      if (printableRows.length === 0) {
        return;
      }

      openPrintWindow({
        columns: visibleExportColumns,
        rows: printableRows,
        title: printTitle,
      });
    },
    [matchingRows, selectedRows, visibleExportColumns, visibleRows],
  );

  const exportPdfView = useCallback(() => {
    printRows('all');
  }, [printRows]);

  const copyContextRow = useCallback(
    (row) => {
      const content = visibleExportColumns
        .map((column) =>
          buildCsvValue(getColumnDisplayText(column, row.getValue(column.id), 'export')),
        )
        .join(',');

      copyText(content);
    },
    [visibleExportColumns],
  );

  const printMenuItems = useMemo(
    () => [
      {
        key: 'current-page',
        label: 'Print current page',
        onClick: () => printRows('page'),
      },
      {
        key: 'all-filtered',
        label: 'Print all filtered rows',
        onClick: () => printRows('all'),
      },
      {
        key: 'selected',
        disabled: selectedRows.length === 0,
        label: 'Print selected rows',
        onClick: () => printRows('selected'),
      },
    ],
    [printRows, selectedRows],
  );

  return {
    copyContextRow,
    exportFilteredRows,
    exportPdfView,
    printMenuItems,
    printRows,
  };
}
