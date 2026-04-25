/**
 * Print grid data with custom HTML generation
 * @param {Object} options - Print options
 * @param {React.RefObject} options.gridRef - Reference to the grid instance
 * @param {Array} options.columns - Grid columns configuration
 * @param {Array} options.actualColumnWidths - Actual rendered column widths (optional)
 * @param {Array} options.data - Data to print
 * @param {string} options.mode - Print mode: 'all', 'current', 'selected'
 */
export const printGridData = (options = {}) => {
    const {gridRef, columns = [], actualColumnWidths = null, data = [], mode = 'current'} = options;

    if (!gridRef?.current) {
        console.error('Grid reference not available');
        return;
    }

    const gridInstance = gridRef.current;

    // For 'all' and 'selected' modes, we need to temporarily change the grid data
    if (mode === 'all' || mode === 'selected') {
        printWithDataSwap(gridInstance, data, mode, columns, actualColumnWidths);
    } else {
        // For current view, extract directly from current DOM
        printCurrentView(gridInstance, columns, actualColumnWidths);
    }
};

/**
 * Print by temporarily swapping grid data and extracting rendered content
 */
const printWithDataSwap = (gridInstance, allData, mode, columns, actualColumnWidths) => {
    const originalDataSource = gridInstance.dataSource;
    let dataToPrint = [];

    if (mode === 'all') {
        dataToPrint = allData;
    } else if (mode === 'selected') {
        dataToPrint = gridInstance.getSelectedRecords?.() || [];
        if (dataToPrint.length === 0) {
            console.warn('No rows selected for printing');
            return;
        }
    }

    // Temporarily swap the data
    gridInstance.dataSource = dataToPrint;
    gridInstance.refresh();

    // Wait for grid to render, then extract and print
    setTimeout(() => {
        try {
            const printHTML = extractGridHTML(gridInstance, columns, actualColumnWidths);
            openPrintWindow(printHTML);
        } finally {
            // Restore original data
            gridInstance.dataSource = originalDataSource;
            gridInstance.refresh();
        }
    }, 500);
};

/**
 * Print current view by extracting from current DOM
 */
const printCurrentView = (gridInstance, columns, actualColumnWidths) => {
    const printHTML = extractGridHTML(gridInstance, columns, actualColumnWidths);
    openPrintWindow(printHTML);
};

/**
 * Extract actual rendered HTML from the grid DOM
 * @param {Object} gridInstance - Syncfusion grid instance
 * @param {Array} columns - Grid columns configuration
 * @param {Array} actualColumnWidths - Actual rendered column widths (optional)
 * @returns {string} - Complete HTML for printing
 */
