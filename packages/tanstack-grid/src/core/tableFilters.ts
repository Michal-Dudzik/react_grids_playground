import { advancedFilterOperators, advancedFilterOperatorsWithoutInput } from './tableConfig';
import { parseAggregateNumber } from './tableAggregation';

export function getEmptyAdvancedFilterValue() {
  return {
    operator: 'contains',
    query: '',
    selectedValues: [],
  };
}

export function normalizeAdvancedFilterValue(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const validOperator = advancedFilterOperators.some((operator) => operator.value === value.operator)
      ? value.operator
      : 'contains';

    return {
      operator: validOperator,
      query: String(value.query ?? ''),
      selectedValues: Array.isArray(value.selectedValues)
        ? [...new Set(value.selectedValues.map((option) => String(option ?? '')))]
        : [],
    };
  }

  return {
    ...getEmptyAdvancedFilterValue(),
    query: String(value ?? ''),
  };
}

export function isAdvancedFilterActive(value) {
  const filterValue = normalizeAdvancedFilterValue(value);

  return (
    filterValue.selectedValues.length > 0 ||
    advancedFilterOperatorsWithoutInput.has(filterValue.operator) ||
    filterValue.query.trim().length > 0
  );
}

export function isAdvancedFilterConfigured(value) {
  const filterValue = normalizeAdvancedFilterValue(value);

  return (
    filterValue.selectedValues.length > 0 ||
    filterValue.operator !== getEmptyAdvancedFilterValue().operator ||
    filterValue.query.trim().length > 0
  );
}

export function buildColumnUniqueValues(rows, columnId) {
  const values: string[] = rows.map((row) => String(row[columnId] ?? ''));

  return [...new Set(values)].sort((first, second) =>
    first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' }),
  );
}

export function formatFilterOptionLabel(value) {
  return value === '' ? '(Blanks)' : value;
}

export function normalizeSelectedFilterValues(selectedValues, allValues) {
  const allValueSet = new Set(allValues);
  const normalizedValues = [...new Set(selectedValues.map((value) => String(value ?? '')))].filter((value) =>
    allValueSet.has(value),
  );

  return normalizedValues.length === allValues.length ? [] : normalizedValues;
}

export function getComparableFilterText(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function advancedColumnFilterFn(row, columnId, filterValue) {
  const normalizedFilter = normalizeAdvancedFilterValue(filterValue);
  const rawValue = row.getValue(columnId);
  const textValue = String(rawValue ?? '');
  const normalizedValue = getComparableFilterText(textValue);
  const normalizedQuery = getComparableFilterText(normalizedFilter.query);

  if (!isAdvancedFilterActive(normalizedFilter)) {
    return true;
  }

  if (normalizedFilter.selectedValues.length > 0 && !normalizedFilter.selectedValues.includes(textValue)) {
    return false;
  }

  switch (normalizedFilter.operator) {
    case 'empty':
      return textValue.trim().length === 0;
    case 'notEmpty':
      return textValue.trim().length > 0;
    case 'notContains':
      return normalizedQuery ? !normalizedValue.includes(normalizedQuery) : true;
    case 'equals':
      return normalizedQuery ? normalizedValue === normalizedQuery : true;
    case 'notEquals':
      return normalizedQuery ? normalizedValue !== normalizedQuery : true;
    case 'startsWith':
      return normalizedQuery ? normalizedValue.startsWith(normalizedQuery) : true;
    case 'endsWith':
      return normalizedQuery ? normalizedValue.endsWith(normalizedQuery) : true;
    case 'greaterThan': {
      const actualNumber = parseAggregateNumber(rawValue);
      const expectedNumber = parseAggregateNumber(normalizedFilter.query);
      return actualNumber !== null && expectedNumber !== null && actualNumber > expectedNumber;
    }
    case 'lessThan': {
      const actualNumber = parseAggregateNumber(rawValue);
      const expectedNumber = parseAggregateNumber(normalizedFilter.query);
      return actualNumber !== null && expectedNumber !== null && actualNumber < expectedNumber;
    }
    case 'contains':
    default:
      return normalizedQuery ? normalizedValue.includes(normalizedQuery) : true;
  }
}

/**
 * Normalizes persisted filter state. When called without nextDefaultColumnOrder,
 * column ID validation is skipped — the component re-validates on mount via its useEffect.
 */
export function normalizeFilterState(filterState, nextDefaultColumnOrder = []) {
  const validColumnIds = nextDefaultColumnOrder.length > 0 ? new Set(nextDefaultColumnOrder) : null;
  const columnFilters = Array.isArray(filterState?.columnFilters)
    ? filterState.columnFilters
        .filter(
          (filter) =>
            filter.id !== 'select' &&
            (!validColumnIds || validColumnIds.has(filter?.id)),
        )
        .map((filter) => ({
          id: filter.id,
          value: normalizeAdvancedFilterValue(filter.value),
        }))
        .filter((filter) => isAdvancedFilterConfigured(filter.value))
    : [];
  const globalFilter = String(filterState?.globalFilter ?? '').trim();
  const activeColumnFilters = columnFilters.filter((filter) => isAdvancedFilterActive(filter.value));

  return {
    columnFilters,
    globalFilter,
    showFilters: Boolean(filterState?.showFilters) || activeColumnFilters.length > 0,
  };
}

