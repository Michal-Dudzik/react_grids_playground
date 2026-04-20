import '@mantine/core/styles.css';
import 'mantine-datatable/styles.css';

import { MantineProvider } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import { StatusBadge } from '../../demoData/StatusBadge';
import { getDemoRows } from '../../demoData';
import { useAppThemeMode } from '../../../shared/hooks/useAppThemeMode';

const rows = getDemoRows();

const columns = [
  {
    accessor: 'id',
    title: 'Campaign',
  },
  {
    accessor: 'owner',
  },
  {
    accessor: 'region',
  },
  {
    accessor: 'status',
    render: ({ status }) => <StatusBadge value={status} />,
  },
  {
    accessor: 'revenue',
  },
  {
    accessor: 'updatedAt',
    title: 'Updated',
  },
];

export function MantinePreview() {
  const themeMode = useAppThemeMode();

  return (
    <MantineProvider forceColorScheme={themeMode}>
      <div className="mantine-grid-preview">
        <DataTable
          borderRadius="md"
          columns={columns}
          highlightOnHover
          minHeight={560}
          records={rows}
          striped
          withColumnBorders
          withTableBorder
        />
      </div>
    </MantineProvider>
  );
}
