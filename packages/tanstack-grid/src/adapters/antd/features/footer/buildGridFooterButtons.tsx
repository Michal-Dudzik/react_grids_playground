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
}) {
  const defaults = [
    showFilter && onToggleFilter && {
      key: 'toggle-filter',
      icon: filtering ? <FilterFilled /> : <FilterOutlined />,
      onClick: onToggleFilter,
      title: filtering ? 'Hide filters' : 'Show filters',
      type: filtering ? 'primary' : 'text',
    },
    showSummary && onToggleSummary && {
      key: 'toggle-summary',
      icon: <BarChartOutlined />,
      onClick: onToggleSummary,
      title: summaryVisible ? 'Hide summary' : 'Show summary',
      type: summaryVisible ? 'primary' : 'text',
    },
    showExportPdf && onExportPdf && {
      key: 'export-pdf',
      icon: <FilePdfOutlined />,
      onClick: onExportPdf,
      title: 'Export PDF',
      type: 'text',
    },
    showPrint && onPrint && {
      key: 'print',
      icon: <PrinterOutlined />,
      onClick: onPrint,
      title: 'Print',
      type: 'text',
    },
    showExportExcel && onExportExcel && {
      key: 'export-excel',
      icon: <FileExcelOutlined />,
      onClick: onExportExcel,
      title: 'Export to Excel',
      type: 'text',
    },
    showColumnsSettings && onColumnsSettings && {
      key: 'columns-settings',
      icon: <SettingOutlined />,
      onClick: onColumnsSettings,
      title: 'Column settings',
      type: columnsSettingsActive ? 'primary' : 'text',
    },
    showPresentationSettings && onPresentationSettings && {
      key: 'presentation-settings',
      icon: <BgColorsOutlined />,
      onClick: onPresentationSettings,
      title: 'Presentation settings',
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
