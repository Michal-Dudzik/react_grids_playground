import { flexRender } from '@tanstack/react-table';
import { Empty } from 'antd';
import {
  getCellValue,
  getMatchingPresentationRule,
  getPresentationClassName,
  getPresentationStyle,
  getPresentationTooltip,
} from '../lib/tablePresentationRules';
import { callOptionalHandler, getResolvedProps, mergeClassNames } from '../lib/tableUtils';
import { renderPresentationCellContent } from './TanStackTableComponents';

export function TanStackTableGrid({
  getCellProps,
  getHeaderProps,
  getRowProps,
  lastDoubleClickedRow,
  onActivateRow,
  onOpenCellContextMenu,
  onOpenHeaderContextMenu,
  presentationRules,
  rowDensity,
  rowDensityConfig,
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
        '--tanstack-editor-gap': rowDensityConfig.editorGap,
        '--tanstack-editor-height': rowDensityConfig.editorHeight,
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
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        className="tanstack-grid__header-button"
                        onClick={header.column.getToggleSortingHandler()}
                        type="button"
                      >
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        <span className="tanstack-grid__sort-indicator">
                          {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
                        </span>
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
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
