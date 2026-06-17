import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import SyncfusionGrid from './SyncfusionGrid';
import apiClient from '../../../api/apiClient';
import { boolCheckmarkTemplate } from './features/templates/useTemplates';
import { useFeatureContextMenu } from './features/contextMenu/useContextMenu';

const jpkRows = [
  {
    id: 'JPK-001',
    invoiceNo: 'FV/2026/001',
    contractor: 'Northwind Sp. z o.o.',
    taxDate: '2026-06-01',
    k10: 12840.25,
    k11: 2953.26,
    gtu01: 1,
    requiresAttention: false,
    locked: false,
  },
  {
    id: 'JPK-002',
    invoiceNo: 'FV/2026/002',
    contractor: 'Contoso Polska',
    taxDate: '2026-06-04',
    k10: 6170,
    k11: 1419.1,
    gtu01: 0,
    requiresAttention: true,
    locked: true,
  },
  {
    id: 'JPK-003',
    invoiceNo: 'FV/2026/003',
    contractor: 'Fabrikam EU',
    taxDate: '2026-06-09',
    k10: 9820.5,
    k11: 2258.72,
    gtu01: 1,
    requiresAttention: false,
    locked: false,
  },
  {
    id: 'JPK-004',
    invoiceNo: 'FV/2026/004',
    contractor: 'Adventure Works',
    taxDate: '2026-06-13',
    k10: 2710,
    k11: 623.3,
    gtu01: 0,
    requiresAttention: false,
    locked: true,
  },
];

const apiColumns = {
  'en-US': [
    { alias: 'id', description: 'JPK row', width: 130, orderID: 1, visible: true, readOnly: true },
    { alias: 'invoiceNo', description: 'Invoice number', width: 170, orderID: 2, visible: true },
    { alias: 'contractor', description: 'Contractor', width: 210, orderID: 3, visible: true },
    { alias: 'taxDate', description: 'Tax date', width: 140, orderID: 4, visible: true },
    { alias: 'k10', description: 'Net value K_10', width: 150, alignment: 'R', orderID: 5, visible: true },
    { alias: 'k11', description: 'VAT K_11', width: 140, alignment: 'R', orderID: 6, visible: true },
    { alias: 'gtu01', description: 'GTU 01', width: 100, alignment: 'M', orderID: 7, visible: true },
  ],
  'pl-PL': [
    { alias: 'id', description: 'Wiersz JPK', width: 130, orderID: 1, visible: true, readOnly: true },
    { alias: 'invoiceNo', description: 'Numer faktury', width: 170, orderID: 2, visible: true },
    { alias: 'contractor', description: 'Kontrahent', width: 210, orderID: 3, visible: true },
    { alias: 'taxDate', description: 'Data podatku', width: 140, orderID: 4, visible: true },
    { alias: 'k10', description: 'Netto K_10', width: 150, alignment: 'R', orderID: 5, visible: true },
    { alias: 'k11', description: 'VAT K_11', width: 140, alignment: 'R', orderID: 6, visible: true },
    { alias: 'gtu01', description: 'GTU 01', width: 100, alignment: 'M', orderID: 7, visible: true },
  ],
};

const localColumns = [
  { field: 'id', headerText: 'Row', width: 120 },
  { field: 'invoiceNo', headerText: 'Invoice', width: 170 },
  { field: 'contractor', headerText: 'Contractor', width: 210 },
  { field: 'k10', headerText: 'Net', width: 150, textAlign: 'Right' },
  { field: 'k11', headerText: 'VAT', width: 140, textAlign: 'Right' },
  { field: 'gtu01', headerText: 'GTU', width: 100, textAlign: 'Center' },
];

function buildMockColumnApi(locale) {
  return ({ endpoint, method }) => {
    if (method !== 'GET' || !endpoint.includes('/api/SysUserInfo/gridColumnsByUser')) {
      return undefined;
    }

    const url = new URL(endpoint, 'http://grid-preview.local');
    const languageCode = url.searchParams.get('languageCode') || locale;

    return {
      columns: apiColumns[languageCode] ?? apiColumns['en-US'],
      languageCode,
    };
  };
}

const aggregationConfig = [
  { field: 'k10', type: 'sum', label: 'Net sum' },
  { field: 'k11', type: 'sum', label: 'VAT sum' },
];

