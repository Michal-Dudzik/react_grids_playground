import { describe, expect, it } from 'vitest';
import { calculateAutoPageSize } from '../hooks/tableHooks';

describe('calculateAutoPageSize', () => {
  it('calculates page size from the measured table height', () => {
    expect(
      calculateAutoPageSize({
        availableTableHeight: 520,
        headerHeight: 56,
        matchingRowsLength: 40,
        rowHeight: 58,
      }),
    ).toBe(8);
  });

  it('caps page size at the number of matching rows', () => {
    expect(
      calculateAutoPageSize({
        availableTableHeight: 520,
        headerHeight: 56,
        matchingRowsLength: 3,
        rowHeight: 58,
      }),
    ).toBe(3);
  });

  it('does not force a page size before the table can be measured', () => {
    expect(
      calculateAutoPageSize({
        availableTableHeight: 0,
        headerHeight: 56,
        matchingRowsLength: 40,
        rowHeight: 58,
      }),
    ).toBeUndefined();
  });
});
