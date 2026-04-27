import {
  BgColorsOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FilterFilled,
  FilterOutlined,
  PrinterOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { BarChartOutlined } from '@ant-design/icons';

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
    showFilter && {
      key: 'toggle-filter',
      className: filtering ? 'active' : '',
      icon: filtering ? <FilterFilled /> : <FilterOutlined />,
      onClick: onToggleFilter,
      title: filtering ? 'Hide filters' : 'Show filters',
    },
    showSummary && {
      key: 'toggle-summary',
      className: summaryVisible ? 'active' : '',
      icon: <BarChartOutlined />,
      onClick: onToggleSummary,
      title: summaryVisible ? 'Hide summary' : 'Show summary',
    },
    showExportPdf && {
      key: 'export-pdf',
      icon: <FilePdfOutlined />,
      onClick: onExportPdf,
      title: 'Export PDF',
    },
    showPrint && {
      key: 'print',
      icon: <PrinterOutlined />,
      onClick: onPrint,
      title: 'Print',
    },
    showExportExcel && {
      key: 'export-excel',
      icon: <FileExcelOutlined />,
      onClick: onExportExcel,
      title: 'Export to Excel',
    },
    showColumnsSettings && {
      key: 'columns-settings',
      className: columnsSettingsActive ? 'active' : '',
      icon: <SettingOutlined />,
      onClick: onColumnsSettings,
      title: 'Column settings',
    },
    showPresentationSettings && {
      key: 'presentation-settings',
      className: presentationSettingsActive ? 'active' : '',
      icon: <BgColorsOutlined />,
      onClick: onPresentationSettings,
      title: 'Presentation settings',
    },
  ].filter(Boolean);

  const customButtonsByKey = new Map(footerButtons.map((customButton) => [customButton.key, customButton]));
  const defaultButtonKeys = new Set(defaults.map((defaultButton) => defaultButton.key));

  return [
    ...defaults.map((defaultButton) => customButtonsByKey.get(defaultButton.key) ?? defaultButton),
    ...footerButtons.filter((customButton) => !defaultButtonKeys.has(customButton.key)),
  ];
}
