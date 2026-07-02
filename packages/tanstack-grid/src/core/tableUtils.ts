import { defaultContextMenuConfig, MIN_COLUMN_WIDTH } from './tableConfig';
import { getColumnDisplayText } from './tableDisplay';
import { getMatchingPresentationRule, getPresentationStyle } from './tablePresentationRules';

export function reorderItems(items, activeId, overId) {
  const getItemId = (item) => (typeof item === 'string' ? item : item.id);
  const activeIndex = items.findIndex((item) => getItemId(item) === activeId);
  const overIndex = items.findIndex((item) => getItemId(item) === overId);

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
    return items;
  }

  const reorderedItems = [...items];
  const [activeItem] = reorderedItems.splice(activeIndex, 1);
  reorderedItems.splice(overIndex, 0, activeItem);

  return reorderedItems;
}

export function mergeClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ');
}

export function getResolvedProps(propGetter, context) {
  return typeof propGetter === 'function' ? propGetter(context) ?? {} : {};
}

export function callOptionalHandler(handler, event, context) {
  if (typeof handler === 'function') {
    handler(event, context);
  }
}

export function normalizeContextMenuConfig(contextMenuConfig: {
  disabledMap?: Record<string, unknown>;
  hiddenMap?: Record<string, unknown>;
  labels?: Record<string, string>;
  [key: string]: unknown;
} = {}) {
  return {
    ...defaultContextMenuConfig,
    ...contextMenuConfig,
    disabledMap: {
      ...defaultContextMenuConfig.disabledMap,
      ...(contextMenuConfig.disabledMap ?? {}),
    },
    hiddenMap: {
      ...defaultContextMenuConfig.hiddenMap,
      ...(contextMenuConfig.hiddenMap ?? {}),
    },
    labels: {
      ...defaultContextMenuConfig.labels,
      ...(contextMenuConfig.labels ?? {}),
    },
  };
}

export function resolveContextMenuRule(rule, item, menuState) {
  return typeof rule === 'function' ? rule({ item, menuState }) : Boolean(rule);
}

export function prepareContextMenuItems(items, menuState, contextMenuConfig) {
  const normalizedConfig = normalizeContextMenuConfig(contextMenuConfig);

  return items
    .map((item) => {
      const hiddenRule = normalizedConfig.hiddenMap[item.key];

      if (resolveContextMenuRule(hiddenRule, item, menuState)) {
        return null;
      }

      const disabledRule = normalizedConfig.disabledMap[item.key];
      const nextItem = {
        ...item,
        disabled: item.disabled || resolveContextMenuRule(disabledRule, item, menuState),
        label: normalizedConfig.labels[item.key] ?? item.label,
      };

      if (Array.isArray(nextItem.items)) {
        nextItem.items = prepareContextMenuItems(nextItem.items, menuState, normalizedConfig);
      }

      return nextItem;
    })
    .filter(Boolean);
}

