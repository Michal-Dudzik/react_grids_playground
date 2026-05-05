import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { EditableCell } from '../components/TanStackTableComponents';

describe('EditableCell', () => {
  it('renders only the select editor for editable badge-backed cells', () => {
    const updateData = vi.fn();
    const markup = renderToStaticMarkup(
      <EditableCell
        column={{
          id: 'status',
          columnDef: {
            header: 'Status',
            meta: {
              editable: true,
              filterOptions: ['Live', 'Review', 'Draft'],
              filterVariant: 'select',
            },
          },
        }}
        getValue={() => 'Live'}
        renderPreview={(value) => <span className="status-badge">{value}</span>}
        row={{ original: { id: 'row-1' } }}
        searchTerm=""
        table={{ options: { meta: { updateData } } }}
      />,
    );

    expect(markup).toContain('<select');
    expect(markup).not.toContain('status-badge');
    expect(markup).not.toContain('tanstack-grid__editable-preview');
  });
});