const extractGridHTML = (gridInstance, columns, actualColumnWidths) => {
    try {
        // Get the grid element
        const gridElement = gridInstance.element;
        if (!gridElement) {
            console.error('Grid element not found');
            return generateFallbackHTML();
        }

        // Get column widths from the grid configuration or actual rendered widths
        const columnWidths = getColumnWidthsFromConfig(columns, actualColumnWidths);


        // Extract and synchronize header and content
        const synchronizedHTML = extractAndSynchronizeTables(gridElement, columnWidths);

        if (!synchronizedHTML) {
            return generateFallbackHTML();
        }

        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Print</title>
          ${getPrintStyles(columnWidths)}
      </head>
      <body class="${getBodyClasses(columnWidths.length)}">
          <div class="print-container">
              ${synchronizedHTML}
          </div>
      </body>
      </html>
    `;

    } catch (error) {
        console.error('Error extracting grid HTML:', error);
        return generateFallbackHTML();
    }
};

/**
 * Get column widths from grid configuration or actual rendered widths
 * @param {Array} columns - Grid columns configuration
 * @param {Array} actualWidths - Actual rendered column widths (optional)
 * @returns {Array} - Array of column widths in pixels
 */
const getColumnWidthsFromConfig = (columns, actualWidths = null) => {
    // If we have actual rendered widths, use those (they're more accurate)
    if (actualWidths && Array.isArray(actualWidths) && actualWidths.length > 0) {
        return actualWidths;
    }

    // Fallback to configured widths
    if (!columns || !Array.isArray(columns)) {
        return [120]; // Default width if no columns
    }

    return columns
        .filter(col => col.visible !== false) // Only include visible columns
        .map(col => {
            // Use the width from column configuration, default to 120 if not specified
            return typeof col.width === 'number' && col.width > 0 ? col.width : 120;
        });
};

/**
 * Extract and synchronize header and content tables with consistent column widths
 * @param {Element} gridElement - Grid DOM element
 * @param {Array} columnWidths - Array of column widths
 * @returns {string} - Synchronized HTML
 */
const extractAndSynchronizeTables = (gridElement, columnWidths) => {
    const headerElement = gridElement.querySelector('.e-gridheader table');
    const contentElement = gridElement.querySelector('.e-gridcontent table');

    if (!headerElement && !contentElement) {
        return null;
    }

    // Check if we need to split columns
    const shouldSplitColumns = shouldSplitGrid(columnWidths);

    if (shouldSplitColumns) {
        return generateSplitGridHTML(headerElement, contentElement, columnWidths);
    } else {
        return generateSingleGridHTML(headerElement, contentElement, columnWidths);
    }
};

/**
 * Determine if grid should be split based on calculated page configuration
 * @param {Array} columnWidths - Array of column widths
 * @returns {boolean} - Whether to split the grid
 */
const shouldSplitGrid = (columnWidths) => {
    if (columnWidths.length === 0) return false;

    const pageConfig = calculatePageConfiguration(columnWidths);
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);

    // Split if total width exceeds the optimal page width for the chosen orientation
    return totalWidth > pageConfig.printableWidth;
};

/**
 * Generate single table HTML (no splitting needed)
 * @param {Element} headerElement - Header table element
 * @param {Element} contentElement - Content table element
 * @param {Array} columnWidths - Array of column widths
 * @returns {string} - Single table HTML
 */
const generateSingleGridHTML = (headerElement, contentElement, columnWidths) => {
    let synchronizedHTML = '';

    if (headerElement && contentElement) {
        // Create a single table with both header and content
        const headerRows = headerElement.querySelector('thead')?.outerHTML || '';
        const contentRows = contentElement.querySelector('tbody')?.outerHTML || '';

        synchronizedHTML = `
      <table class="e-table print-table">
        ${headerRows}
        ${contentRows}
      </table>
    `;
    } else if (headerElement) {
        synchronizedHTML = headerElement.outerHTML;
    } else if (contentElement) {
        synchronizedHTML = contentElement.outerHTML;
    }

    // Apply column widths using colgroup
    synchronizedHTML = addColGroupToTable(synchronizedHTML, columnWidths);

    return synchronizedHTML;
};

/**
 * Generate split grid HTML for wide grids
 * @param {Element} headerElement - Header table element
 * @param {Element} contentElement - Content table element
 * @param {Array} columnWidths - Array of column widths
 * @returns {string} - Multiple tables HTML
 */
const generateSplitGridHTML = (headerElement, contentElement, columnWidths) => {
    const columnChunks = splitColumnsIntoChunks(columnWidths);

    const headerCells = headerElement ? Array.from(headerElement.querySelectorAll('.e-headercell')) : [];
    const dataRows = contentElement ? Array.from(contentElement.querySelectorAll('tbody tr')) : [];

    let splitHTML = '';

    columnChunks.forEach((chunk, chunkIndex) => {
        const {startIndex, endIndex, widths} = chunk;

        // Create header for this chunk
        const chunkHeaderCells = headerCells.slice(startIndex, endIndex + 1);
        const headerHTML = chunkHeaderCells.map(cell => cell.outerHTML).join('');

        // Create data rows for this chunk
        const chunkDataRows = dataRows.map(row => {
            const cells = Array.from(row.querySelectorAll('.e-rowcell'));
            const chunkCells = cells.slice(startIndex, endIndex + 1);
            const rowClass = row.className;
            const cellsHTML = chunkCells.map(cell => cell.outerHTML).join('');
            return `<tr class="${rowClass}">${cellsHTML}</tr>`;
        }).join('');

        // Create table for this chunk
        const chunkTable = `
      <div class="print-page-section">
        ${chunkIndex > 0 ? `<div class="print-section-title">Continued - Columns ${startIndex + 1}-${endIndex + 1}</div>` : ''}
        <table class="e-table print-table">
          <thead>
            <tr>${headerHTML}</tr>
          </thead>
          <tbody>
            ${chunkDataRows}
          </tbody>
        </table>
      </div>
    `;

        // Add colgroup with widths
        const tableWithColGroup = addColGroupToTable(chunkTable, widths);
        splitHTML += tableWithColGroup;
    });

    return splitHTML;
};

/**
 * Calculate optimal page dimensions and available space
 * @param {Array} columnWidths - Array of column widths
 * @returns {Object} - Page configuration with available width
 */
const calculatePageConfiguration = (columnWidths) => {
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);

    // Standard A4 dimensions in pixels (at 96 DPI)
    const A4_PORTRAIT = {width: 794, height: 1123, printableWidth: 700};   // ~210mm x 297mm
    const A4_LANDSCAPE = {width: 1123, height: 794, printableWidth: 1000}; // ~297mm x 210mm

    // Choose orientation based on content width and efficiency
    const portraitEfficiency = Math.min(totalWidth / A4_PORTRAIT.printableWidth, 1);
    const landscapeEfficiency = Math.min(totalWidth / A4_LANDSCAPE.printableWidth, 1);

    // Use landscape if it provides better space utilization or if portrait can't fit reasonably
    const useLandscape = landscapeEfficiency > portraitEfficiency || totalWidth > A4_PORTRAIT.printableWidth * 0.8;

    return useLandscape ? A4_LANDSCAPE : A4_PORTRAIT;
};

/**
 * Calculate optimal column chunks using greedy bin-packing algorithm
 * @param {Array} columnWidths - Array of column widths
 * @returns {Array} - Array of column chunks with start/end indices and widths
 */
const splitColumnsIntoChunks = (columnWidths) => {
    if (columnWidths.length === 0) return [];

    const pageConfig = calculatePageConfiguration(columnWidths);
    const maxWidthPerPage = pageConfig.printableWidth;

    // Constraints for readability and practicality
    const minColumnsPerPage = 1;  // At least 1 column (for very wide columns)
    const maxColumnsPerPage = 25; // Reasonable upper limit
    const minColumnWidth = 40;    // Minimum readable column width

    const chunks = [];
    let currentChunk = [];
    let currentWidth = 0;
    let startIndex = 0;

    for (let i = 0; i < columnWidths.length; i++) {
        const columnWidth = Math.max(columnWidths[i], minColumnWidth); // Ensure minimum width

        // Check if we can fit this column on the current page
        const wouldExceedWidth = currentWidth + columnWidth > maxWidthPerPage;
        const hasMinColumns = currentChunk.length >= minColumnsPerPage;
        const hasMaxColumns = currentChunk.length >= maxColumnsPerPage;

        // Start new page if:
        // 1. Adding this column would exceed page width AND we have at least minimum columns
        // 2. We've reached the maximum columns per page
        if ((wouldExceedWidth && hasMinColumns) || hasMaxColumns) {
            // Finalize current chunk
            if (currentChunk.length > 0) {
                chunks.push({
                    startIndex: startIndex,
                    endIndex: startIndex + currentChunk.length - 1,
                    widths: [...currentChunk],
                    totalWidth: currentWidth,
                    columnCount: currentChunk.length,
                    utilization: (currentWidth / maxWidthPerPage) * 100
                });
            }

            // Start new chunk with current column
            currentChunk = [columnWidth];
            currentWidth = columnWidth;
            startIndex = i;
        } else {
            // Add column to current chunk
            currentChunk.push(columnWidth);
            currentWidth += columnWidth;
        }
    }

    // Add final chunk if it has columns
    if (currentChunk.length > 0) {
        chunks.push({
            startIndex: startIndex,
            endIndex: startIndex + currentChunk.length - 1,
            widths: [...currentChunk],
            totalWidth: currentWidth,
            columnCount: currentChunk.length,
            utilization: (currentWidth / maxWidthPerPage) * 100
        });
    }

    return chunks;
};

/**
 * Add colgroup with specified widths to table HTML and set table width
 * @param {string} tableHTML - Table HTML string
 * @param {Array} columnWidths - Array of column widths
 * @returns {string} - Table HTML with colgroup and proper width
 */
const addColGroupToTable = (tableHTML, columnWidths) => {
    if (!columnWidths.length) return tableHTML;

    // Calculate total table width from column widths
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);

    // Create colgroup with column widths
    const colGroup = `
    <colgroup>
      ${columnWidths.map(width => `<col style="width: ${width}px; min-width: ${width}px; max-width: ${width}px;" />`).join('')}
    </colgroup>
  `;

    // Insert colgroup after table opening tag and set table width
    return tableHTML.replace(
        /<table([^>]*)>/,
        `<table$1 style="width: ${totalWidth}px !important; min-width: ${totalWidth}px !important; table-layout: fixed !important;">${colGroup}`
    );
};

/**
 * Generate fallback HTML when extraction fails
 */
const generateFallbackHTML = () => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Print</title>
    </head>
    <body>
        <div style="text-align: center; padding: 50px;">
            <h3>Unable to extract grid content for printing</h3>
            <p>Please try again or contact support if the issue persists.</p>
        </div>
    </body>
    </html>
  `;
};

const getPrintStyles = (columnWidths) => {
    // Calculate optimal page configuration
    const pageConfig = calculatePageConfiguration(columnWidths);
    const shouldUseLandscape = pageConfig.width > pageConfig.height;

    return `
    <style>
      /* Print styles for SyncfusionGrid custom print functionality */
      @page {
        size: ${shouldUseLandscape ? 'A4 landscape' : 'A4 portrait'};
        margin: 0.5in;
      }

      body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        margin: 0;
        padding: 0;
        color: #333;
      }

      .print-container {
        width: 100%;
        max-width: 100%;
      }

      /* Syncfusion grid styles for print */
      .e-grid,
      .e-table,
      .print-table {
        font-size: 11px;
        /* Width will be set inline based on column widths */
      }

      .e-grid table,
      .e-table,
      .print-table {
        border-collapse: collapse !important;
        table-layout: fixed !important;
        /* Width will be set inline based on column widths */
      }

      /* Ensure colgroup widths are respected with maximum specificity */
      .print-container colgroup col,
      .print-container .e-table colgroup col,
      .print-container .print-table colgroup col {
        width: inherit !important;
        min-width: inherit !important;
        max-width: inherit !important;
      }

      /* Force cells to respect column widths */
      .print-container .e-headercell,
      .print-container .e-rowcell {
        width: inherit !important;
        min-width: inherit !important;
        max-width: inherit !important;
        box-sizing: border-box !important;
      }

      .e-gridheader,
      .e-gridcontent {
        width: 100% !important;
        overflow: visible !important;
      }

      /* Cell styles with consistent height */
      .e-headercell,
      .e-rowcell {
        padding: 6px 4px !important;
        border: 1px solid #ddd !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        vertical-align: top !important;
        white-space: normal !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        /* Consistent height for all cells */
        line-height: 1.3 !important;
        min-height: 2.6em !important;
        max-height: 2.6em !important;
        height: 2.6em !important;
        text-overflow: ellipsis !important;
      }

      /* Header specific styles with maximum specificity */
      .print-container .e-grid .e-gridheader .e-headercell,
      .print-container .e-table .e-headercell,
      .print-container .print-table .e-headercell,
      .print-container .e-headercell {
        background-color: #f8f9fa !important;
        font-weight: bold !important;
        min-height: 2.6em !important;
        height: 2.6em !important;
        /* Center header text with maximum specificity */
        text-align: center !important;
        vertical-align: middle !important;
      }

      /* Ensure table rows have consistent height */
      .e-grid tr,
      .e-table tr,
      .print-table tr {
        height: 2.6em !important;
        min-height: 2.6em !important;
      }

      /* Handle empty cells */
      .e-rowcell:empty::before,
      .e-headercell:empty::before {
        content: "\\00a0\\00a0";
        visibility: hidden;
      }

      .e-altrow {
        background-color: #f9f9f9 !important;
      }

      /* Hide interactive elements */
      .e-checkbox-wrapper,
      .e-btn,
      .e-icons,
      .e-spinner-pane {
        display: none !important;
      }

      /* Split grid styles */
      .print-page-section {
        page-break-before: auto;
        page-break-after: auto;
        margin-bottom: 20px;
      }

      .print-page-section:not(:first-child) {
        page-break-before: always;
      }

      .print-section-title {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #666;
        text-align: center;
        padding: 5px;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
      }

      /* Responsive styles */
      .print-many-columns .e-grid {
        font-size: 9px !important;
      }

      .print-many-columns .e-headercell,
      .print-many-columns .e-rowcell {
        padding: 4px 2px !important;
        height: 2.6em !important;
        min-height: 2.6em !important;
      }

      .print-very-many-columns .e-grid {
        font-size: 8px !important;
      }

      .print-very-many-columns .e-headercell,
      .print-very-many-columns .e-rowcell {
        padding: 3px 1px !important;
        height: 2.6em !important;
        min-height: 2.6em !important;
      }

      /* Print-specific styles */
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        
        .print-container {
          page-break-inside: avoid;
        }
        
        .e-grid table {
          page-break-inside: auto;
        }
        
        .e-gridheader {
          page-break-inside: avoid;
          page-break-after: avoid;
        }
        
        tr {
          page-break-inside: avoid;
        }
      }
    </style>
  `;
};

/**
 * Get body CSS classes based on column count
 * @param {number} columnCount - Number of columns
 * @returns {string} - CSS classes
 */
const getBodyClasses = (columnCount) => {
    if (columnCount > 12) {
        return 'print-very-many-columns';
    } else if (columnCount > 8) {
        return 'print-many-columns';
    }
    return '';
};

/**
 * Open print window with generated HTML
 * @param {string} html - Complete HTML to print
 */
const openPrintWindow = (html) => {
    try {
        const printWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');

        if (!printWindow) {
            console.error('Could not open print window. Please check popup blocker settings.');
            alert('Could not open print window. Please check popup blocker settings and try again.');
            return;
        }

        // Write HTML to the new window
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();

        // Wait for content to load, then focus and print
        const handleLoad = () => {
            setTimeout(() => {
                try {
                    printWindow.focus();
                    printWindow.print();
                } catch (printError) {
                    console.error('Error during print:', printError);
                    alert('Error occurred while printing. Please try again.');
                }
            }, 1000); // Increased delay to ensure content is fully loaded
        };

        // Handle both onload and readystatechange events for better compatibility
        if (printWindow.document.readyState === 'complete') {
            handleLoad();
        } else {
            printWindow.onload = handleLoad;
            printWindow.document.onreadystatechange = () => {
                if (printWindow.document.readyState === 'complete') {
                    handleLoad();
                }
            };
        }

    } catch (error) {
        console.error('Error opening print window:', error);
        alert('Error occurred while opening print window: ' + error.message);
    }
};
