import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TanStackGrid } from '../index';

const rows = [
  { id: 'row-1', owner: 'Ava', status: 'Live', amount: '$1,200' },
  { id: 'row-2', owner: 'Mina', status: 'Draft', amount: '$800' },
];

const columns = [
  { accessorKey: 'owner', header: 'Owner', size: 160, meta: { editable: true, filterVariant: 'text' } },
  { accessorKey: 'status', header: 'Status', size: 140, meta: { filterVariant: 'select' } },
  { accessorKey: 'amount', header: 'Amount', size: 120 },
];

describe('TanStackGrid package component', () => {
  it('renders with consumer-provided rows and columns only', () => {
    const markup = renderToStaticMarkup(<TanStackGrid rows={rows} columns={columns} />);

    expect(markup).toContain('Owner');
    expect(markup).toContain('Ava');
    expect(markup).toContain('Mina');
    expect(markup).toContain('shared-grid-footer');
  });

  it('renders package-provided slots without importing playground components', () => {
    const markup = renderToStaticMarkup(
      <TanStackGrid
        rows={rows}
        columns={columns}
        slots={{
          cellPreviewRenderers: {
            status: ({ value }) => <strong data-slot="status">{String(value)}</strong>,
          },
        }}
      />,
    );

    expect(markup).toContain('data-slot="status"');
    expect(markup).toContain('Live');
  });
});
