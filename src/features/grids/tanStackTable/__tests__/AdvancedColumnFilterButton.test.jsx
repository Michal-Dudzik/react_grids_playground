import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdvancedColumnFilterButton } from '../components/TanStackTableComponents';

describe('AdvancedColumnFilterButton', () => {
  it('clears an applied filter from the dialog without throwing', () => {
    const onClear = vi.fn();

    render(
      <AdvancedColumnFilterButton
        column={{
          getFilterValue: () => ({
            operator: 'contains',
            query: 'EU',
            selectedValues: [],
          }),
          getIsSorted: () => false,
          id: 'region',
          toggleSorting: vi.fn(),
          clearSorting: vi.fn(),
        }}
        isOpen
        onClear={onClear}
        onClose={vi.fn()}
        onFilterChange={vi.fn()}
        onToggle={vi.fn()}
        rows={[
          { id: 'row-1', region: 'EU' },
          { id: 'row-2', region: 'US' },
        ]}
        triggerVariant="icon"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onClear).toHaveBeenCalledWith('region');
  });
});
