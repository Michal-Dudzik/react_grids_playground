import { describe, expect, it } from 'vitest';
import { fillColumnWidthsToAvailableGridWidth } from '../adapters/antd/features/columns/useGridColumnSettings';

describe('fillColumnWidthsToAvailableGridWidth', () => {
  it('distributes remaining grid width across stretch columns', () => {
    expect(
      fillColumnWidthsToAvailableGridWidth(
        {
          select: 44,
          owner: 120,
          status: 100,
        },
        384,
        ['owner', 'status'],
      ),
    ).toEqual({
      select: 44,
      owner: 180,
      status: 160,
    });
  });

  it('keeps content-fit widths when they already fill the grid', () => {
    expect(
      fillColumnWidthsToAvailableGridWidth(
        {
          owner: 220,
          status: 180,
        },
        320,
        ['owner', 'status'],
      ),
    ).toEqual({
      owner: 220,
      status: 180,
    });
  });
});
