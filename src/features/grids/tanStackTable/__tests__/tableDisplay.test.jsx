import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildTanStackDataColumns } from '../lib/tableColumns';
import {
  compileColumnDisplay,
  getColumnDisplayText,
  renderColumnDisplayValue,
} from '../lib/tableDisplay.js';

describe('tableDisplay', () => {
  it('formats date display values through compiled column metadata', () => {
    const [column] = buildTanStackDataColumns([
      {
        accessorKey: 'paymentDate',
        field: 'paymentDate',
        headerText: 'Payment date',
        meta: {
          display: {
            type: 'date',
          },
        },
      },
    ]);

    expect(getColumnDisplayText(column, '2024-07-12T08:15:00', 'cell')).toBe('2024-07-12');
    expect(getColumnDisplayText(column, '1900-01-01T00:00:00', 'cell')).toBe('');
  });

  it('maps Syncfusion-style checkmark metadata into a TanStack display renderer', () => {
    const [column] = buildTanStackDataColumns([
      {
        alias: 'isConfirmed',
        allowColFiltering: true,
        allowColSorting: true,
        colValueAccessor: 'checkmark',
        description: 'Confirmed',
        visible: true,
        width: 120,
      },
    ]);

    const truthyMarkup = renderToStaticMarkup(
      renderColumnDisplayValue({
        column: {
          columnDef: {
            meta: column.meta,
          },
        },
        rawValue: true,
        renderText: (value) => value,
        searchTerm: '',
      }),
    );
    const falsyMarkup = renderToStaticMarkup(
      renderColumnDisplayValue({
        column: {
          columnDef: {
            meta: column.meta,
          },
        },
        rawValue: false,
        renderText: (value) => value,
        searchTerm: '',
      }),
    );

    expect(typeof column.meta.display?.renderer).toBe('function');
    expect(truthyMarkup).toContain('✓');
    expect(falsyMarkup).toBe('');
    expect(getColumnDisplayText(column, true, 'export')).toBe('✓');
    expect(getColumnDisplayText(column, false, 'export')).toBe('');
  });

  it('can compile display presets directly from colValueAccessor values', () => {
    const dateDisplay = compileColumnDisplay({}, { colValueAccessor: 'date' });
    const checkmarkDisplay = compileColumnDisplay({}, { colValueAccessor: 'checkmark' });

    expect(typeof dateDisplay?.formatter).toBe('function');
    expect(typeof checkmarkDisplay?.renderer).toBe('function');
  });
});
