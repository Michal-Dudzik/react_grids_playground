import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { StatusBadge } from '../../demoData/StatusBadge';
import { getDemoRows } from '../../demoData';

const rows = getDemoRows();

function renderStatus(row) {
  return <StatusBadge value={row.status} />;
}

export function PrimeReactPreview() {
  return (
    <div className="prime-grid-preview">
      <DataTable
        dataKey="id"
        removableSort
        scrollable
        scrollHeight="560px"
        showGridlines
        size="small"
        stripedRows
        tableStyle={{ minWidth: '48rem' }}
        value={rows}
      >
        <Column
          field="id"
          header="Campaign"
          sortable
        />
        <Column
          field="owner"
          header="Owner"
          sortable
        />
        <Column
          field="region"
          header="Region"
          sortable
        />
        <Column
          body={renderStatus}
          field="status"
          header="Status"
          sortable
        />
        <Column
          field="revenue"
          header="Revenue"
          sortable
        />
        <Column
          field="updatedAt"
          header="Updated"
          sortable
        />
      </DataTable>
    </div>
  );
}
