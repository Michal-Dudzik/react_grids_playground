// @ts-nocheck
import { Component, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FilterFilled, FilterOutlined } from '@ant-design/icons';
import { GridErrorPanel } from '../../../components/GridComponents';
import { advancedFilterOperators, advancedFilterOperatorsWithoutInput } from '../../../core/tableConfig';
import { renderColumnDisplayValue } from '../../../core/tableDisplay';
import {
  buildColumnUniqueValues,
  formatFilterOptionLabel,
  getEmptyAdvancedFilterValue,
  isAdvancedFilterActive,
  normalizeAdvancedFilterValue,
  normalizeSelectedFilterValues,
} from '../../../core/tableFilters';
import { getColumnLabelFromColumn } from '../../../core/tableAggregation';
import { getPresentationAccent, isTruthyDisplayValue } from '../../../core/tablePresentationRules';
import { mergeClassNames } from '../../../core/tableUtils';

function defaultGetMessage(key, fallback, values) {
  const message = fallback ?? key;

  if (!values) {
    return message;
  }

  return Object.entries(values).reduce(
    (currentMessage, [valueKey, value]) => currentMessage.replaceAll(`{${valueKey}}`, String(value ?? '')),
    message,
  );
}

const advancedFilterOperatorLabelKeys = {
  empty: 'isEmpty',
  notContains: 'doesNotContain',
  notEmpty: 'isNotEmpty',
};

export function renderHighlightedText(value, searchTerm) {
  const text = value == null ? '' : String(value);
  const normalizedSearch = searchTerm?.trim();

  if (!normalizedSearch) {
    return text;
  }

  const escapedTerm = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === normalizedSearch.toLowerCase() ? (
      <mark className="search-highlight" key={`${part}-${index}`}>
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

export function renderPresentationCellContent(cellContent, rule, rawValue, getMessage = defaultGetMessage) {
  if (!rule || rule.cellDisplay === 'value') {
    return (
      <>
        <div className="tanstack-grid__cell-value">{cellContent}</div>
        {rule ? (
          <span
            aria-hidden="true"
            className="tanstack-grid__decoration-icon"
            style={{ '--presentation-accent': getPresentationAccent(rule) }}
          />
        ) : null}
      </>
    );
  }

  if (rule.cellDisplay === 'pill') {
    return (
      <span
        className="tanstack-grid__replacement tanstack-grid__replacement--pill"
        style={{ '--presentation-accent': getPresentationAccent(rule) }}
      >
        {String(rawValue ?? '') || getMessage('emptyCellValue')}
      </span>
    );
  }

  if (rule.cellDisplay === 'booleanIcon') {
    const isTruthy = isTruthyDisplayValue(rawValue);

    return (
      <span
        aria-label={isTruthy ? getMessage('trueValue') : getMessage('falseValue')}
        className="tanstack-grid__replacement tanstack-grid__replacement--mark"
        style={{ '--presentation-accent': rule.textColor || (isTruthy ? 'var(--success)' : 'var(--ts-grid-danger)') }}
      >
        {isTruthy ? '✓' : '×'}
      </span>
    );
  }

  if (rule.cellDisplay === 'check' || rule.cellDisplay === 'cross') {
    const isCheck = rule.cellDisplay === 'check';

    return (
      <span
        aria-label={isCheck ? getMessage('checkMark') : getMessage('crossMark')}
        className="tanstack-grid__replacement tanstack-grid__replacement--mark"
        style={{ '--presentation-accent': getPresentationAccent(rule) }}
      >
        {isCheck ? '✓' : '×'}
      </span>
    );
  }

  return (
    <span
      aria-label={String(rawValue ?? '')}
      className="tanstack-grid__replacement tanstack-grid__replacement--dot"
      style={{ '--presentation-accent': getPresentationAccent(rule) }}
    />
  );
}

export class TanStackTableErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.error) {
      const ErrorPanel = this.props.ErrorPanel ?? GridErrorPanel;
      const getMessage = this.props.getMessage ?? defaultGetMessage;

      return (
        <div className="tanstack-grid">
          <ErrorPanel
            description={this.state.error?.message ?? getMessage('gridFailedToRender')}
            message={getMessage('tanStackTableError')}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export function TableCheckbox({ checked, indeterminate = false, ...props }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate && !checked;
    }
  }, [checked, indeterminate]);

  return <input checked={checked} ref={inputRef} type="checkbox" {...props} />;
}

