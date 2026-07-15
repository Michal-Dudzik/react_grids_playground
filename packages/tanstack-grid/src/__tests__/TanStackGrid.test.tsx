import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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
    expect(markup).toContain('tanstack-grid__presentation-cell--custom-display');
    expect(markup).toContain('Live');
  });

  it('marks custom presentation cells so replacement content can be centered', () => {
    const presentationRules = [
      {
        id: 'live-status',
        name: 'Live status',
        enabled: true,
        target: 'cell' as const,
        field: 'status',
        operator: 'equals',
        value: 'Live',
        decoration: 'success',
        backgroundColor: '',
        cellDisplay: 'pill',
        textColor: '',
      },
    ];
    const markup = renderToStaticMarkup(
      <TanStackGrid
        rows={rows}
        columns={columns}
        persistence={{
          presentationRules: {
            read: () => presentationRules,
            write: () => {},
          },
        }}
      />,
    );

    expect(markup).toContain('tanstack-grid__presentation-cell--custom-display');
    expect(markup).toContain('tanstack-grid__replacement--pill');
  });

  it('hides the page size selector while auto page size is enabled', () => {
    const markup = renderToStaticMarkup(<TanStackGrid rows={rows} columns={columns} autoPageSize />);

    expect(markup).not.toContain('shared-grid-footer-page-size');
  });

  it('does not loop selection reporting when getRowId is omitted', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args) => {
      const message = args.map(String).join(' ');

      if (message.includes('Maximum update depth exceeded')) {
        throw new Error(message);
      }
    });

    expect(() => render(<TanStackGrid rows={rows} columns={columns} />)).not.toThrow();
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining('Maximum update depth exceeded'));
  });

  it('keeps selection distinct for rows without an id field', async () => {
    const onSelectionChange = vi.fn();

    render(
      <TanStackGrid
        columns={[{ accessorKey: 'owner', header: 'Owner' }]}
        onSelectionChange={onSelectionChange}
        rows={[{ owner: 'Ava' }, { owner: 'Mina' }]}
      />,
    );

    fireEvent.click(screen.getByLabelText('Select row 1'));
    await waitFor(() => expect(screen.getByLabelText('Select row 1')).toBeChecked());
    fireEvent.click(screen.getByLabelText('Select row 2'));

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenLastCalledWith(
        [{ owner: 'Ava' }, { owner: 'Mina' }],
        expect.objectContaining({ ids: ['0', '1'] }),
      );
    });
  });

  it('passes row context to native context menu actions', () => {
    const onEdit = vi.fn();

    render(
      <TanStackGrid
        columns={columns}
        contextMenuConfig={{
          cellItems: () => [{ key: 'edit', label: 'Edit row', onSelect: onEdit }],
        }}
        rows={rows}
      />,
    );

    fireEvent.contextMenu(screen.getByText('Ava').closest('td')!);
    fireEvent.click(screen.getByText('Edit row'));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({
      columnId: 'owner',
      row: rows[0],
      rowId: 'row-1',
      target: 'cell',
    }));
  });

  it('renders useful column summaries instead of diagnostic summary items', () => {
    render(
      <TanStackGrid
        aggregationConfig={{ columns: [{ id: 'amount', operations: ['sum'] }] }}
        autoPageSize={false}
        columns={columns}
        pageSize={1}
        rows={rows}
      />,
    );

    fireEvent.click(screen.getByTitle('Show summary'));

    expect(screen.getByText('Summaries')).toBeInTheDocument();
    expect(screen.queryByText('Visible rows')).not.toBeInTheDocument();
    expect(screen.queryByText('Matching rows')).not.toBeInTheDocument();
    expect(screen.queryByText('Selected rows')).not.toBeInTheDocument();
    expect(screen.getAllByText('Amount').length).toBeGreaterThan(1);
    expect(screen.getByText('1,200')).toBeInTheDocument();

    fireEvent.click(screen.getByText('All pages'));

    expect(screen.getByText('2,000')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Summary details'));

    expect(screen.getAllByText('Summary details').length).toBeGreaterThan(0);
    expect(screen.getAllByText('All pages').length).toBeGreaterThan(0);
  });
});