export const SyncfusionGridPreview = forwardRef(function SyncfusionGridPreview(props, ref) {
  const intl = useIntl();
  const gridRef = useRef(null);
  const [mode, setMode] = useState('api');
  const [selectedRows, setSelectedRows] = useState([]);
  const [lastAction, setLastAction] = useState('');

  useEffect(() => apiClient.registerMockHandler('syncfusion-preview-columns', buildMockColumnApi(intl.locale)), [intl.locale]);

  function MoneyTemplate(templateProps) {
    const field = templateProps.field || templateProps.column?.field;
    const value = Number(templateProps[field] ?? templateProps.value ?? 0);

    return (
      <span className="syncfusion-preview__money">
        {new Intl.NumberFormat(intl.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}
      </span>
    );
  }

  function DateTemplate(templateProps) {
    const field = templateProps.field || templateProps.column?.field;
    const value = templateProps[field] ?? templateProps.value;

    return <span>{value ? new Intl.DateTimeFormat(intl.locale).format(new Date(value)) : ''}</span>;
  }

  const templateRules = useMemo(() => [
    { match: (column) => ['k10', 'k11'].includes(column.field || column.alias), template: MoneyTemplate },
    { match: (column) => (column.field || column.alias) === 'taxDate', template: DateTemplate },
    { match: (column) => (column.field || column.alias) === 'gtu01', template: boolCheckmarkTemplate() },
  ], [intl.locale]);

  const decoration = useMemo(() => ({
    getRowDecoration: (row) => (row.requiresAttention ? { className: 'row-requires-attention' } : undefined),
    getCellDecoration: (row, field) => (row.locked && field === 'contractor' ? { className: 'cell-locked', tooltip: 'Locked by declaration state' } : undefined),
  }), []);

  const contextMenuItems = useMemo(() => [
    {
      id: 'txtEdytujDaneDoJPK',
      target: '.e-rowcell',
      action: (args) => {
        const selected = gridRef.current?.getSelectedRows?.() ?? [];
        setLastAction(`Edit requested for ${selected.length || 1} row(s)`);
      },
    },
  ], []);

  const contextMenu = useFeatureContextMenu({
    items: contextMenuItems,
    intl,
    gridRef,
  });

  const footerConfig = useMemo(() => ({
    showFooter: true,
    showPrint: true,
    showExportExcel: true,
    showColumnsSettings: true,
    showPresentationSettings: true,
    hidePageCount: false,
    buttons: [
      {
        key: 'selected-count',
        isCustomComponent: true,
        component: <span className="syncfusion-preview__selection">{selectedRows.length} selected</span>,
      },
      lastAction
        ? {
            key: 'last-action',
            isCustomComponent: true,
            component: <span className="syncfusion-preview__selection">{lastAction}</span>,
          }
        : null,
    ].filter(Boolean),
  }), [lastAction, selectedRows.length]);

  const gridProps = {
    ...props,
    aggregationConfig,
    allowEditing: true,
    autoCalculatePageSize: true,
    data: jpkRows,
    decoration,
    enableSelectionColumn: true,
    footerConfig,
    lowRowHeight: true,
    onRowDoubleClick: (row) => setLastAction(`Double-clicked ${row.invoiceNo}`),
    onSelectionChange: setSelectedRows,
    pageSettings: { pageSize: 5, pageSizes: [5, 10, 20, 50] },
    searchFields: ['id', 'invoiceNo', 'contractor', 'taxDate', 'k10', 'k11'],
    templateRules,
  };

  return (
    <div className="syncfusion-preview">
      <div className="syncfusion-preview__tabs" role="tablist" aria-label="Syncfusion grid scenarios">
        <button className={mode === 'api' ? 'active' : ''} onClick={() => setMode('api')} type="button">API JPK</button>
        <button className={mode === 'local' ? 'active' : ''} onClick={() => setMode('local')} type="button">Local columns</button>
        <button className={mode === 'generated' ? 'active' : ''} onClick={() => setMode('generated')} type="button">Generated</button>
      </div>

      <SyncfusionGrid
        {...gridProps}
        appId={mode === 'api' ? "10" : undefined}
        columns={mode === 'generated' ? Object.keys(jpkRows[0]).map((field) => ({ field, headerText: field, width: 150 })) : localColumns}
        contextMenu={mode === 'api' ? contextMenu : undefined}
        gridId={mode === 'api' ? "29" : undefined}
        ref={(instance) => {
          gridRef.current = instance;
          if (typeof ref === 'function') {
            ref(instance);
          } else if (ref) {
            ref.current = instance;
          }
        }}
      />
    </div>
  );
});
