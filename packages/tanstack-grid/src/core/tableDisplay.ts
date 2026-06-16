import React, { type CSSProperties, type ReactNode } from 'react';

const DEFAULT_DATE_DISPLAY_FORMAT = 'YYYY-MM-DD';

type DisplayType = 'date' | 'checkmark' | '';
type DisplayVariant = 'cell' | 'export' | 'print';

export interface DateDisplayOptions {
  format?: string;
}

export type DisplayFormatter = (
  value: unknown,
  options?: DateDisplayOptions,
  column?: ColumnDisplaySource,
) => string;

export type DisplayRenderer = (context: {
  column?: ColumnDisplaySource;
  formattedValue?: string;
  rawValue: unknown;
  searchTerm?: string;
}) => ReactNode;

export interface ColumnDisplayInput {
  type?: string;
  formatter?: DisplayFormatter | null;
  renderer?: DisplayRenderer | null;
  renderCell?: DisplayRenderer | null;
  exportFormatter?: DisplayFormatter | null;
  printFormatter?: DisplayFormatter | null;
  options?: DateDisplayOptions;
}

export interface CompiledColumnDisplay {
  exportFormatter: DisplayFormatter | null;
  formatter: DisplayFormatter | null;
  options: DateDisplayOptions;
  printFormatter: DisplayFormatter | null;
  renderer: DisplayRenderer | null;
  type: string;
}

export interface ColumnDisplaySource {
  colValueAccessor?: string;
  columnDef?: {
    meta?: {
      display?: CompiledColumnDisplay | null;
    };
  };
  meta?: {
    display?: CompiledColumnDisplay | null;
  };
}

function normalizeTextValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

export function isTruthyDisplayValue(value: unknown): boolean {
  return ['1', 'true', 'yes', 'y'].includes(String(value ?? '').trim().toLowerCase());
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function applyDateFormat(date: Date, format: string): string {
  return format
    .replace(/YYYY/g, String(date.getFullYear()))
    .replace(/MM/g, pad2(date.getMonth() + 1))
    .replace(/DD/g, pad2(date.getDate()))
    .replace(/HH/g, pad2(date.getHours()))
    .replace(/mm/g, pad2(date.getMinutes()))
    .replace(/ss/g, pad2(date.getSeconds()));
}

export function formatDateDisplayValue(
  value: unknown,
  { format = DEFAULT_DATE_DISPLAY_FORMAT }: DateDisplayOptions = {},
): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (String(value).startsWith('1900-01-01')) {
    return '';
  }

  const parsedValue = new Date(value as string | number | Date);

  if (Number.isNaN(parsedValue.getTime())) {
    return normalizeTextValue(value);
  }

  return applyDateFormat(parsedValue, format);
}

function renderCheckmarkDisplay({ rawValue }: { rawValue: unknown }): React.ReactElement | null {
  if (!isTruthyDisplayValue(rawValue)) {
    return null;
  }

  const style = { '--presentation-accent': 'var(--success)' } as CSSProperties;

  return React.createElement(
    'span',
    {
      'aria-label': 'True',
      className: 'tanstack-grid__replacement tanstack-grid__replacement--mark',
      style,
    },
    '✓',
  );
}

type PresetDisplayConfig = Pick<
  CompiledColumnDisplay,
  'exportFormatter' | 'formatter' | 'printFormatter' | 'renderer'
>;

function buildPresetDisplayConfig(type: DisplayType): Partial<PresetDisplayConfig> {
  switch (type) {
    case 'date':
      return {
        formatter: (value, options) => formatDateDisplayValue(value, options),
      };
    case 'checkmark':
      return {
        exportFormatter: (value) => (isTruthyDisplayValue(value) ? '✓' : ''),
        printFormatter: (value) => (isTruthyDisplayValue(value) ? '✓' : ''),
        renderer: renderCheckmarkDisplay,
      };
    default:
      return {};
  }
}

function mapColumnDisplayType(column: ColumnDisplaySource | undefined): DisplayType {
  switch (column?.colValueAccessor) {
    case 'date':
      return 'date';
    case 'checkmark':
      return 'checkmark';
    default:
      return '';
  }
}

function normalizeDisplayInput(displayInput: string | ColumnDisplayInput | null | undefined): ColumnDisplayInput {
  if (typeof displayInput === 'string') {
    return { type: displayInput };
  }

  if (displayInput && typeof displayInput === 'object') {
    return displayInput;
  }

  return {};
}

export function compileColumnDisplay(
  displayInput: string | ColumnDisplayInput | null | undefined = {},
  column: ColumnDisplaySource = {},
): CompiledColumnDisplay | null {
  const normalizedInput = normalizeDisplayInput(displayInput);
  const type = normalizedInput.type || mapColumnDisplayType(column);

  if (!type && !normalizedInput.formatter && !normalizedInput.renderer && !normalizedInput.renderCell) {
    return null;
  }

  const preset = buildPresetDisplayConfig(type as DisplayType);
  const options = normalizedInput.options ?? {};
  const formatter = normalizedInput.formatter ?? preset.formatter ?? null;
  const renderer = normalizedInput.renderer ?? normalizedInput.renderCell ?? preset.renderer ?? null;
  const exportFormatter = normalizedInput.exportFormatter ?? preset.exportFormatter ?? formatter;
  const printFormatter = normalizedInput.printFormatter ?? preset.printFormatter ?? formatter;

  return {
    exportFormatter,
    formatter,
    options,
    printFormatter,
    renderer,
    type,
  };
}

export function getColumnDisplayText(
  column: ColumnDisplaySource | undefined,
  rawValue: unknown,
  variant: DisplayVariant = 'cell',
): string {
  const display = column?.columnDef?.meta?.display ?? column?.meta?.display ?? null;
  const formatter =
    variant === 'export'
      ? display?.exportFormatter ?? display?.formatter
      : variant === 'print'
        ? display?.printFormatter ?? display?.formatter
        : display?.formatter;

  if (typeof formatter === 'function') {
    return normalizeTextValue(formatter(rawValue, display?.options ?? {}, column));
  }

  return normalizeTextValue(rawValue);
}

export interface RenderColumnDisplayValueParams {
  column: ColumnDisplaySource;
  rawValue: unknown;
  renderText: (value: string, searchTerm?: string) => ReactNode;
  searchTerm?: string;
}

export function renderColumnDisplayValue({
  column,
  rawValue,
  renderText,
  searchTerm,
}: RenderColumnDisplayValueParams): ReactNode {
  const display = column?.columnDef?.meta?.display ?? column?.meta?.display ?? null;
  const formattedValue = getColumnDisplayText(column, rawValue, 'cell');

  if (typeof display?.renderer === 'function') {
    return display.renderer({
      column,
      formattedValue,
      rawValue,
      searchTerm,
    });
  }

  return renderText(formattedValue, searchTerm);
}