export function normalizeCustomContextMenuItems(items, menuState) {
  const customItems = typeof items === 'function' ? items(menuState) : items;
  return Array.isArray(customItems) ? customItems : [];
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildCsvValue(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function getColumnHeaderText(column) {
  return column.columnDef?.header ?? column.id;
}

function getRowExportValue(column, row) {
  if (typeof row.getValue === 'function') {
    return row.getValue(column.id);
  }

  return row.original?.[column.id];
}

function buildExportMatrix(columns, tableRows) {
  const headerRow = columns.map((column) => getColumnHeaderText(column));
  const dataRows = tableRows.map((row) =>
    columns.map((column) => getColumnDisplayText(column, getRowExportValue(column, row), 'export')),
  );

  return [headerRow, ...dataRows];
}

export function buildCsvContent(columns, tableRows) {
  const [headerRow, ...dataRows] = buildExportMatrix(columns, tableRows);

  return [
    headerRow.map((value) => buildCsvValue(value)).join(','),
    ...dataRows.map((row) => row.map((value) => buildCsvValue(value)).join(',')),
  ].join('\n');
}

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const ZIP_DOS_DATE_2020_01_01 = (40 << 9) | (1 << 5) | 1;

export interface BuildXlsxContentOptions {
  presentationRules?: unknown[];
  sheetName?: string;
}

function removeInvalidXmlCharacters(value) {
  return String(value ?? '').replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g, '');
}

function escapeXmlText(value) {
  return removeInvalidXmlCharacters(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeXmlAttribute(value) {
  return escapeXmlText(value).replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function buildCellStyleAttribute(styleIndex) {
  return styleIndex ? ` s="${styleIndex}"` : '';
}

function buildInlineStringCell(cellReference, value, styleIndex = 0) {
  const normalizedValue = removeInvalidXmlCharacters(value);
  const preserveWhitespace = /^\s|\s$/.test(normalizedValue) ? ' xml:space="preserve"' : '';

  return `<c r="${cellReference}" t="inlineStr"${buildCellStyleAttribute(styleIndex)}><is><t${preserveWhitespace}>${escapeXmlText(
    normalizedValue,
  )}</t></is></c>`;
}

function buildNumberCell(cellReference, value, styleIndex = 0) {
  return `<c r="${cellReference}"${buildCellStyleAttribute(styleIndex)}><v>${value}</v></c>`;
}

function columnIndexToName(index) {
  let columnName = '';
  let currentIndex = index;

  while (currentIndex > 0) {
    const remainder = (currentIndex - 1) % 26;
    columnName = String.fromCharCode(65 + remainder) + columnName;
    currentIndex = Math.floor((currentIndex - 1) / 26);
  }

  return columnName;
}

function normalizeWorksheetName(sheetName = 'Grid Export') {
  const normalizedName = String(sheetName).replace(/[\[\]:*?/\\]/g, ' ').trim();
  return (normalizedName || 'Grid Export').slice(0, 31);
}

function normalizeHorizontalAlignment(value) {
  const normalizedValue = String(value ?? '').trim().toLowerCase();

  if (['center', 'centre', 'middle', 'm'].includes(normalizedValue)) {
    return 'center';
  }

  if (['right', 'r'].includes(normalizedValue)) {
    return 'right';
  }

  if (['left', 'l'].includes(normalizedValue)) {
    return 'left';
  }

  return '';
}

function getColumnMeta(column) {
  return column?.columnDef?.meta ?? column?.meta ?? {};
}

function getOriginalColumn(column) {
  return getColumnMeta(column)?.originalColumn ?? {};
}

function getColumnTextAlignment(column) {
  const meta = getColumnMeta(column);
  const originalColumn = getOriginalColumn(column);

  return normalizeHorizontalAlignment(
    meta.excelTextAlign ??
      meta.textAlign ??
      column?.columnDef?.textAlign ??
      column?.textAlign ??
      originalColumn.textAlign ??
      originalColumn.alignment,
  );
}

function getColumnFormat(column) {
  const meta = getColumnMeta(column);
  const originalColumn = getOriginalColumn(column);

  return String(meta.excelFormat ?? column?.columnDef?.format ?? column?.format ?? originalColumn.format ?? '');
}

function getColumnDisplayType(column) {
  const meta = getColumnMeta(column);
  const originalColumn = getOriginalColumn(column);
  const display = meta.display ?? column?.columnDef?.meta?.display ?? column?.meta?.display ?? null;

  return String(
    meta.excelType ??
      display?.type ??
      column?.columnDef?.type ??
      column?.type ??
      originalColumn.type ??
      originalColumn.colType ??
      originalColumn.colValueAccessor ??
      '',
  ).toLowerCase();
}

function detectCurrencySymbol(value) {
  const text = String(value ?? '');

  if (/\bzł\b|zł|\bpln\b/i.test(text)) {
    return 'zł';
  }

  if (text.includes('$') || /\busd\b/i.test(text)) {
    return '$';
  }

  if (text.includes('€') || /\beur\b/i.test(text)) {
    return '€';
  }

  if (text.includes('£') || /\bgbp\b/i.test(text)) {
    return '£';
  }

  return '';
}

function getDecimalPlaces(value) {
  const text = String(value);
  const decimalPart = text.includes('.') ? text.split('.').at(-1) : '';

  return decimalPart ? decimalPart.length : 0;
}

function parseExportNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return {
      decimalPlaces: getDecimalPlaces(value),
      isCurrency: false,
      number: value,
      symbol: '',
    };
  }

  const textValue = String(value ?? '').trim();

  if (!textValue || !/[0-9]/.test(textValue) || /^\d{4}-\d{2}-\d{2}/.test(textValue)) {
    return null;
  }

  const symbol = detectCurrencySymbol(textValue);
  const negative = /^\(.*\)$/.test(textValue) || /^-/.test(textValue);
  const cleanedValue = textValue
    .replace(/[()]/g, '')
    .replace(/[$€£¥]|zł|\b(pln|usd|eur|gbp)\b/gi, '')
    .replace(/\s+/g, '')
    .replace(/^\+/, '');

  if (/[^0-9,.-]/.test(cleanedValue)) {
    return null;
  }

  const unsignedValue = cleanedValue.replace(/^-/, '');
  const lastDotIndex = unsignedValue.lastIndexOf('.');
  const lastCommaIndex = unsignedValue.lastIndexOf(',');
  let decimalSeparator = '';

  if (lastDotIndex >= 0 && lastCommaIndex >= 0) {
    decimalSeparator = lastDotIndex > lastCommaIndex ? '.' : ',';
  } else {
    const separator = lastDotIndex >= 0 ? '.' : lastCommaIndex >= 0 ? ',' : '';
    const parts = separator ? unsignedValue.split(separator) : [unsignedValue];

    if (separator && parts.length === 2 && parts[1].length > 0 && parts[1].length !== 3) {
      decimalSeparator = separator;
    }
  }

  const groupSeparator = decimalSeparator === '.' ? ',' : decimalSeparator === ',' ? '.' : '';
  let normalizedValue = unsignedValue;

  if (groupSeparator) {
    normalizedValue = normalizedValue.replaceAll(groupSeparator, '');
  }

  if (decimalSeparator) {
    normalizedValue = normalizedValue.replace(decimalSeparator, '.');
  } else {
    normalizedValue = normalizedValue.replace(/[,.]/g, '');
  }

  if (!/^\d+(\.\d+)?$/.test(normalizedValue)) {
    return null;
  }

  const number = Number(`${negative ? '-' : ''}${normalizedValue}`);

  if (!Number.isFinite(number)) {
    return null;
  }

  return {
    decimalPlaces: getDecimalPlaces(normalizedValue),
    isCurrency: Boolean(symbol),
    number,
    symbol,
  };
}

function isCurrencyColumn(column, rawValue, displayValue, parsedNumber) {
  const format = getColumnFormat(column).toLowerCase();
  const displayType = getColumnDisplayType(column);

  return (
    parsedNumber?.isCurrency ||
    detectCurrencySymbol(rawValue) ||
    detectCurrencySymbol(displayValue) ||
    ['currency', 'money'].includes(displayType) ||
    /^c\d*$/i.test(format) ||
    format.includes('currency')
  );
}

function getNumberFormatCode({ column, decimalPlaces, isCurrency, rawValue, displayValue }) {
  const format = getColumnFormat(column).toLowerCase();
  const effectiveDecimalPlaces = Math.max(
    Number.isFinite(Number(decimalPlaces)) ? Number(decimalPlaces) : 0,
    /\.\d+$/.test(format) || /n2|c2|f2/.test(format) ? 2 : 0,
  );
  const numberFormat = effectiveDecimalPlaces > 0 ? '#,##0.00' : '#,##0';

  if (!isCurrency) {
    return numberFormat;
  }

  const symbol = detectCurrencySymbol(rawValue) || detectCurrencySymbol(displayValue);

  if (['$', '€', '£'].includes(symbol)) {
    return `"${symbol}"${numberFormat}`;
  }

  if (symbol) {
    return `${numberFormat} "${symbol}"`;
  }

  return numberFormat;
}

function excelDateSerial(date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

  return Math.floor(utcDate / millisecondsPerDay) + 25569;
}

function getDateCellValue(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (String(value).startsWith('1900-01-01')) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return excelDateSerial(parsedDate);
}

function normalizeHexColor(value) {
  const color = String(value ?? '').trim();

  return /^#[0-9a-f]{6}$/i.test(color) ? color.slice(1).toUpperCase() : '';
}

function getPresentationCellStyle({ column, presentationRules, row, target }) {
  const rule = getMatchingPresentationRule(presentationRules, {
    columnId: column.id,
    row,
    target,
  });
  const style = getPresentationStyle(rule);

  return {
    fillColor: normalizeHexColor(style.backgroundColor),
    fontColor: normalizeHexColor(style.color),
  };
}

function createXlsxStyleRegistry() {
  const fonts = [{ bold: false, color: '' }];
  const fills = [{ color: '' }, { color: 'gray125' }];
  const borders = [{ grid: false }, { grid: true }];
  const fontKeys = new Map([['false|', 0]]);
  const fillKeys = new Map([
    ['', 0],
    ['gray125', 1],
  ]);
  const borderKeys = new Map([
    ['false', 0],
    ['true', 1],
  ]);
  const numFmtCodeToId = new Map();
  const styleKeyToIndex = new Map();
  const cellXfs = [];

  function getFontId({ bold = false, color = '' }) {
    const normalizedColor = normalizeHexColor(color);
    const key = `${Boolean(bold)}|${normalizedColor}`;

    if (!fontKeys.has(key)) {
      fontKeys.set(key, fonts.length);
      fonts.push({ bold: Boolean(bold), color: normalizedColor });
    }

    return fontKeys.get(key);
  }

  function getFillId(color = '') {
    const normalizedColor = normalizeHexColor(color);

    if (!normalizedColor) {
      return 0;
    }

    if (!fillKeys.has(normalizedColor)) {
      fillKeys.set(normalizedColor, fills.length);
      fills.push({ color: normalizedColor });
    }

    return fillKeys.get(normalizedColor);
  }

  function getBorderId(grid = false) {
    return borderKeys.get(String(Boolean(grid))) ?? 0;
  }

  function getNumFmtId(formatCode = '') {
    if (!formatCode) {
      return 0;
    }

    const builtInFormats = new Map([
      ['#,##0', 3],
      ['#,##0.00', 4],
    ]);

    if (builtInFormats.has(formatCode)) {
      return builtInFormats.get(formatCode);
    }

    if (!numFmtCodeToId.has(formatCode)) {
      numFmtCodeToId.set(formatCode, 165 + numFmtCodeToId.size);
    }

    return numFmtCodeToId.get(formatCode);
  }

  function getStyleIndex({
    alignment = '',
    bold = false,
    border = false,
    fillColor = '',
    fontColor = '',
    formatCode = '',
  } = {}) {
    const fontId = getFontId({ bold, color: fontColor });
    const fillId = getFillId(fillColor);
    const borderId = getBorderId(border);
    const numFmtId = getNumFmtId(formatCode);
    const key = [fontId, fillId, borderId, numFmtId, alignment].join('|');

    if (!styleKeyToIndex.has(key)) {
      styleKeyToIndex.set(key, cellXfs.length);
      cellXfs.push({
        alignment,
        borderId,
        fillId,
        fontId,
        numFmtId,
      });
    }

    return styleKeyToIndex.get(key);
  }

  getStyleIndex();

  return {
    borders,
    cellXfs,
    fills,
    fonts,
    getStyleIndex,
    numFmtCodeToId,
  };
}

function buildFontXml(font) {
  return `<font>${font.bold ? '<b/>' : ''}${font.color ? `<color rgb="FF${font.color}"/>` : ''}<sz val="11"/><name val="Calibri"/></font>`;
}

function buildFillXml(fill) {
  if (fill.color === 'gray125') {
    return '<fill><patternFill patternType="gray125"/></fill>';
  }

  if (!fill.color) {
    return '<fill><patternFill patternType="none"/></fill>';
  }

  return `<fill><patternFill patternType="solid"><fgColor rgb="FF${fill.color}"/><bgColor indexed="64"/></patternFill></fill>`;
}

function buildBorderXml(border) {
  if (!border.grid) {
    return '<border><left/><right/><top/><bottom/><diagonal/></border>';
  }

  return '<border><left style="thin"><color rgb="FFD8CDC0"/></left><right style="thin"><color rgb="FFD8CDC0"/></right><top style="thin"><color rgb="FFD8CDC0"/></top><bottom style="thin"><color rgb="FFD8CDC0"/></bottom><diagonal/></border>';
}

function buildCellXfXml(style) {
  const alignmentXml = style.alignment ? `<alignment horizontal="${style.alignment}"/>` : '';

  return `<xf numFmtId="${style.numFmtId}" fontId="${style.fontId}" fillId="${style.fillId}" borderId="${style.borderId}" xfId="0"${
    style.numFmtId ? ' applyNumberFormat="1"' : ''
  }${style.alignment ? ' applyAlignment="1"' : ''}${style.fillId ? ' applyFill="1"' : ''}${
    style.fontId ? ' applyFont="1"' : ''
  }${style.borderId ? ' applyBorder="1"' : ''}>${alignmentXml}</xf>`;
}

function getHeaderStyleIndex(column, styleRegistry) {
  return styleRegistry.getStyleIndex({
    alignment: getColumnTextAlignment(column),
    bold: true,
    border: true,
    fillColor: 'F4EDE3',
  });
}

function getDataCellDescriptor(column, row, value, displayValue, options) {
  const presentationStyle = getPresentationCellStyle({
    column,
    presentationRules: options.presentationRules,
    row,
    target: 'cell',
  });
  const rowPresentationStyle = getPresentationCellStyle({
    column,
    presentationRules: options.presentationRules,
    row,
    target: 'row',
  });
  const columnAlignment = getColumnTextAlignment(column);
  const displayType = getColumnDisplayType(column);
  const dateValue = displayType === 'date' ? getDateCellValue(value) : null;

  if (dateValue !== null) {
    return {
      kind: 'number',
      styleIndex: options.styleRegistry.getStyleIndex({
        alignment: columnAlignment || 'right',
        fillColor: presentationStyle.fillColor || rowPresentationStyle.fillColor,
        fontColor: presentationStyle.fontColor || rowPresentationStyle.fontColor,
        formatCode: 'yyyy-mm-dd',
      }),
      value: dateValue,
    };
  }

  const parsedNumber = parseExportNumber(value) ?? parseExportNumber(displayValue);
  const currency = isCurrencyColumn(column, value, displayValue, parsedNumber);

  if (parsedNumber) {
    return {
      kind: 'number',
      styleIndex: options.styleRegistry.getStyleIndex({
        alignment: columnAlignment || 'right',
        fillColor: presentationStyle.fillColor || rowPresentationStyle.fillColor,
        fontColor: presentationStyle.fontColor || rowPresentationStyle.fontColor,
        formatCode: getNumberFormatCode({
          column,
          decimalPlaces: parsedNumber.decimalPlaces,
          displayValue,
          isCurrency: currency,
          rawValue: value,
        }),
      }),
      value: parsedNumber.number,
    };
  }

  return {
    kind: 'string',
    styleIndex: options.styleRegistry.getStyleIndex({
      alignment: columnAlignment,
      fillColor: presentationStyle.fillColor || rowPresentationStyle.fillColor,
      fontColor: presentationStyle.fontColor || rowPresentationStyle.fontColor,
    }),
    value: displayValue,
  };
}

function buildWorksheetXml(columns, matrix, options: any = {}) {
  const columnCount = Math.max(columns.length, 1);
  const rowCount = Math.max(matrix.length, 1);
  const dimensionRef = `A1:${columnIndexToName(columnCount)}${rowCount}`;
  const columnDefinitions = columns
    .map((column, index) => {
      const width = Number(column.getSize?.() ?? column.columnDef?.size ?? 140);
      const excelWidth = Math.max(8, Math.min(80, Math.round(width / 7)));

      return `<col min="${index + 1}" max="${index + 1}" width="${excelWidth}" customWidth="1"/>`;
    })
    .join('');
  const rows = matrix
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const tableRow = options.tableRows?.[rowIndex - 1];
      const cells = row
        .map((value, columnIndex) => {
          const column = columns[columnIndex];
          const cellReference = `${columnIndexToName(columnIndex + 1)}${rowNumber}`;

          if (rowIndex === 0) {
            return buildInlineStringCell(cellReference, value, getHeaderStyleIndex(column, options.styleRegistry));
          }

          const rawValue = getRowExportValue(column, tableRow);
          const descriptor = getDataCellDescriptor(column, tableRow, rawValue, value, options);

          if (descriptor.kind === 'number') {
            return buildNumberCell(cellReference, descriptor.value, descriptor.styleIndex);
          }

          return buildInlineStringCell(cellReference, descriptor.value, descriptor.styleIndex);
        })
        .join('');

      return `<row r="${rowNumber}">${cells}</row>`;
    })
    .join('');

  return `${XML_DECLARATION}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="${dimensionRef}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/>${
    columnDefinitions ? `<cols>${columnDefinitions}</cols>` : ''
  }<sheetData>${rows || '<row r="1"/>'}</sheetData></worksheet>`;
}

