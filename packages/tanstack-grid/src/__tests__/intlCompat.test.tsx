import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TanStackGrid, TanStackGridCompat, createGridMessageResolver } from '../index';

const rows = [
  { id: 'row-1', amount: 1200, owner: 'Ava', status: 'Live' },
  { id: 'row-2', amount: 800, owner: 'Mina', status: 'Draft' },
];

const columns = [
  { field: 'owner', headerText: 'Owner', width: 160 },
  { field: 'status', headerText: 'Status', width: 140 },
  { field: 'amount', headerText: 'Amount', width: 120 },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('TanStackGrid intl support', () => {
  it('resolves default labels, direct overrides and formatMessage overrides', () => {
    const defaultMessage = createGridMessageResolver();
    const labelMessage = createGridMessageResolver({ labels: { searchPlaceholder: 'Szukaj' } });
    const formattedMessage = createGridMessageResolver({
      formatMessage: (descriptor) => `fmt:${descriptor.id}`,
    });

    expect(defaultMessage('searchPlaceholder')).toBe('Search');
    expect(labelMessage('searchPlaceholder')).toBe('Szukaj');
    expect(formattedMessage('searchPlaceholder')).toBe('fmt:tanstackGrid.searchPlaceholder');
  });

  it('passes locale as languageCode to API column loaders', async () => {
    const load = vi.fn().mockResolvedValue(columns);

    render(
      <TanStackGrid
        columnPreferences={{ load }}
        columns={columns}
        fetchColumns
        locale="pl-PL"
        rows={rows}
      />,
    );

    await waitFor(() => {
      expect(load).toHaveBeenCalledWith(expect.objectContaining({ languageCode: 'pl-PL' }));
    });
  });

  it('uses label overrides in rendered grid controls', () => {
    const markup = renderToStaticMarkup(
      <TanStackGrid
        columns={columns}
        labels={{ searchPlaceholder: 'Szukaj wierszy' }}
        rows={rows}
      />,
    );

    expect(markup).toContain('Szukaj wierszy');
  });
});

describe('TanStackGridCompat', () => {
  it('maps Syncfusion-style data, templates, decoration and footer config', () => {
    function AmountTemplate(props) {
      return <strong data-template="amount">{props.amount}</strong>;
    }

    const markup = renderToStaticMarkup(
      <TanStackGridCompat
        columns={columns}
        data={rows}
        decoration={{
          getCellDecoration: (_row, field) => (field === 'status' ? { className: 'cell-locked' } : undefined),
        }}
        footerConfig={{
          buttons: [{ component: <span>Custom footer</span>, isCustomComponent: true, key: 'custom' }],
          showFooter: true,
        }}
        templateRules={[
          {
            match: (column) => (column as { field?: string; alias?: string }).field === 'amount' || (column as { field?: string; alias?: string }).alias === 'amount',
            template: AmountTemplate,
          },
        ]}
      />,
    );

    expect(markup).toContain('Ava');
    expect(markup).toContain('data-template="amount"');
    expect(markup).toContain('cell-locked');
    expect(markup).toContain('Custom footer');
  });

  it('maps Syncfusion-style aggregation config to per-column summary operations', () => {
    render(
      <TanStackGridCompat
        autoPageSize={false}
        columns={columns}
        data={rows}
        aggregationConfig={[{ field: 'amount', types: ['sum', 'avg', 'count'] }]}
      />,
    );

    fireEvent.click(screen.getByTitle('Show summary'));

    expect(screen.getByText('Sum')).toBeInTheDocument();
    expect(screen.getByText('Average')).toBeInTheDocument();
    expect(screen.getByText('Count')).toBeInTheDocument();
  });
});
