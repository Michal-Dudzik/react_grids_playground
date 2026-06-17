import { forwardRef, useMemo, useState } from 'react';
import SyncfusionGrid from './SyncfusionGrid';
import { getDemoRows } from '../../demoData';

const syncfusionColumns = [
  {
    field: 'id',
    headerText: 'Campaign',
    width: 150,
  },
  {
    field: 'owner',
    headerText: 'Owner',
    width: 180,
  },
  {
    field: 'region',
    headerText: 'Region',
    width: 160,
  },
  {
    field: 'status',
    headerText: 'Status',
    width: 150,
  },
  {
    field: 'revenue',
    headerText: 'Revenue',
    width: 140,
    textAlign: 'Right',
  },
  {
    field: 'updatedAt',
    headerText: 'Updated',
    width: 140,
  },
];

const syncfusionAggregation = [
  {
    field: 'revenue',
    type: 'count',
    label: 'Rows',
  },
];

export const SyncfusionGridPreview = forwardRef(function SyncfusionGridPreview(props, ref) {
  const [selectedRows, setSelectedRows] = useState([]);
  const rows = useMemo(() => props.rows ?? getDemoRows(), [props.rows]);
  const columns = useMemo(() => props.columns ?? syncfusionColumns, [props.columns]);

  return (
    <SyncfusionGrid
      {...props}
      aggregationConfig={props.aggregationConfig ?? syncfusionAggregation}
      allowEditing
      autoCalculatePageSize
      columns={columns}
      data={rows}
      enableSelectionColumn
      footerConfig={{
        showFooter: true,
        showPrint: true,
        showExportExcel: true,
        showColumnsSettings: true,
        showPresentationSettings: true,
        hidePageCount: false,
        ...props.footerConfig,
        buttons: [
          {
            key: 'selected-count',
            isCustomComponent: true,
            component: <span className="syncfusion-preview__selection">{selectedRows.length} selected</span>,
          },
          ...(props.footerConfig?.buttons ?? []),
        ],
      }}
      lowRowHeight
      onSelectionChange={setSelectedRows}
      pageSettings={props.pageSettings ?? { pageSize: 5, pageSizes: [5, 10, 20, 50] }}
      ref={ref}
      searchFields={props.searchFields ?? ['id', 'owner', 'region', 'status', 'revenue', 'updatedAt']}
    />
  );
});
