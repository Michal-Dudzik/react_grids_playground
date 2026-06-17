// @ts-nocheck
import { createElement, forwardRef, useCallback, useMemo } from 'react';
import { TanStackGrid } from './TanStackGrid';
import type {
  GridColumnDef,
  GridFooterConfig,
  GridSlots,
  SyncfusionContextMenuCompat,
  SyncfusionTemplateRuleCompat,
  TanStackGridCompatProps,
  TanStackGridRef,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}

function mergeClassNames(...classNames: unknown[]) {
  return classNames.filter(Boolean).join(' ');
}

function normalizeAggregationConfig(aggregationConfig: unknown) {
  if (!Array.isArray(aggregationConfig)) {
    return aggregationConfig;
  }

  const columns = [];
  const operations = new Set<string>();
  const customAggregates = [];

  aggregationConfig.forEach((item) => {
    if (!isRecord(item)) {
      return;
    }

    const field = String(item.field ?? item.id ?? item.column ?? '');

    if (!field) {
      return;
    }

    columns.push({
      id: field,
      label: typeof item.label === 'string' ? item.label : field,
    });

    const type = String(item.type ?? 'sum').toLowerCase();

    if (type === 'count') {
      customAggregates.push({
        calculate: (_values, context) => context?.rows?.length ?? 0,
        format: (value) => String(value ?? 0),
        key: `${field}-count`,
        label: typeof item.label === 'string' ? item.label : 'Count',
      });
      return;
    }

    operations.add(type === 'avg' ? 'average' : type);
  });

  return {
    columns,
    customAggregates,
    operations: operations.size > 0 ? [...operations] : undefined,
  };
}

function matchesTemplateRule(rule: SyncfusionTemplateRuleCompat, column: GridColumnDef, originalColumn: unknown) {
  if (typeof rule?.match !== 'function') {
    return false;
  }

  try {
    return Boolean(rule.match(originalColumn ?? column) || rule.match(column));
  } catch {
    return false;
  }
}

function buildTemplateRenderer(rule: SyncfusionTemplateRuleCompat, column: GridColumnDef) {
  const Template = rule.template;

  if (!Template) {
    return undefined;
  }

  return ({ columnId, row, value }) =>
    createElement(Template, {
      ...(isRecord(row) ? row : {}),
      column: {
        ...(isRecord(column.meta?.originalColumn) ? column.meta.originalColumn : {}),
        field: columnId,
      },
      field: columnId,
      value,
      [columnId]: value,
    });
}

function mergeSlotsWithTemplateRules<Row>(
  slots: GridSlots<Row> | undefined,
  templateRules: SyncfusionTemplateRuleCompat[] | undefined,
  transformColumnsFn: TanStackGridCompatProps<Row>['transformColumnsFn'],
) {
  return (columns) => {
    const nextColumns = columns.map((column) => {
      const originalColumn = column.meta?.originalColumn ?? column;
      const rule = templateRules?.find((candidate) => matchesTemplateRule(candidate, column, originalColumn));
      const renderPreview = rule ? buildTemplateRenderer(rule, column) : undefined;

      if (!renderPreview) {
        return column;
      }

      return {
        ...column,
        meta: {
          ...(column.meta ?? {}),
          renderPreview,
        },
      };
    });

    return typeof transformColumnsFn === 'function' ? transformColumnsFn(nextColumns) : nextColumns;
  };
}

function buildDecorationProps(decoration, target, context) {
  if (!decoration) {
    return {};
  }

  const row = context.row?.original ?? context.row;
  const field = context.cell?.column?.id ?? context.header?.column?.id;
  const decorationResult =
    target === 'row'
      ? decoration.getRowDecoration?.(row)
      : target === 'header'
        ? decoration.getColumnDecoration?.(field)
        : decoration.getCellDecoration?.(row, field);

  const className = mergeClassNames(
    target === 'row' ? decoration.getRowClassName?.(row) : '',
    target === 'cell' ? decoration.getCellClassName?.(row, field) : '',
    decorationResult?.className,
  );
  const style = {
    ...(target === 'row' ? decoration.getRowStyle?.(row) : undefined),
    ...(target === 'cell' ? decoration.getCellStyle?.(row, field) : undefined),
    ...(decorationResult?.style ?? {}),
  };
  const tooltip =
    decorationResult?.tooltip ??
    (target === 'cell' && typeof decoration.getCellTooltip === 'function'
      ? decoration.getCellTooltip(row, field)
      : undefined);

  return {
    className,
    style: Object.keys(style).length > 0 ? style : undefined,
    title: tooltip,
  };
}

function normalizeCompatMenuItem(item, onContextMenuClick) {
  if (typeof item === 'string') {
    return null;
  }

  const key = item.id ?? item.key ?? item.text;

  if (!key) {
    return null;
  }

  const normalized = {
    disabled: typeof item.disabled === 'boolean' ? item.disabled : undefined,
    items: Array.isArray(item.items)
      ? item.items.map((child) => normalizeCompatMenuItem(child, onContextMenuClick)).filter(Boolean)
      : undefined,
    key,
    label: item.text ?? item.label ?? key,
    meta: item.meta,
    onSelect: (menuState) => {
      onContextMenuClick?.({
        item: {
          ...item,
          id: key,
          text: item.text ?? item.label ?? key,
        },
        menuState,
      });
      item.action?.({ item, menuState });
    },
    separator: item.separator,
  };

  return normalized;
}

