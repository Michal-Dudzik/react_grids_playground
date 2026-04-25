import { DeleteOutlined, HolderOutlined, InfoCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Input, Modal, Select, Space, Switch, Tooltip } from 'antd';
import { createContext, useContext } from 'react';
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

function shouldShowValueInput(operator, target) {
  return target !== 'header' && operator !== 'empty' && operator !== 'notEmpty';
}

function normalizeColor(value) {
  return value || '#000000';
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
    <Modal footer={null} onCancel={onClose} open={open} title="Presentation settings" width={820}>
      <Space className="shared-grid-modal__stack" orientation="vertical" size={16}>
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
                            aria-label="Rule name"
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

                          <label>
                            <span>Decoration</span>
                            <Select
                              onChange={(value) => onUpdateRule?.(rule.id, { decoration: value })}
                              options={decorationOptions}
                              value={rule.decoration}
                            />
                          </label>

                          <label>
                            <span>Text color</span>
                            <div className="shared-grid-template-editor__color-field">
                              <input
                                aria-label="Text color"
                                onChange={(event) => onUpdateRule?.(rule.id, { textColor: event.target.value })}
                                type="color"
                                value={normalizeColor(rule.textColor)}
                              />
                              <Button
                                disabled={!rule.textColor}
                                onClick={() => onUpdateRule?.(rule.id, { textColor: '' })}
                              >
                                Clear
                              </Button>
                            </div>
                          </label>

                          <label>
                            <span>Background</span>
                            <div className="shared-grid-template-editor__color-field">
                              <input
                                aria-label="Background color"
                                onChange={(event) => onUpdateRule?.(rule.id, { backgroundColor: event.target.value })}
                                type="color"
                                value={normalizeColor(rule.backgroundColor)}
                              />
                              <Button
                                disabled={!rule.backgroundColor}
                                onClick={() => onUpdateRule?.(rule.id, { backgroundColor: '' })}
                              >
                                Clear
                              </Button>
                            </div>
                          </label>

                          {rule.target === 'cell' ? (
                            <label>
                              <span>Cell display</span>
                              <Select
                                onChange={(value) => onUpdateRule?.(rule.id, { cellDisplay: value })}
                                options={cellDisplayOptions}
                                value={rule.cellDisplay}
                              />
                            </label>
                          ) : null}
                        </div>
                        <div className="shared-grid-template-editor__rule-footer">
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