export function AdvancedColumnFilterButton({
  column,
  isOpen,
  onClear,
  onClose,
  onFilterChange,
  onToggle,
  rows,
  triggerVariant = 'default',
  getMessage = defaultGetMessage,
}) {
  const panelRef = useRef(null);
  const menuRef = useRef(null);
  const [valueSearch, setValueSearch] = useState('');
  const [menuPosition, setMenuPosition] = useState(null);
  const appliedFilterValue = normalizeAdvancedFilterValue(column.getFilterValue());
  const [draftFilterValue, setDraftFilterValue] = useState(appliedFilterValue);
  const isActive = isAdvancedFilterActive(appliedFilterValue);
  const label = getColumnLabelFromColumn(column);
  const isIconTrigger = triggerVariant === 'icon';
  const allColumnValues = useMemo(() => buildColumnUniqueValues(rows, column.id), [column.id, rows]);
  const visibleColumnValues = useMemo(() => {
    const normalizedSearch = valueSearch.trim().toLowerCase();

    return normalizedSearch
      ? allColumnValues.filter((value) => value.toLowerCase().includes(normalizedSearch))
      : allColumnValues;
  }, [allColumnValues, valueSearch]);
  const selectedValues = draftFilterValue.selectedValues;
  const selectedValueSet = new Set(selectedValues);
  const allValuesSelected = selectedValues.length === 0;
  const conditionActive =
    advancedFilterOperatorsWithoutInput.has(draftFilterValue.operator) || draftFilterValue.query.trim().length > 0;
  const allVisibleValuesSelected =
    allValuesSelected ||
    (visibleColumnValues.length > 0 && visibleColumnValues.every((value) => selectedValueSet.has(value)));
  const someValuesSelected =
    !allValuesSelected &&
    visibleColumnValues.some((value) => selectedValueSet.has(value)) &&
    !allVisibleValuesSelected;
  const selectedSummary = allValuesSelected
    ? conditionActive
      ? getMessage('rule', 'Rule')
      : getMessage('all', 'All')
    : `${selectedValues.length}/${allColumnValues.length}`;
  const sortDirection = column.getIsSorted();

  useEffect(() => {
    if (isOpen) {
      setDraftFilterValue(normalizeAdvancedFilterValue(column.getFilterValue()));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return undefined;
    }

    function updateMenuPosition() {
      const triggerElement = panelRef.current;

      if (!triggerElement) {
        return;
      }

      const horizontalPadding = 16;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const rect = triggerElement.getBoundingClientRect();
      const width = Math.min(340, viewportWidth - horizontalPadding * 2);
      const gap = 8;
      const minimumMenuHeight = 240;
      const desiredMenuHeight = Math.min(menuRef.current?.offsetHeight ?? 420, viewportHeight - horizontalPadding * 2);
      const spaceBelow = viewportHeight - rect.bottom - horizontalPadding;
      const spaceAbove = rect.top - horizontalPadding;
      const shouldOpenAbove = spaceBelow < minimumMenuHeight && spaceAbove > spaceBelow;

      let left = isIconTrigger ? rect.right - width : rect.left;
      left = Math.max(horizontalPadding, Math.min(left, viewportWidth - width - horizontalPadding));

      const top = shouldOpenAbove
        ? Math.max(horizontalPadding, rect.top - desiredMenuHeight - gap)
        : rect.bottom + gap;
      const maxHeight = shouldOpenAbove
        ? Math.max(180, rect.top - horizontalPadding - gap)
        : Math.max(180, viewportHeight - rect.bottom - horizontalPadding - gap);

      setMenuPosition({
        left,
        maxHeight,
        top,
        width,
      });
    }

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isIconTrigger, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleWindowClick(event) {
      const eventTarget = event.target;

      if (
        panelRef.current?.contains(eventTarget) ||
        menuRef.current?.contains(eventTarget) ||
        eventTarget?.closest?.('.tanstack-grid__filter-condition-popup')
      ) {
        return;
      }

      onClose();
    }

    window.addEventListener('click', handleWindowClick);

    return () => {
      window.removeEventListener('click', handleWindowClick);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setValueSearch('');
    }
  }, [isOpen]);

  function commitFilter(patch) {
    const nextFilterValue = normalizeAdvancedFilterValue({
      ...draftFilterValue,
      ...patch,
    });

    setDraftFilterValue(nextFilterValue);
    onFilterChange(column.id, nextFilterValue);
  }

  function commitSelectedValues(nextSelectedValues) {
    commitFilter({
      selectedValues: normalizeSelectedFilterValues(nextSelectedValues, allColumnValues),
    });
  }

  function toggleFilterOption(option) {
    if (allValuesSelected) {
      commitSelectedValues(allColumnValues.filter((value) => value !== option));
      return;
    }

    if (selectedValueSet.has(option)) {
      commitSelectedValues(selectedValues.filter((value) => value !== option));
      return;
    }

    commitSelectedValues([...selectedValues, option]);
  }

  function toggleVisibleOptions() {
    if (allVisibleValuesSelected) {
      const currentSelection = allValuesSelected ? allColumnValues : selectedValues;
      const visibleValueSet = new Set(visibleColumnValues);
      commitSelectedValues(currentSelection.filter((value) => !visibleValueSet.has(value)));
      return;
    }

    commitSelectedValues([...selectedValues, ...visibleColumnValues]);
  }

  return (
    <div className="tanstack-grid__filter-menu-wrap" ref={panelRef}>
      <button
        className={mergeClassNames(
          'tanstack-grid__filter-trigger',
          isIconTrigger ? 'tanstack-grid__filter-trigger--icon' : '',
          isActive ? 'tanstack-grid__filter-trigger--active' : '',
        )}
        aria-label={getMessage(isActive ? 'editFilterFor' : 'addFilterFor', undefined, { label })}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        title={getMessage(isActive ? 'editFilterFor' : 'addFilterFor', undefined, { label })}
        type="button"
      >
        {isIconTrigger ? (
          <>
            {isActive ? <FilterFilled /> : <FilterOutlined />}
            <span className="tanstack-grid__sr-only">{selectedSummary}</span>
          </>
        ) : (
          <>
            <span>{label}</span>
            <strong>{selectedSummary}</strong>
          </>
        )}
      </button>

      {isOpen && menuPosition != null
        ? createPortal(
            <div
              className={mergeClassNames(
                'tanstack-grid__filter-menu',
                isIconTrigger ? 'tanstack-grid__filter-menu--header' : '',
              )}
              ref={menuRef}
              style={menuPosition ?? undefined}
            >
              <div className="tanstack-grid__filter-menu-title">
                <span>{label}</span>
                <button aria-label={getMessage('closeFilterMenu')} onClick={onClose} type="button">
                  ×
                </button>
              </div>

              <div className="tanstack-grid__filter-menu-actions">
                <button
                  className={sortDirection === 'asc' ? 'tanstack-grid__filter-menu-action--active' : ''}
                  onClick={() => column.toggleSorting(false)}
                  type="button"
                >
                  {getMessage('sortAtoZ')}
                </button>
                <button
                  className={sortDirection === 'desc' ? 'tanstack-grid__filter-menu-action--active' : ''}
                  onClick={() => column.toggleSorting(true)}
                  type="button"
                >
                  {getMessage('sortZtoA')}
                </button>
                <button disabled={!column.getIsSorted()} onClick={() => column.clearSorting()} type="button">
                  {getMessage('clearSort')}
                </button>
              </div>

              <div className="tanstack-grid__filter-condition">
                <label className="tanstack-grid__field">
                  <span>{getMessage('condition')}</span>
                  <select
                    onChange={(event) => commitFilter({ operator: event.target.value })}
                    value={draftFilterValue.operator}
                  >
                    {advancedFilterOperators.map((operator) => (
                      <option key={operator.value} value={operator.value}>
                        {getMessage(advancedFilterOperatorLabelKeys[operator.value] ?? operator.value, operator.label)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="tanstack-grid__field">
                  <span>{getMessage('value')}</span>
                  <input
                    disabled={advancedFilterOperatorsWithoutInput.has(draftFilterValue.operator)}
                    onChange={(event) => commitFilter({ query: event.target.value })}
                    placeholder={getMessage('filterValue')}
                    type="text"
                    value={draftFilterValue.query}
                  />
                </label>
              </div>

              <div className="tanstack-grid__filter-values">
                <input
                  aria-label={getMessage('searchValues', undefined, { label })}
                  onChange={(event) => setValueSearch(event.target.value)}
                  placeholder={getMessage('searchValues', undefined, { label })}
                  type="text"
                  value={valueSearch}
                />
                <label className="tanstack-grid__filter-check">
                  <TableCheckbox
                    checked={allVisibleValuesSelected}
                    indeterminate={someValuesSelected}
                    onChange={toggleVisibleOptions}
                  />
                  <span>{getMessage('selectAll')}</span>
                </label>
                <div className="tanstack-grid__filter-options">
                  {visibleColumnValues.map((option) => (
                    <label className="tanstack-grid__filter-check" key={option}>
                      <input
                        checked={allValuesSelected || selectedValueSet.has(option)}
                        onChange={() => toggleFilterOption(option)}
                        type="checkbox"
                      />
                      <span>{formatFilterOptionLabel(option)}</span>
                    </label>
                  ))}
                  {visibleColumnValues.length === 0 ? (
                    <span className="tanstack-grid__filter-empty">{getMessage('noValuesFound')}</span>
                  ) : null}
                </div>
              </div>

              <div className="tanstack-grid__filter-menu-footer">
                <button
                  disabled={!isActive}
                  onClick={() => {
                    setDraftFilterValue(getEmptyAdvancedFilterValue());
                    onClear(column.id);
                  }}
                  type="button"
                >
                  {getMessage('clear')}
                </button>
                <button className="tanstack-grid__button--primary" onClick={onClose} type="button">
                  {getMessage('done')}
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function ContextMenuItemButton({ item, onSelect }) {
  if (item.separator) {
    return <div className="tanstack-grid__context-menu-separator" role="separator" />;
  }

  const hasSubmenu = item.items?.length > 0;

  return (
    <div className="tanstack-grid__context-menu-item-wrap">
      <button
        className="tanstack-grid__context-menu-item"
        disabled={item.disabled}
        onClick={() => {
          if (!hasSubmenu) {
            onSelect(item);
          }
        }}
        type="button"
      >
        <span>{item.label}</span>
        {item.meta ? <span className="tanstack-grid__context-menu-meta">{item.meta}</span> : null}
        {hasSubmenu ? <span className="tanstack-grid__context-menu-arrow">›</span> : null}
      </button>

      {hasSubmenu ? (
        <div className="tanstack-grid__context-submenu" role="menu">
          {item.items.map((childItem) => (
            <ContextMenuItemButton item={childItem} key={childItem.key} onSelect={onSelect} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ContextMenu({ items, onClose, onHeightChange, onSelect, state }) {
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el || !onHeightChange) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const height = Math.ceil(
        entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height,
      );
      onHeightChange(height);
    });

    observer.observe(el);
    return () => observer.disconnect();
    // Re-observe each time the menu opens (state identity changes); intentionally
    // omitting onHeightChange to avoid reconnecting on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (!state) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      className={`tanstack-grid__context-menu ${
        state.submenuPlacement === 'left' ? 'tanstack-grid__context-menu--submenu-left' : ''
      }`.trim()}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
      role="menu"
      style={{
        left: state.x,
        top: state.y,
      }}
    >
      <div className="tanstack-grid__context-menu-title">{state.label}</div>
      {items.map((item) => (
        <ContextMenuItemButton item={item} key={item.key} onSelect={onSelect} />
      ))}
      <button className="tanstack-grid__context-menu-close" onClick={onClose} type="button">
        {state.closeLabel ?? 'Close'}
      </button>
    </div>,
    document.body,
  );
}

export function EditableCell({ column, getValue, renderPreview, row, searchTerm, table }) {
  const rawValue = getValue();
  const value = rawValue ?? '';
  const columnMeta = column.columnDef.meta ?? {};
  const shouldRenderHighlightedPreview = Boolean(searchTerm?.trim());
  const previewContent = renderPreview
    ? renderPreview(value, searchTerm)
    : renderColumnDisplayValue({
        column,
        rawValue,
        renderText: renderHighlightedText,
        searchTerm,
      });

  if (!columnMeta.editable) {
    return previewContent;
  }

  function updateValue(nextValue) {
    table.options.meta?.updateData?.(row.original.id, column.id, nextValue);
  }

  return (
    <div className="tanstack-grid__editable-cell">
      {shouldRenderHighlightedPreview ? (
        <div className="tanstack-grid__editable-preview">{previewContent}</div>
      ) : null}
      {columnMeta.filterVariant === 'select' ? (
        <select
          aria-label={`Edit ${column.columnDef.header}`}
          onChange={(event) => updateValue(event.target.value)}
          value={value}
        >
          {columnMeta.filterOptions?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          aria-label={`Edit ${column.columnDef.header}`}
          onChange={(event) => updateValue(event.target.value)}
          type="text"
          value={value}
        />
      )}
    </div>
  );
}
