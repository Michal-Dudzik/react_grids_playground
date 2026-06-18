import { useCallback, useMemo } from 'react';
import type { Column, Row, RowData } from '@tanstack/react-table';
import { getColumnDisplayText } from '../../../../core/tableDisplay';
import {
  buildCsvContent,
  buildCsvValue,
} from '../../../../core/tableUtils';
import type { GridClipboardAdapter, GridExportAdapter, GridPrintAdapter } from '../../../../types';
import { copyText, downloadCsvFile, openPrintWindow } from '../../../browser';

type PrintMode = 'selected' | 'all' | 'page';

export interface UseGridExportPrintOptions<TData extends RowData = RowData> {
  matchingRows?: Row<TData>[];
  clipboardAdapter?: GridClipboardAdapter;
  exportAdapter?: GridExportAdapter;
  exportPdfLabel?: string;
  includeExportPdf?: boolean;
  printAdapter?: GridPrintAdapter;
  selectedRows?: Row<TData>[];
  visibleExportColumns?: Column<TData, unknown>[];
  visibleRows?: Row<TData>[];
}

export function useGridExportPrint<TData extends RowData = RowData>({
  matchingRows = [],
  clipboardAdapter,
  exportAdapter,
  exportPdfLabel = 'Export PDF',
  includeExportPdf = false,
  printAdapter,
  selectedRows = [],
  visibleExportColumns = [],
  visibleRows = [],
}: UseGridExportPrintOptions<TData> = {}) {
  const exportFilteredRows = useCallback(() => {
    const csvContent = buildCsvContent(visibleExportColumns, matchingRows);
    (exportAdapter?.downloadCsvFile ?? downloadCsvFile)('tanstack-table-export.csv', csvContent);
  }, [exportAdapter, visibleExportColumns, matchingRows]);

  const printRows = useCallback(
    (mode: PrintMode) => {
      const modeConfig: Record<PrintMode, { rows: Row<TData>[]; title: string }> = {
        selected: { rows: selectedRows, title: 'TanStack Table - Selected Rows' },
        all: { rows: matchingRows, title: 'TanStack Table - All Filtered Rows' },
        page: { rows: visibleRows, title: 'TanStack Table - Current Page' },
      };
      const { rows: printableRows, title: printTitle } = modeConfig[mode] ?? modeConfig.page;

      if (printableRows.length === 0) {
        return;
      }

      (printAdapter?.openPrintWindow ?? openPrintWindow)({
        columns: visibleExportColumns,
        rows: printableRows,
        title: printTitle,
      });
    },
    [matchingRows, printAdapter, selectedRows, visibleExportColumns, visibleRows],
  );

  const exportPdfView = useCallback(() => {
    printRows('all');
  }, [printRows]);

  const copyContextRow = useCallback(
    (row: Row<TData>) => {
      const content = visibleExportColumns
        .map((column) =>
          buildCsvValue(getColumnDisplayText(column, row.getValue(column.id), 'export')),
        )
        .join(',');

      (clipboardAdapter?.copyText ?? copyText)(content);
    },
    [clipboardAdapter, visibleExportColumns],
  );

  const printMenuItems = useMemo(() => {
    const items = [
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
    ];

    if (includeExportPdf) {
      items.push({
        key: 'export-pdf',
        label: exportPdfLabel,
        onClick: exportPdfView,
      });
    }

    return items;
  }, [exportPdfLabel, exportPdfView, includeExportPdf, printRows, selectedRows.length]);

  return {
    copyContextRow,
    exportFilteredRows,
    exportPdfView,
    printMenuItems,
    printRows,
  };
}
