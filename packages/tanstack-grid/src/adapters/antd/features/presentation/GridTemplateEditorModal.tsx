import { DeleteOutlined, HolderOutlined, InfoCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Select, Space, Switch, Tooltip } from 'antd';
import type { DragEndEvent, DraggableAttributes, UniqueIdentifier } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { ComponentType, CSSProperties, ReactElement, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { GridEmptyState, GridModal } from '../../../../components/GridComponents';
import type { GridEmptyStateProps, GridModalProps, GridPresentationRule } from '../../../../types';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

const targetOptions = [
  { label: 'Cell', labelKey: 'cell', value: 'cell' },
  { label: 'Row', labelKey: 'row', value: 'row' },
  { label: 'Header', labelKey: 'header', value: 'header' },
];

const operatorOptions = [
  { label: 'Contains', labelKey: 'contains', value: 'contains' },
  { label: 'Equals', labelKey: 'equals', value: 'equals' },
  { label: 'Not equals', labelKey: 'notEquals', value: 'notEquals' },
  { label: 'Starts with', labelKey: 'startsWith', value: 'startsWith' },
  { label: 'Ends with', labelKey: 'endsWith', value: 'endsWith' },
  { label: 'Greater than', labelKey: 'greaterThan', value: 'greaterThan' },
  { label: 'Less than', labelKey: 'lessThan', value: 'lessThan' },
  { label: 'Is empty', labelKey: 'isEmpty', value: 'empty' },
  { label: 'Is not empty', labelKey: 'isNotEmpty', value: 'notEmpty' },
];

const decorationOptions = [
  { label: 'Success', labelKey: 'success', value: 'success' },
  { label: 'Warning', labelKey: 'warning', value: 'warning' },
  { label: 'Info', labelKey: 'info', value: 'info' },
  { label: 'Accent', labelKey: 'accent', value: 'accent' },
  { label: 'Muted', labelKey: 'muted', value: 'muted' },
];

const cellDisplayOptions = [
  { label: 'Keep value', labelKey: 'keepValue', value: 'value' },
  { label: 'Colored dot', labelKey: 'coloredDot', value: 'dot' },
  { label: 'Check mark', labelKey: 'checkMarkDisplay', value: 'check' },
  { label: 'Cross mark', labelKey: 'crossMarkDisplay', value: 'cross' },
  { label: 'Boolean icon', labelKey: 'booleanIcon', value: 'booleanIcon' },
  { label: 'Compact pill', labelKey: 'compactPill', value: 'pill' },
];

const previewColors = {
  accent: { background: 'var(--ts-grid-accent-soft)', text: 'var(--ts-grid-accent-strong)' },
  info: { background: 'rgb(var(--color-info, 62 114 168) / 0.12)', text: 'var(--ts-grid-info)' },
  muted: { background: 'rgb(var(--color-text-muted, 98 86 73) / 0.12)', text: 'var(--ts-grid-text-muted)' },
  success: { background: 'rgb(var(--color-success, 47 143 99) / 0.12)', text: 'var(--ts-grid-success)' },
  warning: { background: 'rgb(var(--color-warning, 197 127 37) / 0.14)', text: 'var(--ts-grid-warning)' },
} as const;

type PreviewDecoration = keyof typeof previewColors;

interface SelectOption {
  label: string;
  labelKey?: string;
  value: string;
}

export interface GridTemplateEditorModalColumn {
  key: string;
  label: string;
}

export interface GridTemplateEditorModalProps {
  columns?: GridTemplateEditorModalColumn[];
  onAddRule?: () => void;
  onClose?: () => void;
  onDeleteRule?: (ruleId: string) => void;
  onReorderRules?: (activeRuleId: UniqueIdentifier, overRuleId: UniqueIdentifier) => void;
  onReset?: () => void;
  onUpdateRule?: (ruleId: string, patch: Partial<GridPresentationRule>) => void;
  open: boolean;
  rules?: GridPresentationRule[];
  getMessage?: (key: string, fallback?: string, values?: Record<string, unknown>) => string;
  ModalComponent?: ComponentType<GridModalProps>;
  EmptyState?: ComponentType<GridEmptyStateProps>;
}

interface ColorFieldProps {
  colorKey: 'backgroundColor' | 'textColor';
  label: string;
  onUpdateRule?: GridTemplateEditorModalProps['onUpdateRule'];
  ruleId: string;
  value?: string;
  getMessage: (key: string, fallback?: string, values?: Record<string, unknown>) => string;
}

interface RulePreviewProps {
  rule: GridPresentationRule;
  getMessage: (key: string, fallback?: string, values?: Record<string, unknown>) => string;
}

interface GridTemplateEditorDragHandleProps {
  attributes: DraggableAttributes;
  listeners: Record<string, unknown> | undefined;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
}

interface SortableRuleCardProps {
  children: ReactNode;
  ruleId: string;
}

interface RuleDragHandleProps {
  getMessage: (key: string, fallback?: string, values?: Record<string, unknown>) => string;
  ruleName: string;
}

function shouldShowValueInput(operator: string, target: string): boolean {
  return target !== 'header' && operator !== 'empty' && operator !== 'notEmpty';
}

function ColorField({ colorKey, getMessage, label, onUpdateRule, ruleId, value }: ColorFieldProps): ReactElement {
  const [pending, setPending] = useState<string | null>(null);

  if (pending !== null) {
    return (
      <div className="shared-grid-template-editor__color-field">
        <input
          aria-label={label}
          onChange={(e) => setPending(e.target.value)}
          type="color"
          value={pending}
        />
        <Button
          onClick={() => {
            onUpdateRule?.(ruleId, { [colorKey]: pending });
            setPending(null);
          }}
          size="small"
          type="primary"
        >
          {getMessage('ok')}
        </Button>
        <Button onClick={() => setPending(null)} size="small">
          {getMessage('cancel')}
        </Button>
      </div>
    );
  }

  if (!value) {
    return (
      <div className="shared-grid-template-editor__color-field">
        <Button onClick={() => setPending('#000000')} size="small">
          {getMessage('setAsCustom')}
        </Button>
      </div>
    );
  }

  return (
    <div className="shared-grid-template-editor__color-field">
      <input
        aria-label={label}
        onChange={(e) => onUpdateRule?.(ruleId, { [colorKey]: e.target.value })}
        type="color"
        value={value}
      />
      <Button onClick={() => onUpdateRule?.(ruleId, { [colorKey]: '' })}>{getMessage('autoLabel')}</Button>
    </div>
  );
}

function getOptionLabel(options: readonly SelectOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function getLocalizedOptions(
  options: readonly SelectOption[],
  getMessage: (key: string, fallback?: string, values?: Record<string, unknown>) => string,
): SelectOption[] {
  return options.map((option) => ({
    ...option,
    label: getMessage(option.labelKey ?? option.value, option.label),
  }));
}

function getRuleSummary(
  rule: GridPresentationRule,
  columnOptions: readonly SelectOption[],
  localizedTargetOptions: readonly SelectOption[],
  localizedOperatorOptions: readonly SelectOption[],
  getMessage: (key: string, fallback?: string, values?: Record<string, unknown>) => string,
): string {
  const target = getOptionLabel(localizedTargetOptions, rule.target);
  const field = getOptionLabel(columnOptions, rule.field);

  if (rule.target === 'header') {
    return getMessage('headerRuleSummary', undefined, { field, target });
  }

  const operator = getOptionLabel(localizedOperatorOptions, rule.operator).toLowerCase();
  const value = shouldShowValueInput(rule.operator, rule.target) ? ` "${rule.value || '...'}"` : '';

  return getMessage('ruleSummary', undefined, { field, operator, target, value });
}

type PreviewStyle = CSSProperties & { '--preview-accent'?: string };

function getPreviewStyle(rule: GridPresentationRule): PreviewStyle {
  const decoration = rule.decoration as PreviewDecoration | undefined;
  const fallback = (decoration && previewColors[decoration]) ?? previewColors.info;

  return {
    '--preview-accent': rule.textColor || fallback.text,
    background: rule.backgroundColor || fallback.background,
    color: rule.textColor || fallback.text,
  };
}

function RulePreview({ getMessage, rule }: RulePreviewProps): ReactElement {
  const cellDisplay = rule.cellDisplay ?? 'value';
  const previewText = rule.value || getMessage('example', 'Example');

  if (rule.target !== 'cell' || cellDisplay === 'value') {
    return (
      <div className="shared-grid-template-editor__preview-value" style={getPreviewStyle(rule)}>
        {previewText}
        {rule.target === 'cell' ? <span className="shared-grid-template-editor__preview-dot" /> : null}
      </div>
    );
  }

  if (cellDisplay === 'dot') {
    return <span className="shared-grid-template-editor__preview-dot shared-grid-template-editor__preview-dot--large" style={getPreviewStyle(rule)} />;
  }

  if (cellDisplay === 'pill') {
    return (
      <span className="shared-grid-template-editor__preview-pill" style={getPreviewStyle(rule)}>
        {previewText}
      </span>
    );
  }

  if (cellDisplay === 'booleanIcon') {
    return (
      <span className="shared-grid-template-editor__preview-mark" style={getPreviewStyle(rule)}>
        ✓ / ×
      </span>
    );
  }

  return (
    <span className="shared-grid-template-editor__preview-mark" style={getPreviewStyle(rule)}>
      {cellDisplay === 'cross' ? '×' : '✓'}
    </span>
  );
}

const DragHandleContext = createContext<GridTemplateEditorDragHandleProps | null>(null);

function RuleDragHandle({ getMessage, ruleName }: RuleDragHandleProps): ReactElement | null {
  const dragHandleProps = useContext(DragHandleContext);

  if (!dragHandleProps) {
    return null;
  }

  const { attributes, listeners, setActivatorNodeRef } = dragHandleProps;

  return (
    <Tooltip title={getMessage('dragRule')}>
      <button
        aria-label={getMessage('dragNamedRule', `Drag ${ruleName}`, { name: ruleName })}
        className="shared-grid-template-editor__drag-handle"
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
      >
        <HolderOutlined />
      </button>
    </Tooltip>
  );
}

function SortableRuleCard({ children, ruleId }: SortableRuleCardProps): ReactElement {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: ruleId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <DragHandleContext.Provider value={{ attributes, listeners, setActivatorNodeRef }}>
      <div
        className={isDragging ? 'shared-grid-template-editor__sortable--dragging' : ''}
        ref={setNodeRef}
        style={style}
      >
        {children}
      </div>
    </DragHandleContext.Provider>
  );
}

export function GridTemplateEditorModal({
  columns = [],
  EmptyState = GridEmptyState,
  getMessage = (key, fallback) => fallback ?? key,
  ModalComponent = GridModal,
  onAddRule,
  onClose,
  onDeleteRule,
  onReorderRules,
  onReset,
  onUpdateRule,
  open,
  rules = [],
}: GridTemplateEditorModalProps): ReactElement {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const columnOptions = columns.map((column) => ({
    label: column.label,
    value: column.key,
  }));
  const localizedTargetOptions = getLocalizedOptions(targetOptions, getMessage);
  const localizedOperatorOptions = getLocalizedOptions(operatorOptions, getMessage);
  const localizedDecorationOptions = getLocalizedOptions(decorationOptions, getMessage);
  const localizedCellDisplayOptions = getLocalizedOptions(cellDisplayOptions, getMessage);

  function handleDragEnd(event: DragEndEvent): void {
    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    onReorderRules?.(event.active.id, event.over.id);
  }

  return (
    <ModalComponent
      footer={null}
      onClose={onClose}
      open={open}
      className="shared-grid-modal"
      title={getMessage('editPresentation')}
      width={1080}
    >
      <Space className="shared-grid-modal__stack" direction="vertical" size={16}>
        <Alert
          icon={<InfoCircleOutlined />}
          message={getMessage('presentationEditorInfo')}
          showIcon
          type="info"
        />

        <div className="shared-grid-template-editor__toolbar">
          <Button icon={<PlusOutlined />} onClick={onAddRule} type="primary">
            {getMessage('addPresentationRule')}
          </Button>
          {onReset ? (
            <Button icon={<ReloadOutlined />} onClick={onReset}>
              {getMessage('restoreDefaults')}
            </Button>
          ) : null}
        </div>

        {rules.length > 0 ? (
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext items={rules.map((rule) => rule.id)} strategy={verticalListSortingStrategy}>
              <div className="shared-grid-template-editor__rules">
                {rules.map((rule) => {
                  const valueInputVisible = shouldShowValueInput(rule.operator, rule.target);

                  return (
                    <SortableRuleCard key={rule.id} ruleId={rule.id}>
                      <div className="shared-grid-template-editor__rule">
                        <div className="shared-grid-template-editor__rule-header">
                          <Switch
                            checked={rule.enabled}
                            onChange={(checked) => onUpdateRule?.(rule.id, { enabled: checked })}
                            size="small"
                          />
                          <Input
                            aria-label={getMessage('ruleName', undefined, { id: rule.id })}
                            onChange={(event) => onUpdateRule?.(rule.id, { name: event.target.value })}
                            value={rule.name}
                          />
                          <Tooltip title={getMessage('deleteRule', undefined, { name: rule.name })}>
                            <Button
                              aria-label={getMessage('deleteRule', undefined, { name: rule.name })}
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => onDeleteRule?.(rule.id)}
                              type="text"
                            />
                          </Tooltip>
                        </div>

                        <div className="shared-grid-template-editor__rule-body">
                          <div className="shared-grid-template-editor__sections">
                            <section className="shared-grid-template-editor__section">
                              <div className="shared-grid-template-editor__section-title">{getMessage('when')}</div>
                              <div className="shared-grid-template-editor__grid">
                                <label>
                                  <span>{getMessage('target')}</span>
                                  <Select
                                    onChange={(value) =>
                                      onUpdateRule?.(rule.id, {
                                        target: value,
                                        operator: value === 'header' ? 'equals' : rule.operator,
                                      })
                                    }
                                    options={localizedTargetOptions}
                                    value={rule.target}
                                  />
                                </label>

                                <label>
                                  <span>{getMessage('field')}</span>
                                  <Select
                                    onChange={(value) => onUpdateRule?.(rule.id, { field: value })}
                                    options={columnOptions}
                                    value={rule.field}
                                  />
                                </label>

                                <label>
                                  <span>{getMessage('operator')}</span>
                                  <Select
                                    disabled={rule.target === 'header'}
                                    onChange={(value) => onUpdateRule?.(rule.id, { operator: value })}
                                    options={localizedOperatorOptions}
                                    value={rule.operator}
                                  />
                                </label>

                                {valueInputVisible ? (
                                  <label>
                                    <span>{getMessage('value')}</span>
                                    <Input
                                      onChange={(event) => onUpdateRule?.(rule.id, { value: event.target.value })}
                                      value={rule.value}
                                    />
                                  </label>
                                ) : null}
                              </div>
                            </section>

                            <section className="shared-grid-template-editor__section">
                              <div className="shared-grid-template-editor__section-title">{getMessage('style')}</div>
                              <div className="shared-grid-template-editor__grid">
                                <label>
                                  <span>{getMessage('preset')}</span>
                                  <Select
                                    onChange={(value) => onUpdateRule?.(rule.id, { decoration: value })}
                                    options={localizedDecorationOptions}
                                    value={rule.decoration}
                                  />
                                </label>

                                <label>
                                  <span>{getMessage('text')}</span>
                                  <ColorField
                                    colorKey="textColor"
                                    getMessage={getMessage}
                                    label={getMessage('text')}
                                    onUpdateRule={onUpdateRule}
                                    ruleId={rule.id}
                                    value={rule.textColor}
                                  />
                                </label>

                                <label>
                                  <span>{getMessage('background')}</span>
                                  <ColorField
                                    colorKey="backgroundColor"
                                    getMessage={getMessage}
                                    label={getMessage('background')}
                                    onUpdateRule={onUpdateRule}
                                    ruleId={rule.id}
                                    value={rule.backgroundColor}
                                  />
                                </label>

                                {rule.target === 'cell' ? (
                                  <label>
                                    <span>{getMessage('display')}</span>
                                    <Select
                                      onChange={(value) => onUpdateRule?.(rule.id, { cellDisplay: value })}
                                      options={localizedCellDisplayOptions}
                                      value={rule.cellDisplay}
                                    />
                                  </label>
                                ) : null}
                              </div>
                            </section>
                          </div>

                          <aside className="shared-grid-template-editor__preview">
                            <div className="shared-grid-template-editor__section-title">{getMessage('preview')}</div>
                            <div className="shared-grid-template-editor__preview-box">
                              <RulePreview getMessage={getMessage} rule={rule} />
                            </div>
                          </aside>
                        </div>
                        <div className="shared-grid-template-editor__rule-footer">
                          <div className="shared-grid-template-editor__summary">
                            {getRuleSummary(
                              rule,
                              columnOptions,
                              localizedTargetOptions,
                              localizedOperatorOptions,
                              getMessage,
                            )}
                          </div>
                          <RuleDragHandle getMessage={getMessage} ruleName={rule.name} />
                        </div>
                      </div>
                    </SortableRuleCard>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <EmptyState description={getMessage('noPresentationRules')} />
        )}
      </Space>
    </ModalComponent>
  );
}
