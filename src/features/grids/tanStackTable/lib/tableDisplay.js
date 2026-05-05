import React from 'react';
import dayjs from 'dayjs';

const DEFAULT_DATE_DISPLAY_FORMAT = 'YYYY-MM-DD';

function normalizeTextValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

export function isTruthyDisplayValue(value) {
  return ['1', 'true', 'yes', 'y'].includes(String(value ?? '').trim().toLowerCase());
}

export function formatDateDisplayValue(value, { format = DEFAULT_DATE_DISPLAY_FORMAT } = {}) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (String(value).startsWith('1900-01-01')) {
    return '';
  }

  const parsedValue = dayjs(value);
  return parsedValue.isValid() ? parsedValue.format(format) : normalizeTextValue(value);
}

function renderCheckmarkDisplay({ rawValue }) {
  if (!isTruthyDisplayValue(rawValue)) {
    return null;
  }

  return React.createElement(
    'span',
    {
      'aria-label': 'True',
      className: 'tanstack-grid__replacement tanstack-grid__replacement--mark',
      style: { '--presentation-accent': 'var(--success)' },
    },
    '✓',
  );
}

function buildPresetDisplayConfig(type) {
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

function mapColumnDisplayType(column) {
  switch (column?.colValueAccessor) {
    case 'date':
      return 'date';
    case 'checkmark':
      return 'checkmark';
    default:
      return '';
  }
}

export function compileColumnDisplay(displayInput = {}, column = {}) {
  const normalizedInput =
    typeof displayInput === 'string'
      ? { type: displayInput }
      : displayInput && typeof displayInput === 'object'
        ? displayInput
        : {};
  const type = normalizedInput.type || mapColumnDisplayType(column);

  if (!type && !normalizedInput.formatter && !normalizedInput.renderer && !normalizedInput.renderCell) {
    return null;
  }

  const preset = buildPresetDisplayConfig(type);
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

export function getColumnDisplayText(column, rawValue, variant = 'cell') {
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

export function renderColumnDisplayValue({ column, rawValue, renderText, searchTerm }) {
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
