import { useCallback, useMemo, useState } from 'react';
import {
  buildColumnPreferencesPayload,
  buildColumnSettingsState,
  normalizeColumnOrder,
} from '../../../../core/tableColumns';
import { MIN_COLUMN_WIDTH } from '../../../../core/tableConfig';
import { reorderItems } from '../../../../core/tableUtils';

function getColumnLabel(column) {
  return typeof column?.columnDef.header === 'string' ? column.columnDef.header : column?.id;
}

const MAX_AUTO_FIT_COLUMN_WIDTH = 300;

export function fillColumnWidthsToAvailableGridWidth(
  columnWidths: Record<string, number>,
  availableWidth: number,
  stretchColumnIds: string[],
) {
  const nextColumnWidths = { ...columnWidths };
  const currentTotalWidth = Object.values(nextColumnWidths).reduce((total, width) => total + Number(width || 0), 0);
  const remainingWidth = Math.floor(Number(availableWidth) - currentTotalWidth);
  const visibleStretchColumnIds = stretchColumnIds.filter((columnId) =>
    Number.isFinite(Number(nextColumnWidths[columnId])),
  );

  if (remainingWidth <= 0 || visibleStretchColumnIds.length === 0) {
    return nextColumnWidths;
  }

  const baseExtraWidth = Math.floor(remainingWidth / visibleStretchColumnIds.length);
  let remainder = remainingWidth - baseExtraWidth * visibleStretchColumnIds.length;

  visibleStretchColumnIds.forEach((columnId) => {
    const extraWidth = baseExtraWidth + (remainder > 0 ? 1 : 0);
    nextColumnWidths[columnId] = Math.round(Number(nextColumnWidths[columnId]) + extraWidth);
    remainder -= 1;
  });

  return nextColumnWidths;
}

