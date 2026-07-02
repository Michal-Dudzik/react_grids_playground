import { describe, expect, it } from 'vitest';
import {
  buildColumnPreferencesPayload,
  buildColumnSettingsState,
  buildTanStackDataColumns,
  normalizeColumnOrder,
} from '../core/tableColumns';
import { advancedColumnFilterFn, normalizeFilterState } from '../core/tableFilters';
import {
  cloneDefaultPresentationRules,
  getMatchingPresentationRule,
  normalizePresentationRules,
} from '../core/tablePresentationRules';
import { getColumnAggregates, getNumericAggregateValues } from '../core/tableAggregation';
import { buildCsvContent, buildPrintableMarkup, buildXlsxContent, prepareContextMenuItems } from '../core/tableUtils';

const rows = [
  {
    original: { id: 'row-1', amount: '$1,200', owner: 'Ava', status: 'Live' },
    getValue(key: string) {
      return this.original[key as keyof typeof this.original];
    },
  },
  {
    original: { id: 'row-2', amount: '$800', owner: 'Mina', status: 'Draft' },
    getValue(key: string) {
      return this.original[key as keyof typeof this.original];
    },
  },
];

describe('core column helpers', () => {
  it('normalizes order, sizing and visibility against current columns', () => {
    const columns = buildTanStackDataColumns([
      { accessorKey: 'owner', header: 'Owner', size: 180 },
      { alias: 'amount', description: 'Amount', width: 120 },
    ]);
    const defaults = ['select', 'owner', 'amount'];

    expect(normalizeColumnOrder(['amount'], defaults)).toEqual(['select', 'amount', 'owner']);
    expect(buildColumnSettingsState({ columnVisibility: { owner: false, stale: false } }, columns)).toMatchObject({
      columnOrder: ['select', 'owner', 'amount'],
      columnVisibility: { owner: false },
    });
    expect(buildColumnPreferencesPayload({ columnOrder: ['select', 'amount', 'owner'] }, columns)).toEqual([
      expect.objectContaining({ alias: 'amount', orderID: 1, visible: true }),
      expect.objectContaining({ alias: 'owner', orderID: 2, visible: true }),
    ]);
  });

  it('maps local and API-like columns without importing Syncfusion code', () => {
    const columns = buildTanStackDataColumns([
      { accessorKey: 'owner', header: 'Owner' },
      { alias: 'GrossValue', description: 'Gross value', width: 160, readOnly: true },
    ]);

    expect(columns.map((column) => column.id)).toEqual(['owner', 'grossValue']);
    expect(columns[1]).toMatchObject({
      header: 'Gross value',
      size: 160,
      meta: expect.objectContaining({ editable: false }),
    });
  });
});

describe('core filters, presentation and aggregation', () => {
  it('normalizes and applies advanced filters', () => {
    expect(normalizeFilterState({
      columnFilters: [{ id: 'amount', value: { operator: 'greaterThan', query: '900' } }],
      showFilters: false,
    }, ['select', 'amount'])).toMatchObject({ showFilters: true });
    expect(advancedColumnFilterFn(rows[0] as any, 'amount', { operator: 'greaterThan', query: '900' })).toBe(true);
    expect(advancedColumnFilterFn(rows[1] as any, 'amount', { operator: 'greaterThan', query: '900' })).toBe(false);
  });

  it('normalizes presentation rules and matches row/cell/header targets', () => {
    const [rule] = normalizePresentationRules([
      { id: 'live', name: 'Live', target: 'row', field: 'status', operator: 'equals', value: 'Live' },
    ]);

    expect(cloneDefaultPresentationRules().length).toBeGreaterThan(0);
    expect(getMatchingPresentationRule([rule], { row: rows[0], target: 'row' })).toMatchObject({ id: 'live' });
    expect(getMatchingPresentationRule([rule], { row: rows[1], target: 'row' })).toBeUndefined();
  });

  it('calculates numeric aggregates from formatted values', () => {
    expect(getNumericAggregateValues(rows as any, 'amount')).toEqual([1200, 800]);
    expect(getColumnAggregates({
      columnId: 'amount',
      labels: { average: 'Average', max: 'Max', min: 'Min', sum: 'Sum' },
      tableRows: rows,
    } as any)).toEqual([
      expect.objectContaining({ key: 'sum' }),
      expect.objectContaining({ key: 'average' }),
      expect.objectContaining({ key: 'min' }),
      expect.objectContaining({ key: 'max' }),
    ]);
  });
});

describe('core context and export payload helpers', () => {
  it('applies context menu hide and disable maps recursively', () => {
    const items = prepareContextMenuItems([
      { key: 'copy', label: 'Copy' },
      { key: 'layout', label: 'Layout', items: [{ key: 'fit', label: 'Fit' }] },
    ], {}, {
      disabledMap: { fit: true },
      hiddenMap: { copy: true },
      labels: { layout: 'Columns' },
    });

    expect(items).toEqual([
      expect.objectContaining({
        key: 'layout',
        label: 'Columns',
        items: [expect.objectContaining({ key: 'fit', disabled: true })],
      }),
    ]);
  });

  it('builds CSV and printable markup without DOM assumptions', () => {
    const columns = [
      { id: 'owner', columnDef: { header: 'Owner' }, getSize: () => 140 },
      { id: 'amount', columnDef: { header: 'Amount' }, getSize: () => 120 },
    ];

    expect(buildCsvContent(columns as any, rows as any)).toContain('"Owner","Amount"');
    expect(buildPrintableMarkup({ columns, rows, title: 'Print' } as any)).toContain('<table>');
  });

  it('uses getValue for printable markup when it differs from row.original', () => {
    const columns = [{ id: 'amount', columnDef: { header: 'Amount' }, getSize: () => 120 }];
    const exportRows = [
      {
        original: { amount: 1200 },
        getValue() {
          return '$1,200';
        },
      },
    ];

    expect(buildCsvContent(columns as any, exportRows as any)).toContain('$1,200');
    expect(buildPrintableMarkup({ columns, rows: exportRows, title: 'Print' } as any)).toContain('$1,200');
    expect(buildPrintableMarkup({ columns, rows: exportRows, title: 'Print' } as any)).not.toContain('>1200<');
  });

  it('builds an XLSX workbook as an OpenXML zip archive', () => {
    const columns = [
      { id: 'owner', columnDef: { header: 'Owner' }, getSize: () => 140 },
      { id: 'amount', columnDef: { header: 'Amount' }, getSize: () => 120 },
    ];
    const xlsxContent = buildXlsxContent(columns as any, rows as any, { sheetName: 'Orders' });
    const decodedContent = new TextDecoder().decode(xlsxContent);

    expect(Array.from(xlsxContent.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(decodedContent).toContain('xl/worksheets/sheet1.xml');
    expect(decodedContent).toContain('<sheet name="Orders"');
    expect(decodedContent).toContain('Ava');
  });

  it('exports formatted numeric values as right-aligned Excel numbers', () => {
    const columns = [
      { id: 'amount', columnDef: { header: 'Amount' }, getSize: () => 120 },
    ];
    const exportRows = [
      {
        original: { amount: 1200 },
        getValue() {
          return '$1,200';
        },
      },
    ];
    const xlsxContent = buildXlsxContent(columns as any, exportRows as any);
    const decodedContent = new TextDecoder().decode(xlsxContent);

    expect(decodedContent).toContain('<v>1200</v>');
    expect(decodedContent).toContain('horizontal="right"');
    expect(decodedContent).toContain('formatCode="&quot;$&quot;#,##0"');
  });
});
