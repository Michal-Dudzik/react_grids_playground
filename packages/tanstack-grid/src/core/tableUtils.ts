import { defaultContextMenuConfig, MIN_COLUMN_WIDTH } from './tableConfig';
import { getColumnDisplayText } from './tableDisplay';

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

function buildInlineStringCell(cellReference, value) {
  const normalizedValue = removeInvalidXmlCharacters(value);
  const preserveWhitespace = /^\s|\s$/.test(normalizedValue) ? ' xml:space="preserve"' : '';

  return `<c r="${cellReference}" t="inlineStr"><is><t${preserveWhitespace}>${escapeXmlText(
    normalizedValue,
  )}</t></is></c>`;
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

function buildWorksheetXml(columns, matrix) {
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
      const cells = row
        .map((value, columnIndex) => buildInlineStringCell(`${columnIndexToName(columnIndex + 1)}${rowNumber}`, value))
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

function buildStylesXml() {
  return `${XML_DECLARATION}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
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

  return buildZipArchive([
    { path: '[Content_Types].xml', content: buildContentTypesXml() },
    { path: '_rels/.rels', content: buildRootRelationshipsXml() },
    { path: 'xl/workbook.xml', content: buildWorkbookXml(sheetName) },
    { path: 'xl/_rels/workbook.xml.rels', content: buildWorkbookRelationshipsXml() },
    { path: 'xl/worksheets/sheet1.xml', content: buildWorksheetXml(columns, matrix) },
    { path: 'xl/styles.xml', content: buildStylesXml() },
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
