import { forwardRef, useMemo, useState } from 'react';
import {
  createLocalStorageGridStateAdapter,
  TanStackGrid,
} from '@react-grids-playground/tanstack-grid';
import { getDemoRows } from '../../demoData';
import { StatusBadge } from '../../demoData/StatusBadge';

const demoColumns = [
  {
    accessorKey: 'id',
    header: 'Campaign',
    size: 150,
    meta: {
      filterVariant: 'text',
    },
  },
  {
    accessorKey: 'owner',
    header: 'Owner',
    size: 180,
    meta: {
      editable: true,
      filterVariant: 'text',
    },
  },
  {
    accessorKey: 'region',
    header: 'Region',
    size: 160,
    meta: {
      editable: true,
      filterVariant: 'select',
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 150,
    meta: {
      editable: true,
      filterVariant: 'select',
    },
  },
  {
    accessorKey: 'revenue',
    header: 'Revenue',
    size: 140,
    meta: {
      editable: true,
      filterVariant: 'text',
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    size: 140,
    meta: {
      display: {
        type: 'date',
      },
      editable: true,
      filterVariant: 'text',
    },
  },
];

export const TanStackTablePreview = forwardRef(function TanStackTablePreview(props, ref) {
  const [selectionMode, setSelectionMode] = useState('multi');
  const [pageSize, setPageSize] = useState(5);
  const [showAllRows, setShowAllRows] = useState(false);
  const [autoPageSize, setAutoPageSize] = useState(true);
  const [rowDensity, setRowDensity] = useState('standard');
  const [editingEnabled, setEditingEnabled] = useState(true);
  const rows = useMemo(() => props.rows ?? getDemoRows(), [props.rows]);
  const columns = useMemo(() => props.columns ?? demoColumns, [props.columns]);
  const persistence = useMemo(
    () => ({
      columnState: createLocalStorageGridStateAdapter({
        fallback: {},
        key: 'tanstack-table-preview-column-state-v1',
      }),
      filterState: createLocalStorageGridStateAdapter({
        fallback: {},
        key: 'tanstack-table-preview-filter-state-v1',
      }),
      presentationRules: createLocalStorageGridStateAdapter({
        key: 'tanstack-table-preview-presentation-rules-v1',
      }),
    }),
    [],
  );
  const slots = useMemo(
    () => ({
      cellPreviewRenderers: {
        status: ({ renderHighlightedText, searchTerm, value }) => (
          <StatusBadge value={value}>{renderHighlightedText(value, searchTerm)}</StatusBadge>
        ),
      },
    }),
    [],
  );

  return (
    <>
      
      <TanStackGrid
        {...props}
        autoPageSize={autoPageSize}
        columns={columns}
        editingEnabled={editingEnabled}
        onAutoPageSizeChange={setAutoPageSize}
        onEditingEnabledChange={setEditingEnabled}
        onPageSizeChange={setPageSize}
        onRowDensityChange={setRowDensity}
        onSelectionModeChange={setSelectionMode}
        onShowAllRowsChange={setShowAllRows}
        pageSize={pageSize}
        persistence={props.persistence ?? persistence}
        ref={ref}
        rowDensity={rowDensity}
        rows={rows}
        selectionMode={selectionMode}
        showAllRows={showAllRows}
        slots={props.slots ?? slots}
      />
    </>
  );
});
