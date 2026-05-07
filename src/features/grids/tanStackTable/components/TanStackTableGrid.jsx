import { flexRender } from '@tanstack/react-table';
import { Empty, Tooltip } from 'antd';
import {
  getCellValue,
  getMatchingPresentationRule,
  getPresentationClassName,
  getPresentationStyle,
  getPresentationTooltip,
} from '../lib/tablePresentationRules';
import { callOptionalHandler, getResolvedProps, mergeClassNames } from '../lib/tableUtils';
import { AdvancedColumnFilterButton, renderPresentationCellContent } from './TanStackTableComponents';

function getHeaderLabelTitle(header) {
  return typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : undefined;
}

function wrapHeaderLabelWithTooltip(content, header) {
  const headerLabelTitle = getHeaderLabelTitle(header);

  if (!headerLabelTitle) {
    return content;
  }

  return (
    <Tooltip overlayClassName="tanstack-grid__header-tooltip" placement="topLeft" title={headerLabelTitle} trigger={['hover', 'focus']}>
      {content}
    </Tooltip>
  );
}

export function TanStackTableGrid({
  getCellProps,
  getHeaderProps,
  getRowProps,
  lastDoubleClickedRow,
  onActivateRow,
  onClearAdvancedColumnFilter,
  onOpenCellContextMenu,
  onOpenHeaderContextMenu,
  onToggleFilterColumn,
  onUpdateAdvancedColumnFilter,
  openFilterColumnId,
  presentationRules,
  rowDensity,
  rowDensityConfig,
  rows,
  showColumnDividers,
  showFilters,
  showRowDividers,
  table,
  tableProps = {},
  tableWrapRef,
  tableWrapperProps = {},
  visibleRows,
}) {
  const {
    className: tableWrapperClassName,
    style: tableWrapperStyle,
    ...resolvedTableWrapperProps
  } = tableWrapperProps;
  const { className: tableClassName, style: tableStyle, ...resolvedTableProps } = tableProps;

  return (
    <div
      {...resolvedTableWrapperProps}
      className={mergeClassNames(
        `tanstack-grid__table-wrap tanstack-grid__table-wrap--${rowDensity}`,
        tableWrapperClassName,
      )}
      ref={tableWrapRef}
      style={{
        '--tanstack-cell-padding-y': rowDensityConfig.cellPaddingY,
        '--tanstack-column-divider-width': showColumnDividers ? '1px' : '0',
        '--tanstack-editor-gap': rowDensityConfig.editorGap,
        '--tanstack-editor-height': rowDensityConfig.editorHeight,
        '--tanstack-row-divider-width': showRowDividers ? '1px' : '0',
        '--tanstack-row-height': `${rowDensityConfig.rowHeight}px`,
        ...tableWrapperStyle,
      }}
    >
      <table
        {...resolvedTableProps}
        className={mergeClassNames('tanstack-grid__table', tableClassName)}
        style={{ width: table.getTotalSize(), ...tableStyle }}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const canFilter = header.column.getCanFilter();
                const canResize = header.column.getCanResize();
                const sortDirection = header.column.getIsSorted();
                const headerPresentationRule = getMatchingPresentationRule(presentationRules, {
                  columnId: header.column.id,
                  target: 'header',
                });
                const headerExtraProps = getResolvedProps(getHeaderProps, { header, table });
                const {
                  className: headerClassName,
                  onContextMenu: onHeaderContextMenu,
                  style: headerStyle,
                  ...headerRestProps
                } = headerExtraProps;

                return (
                  <th
                    {...headerRestProps}
                    className={mergeClassNames(
                      getPresentationClassName('header', headerPresentationRule),
                      header.column.getIsResizing() ? 'tanstack-grid__header-cell--resizing' : '',
                      headerClassName,
                    )}
                    data-column-id={header.column.id}
                    key={header.id}
                    onContextMenu={(event) => {
                      callOptionalHandler(onHeaderContextMenu, event, { header, table });

                      if (!event.defaultPrevented) {
                        onOpenHeaderContextMenu(event, header);
                      }
                    }}
                    style={{
                      width: header.getSize(),
                      ...getPresentationStyle(headerPresentationRule),
                      ...headerStyle,
                    }}
                    title={getPresentationTooltip(headerPresentationRule)}
                  >
                    {header.isPlaceholder ? null : (
                      <>
                        <div className="tanstack-grid__header-content">
                          {wrapHeaderLabelWithTooltip(
                            canSort ? (
                              <button
                                className="tanstack-grid__header-button"
                                onClick={header.column.getToggleSortingHandler()}
                                type="button"
                              >
                                <span className="tanstack-grid__header-label">
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                </span>
                                <span className="tanstack-grid__sort-indicator">
                                  {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
                                </span>
                              </button>
                            ) : (
                              <span className="tanstack-grid__header-label">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </span>
                            ),
                            header,
                          )}

                          {showFilters && canFilter ? (
                            <span className="tanstack-grid__header-filter-slot">
                              <AdvancedColumnFilterButton
                                column={header.column}
                                isOpen={openFilterColumnId === header.column.id}
                                onClear={onClearAdvancedColumnFilter}
                                onClose={() => onToggleFilterColumn('')}
                                onFilterChange={onUpdateAdvancedColumnFilter}
                                onToggle={() =>
                                  onToggleFilterColumn(openFilterColumnId === header.column.id ? '' : header.column.id)
                                }
                                rows={rows}
                                triggerVariant="icon"
                              />
                            </span>
                          ) : null}
                        </div>

                        {canResize ? (
                          <div
                            aria-hidden="true"
                            className="tanstack-grid__column-resizer"
                            onDoubleClick={(event) => event.stopPropagation()}
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                          />
                        ) : null}
                      </>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {visibleRows.length > 0 ? (
            visibleRows.map((row) => {
              const rowPresentationRule = getMatchingPresentationRule(presentationRules, {
                row,
                target: 'row',
              });
              const rowExtraProps = getResolvedProps(getRowProps, { row, table });
              const {
                className: rowClassName,
                onDoubleClick: onRowDoubleClickProp,
                style: rowStyle,
                ...rowRestProps
              } = rowExtraProps;

              return (
                <tr
                  {...rowRestProps}
                  className={mergeClassNames(
                    row.getIsSelected() ? 'tanstack-grid__row--selected' : '',
                    lastDoubleClickedRow?.id === row.original.id ? 'tanstack-grid__row--active' : '',
                    getPresentationClassName('row', rowPresentationRule),
                    rowClassName,
                  )}
                  key={row.id}
                  onDoubleClick={(event) => {
                    callOptionalHandler(onRowDoubleClickProp, event, { row, table });

                    if (!event.defaultPrevented) {
                      onActivateRow(row, event);
                    }
                  }}
                  style={rowStyle}
                  title={getPresentationTooltip(rowPresentationRule)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const cellPresentationRule = getMatchingPresentationRule(presentationRules, {
                      columnId: cell.column.id,
                      row,
                      target: 'cell',
                    });
                    const rawCellValue = getCellValue(row, cell.column.id);
                    const renderedCellContent = flexRender(cell.column.columnDef.cell, cell.getContext());
                    const cellExtraProps = getResolvedProps(getCellProps, { cell, row, table });
                    const {
                      className: cellClassName,
                      onContextMenu: onCellContextMenu,
                      style: cellStyle,
                      ...cellRestProps
                    } = cellExtraProps;

                    return (
                      <td
                        {...cellRestProps}
                        className={mergeClassNames(
                          getPresentationClassName('cell', cellPresentationRule),
                          cellClassName,
                        )}
                        key={cell.id}
                        onContextMenu={(event) => {
                          callOptionalHandler(onCellContextMenu, event, { cell, row, table });

                          if (!event.defaultPrevented) {
                            onOpenCellContextMenu(event, cell, row);
                          }
                        }}
                        style={{
                          width: cell.column.getSize(),
                          ...getPresentationStyle(rowPresentationRule),
                          ...getPresentationStyle(cellPresentationRule),
                          ...cellStyle,
                        }}
                        title={getPresentationTooltip(cellPresentationRule) ?? getPresentationTooltip(rowPresentationRule)}
                      >
                        <div className="tanstack-grid__cell-content">
                          {renderPresentationCellContent(
                            renderedCellContent,
                            cellPresentationRule,
                            rawCellValue,
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="tanstack-grid__empty-cell" colSpan={table.getVisibleLeafColumns().length}>
                <Empty description="No rows match the current search and filters." image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
