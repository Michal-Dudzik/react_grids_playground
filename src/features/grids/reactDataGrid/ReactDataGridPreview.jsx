import 'react-data-grid/lib/styles.css';

import { DataGrid } from 'react-data-grid';
import { StatusBadge } from '../../demoData/StatusBadge';
import { getDemoRows } from '../../demoData';
import { useAppThemeMode } from '../../../shared/hooks/useAppThemeMode';

const rows = getDemoRows();

const columns = [
  { key: 'id', name: 'Campaign', frozen: true, sortable: true, resizable: true },
  { key: 'owner', name: 'Owner', sortable: true, resizable: true },
  { key: 'region', name: 'Region', sortable: true, resizable: true },
  {
    key: 'status',
    name: 'Status',
    sortable: true,
    resizable: true,
    renderCell: ({ row }) => <StatusBadge value={row.status} />,
  },
  { key: 'revenue', name: 'Revenue', sortable: true, resizable: true },
  { key: 'updatedAt', name: 'Updated', sortable: true, resizable: true },
];

function rowKeyGetter(row) {
  return row.id;
}

export function ReactDataGridPreview() {
  const themeMode = useAppThemeMode();

  return (
    <div className="react-data-grid-preview">
      <DataGrid
        className={themeMode === 'dark' ? 'rdg-dark' : 'rdg-light'}
        columns={columns}
        defaultColumnOptions={{
          resizable: true,
          sortable: true,
        }}
        rowKeyGetter={rowKeyGetter}
        rows={rows}
      />
    </div>
  );
}
