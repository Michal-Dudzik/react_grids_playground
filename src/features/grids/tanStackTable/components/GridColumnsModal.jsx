import { HolderOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Checkbox, InputNumber, Modal, Space, Tooltip } from 'antd';
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
import { MIN_COLUMN_WIDTH } from '../lib/tableConfig';

function GridColumnsModalRow({ column, dragHandleProps }) {
  return (
    <>
      <div className="shared-grid-columns-modal__identity">
        <Checkbox
          checked={column.checked}
          disabled={column.disabled}
          onChange={(event) => column.onChange?.(event.target.checked)}
        >
          {column.label}
        </Checkbox>
      </div>

      <div className="shared-grid-columns-modal__controls">
        {column.width !== undefined ? (
          <label className="shared-grid-columns-modal__width">
            <span>Width</span>
            <InputNumber
              addonAfter="px"
              disabled={column.widthDisabled}
              min={column.minWidth ?? MIN_COLUMN_WIDTH}
              onChange={(value) => column.onWidthChange?.(value)}
              precision={0}
              size="small"
              step={1}
              value={column.width}
            />
          </label>
        ) : null}

        {dragHandleProps ? (
          <Tooltip title="Drag column">
            <Button
              aria-label={`Drag ${column.label}`}
              className="shared-grid-columns-modal__drag-handle"
              icon={<HolderOutlined />}
              size="small"
              type="text"
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
              ref={dragHandleProps.setActivatorNodeRef}
            />
          </Tooltip>
        ) : null}
      </div>
    </>
  );
}

function SortableGridColumnsModalRow({ column }) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={`shared-grid-columns-modal__row ${
        isDragging ? 'shared-grid-columns-modal__row--dragging' : ''
      }`.trim()}
      ref={setNodeRef}
      style={style}
    >
      <GridColumnsModalRow
        column={column}
        dragHandleProps={{
          attributes,
          listeners,
          setActivatorNodeRef,
        }}
      />
    </div>
  );
}

export function GridColumnsModal({
  columns = [],
  description,
  error,
  isSaving = false,
  onClose,
  onReorderColumns,
  onReset,
  onSave,
  open,
  title = 'Edit columns',
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

  function handleDragEnd(event) {
    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    onReorderColumns?.(event.active.id, event.over.id);
  }

  const rows = columns.map((column) => (
    <div className="shared-grid-columns-modal__row" key={column.key}>
      <GridColumnsModalRow column={column} />
    </div>
  ));

  function handleCancel() {
    onClose?.();
  }

  function handleSave() {
    if (onSave) {
      onSave();
      return;
    }

    onClose?.();
  }

  return (
    <Modal
      centered
      footer={
        <div className="shared-grid-columns-modal__footer">
          <div className="shared-grid-columns-modal__footer-start">
            {onReset ? (
              <Button disabled={isSaving} icon={<ReloadOutlined />} onClick={onReset}>
                Reset defaults
              </Button>
            ) : null}
          </div>
          <Space size={8}>
            <Button disabled={isSaving} onClick={handleCancel}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSave} type="primary">
              Save
            </Button>
          </Space>
        </div>
      }
      onCancel={handleCancel}
      open={open}
      title={title}
    >
      <Space className="shared-grid-modal__stack" orientation="vertical" size={12}>
        {description ? <p className="shared-grid-modal__description">{description}</p> : null}
        {error ? <p className="shared-grid-modal__error">{error}</p> : null}
        {onReorderColumns ? (
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext items={columns.map((column) => column.key)} strategy={verticalListSortingStrategy}>
              {columns.map((column) => (
                <SortableGridColumnsModalRow column={column} key={column.key} />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          rows
        )}
      </Space>
    </Modal>
  );
}
