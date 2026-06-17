// @ts-nocheck
import {
  BgColorsOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FilterFilled,
  FilterOutlined,
  PrinterOutlined,
  SettingOutlined,
  BarChartOutlined
} from '@ant-design/icons';

export function buildGridFooterButtons({
  showFilter = false,
  filtering = false,
  onToggleFilter,
  showSummary = false,
  summaryVisible = false,
  onToggleSummary,
  showPrint = false,
  onPrint,
  showExportPdf = false,
  onExportPdf,
  showExportExcel = false,
  onExportExcel,
  showColumnsSettings = false,
  onColumnsSettings,
  columnsSettingsActive = false,
  showPresentationSettings = false,
  onPresentationSettings,
  presentationSettingsActive = false,
  footerButtons = [],
  getMessage = (key, fallback) => fallback ?? key,
}) {
  const defaults = [
    showFilter && onToggleFilter && {
      key: 'toggle-filter',
      icon: filtering ? <FilterFilled /> : <FilterOutlined />,
      onClick: onToggleFilter,
      title: filtering ? getMessage('hideFilters') : getMessage('showFilters'),
      type: filtering ? 'primary' : 'text',
    },
    showSummary && onToggleSummary && {
      key: 'toggle-summary',
      icon: <BarChartOutlined />,
      onClick: onToggleSummary,
      title: summaryVisible ? getMessage('hideSummary') : getMessage('showSummary'),
      type: summaryVisible ? 'primary' : 'text',
    },
    showExportPdf && onExportPdf && {
      key: 'export-pdf',
      icon: <FilePdfOutlined />,
      onClick: onExportPdf,
      title: getMessage('exportPdf'),
      type: 'text',
    },
    showPrint && onPrint && {
      key: 'print',
      icon: <PrinterOutlined />,
      onClick: onPrint,
      title: getMessage('print'),
      type: 'text',
    },
    showExportExcel && onExportExcel && {
      key: 'export-excel',
      icon: <FileExcelOutlined />,
      onClick: onExportExcel,
      title: getMessage('exportExcel'),
      type: 'text',
    },
    showColumnsSettings && onColumnsSettings && {
      key: 'columns-settings',
      icon: <SettingOutlined />,
      onClick: onColumnsSettings,
      title: getMessage('columnSettings'),
      type: columnsSettingsActive ? 'primary' : 'text',
    },
    showPresentationSettings && onPresentationSettings && {
      key: 'presentation-settings',
      icon: <BgColorsOutlined />,
      onClick: onPresentationSettings,
      title: getMessage('editPresentation'),
      type: presentationSettingsActive ? 'primary' : 'text',
    },
  ].filter(Boolean);

  if (process.env.NODE_ENV !== 'production') {
    footerButtons.forEach((customButton) => {
      if (!customButton.key) {
        console.warn('[buildGridFooterButtons] A custom footer button is missing a required `key` property.', customButton);
      }
    });
  }

  const customButtonsByKey = new Map(footerButtons.map((customButton) => [customButton.key, customButton]));
  const defaultButtonKeys = new Set(defaults.map((defaultButton) => defaultButton.key));

  return [
    ...defaults.map((defaultButton) => ({ ...defaultButton, ...customButtonsByKey.get(defaultButton.key) })),
    ...footerButtons.filter((customButton) => !defaultButtonKeys.has(customButton.key)),
  ];
}
