import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GridProvider, TanStackGrid, plPL } from '../index';
import type { GridEmptyStateProps, GridSpinnerProps } from '../index';

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

describe('GridProvider integration', () => {
  it('uses provider locale and labels when grid props do not override them', async () => {
    const load = vi.fn().mockResolvedValue(columns);

    render(
      <GridProvider labels={plPL} locale="pl-PL">
        <TanStackGrid columnPreferences={{ load }} columns={columns} fetchColumns rows={rows} />
      </GridProvider>,
    );

    await waitFor(() => {
      expect(load).toHaveBeenCalledWith(expect.objectContaining({ languageCode: 'pl-PL' }));
    });
  });

  it('lets TanStackGrid props override provider labels', () => {
    const markup = renderToStaticMarkup(
      <GridProvider labels={{ searchPlaceholder: 'Provider search' }}>
        <TanStackGrid columns={columns} labels={{ searchPlaceholder: 'Prop search' }} rows={rows} />
      </GridProvider>,
    );

    expect(markup).toContain('Prop search');
    expect(markup).not.toContain('Provider search');
  });

  it('renders without a provider', () => {
    const markup = renderToStaticMarkup(<TanStackGrid columns={columns} rows={rows} />);

    expect(markup).toContain('Owner');
    expect(markup).toContain('Ava');
  });

  it('applies provider defaults to grids without local overrides', () => {
    const markup = renderToStaticMarkup(
      <GridProvider defaults={{ footerConfig: { showFooter: false } }}>
        <TanStackGrid columns={columns} rows={rows} />
      </GridProvider>,
    );

    expect(markup).not.toContain('shared-grid-footer');
  });

  it('uses provider-supplied UI components', () => {
    function CustomSpinner({ label }: GridSpinnerProps) {
      return <span data-custom-spinner="true">{label}</span>;
    }

    function CustomEmptyState({ description }: GridEmptyStateProps) {
      return <span data-custom-empty="true">{description}</span>;
    }

    const markup = renderToStaticMarkup(
      <GridProvider
        components={{
          EmptyState: CustomEmptyState,
          Spinner: CustomSpinner,
        }}
      >
        <TanStackGrid columns={columns} loading rows={[]} />
      </GridProvider>,
    );

    expect(markup).toContain('data-custom-spinner="true"');
    expect(markup).toContain('Loading table');
    expect(markup).toContain('data-custom-empty="true"');
  });

  it('maps provider theme tokens to grid CSS variables', () => {
    const markup = renderToStaticMarkup(
      <GridProvider themeTokens={{ accent: '#2563eb', surface: '#ffffff' }}>
        <TanStackGrid columns={columns} rows={rows} />
      </GridProvider>,
    );

    expect(markup).toContain('--ts-grid-accent:#2563eb');
    expect(markup).toContain('--ts-grid-surface:#ffffff');
  });
});
