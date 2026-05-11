import { DeleteOutlined, HolderOutlined, InfoCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Input, Modal, Select, Space, Switch, Tooltip } from 'antd';
import { createContext, useContext, useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

const targetOptions = [
  { label: 'Cell', value: 'cell' },
  { label: 'Row', value: 'row' },
  { label: 'Header', value: 'header' },
];

const operatorOptions = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not equals', value: 'notEquals' },
  { label: 'Starts with', value: 'startsWith' },
  { label: 'Ends with', value: 'endsWith' },
  { label: 'Greater than', value: 'greaterThan' },
  { label: 'Less than', value: 'lessThan' },
  { label: 'Is empty', value: 'empty' },
  { label: 'Is not empty', value: 'notEmpty' },
];

const decorationOptions = [
  { label: 'Success', value: 'success' },
  { label: 'Warning', value: 'warning' },
  { label: 'Info', value: 'info' },
  { label: 'Accent', value: 'accent' },
  { label: 'Muted', value: 'muted' },
];

const cellDisplayOptions = [
  { label: 'Keep value', value: 'value' },
  { label: 'Colored dot', value: 'dot' },
  { label: 'Check mark', value: 'check' },
  { label: 'Cross mark', value: 'cross' },
  { label: 'Boolean icon', value: 'booleanIcon' },
  { label: 'Compact pill', value: 'pill' },
];

const previewColors = {
  accent: { background: 'rgba(182, 84, 60, 0.14)', text: '#8f3d29' },
  info: { background: 'rgba(62, 114, 168, 0.12)', text: '#3e72a8' },
  muted: { background: 'rgba(98, 86, 73, 0.12)', text: '#625649' },
  success: { background: 'rgba(47, 143, 99, 0.12)', text: '#2f8f63' },
  warning: { background: 'rgba(197, 127, 37, 0.14)', text: '#8a5a12' },
};

function shouldShowValueInput(operator, target) {
  return target !== 'header' && operator !== 'empty' && operator !== 'notEmpty';
}

function ColorField({ colorKey, label, onUpdateRule, ruleId, value }) {
  const [pending, setPending] = useState(null);

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
          OK
        </Button>
        <Button onClick={() => setPending(null)} size="small">
          Cancel
        </Button>
      </div>
    );
  }

  if (!value) {
    return (
      <div className="shared-grid-template-editor__color-field">
        <Button onClick={() => setPending('#000000')} size="small">
          Set custom
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
      <Button onClick={() => onUpdateRule?.(ruleId, { [colorKey]: '' })}>Auto</Button>
    </div>
  );
}

function getOptionLabel(options, value) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function getRuleSummary(rule, columnOptions) {
  const target = getOptionLabel(targetOptions, rule.target);
  const field = getOptionLabel(columnOptions, rule.field);

  if (rule.target === 'header') {
    return `${target} for ${field}`;
  }

  const operator = getOptionLabel(operatorOptions, rule.operator).toLowerCase();
  const value = shouldShowValueInput(rule.operator, rule.target) ? ` "${rule.value || '...'}"` : '';

  return `${target} when ${field} ${operator}${value}`;
}

function getPreviewStyle(rule) {
  const fallback = previewColors[rule.decoration] ?? previewColors.info;

  return {
    '--preview-accent': rule.textColor || fallback.text,
    background: rule.backgroundColor || fallback.background,
    color: rule.textColor || fallback.text,
  };
}