function mapContextMenu(contextMenu: SyncfusionContextMenuCompat = {}) {
  const sourceItems = contextMenu.contextMenuItems ?? contextMenu.items ?? [];
  const cellItems = [];
  const headerItems = [];
  const disabledMap = {};
  const hiddenMap = {};
  const labels = {};

  sourceItems.forEach((item) => {
    if (typeof item === 'string') {
      return;
    }

    const normalized = normalizeCompatMenuItem(item, contextMenu.onContextMenuClick);

    if (!normalized) {
      return;
    }

    const target = String(item.target ?? '').toLowerCase();
    const showInHeader = !target || target.includes('header');
    const showInCell = !target || target.includes('row') || target.includes('cell');

    if (showInHeader) {
      headerItems.push(normalized);
    }

    if (showInCell) {
      cellItems.push(normalized);
    }

    labels[normalized.key] = normalized.label;

    if (item.disabled !== undefined) {
      disabledMap[normalized.key] =
        typeof item.disabled === 'function' ? ({ menuState }) => item.disabled(menuState) : item.disabled;
    }

    if (item.hidden !== undefined) {
      hiddenMap[normalized.key] =
        typeof item.hidden === 'function' ? ({ menuState }) => item.hidden(menuState) : item.hidden;
    }
  });

  return {
    cellItems,
    disabledMap: {
      ...disabledMap,
      ...(contextMenu.disabledMap ?? {}),
    },
    headerItems,
    hiddenMap: {
      ...hiddenMap,
      ...(contextMenu.hiddenMap ?? {}),
    },
    labels,
  };
}

function mergeFooterConfig(footerConfig: GridFooterConfig | undefined, enableSelectionColumn: boolean) {
  return {
    showColumnsSettings: false,
    showExportExcel: true,
    showFilter: true,
    showFooter: true,
    showPresentationSettings: false,
    showPrint: true,
    showSummary: true,
    ...footerConfig,
    buttons: footerConfig?.buttons ?? [],
  };
}

export const TanStackGridCompat = forwardRef<TanStackGridRef, TanStackGridCompatProps>(function TanStackGridCompat(
  {
    aggregationConfig,
    autoCalculatePageSize = false,
    columns = [],
    contextMenu,
    contextMenuConfig = {},
    data,
    decoration,
    disablePaging = false,
    enableSelectionColumn = false,
    footerConfig,
    lowRowHeight = false,
    onSelectionChange,
    pageSettings,
    rows,
    selectionSettings,
    slots,
    templateRules,
    transformColumnsFn,
    ...restProps
  },
  ref,
) {
  const compatContextMenuConfig = useMemo(() => {
    const mappedContextMenu = mapContextMenu(contextMenu);

    return {
      ...contextMenuConfig,
      cellItems: [...mappedContextMenu.cellItems, ...(contextMenuConfig.cellItems ?? [])],
      disabledMap: {
        ...mappedContextMenu.disabledMap,
        ...(contextMenuConfig.disabledMap ?? {}),
      },
      headerItems: [...mappedContextMenu.headerItems, ...(contextMenuConfig.headerItems ?? [])],
      hiddenMap: {
        ...mappedContextMenu.hiddenMap,
        ...(contextMenuConfig.hiddenMap ?? {}),
      },
      labels: {
        ...mappedContextMenu.labels,
        ...(contextMenuConfig.labels ?? {}),
      },
    };
  }, [contextMenu, contextMenuConfig]);

  const compatFooterConfig = useMemo(
    () => mergeFooterConfig(footerConfig, enableSelectionColumn),
    [enableSelectionColumn, footerConfig],
  );

  const compatSlots = useMemo(
    () => ({
      ...slots,
      cellPreviewRenderers: {
        ...(slots?.cellPreviewRenderers ?? {}),
      },
    }),
    [slots],
  );

  const combinedTransformColumnsFn = useMemo(
    () => mergeSlotsWithTemplateRules(compatSlots, templateRules, transformColumnsFn),
    [compatSlots, templateRules, transformColumnsFn],
  );

  const getCellProps = useCallback(
    (context) => buildDecorationProps(decoration, 'cell', context),
    [decoration],
  );
  const getHeaderProps = useCallback(
    (context) => buildDecorationProps(decoration, 'header', context),
    [decoration],
  );
  const getRowProps = useCallback(
    (context) => buildDecorationProps(decoration, 'row', context),
    [decoration],
  );

  return (
    <TanStackGrid
      {...restProps}
      aggregationConfig={normalizeAggregationConfig(aggregationConfig)}
      columns={columns}
      contextMenuConfig={compatContextMenuConfig}
      features={{
        columnSettings: compatFooterConfig.showColumnsSettings,
        contextMenu: true,
        export: compatFooterConfig.showExportExcel,
        filtering: compatFooterConfig.showFilter,
        pagination: !disablePaging,
        presentation: compatFooterConfig.showPresentationSettings,
        print: compatFooterConfig.showPrint,
        selection: enableSelectionColumn,
        summary: compatFooterConfig.showSummary,
        ...(restProps.features ?? {}),
      }}
      footerConfig={compatFooterConfig}
      getCellProps={decoration ? getCellProps : restProps.getCellProps}
      getHeaderProps={decoration ? getHeaderProps : restProps.getHeaderProps}
      getRowProps={decoration ? getRowProps : restProps.getRowProps}
      initialAutoPageSize={autoCalculatePageSize}
      initialPageSize={pageSettings?.pageSize ?? restProps.initialPageSize}
      initialRowDensity={lowRowHeight ? 'compact' : restProps.initialRowDensity}
      initialSelectionMode={selectionSettings?.type === 'Single' ? 'single' : restProps.initialSelectionMode}
      initialShowAllRows={disablePaging}
      onSelectionChange={(selectedRows, context) => {
        onSelectionChange?.(selectedRows, context);
      }}
      ref={ref}
      rows={rows ?? data ?? []}
      slots={compatSlots}
      transformColumnsFn={combinedTransformColumnsFn}
    />
  );
});