function buildWorkbookXml(sheetName) {
  return `${XML_DECLARATION}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXmlAttribute(
    sheetName,
  )}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
}

function buildWorkbookRelationshipsXml() {
  return `${XML_DECLARATION}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
}

function buildRootRelationshipsXml() {
  return `${XML_DECLARATION}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
}

function buildContentTypesXml() {
  return `${XML_DECLARATION}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="${XLSX_MIME_TYPE}.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
}

function buildStylesXml(styleRegistry = createXlsxStyleRegistry()) {
  const numFmts = [...styleRegistry.numFmtCodeToId.entries()]
    .map(([formatCode, id]) => `<numFmt numFmtId="${id}" formatCode="${escapeXmlAttribute(formatCode)}"/>`)
    .join('');
  const fonts = styleRegistry.fonts.map(buildFontXml).join('');
  const fills = styleRegistry.fills.map(buildFillXml).join('');
  const borders = styleRegistry.borders.map(buildBorderXml).join('');
  const cellXfs = styleRegistry.cellXfs.map(buildCellXfXml).join('');

  return `${XML_DECLARATION}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${
    numFmts ? `<numFmts count="${styleRegistry.numFmtCodeToId.size}">${numFmts}</numFmts>` : ''
  }<fonts count="${styleRegistry.fonts.length}">${fonts}</fonts><fills count="${
    styleRegistry.fills.length
  }">${fills}</fills><borders count="${styleRegistry.borders.length}">${borders}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${
    styleRegistry.cellXfs.length
  }">${cellXfs}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
}

function buildCrcTable() {
  const table = new Uint32Array(256);

  for (let i = 0; i < table.length; i += 1) {
    let crc = i;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }

    table[i] = crc >>> 0;
  }

  return table;
}

const CRC_TABLE = buildCrcTable();

function calculateCrc32(data) {
  let crc = 0xffffffff;

  for (let i = 0; i < data.length; i += 1) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function pushUint16(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff);
}

function pushUint32(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function buildLocalFileHeader({ crc, dataSize, fileNameLength }) {
  const bytes = [];
  pushUint32(bytes, 0x04034b50);
  pushUint16(bytes, 20);
  pushUint16(bytes, 0);
  pushUint16(bytes, 0);
  pushUint16(bytes, 0);
  pushUint16(bytes, ZIP_DOS_DATE_2020_01_01);
  pushUint32(bytes, crc);
  pushUint32(bytes, dataSize);
  pushUint32(bytes, dataSize);
  pushUint16(bytes, fileNameLength);
  pushUint16(bytes, 0);

  return Uint8Array.from(bytes);
}

function buildCentralDirectoryHeader({ crc, dataSize, fileNameLength, localHeaderOffset }) {
  const bytes = [];
  pushUint32(bytes, 0x02014b50);
  pushUint16(bytes, 20);
  pushUint16(bytes, 20);
  pushUint16(bytes, 0);
  pushUint16(bytes, 0);
  pushUint16(bytes, 0);
  pushUint16(bytes, ZIP_DOS_DATE_2020_01_01);
  pushUint32(bytes, crc);
  pushUint32(bytes, dataSize);
  pushUint32(bytes, dataSize);
  pushUint16(bytes, fileNameLength);
  pushUint16(bytes, 0);
  pushUint16(bytes, 0);
  pushUint16(bytes, 0);
  pushUint16(bytes, 0);
  pushUint32(bytes, 0);
  pushUint32(bytes, localHeaderOffset);

  return Uint8Array.from(bytes);
}

function buildEndOfCentralDirectory({ centralDirectoryOffset, centralDirectorySize, fileCount }) {
  const bytes = [];
  pushUint32(bytes, 0x06054b50);
  pushUint16(bytes, 0);
  pushUint16(bytes, 0);
  pushUint16(bytes, fileCount);
  pushUint16(bytes, fileCount);
  pushUint32(bytes, centralDirectorySize);
  pushUint32(bytes, centralDirectoryOffset);
  pushUint16(bytes, 0);

  return Uint8Array.from(bytes);
}

function concatUint8Arrays(chunks, totalLength) {
  const output = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });

  return output;
}

function buildZipArchive(files) {
  const encoder = new TextEncoder();
  const localFileChunks = [];
  const centralDirectoryChunks = [];
  let archiveOffset = 0;

  files.forEach((file) => {
    const fileNameBytes = encoder.encode(file.path);
    const data = typeof file.content === 'string' ? encoder.encode(file.content) : file.content;
    const crc = calculateCrc32(data);
    const localHeaderOffset = archiveOffset;
    const localHeader = buildLocalFileHeader({
      crc,
      dataSize: data.length,
      fileNameLength: fileNameBytes.length,
    });

    localFileChunks.push(localHeader, fileNameBytes, data);
    archiveOffset += localHeader.length + fileNameBytes.length + data.length;

    const centralDirectoryHeader = buildCentralDirectoryHeader({
      crc,
      dataSize: data.length,
      fileNameLength: fileNameBytes.length,
      localHeaderOffset,
    });
    centralDirectoryChunks.push(centralDirectoryHeader, fileNameBytes);
  });

  const centralDirectoryOffset = archiveOffset;
  const centralDirectorySize = centralDirectoryChunks.reduce((size, chunk) => size + chunk.length, 0);
  const endOfCentralDirectory = buildEndOfCentralDirectory({
    centralDirectoryOffset,
    centralDirectorySize,
    fileCount: files.length,
  });

  return concatUint8Arrays(
    [...localFileChunks, ...centralDirectoryChunks, endOfCentralDirectory],
    archiveOffset + centralDirectorySize + endOfCentralDirectory.length,
  );
}

export function buildXlsxContent(columns, tableRows, options: BuildXlsxContentOptions = {}) {
  const matrix = buildExportMatrix(columns, tableRows);
  const sheetName = normalizeWorksheetName(options.sheetName);
  const styleRegistry = createXlsxStyleRegistry();
  const worksheetXml = buildWorksheetXml(columns, matrix, {
    presentationRules: Array.isArray(options.presentationRules) ? options.presentationRules : [],
    styleRegistry,
    tableRows,
  });

  return buildZipArchive([
    { path: '[Content_Types].xml', content: buildContentTypesXml() },
    { path: '_rels/.rels', content: buildRootRelationshipsXml() },
    { path: 'xl/workbook.xml', content: buildWorkbookXml(sheetName) },
    { path: 'xl/_rels/workbook.xml.rels', content: buildWorkbookRelationshipsXml() },
    { path: 'xl/worksheets/sheet1.xml', content: worksheetXml },
    { path: 'xl/styles.xml', content: buildStylesXml(styleRegistry) },
  ]);
}

export function buildPrintableMarkup({ columns, rows: tableRows, title }) {
  const headerMarkup = columns
    .map((column) => `<th>${escapeHtml(column.columnDef.header ?? column.id)}</th>`)
    .join('');
  const colgroupMarkup = columns
    .map((column) => {
      const width = Number(column.getSize?.() ?? column.columnDef.size ?? 140);
      return `<col style="width: ${Math.max(MIN_COLUMN_WIDTH, Math.round(width))}px" />`;
    })
    .join('');

  const bodyMarkup = tableRows
    .map(
      (row) =>
        `<tr>${columns
          .map((column) => `<td>${escapeHtml(getColumnDisplayText(column, getRowExportValue(column, row), 'print'))}</td>`)
          .join('')}</tr>`,
    )
    .join('');

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body {
            margin: 24px;
            font-family: "Avenir Next", "Segoe UI", sans-serif;
            color: #231d18;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 20px;
          }

          p {
            margin: 0 0 16px;
            color: #625649;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          th,
          td {
            padding: 10px 12px;
            border: 1px solid #d8cdc0;
            text-align: left;
          }

          th {
            background: #f4ede3;
            font-size: 12px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>${tableRows.length} rows</p>
        <table>
          <colgroup>${colgroupMarkup}</colgroup>
          <thead>
            <tr>${headerMarkup}</tr>
          </thead>
          <tbody>${bodyMarkup}</tbody>
        </table>
      </body>
    </html>
  `;
}