export function useGridColumnSettings({
  appId,
  columnOrder,
  columnSettingsDraft,
  columnSizing,
  columnVisibility,
  currentDefaultColumnOrder,
  currentDefaultColumnSizing,
  dataColumns,
  gridId,
  onResetColumnPreferences,
  onSaveColumnPreferences,
  reloadColumns,
  setColumnOrder,
  setColumnSettingsDraft,
  setColumnSizing,
  setColumnVisibility,
  table,
  tableData,
  tableWrapRef,
}) {
  const [columnsModalOpen, setColumnsModalOpen] = useState(false);
  const [columnSettingsSaving, setColumnSettingsSaving] = useState(false);
  const [columnSettingsError, setColumnSettingsError] = useState('');

  const orderedDataColumnIds = useMemo(
    () =>
      normalizeColumnOrder(columnOrder, currentDefaultColumnOrder).filter((columnId) => columnId !== 'select'),
    [columnOrder, currentDefaultColumnOrder],
  );

  const clampColumnWidth = useCallback((columnId, width) => {
    const numericWidth = Number(width);

    if (!Number.isFinite(numericWidth)) {
      return null;
    }

    const defaultSelectWidth = currentDefaultColumnSizing.select;
    const minimumWidth =
      columnId === 'select' && Number.isFinite(defaultSelectWidth) ? defaultSelectWidth : MIN_COLUMN_WIDTH;

    return Math.max(minimumWidth, numericWidth);
  }, [currentDefaultColumnSizing]);

  function moveColumn(columnId, direction) {
    setColumnOrder((currentOrder) => {
      const movableColumnIds = normalizeColumnOrder(currentOrder, currentDefaultColumnOrder).filter(
        (id) => id !== 'select',
      );
      const columnIndex = movableColumnIds.indexOf(columnId);
      const nextIndex = columnIndex + direction;

      if (columnIndex === -1 || nextIndex < 0 || nextIndex >= movableColumnIds.length) {
        return currentOrder;
      }

      const nextOrder = [...movableColumnIds];
      [nextOrder[columnIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[columnIndex]];

      return ['select', ...nextOrder];
    });
  }

  const moveDraftColumn = useCallback((columnId, direction) => {
    setColumnSettingsDraft((currentDraft) => {
      const normalizedOrder = normalizeColumnOrder(currentDraft.columnOrder, currentDefaultColumnOrder);
      const movableColumnIds = normalizedOrder.filter((id) => id !== 'select');
      const columnIndex = movableColumnIds.indexOf(columnId);
      const nextIndex = columnIndex + direction;

      if (columnIndex === -1 || nextIndex < 0 || nextIndex >= movableColumnIds.length) {
        return currentDraft;
      }

      const nextOrder = [...movableColumnIds];
      [nextOrder[columnIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[columnIndex]];

      return {
        ...currentDraft,
        columnOrder: ['select', ...nextOrder],
      };
    });
  }, [currentDefaultColumnOrder, setColumnSettingsDraft]);

  function reorderColumnSettings(activeColumnId, overColumnId) {
    setColumnSettingsDraft((currentDraft) => ({
      ...currentDraft,
      columnOrder: [
        'select',
        ...reorderItems(
          normalizeColumnOrder(currentDraft.columnOrder, currentDefaultColumnOrder).filter(
            (columnId) => columnId !== 'select',
          ),
          activeColumnId,
          overColumnId,
        ),
      ],
    }));
  }

  function updateColumnWidth(columnId, width) {
    const clamped = clampColumnWidth(columnId, width);

    if (clamped === null) {
      return;
    }

    setColumnSizing((currentSizing) => ({
      ...currentSizing,
      [columnId]: clamped,
    }));
  }

  const updateDraftColumnWidth = useCallback((columnId, width) => {
    const clamped = clampColumnWidth(columnId, width);

    if (clamped === null) {
      return;
    }

    setColumnSettingsDraft((currentDraft) => ({
      ...currentDraft,
      columnSizing: {
        ...currentDraft.columnSizing,
        [columnId]: clamped,
      },
    }));
  }, [clampColumnWidth, setColumnSettingsDraft]);

  function resetColumnSettings() {
    setColumnOrder(currentDefaultColumnOrder);
    setColumnSizing(currentDefaultColumnSizing);
    setColumnVisibility({});
  }

  function buildCurrentColumnSettingsDraft() {
    return buildColumnSettingsState(
      {
        columnOrder,
        columnSizing,
        columnVisibility,
      },
      dataColumns,
    );
  }

  async function resetColumnSettingsDraft() {
    setColumnSettingsError('');

    if (typeof onResetColumnPreferences === 'function') {
      if (columnSettingsSaving) return;

      setColumnSettingsSaving(true);

      try {
        await onResetColumnPreferences({ appId, gridId });
        resetColumnSettings();
        reloadColumns?.();
        setColumnsModalOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setColumnSettingsError(message || 'Failed to reset column preferences.');
      } finally {
        setColumnSettingsSaving(false);
      }

      return;
    }

    setColumnSettingsDraft(buildColumnSettingsState({}, dataColumns));
  }

  function openColumnSettingsModal() {
    setColumnSettingsDraft(buildCurrentColumnSettingsDraft());
    setColumnSettingsError('');
    setColumnsModalOpen(true);
  }

  function cancelColumnSettings() {
    setColumnSettingsDraft(buildCurrentColumnSettingsDraft());
    setColumnSettingsError('');
    setColumnsModalOpen(false);
  }

  async function saveColumnSettings() {
    if (columnSettingsSaving) return;

    const nextColumnSettings = buildColumnSettingsState(columnSettingsDraft, dataColumns);
    const columnPreferencesPayload = buildColumnPreferencesPayload(nextColumnSettings, dataColumns);

    setColumnSettingsSaving(true);
    setColumnSettingsError('');

    try {
      await onSaveColumnPreferences({
        appId,
        gridId,
        payload: columnPreferencesPayload,
      });

      setColumnOrder(nextColumnSettings.columnOrder);
      setColumnSizing(nextColumnSettings.columnSizing);
      setColumnVisibility(nextColumnSettings.columnVisibility);
      setColumnsModalOpen(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setColumnSettingsError(msg || 'Failed to save column preferences.');
    } finally {
      setColumnSettingsSaving(false);
    }
  }

  function getAutoFitColumnWidth(columnId) {
    if (columnId === 'select') {
      return currentDefaultColumnSizing.select;
    }

    const column = table.getColumn(columnId);
    const headerText = getColumnLabel(column) ?? columnId;

    const canvas = typeof document !== 'undefined' && document.createElement('canvas');
    const ctx = canvas?.getContext('2d');

    if (ctx) {
      const tableElement = tableWrapRef?.current;
      const computedFont =
        tableElement ? globalThis.getComputedStyle(tableElement).font : '';
      ctx.font = computedFont || '14px sans-serif';

      const allTexts = [String(headerText), ...tableData.map((row) => String(row[columnId] ?? ''))];
      const maxTextWidth = allTexts.reduce((max, text) => Math.max(max, ctx.measureText(text).width), 0);
      return Math.min(MAX_AUTO_FIT_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, Math.ceil(maxTextWidth) + 48));
    }

    // Fallback: character-count heuristic when Canvas API is unavailable
    const longestTextLength = tableData.reduce(
      (length, row) => Math.max(length, String(row[columnId] ?? '').length),
      String(headerText).length,
    );
    return Math.min(MAX_AUTO_FIT_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, longestTextLength * 9 + 48));
  }

  function fitColumnWidth(columnId) {
    const measuredWidth = getAutoFitColumnWidth(columnId);
    updateColumnWidth(columnId, measuredWidth);
  }

  function fitAllColumnWidths() {
    const visibleColumnIds = table
      .getVisibleLeafColumns()
      .map((column) => column.id)
      .filter((columnId) => currentDefaultColumnOrder.includes(columnId));
    const measuredColumnWidths = Object.fromEntries(
      visibleColumnIds.map((columnId) => [columnId, getAutoFitColumnWidth(columnId)]),
    );
    const stretchColumnIds = visibleColumnIds.filter((columnId) => columnId !== 'select');
    const availableGridWidth = tableWrapRef.current?.clientWidth ?? 0;
    const nextColumnWidths = fillColumnWidthsToAvailableGridWidth(
      measuredColumnWidths,
      availableGridWidth,
      stretchColumnIds.length > 0 ? stretchColumnIds : visibleColumnIds,
    );

    setColumnSizing((currentSizing) => ({
      ...currentSizing,
      ...nextColumnWidths,
    }));
  }

  function readRenderedColumnWidths(): Record<string, number> {
    const tableWrapElement = tableWrapRef.current as HTMLElement | null;

    if (!tableWrapElement) {
      return {};
    }

    return Array.from(tableWrapElement.querySelectorAll('thead th[data-column-id]')).reduce<
      Record<string, number>
    >((widths, headerCell) => {
      const columnId = headerCell.getAttribute('data-column-id');

      if (columnId) {
        widths[columnId] = Math.max(MIN_COLUMN_WIDTH, Math.round(headerCell.getBoundingClientRect().width));
      }

      return widths;
    }, {});
  }

  function syncColumnWidthsFromDom() {
    const renderedWidths = readRenderedColumnWidths();

    if (Object.keys(renderedWidths).length === 0) {
      return;
    }

    setColumnSizing((currentSizing) => ({
      ...currentSizing,
      ...renderedWidths,
    }));
  }

  const draftDataColumnIds = useMemo(
    () =>
      normalizeColumnOrder(columnSettingsDraft.columnOrder, currentDefaultColumnOrder).filter(
        (columnId) => columnId !== 'select',
      ),
    [columnSettingsDraft.columnOrder, currentDefaultColumnOrder],
  );

  const columnSettingsOptions = useMemo(
    () =>
      draftDataColumnIds
        .map((columnId) => table.getColumn(columnId))
        .filter(Boolean)
        .map((column, index) => ({
          key: column.id,
          label: getColumnLabel(column),
          checked: columnSettingsDraft.columnVisibility[column.id] !== false,
          canMoveDown: index < draftDataColumnIds.length - 1,
          canMoveUp: index > 0,
          disabled: !column.getCanHide(),
          minWidth: MIN_COLUMN_WIDTH,
          onChange: (checked) =>
            setColumnSettingsDraft((currentDraft) => ({
              ...currentDraft,
              columnVisibility: {
                ...currentDraft.columnVisibility,
                [column.id]: checked,
              },
            })),
          onMoveDown: () => moveDraftColumn(column.id, 1),
          onMoveUp: () => moveDraftColumn(column.id, -1),
          onWidthChange: (width) => updateDraftColumnWidth(column.id, width),
          width: columnSettingsDraft.columnSizing[column.id] ?? column.getSize(),
        })),
    [
      columnSettingsDraft.columnSizing,
      columnSettingsDraft.columnVisibility,
      draftDataColumnIds,
      moveDraftColumn,
      setColumnSettingsDraft,
      table,
      updateDraftColumnWidth,
    ],
  );

  return {
    columnSettingsError,
    columnSettingsOptions,
    columnSettingsSaving,
    columnsModalOpen,
    fitAllColumnWidths,
    fitColumnWidth,
    moveColumn,
    openColumnSettingsModal,
    orderedDataColumnIds,
    reorderColumnSettings,
    resetColumnSettings,
    resetColumnSettingsDraft,
    saveColumnSettings,
    syncColumnWidthsFromDom,
    cancelColumnSettings,
  };
}
