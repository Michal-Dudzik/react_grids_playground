import { useCallback, useMemo } from 'react';
import {
  cloneDefaultPresentationRules,
  createPresentationRule,
  normalizePresentationRules,
} from '../../../../core/tablePresentationRules';
import { reorderItems } from '../../../../core/tableUtils';

function getColumnLabel(column) {
  return typeof column?.columnDef.header === 'string' ? column.columnDef.header : column?.id;
}

export function useGridPresentation({
  dataColumns,
  orderedDataColumnIds,
  presentationRules,
  setPresentationRules,
  table,
}) {
  const addPresentationRule = useCallback(() => {
    const fallbackField =
      orderedDataColumnIds[0] ??
      dataColumns.find((c) => c.accessorKey)?.accessorKey ??
      dataColumns.find((c) => c.id)?.id ??
      dataColumns[0]?.id;

    if (!fallbackField) {
      return;
    }

    setPresentationRules((currentRules) => [
      ...currentRules,
      createPresentationRule({
        field: fallbackField,
      }),
    ]);
  }, [dataColumns, orderedDataColumnIds, setPresentationRules]);

  const updatePresentationRule = useCallback(
    (ruleId, patch) => {
      setPresentationRules((currentRules) =>
        normalizePresentationRules(
          currentRules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
        ),
      );
    },
    [setPresentationRules],
  );

  const deletePresentationRule = useCallback(
    (ruleId) => {
      setPresentationRules((currentRules) => currentRules.filter((rule) => rule.id !== ruleId));
    },
    [setPresentationRules],
  );

  const reorderPresentationRules = useCallback(
    (activeRuleId, overRuleId) => {
      setPresentationRules((currentRules) => reorderItems(currentRules, activeRuleId, overRuleId));
    },
    [setPresentationRules],
  );

  const resetPresentationRules = useCallback(() => {
    setPresentationRules(cloneDefaultPresentationRules());
  }, [setPresentationRules]);

  const columnOptions = useMemo(
    () =>
      orderedDataColumnIds
        .map((columnId) => table.getColumn(columnId))
        .filter(Boolean)
        .map((column) => ({
          key: column.id,
          label: getColumnLabel(column),
        })),
    [orderedDataColumnIds, table],
  );

  const activePresentationRules = useMemo(
    () => presentationRules.filter((rule) => rule.enabled).length,
    [presentationRules],
  );

  return {
    activePresentationRules,
    addPresentationRule,
    columnOptions,
    deletePresentationRule,
    reorderPresentationRules,
    resetPresentationRules,
    updatePresentationRule,
  };
}