function RulePreview({ rule }) {
  const cellDisplay = rule.cellDisplay ?? 'value';
  const previewText = rule.value || 'Example';

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

const DragHandleContext = createContext(null);

function RuleDragHandle({ ruleName }) {
  const dragHandleProps = useContext(DragHandleContext);

  if (!dragHandleProps) {
    return null;
  }

  const { attributes, listeners, setActivatorNodeRef } = dragHandleProps;

  return (
    <Tooltip title="Drag rule">
      <button
        aria-label={`Drag ${ruleName}`}
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

function SortableRuleCard({ children, ruleId }) {
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
  onAddRule,
  onClose,
  onDeleteRule,
  onReorderRules,
  onReset,
  onUpdateRule,
  open,
  rules = [],
}) {
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

  function handleDragEnd(event) {
    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    onReorderRules?.(event.active.id, event.over.id);
  }

  return (
    <Modal footer={null} onCancel={onClose} open={open} title="Presentation settings" width={1080}>
      <Space className="shared-grid-modal__stack" direction="vertical" size={16}>
        <Alert
          icon={<InfoCircleOutlined />}
          message="Rules run from top to bottom. Drag cards to change which matching rule wins first."
          showIcon
          type="info"
        />

        <div className="shared-grid-template-editor__toolbar">
          <Button icon={<PlusOutlined />} onClick={onAddRule} type="primary">
            Add rule
          </Button>
          {onReset ? (
            <Button icon={<ReloadOutlined />} onClick={onReset}>
              Restore defaults
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
                            aria-label={`Rule name ${rule.id}`}
                            onChange={(event) => onUpdateRule?.(rule.id, { name: event.target.value })}
                            value={rule.name}
                          />
                          <Tooltip title="Delete rule">
                            <Button
                              aria-label={`Delete ${rule.name}`}
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
                              <div className="shared-grid-template-editor__section-title">When</div>
                              <div className="shared-grid-template-editor__grid">
                                <label>
                                  <span>Target</span>
                                  <Select
                                    onChange={(value) =>
                                      onUpdateRule?.(rule.id, {
                                        target: value,
                                        operator: value === 'header' ? 'equals' : rule.operator,
                                      })
                                    }
                                    options={targetOptions}
                                    value={rule.target}
                                  />
                                </label>

                                <label>
                                  <span>Field</span>
                                  <Select
                                    onChange={(value) => onUpdateRule?.(rule.id, { field: value })}
                                    options={columnOptions}
                                    value={rule.field}
                                  />
                                </label>

                                <label>
                                  <span>Operator</span>
                                  <Select
                                    disabled={rule.target === 'header'}
                                    onChange={(value) => onUpdateRule?.(rule.id, { operator: value })}
                                    options={operatorOptions}
                                    value={rule.operator}
                                  />
                                </label>

                                {valueInputVisible ? (
                                  <label>
                                    <span>Value</span>
                                    <Input
                                      onChange={(event) => onUpdateRule?.(rule.id, { value: event.target.value })}
                                      value={rule.value}
                                    />
                                  </label>
                                ) : null}
                              </div>
                            </section>

                            <section className="shared-grid-template-editor__section">
                              <div className="shared-grid-template-editor__section-title">Style</div>
                              <div className="shared-grid-template-editor__grid">
                                <label>
                                  <span>Preset</span>
                                  <Select
                                    onChange={(value) => onUpdateRule?.(rule.id, { decoration: value })}
                                    options={decorationOptions}
                                    value={rule.decoration}
                                  />
                                </label>

                                <label>
                                  <span>Text</span>
                                  <ColorField
                                    colorKey="textColor"
                                    label="Text color"
                                    onUpdateRule={onUpdateRule}
                                    ruleId={rule.id}
                                    value={rule.textColor}
                                  />
                                </label>

                                <label>
                                  <span>Background</span>
                                  <ColorField
                                    colorKey="backgroundColor"
                                    label="Background color"
                                    onUpdateRule={onUpdateRule}
                                    ruleId={rule.id}
                                    value={rule.backgroundColor}
                                  />
                                </label>

                                {rule.target === 'cell' ? (
                                  <label>
                                    <span>Display</span>
                                    <Select
                                      onChange={(value) => onUpdateRule?.(rule.id, { cellDisplay: value })}
                                      options={cellDisplayOptions}
                                      value={rule.cellDisplay}
                                    />
                                  </label>
                                ) : null}
                              </div>
                            </section>
                          </div>

                          <aside className="shared-grid-template-editor__preview">
                            <div className="shared-grid-template-editor__section-title">Preview</div>
                            <div className="shared-grid-template-editor__preview-box">
                              <RulePreview rule={rule} />
                            </div>
                          </aside>
                        </div>
                        <div className="shared-grid-template-editor__rule-footer">
                          <div className="shared-grid-template-editor__summary">
                            {getRuleSummary(rule, columnOptions)}
                          </div>
                          <RuleDragHandle ruleName={rule.name} />
                        </div>
                      </div>
                    </SortableRuleCard>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <Empty description="No presentation rules configured." image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Space>
    </Modal>
  );
}
