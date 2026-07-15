import type { ReactNode } from 'react';
import type { RowData } from '@tanstack/react-table';
import type { GridCellRenderer } from '../types';

export interface BooleanRendererOptions {
  falseContent?: ReactNode;
  label?: string;
  trueContent?: ReactNode;
  truthyValues?: unknown[];
}

export interface DateRendererOptions extends Intl.DateTimeFormatOptions {
  emptyContent?: ReactNode;
  locale?: string;
}

export interface NumberRendererOptions extends Intl.NumberFormatOptions {
  emptyContent?: ReactNode;
  hideZero?: boolean;
  locale?: string;
}

function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value ?? '').trim();

  if (!text || text.startsWith('1900-01-01')) {
    return null;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const date = new Date(year, month - 1, day);

    if (
      Number.isNaN(date.getTime())
      || date.getFullYear() !== year
      || date.getMonth() !== month - 1
      || date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getLocaleNumberSeparators(
  locale?: string,
  formatOptions?: Intl.NumberFormatOptions,
): { decimal: string; group: string } {
  const parts = new Intl.NumberFormat(locale, formatOptions).formatToParts(1234567.89);

  return {
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
    group: parts.find((part) => part.type === 'group')?.value ?? ',',
  };
}

function normalizeLocalizedNumber(
  text: string,
  group: string,
  decimal: string,
): string | null {
  const decimalIndex = text.lastIndexOf(decimal);
  let integerPart: string;
  let fractionPart: string;

  if (decimalIndex === -1) {
    integerPart = text;
    fractionPart = '';
  } else {
    integerPart = text.slice(0, decimalIndex);
    fractionPart = text.slice(decimalIndex + decimal.length);

    if (fractionPart.includes(decimal)) {
      return null;
    }
  }

  if (group) {
    integerPart = integerPart.replaceAll(group, '');
  }

  const normalized = fractionPart ? `${integerPart}.${fractionPart}` : integerPart;

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function parseNumberValue(
  value: unknown,
  locale?: string,
  formatOptions?: Intl.NumberFormatOptions,
): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const text = String(value ?? '').trim();

  if (!text) {
    return null;
  }

  const { decimal, group } = getLocaleNumberSeparators(locale, formatOptions);
  const normalized = normalizeLocalizedNumber(text, group, decimal);

  if (normalized === null) {
    return null;
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function createBooleanRenderer<Row extends RowData = RowData>({
  falseContent = null,
  label = 'True',
  trueContent = '✓',
  truthyValues = [true, 1, '1'],
}: BooleanRendererOptions = {}): GridCellRenderer<Row> {
  const truthyValueSet = new Set(truthyValues);

  return ({ value }) => truthyValueSet.has(value) ? (
    <span aria-label={label} className="tanstack-grid__boolean-value">
      {trueContent}
    </span>
  ) : falseContent;
}

export function createDateRenderer<Row extends RowData = RowData>({
  emptyContent = null,
  locale,
  ...formatOptions
}: DateRendererOptions = {}): GridCellRenderer<Row> {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...formatOptions,
  });

  return ({ value }) => {
    const date = parseDateValue(value);
    return date ? formatter.format(date) : emptyContent;
  };
}

export function createNumberRenderer<Row extends RowData = RowData>({
  emptyContent = null,
  hideZero = false,
  locale,
  ...formatOptions
}: NumberRendererOptions = {}): GridCellRenderer<Row> {
  const formatter = new Intl.NumberFormat(locale, formatOptions);

  return ({ value }) => {
    const number = parseNumberValue(value, locale, formatOptions);

    if (number === null || (hideZero && number === 0)) {
      return emptyContent;
    }

    return <span className="tanstack-grid__number-value">{formatter.format(number)}</span>;
  };
}
