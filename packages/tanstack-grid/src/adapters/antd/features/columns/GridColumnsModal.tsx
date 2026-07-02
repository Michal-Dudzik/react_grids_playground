import { HolderOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Checkbox, InputNumber, Space, Tooltip } from 'antd';
import type { DragEndEvent, DraggableAttributes, UniqueIdentifier } from '@dnd-kit/core';
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
import clsx from 'clsx';
import type { ComponentType, ReactElement } from 'react';
import { GridModal } from '../../../../components/GridComponents';
import { MIN_COLUMN_WIDTH } from '../../../../core/tableConfig';
import type { GridModalProps } from '../../../../types';

export interface GridColumnsModalColumn {
  key: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  minWidth?: number;
  onChange?: (checked: boolean) => void;
  onWidthChange?: (width: number | null) => void;
  width?: number;
  widthDisabled?: boolean;
}

interface GridColumnsModalDragHandleProps {
  attributes: DraggableAttributes;
  listeners: Record<string, unknown> | undefined;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
}

interface GridColumnsModalRowProps {
  column: GridColumnsModalColumn;
  dragHandleProps?: GridColumnsModalDragHandleProps;
  getMessage: (key: string, fallback?: string, values?: Record<string, unknown>) => string;
}

interface SortableGridColumnsModalRowProps {
  column: GridColumnsModalColumn;
  getMessage: (key: string, fallback?: string, values?: Record<string, unknown>) => string;
}

export interface GridColumnsModalProps {
  columns?: GridColumnsModalColumn[];
  description?: string;
  error?: string;
  getMessage?: (key: string, fallback?: string, values?: Record<string, unknown>) => string;
  isSaving?: boolean;
  ModalComponent?: ComponentType<GridModalProps>;
  onClose?: () => void;
  onReorderColumns?: (activeColumnId: UniqueIdentifier, overColumnId: UniqueIdentifier) => void;
  onReset?: () => void;
  onSave?: () => void;
  open: boolean;
  title?: string;
}

function GridColumnsModalRow({ column, dragHandleProps, getMessage }: GridColumnsModalRowProps): ReactElement {
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
            <span>{getMessage('width', 'Width')}</span>
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
          <Tooltip title={getMessage('dragColumn', 'Drag column')}>
            <Button
              aria-label={getMessage('dragNamedColumn', `Drag ${column.label}`, { label: column.label })}
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

function SortableGridColumnsModalRow({ column, getMessage }: SortableGridColumnsModalRowProps): ReactElement {
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
      className={clsx('shared-grid-columns-modal__row', {
        'shared-grid-columns-modal__row--dragging': isDragging,
      })}
      ref={setNodeRef}
      style={style}
    >
      <GridColumnsModalRow
        column={column}
        getMessage={getMessage}
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
  getMessage = (key, fallback) => fallback ?? key,
  isSaving = false,
  ModalComponent = GridModal,
  onClose,
  onReorderColumns,
  onReset,
  onSave,
  open,
  title,
}: GridColumnsModalProps): ReactElement {
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

  function handleDragEnd(event: DragEndEvent): void {
    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    onReorderColumns?.(event.active.id, event.over.id);
  }

  function handleCancel(): void {
    onClose?.();
  }

  function handleSave(): void {
    if (onSave) {
      onSave();
      return;
    }

    onClose?.();
  }

  return (
    <ModalComponent
      centered
      footer={
        <div className="shared-grid-columns-modal__footer">
          <div className="shared-grid-columns-modal__footer-start">
            {onReset ? (
              <Button disabled={isSaving} icon={<ReloadOutlined />} onClick={onReset}>
                {getMessage('resetDefaults', 'Reset to defaults')}
              </Button>
            ) : null}
          </div>
          <Space size={8}>
            <Button disabled={isSaving} onClick={handleCancel}>
              {getMessage('cancel', 'Cancel')}
            </Button>
            <Button loading={isSaving} onClick={handleSave} type="primary">
              {getMessage('save', 'Save')}
            </Button>
          </Space>
        </div>
      }
      onClose={handleCancel}
      open={open}
      title={title ?? getMessage('columnSettings', 'Column settings')}
    >
      <Space className="shared-grid-modal__stack" direction="vertical" size={12}>
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
                <SortableGridColumnsModalRow column={column} getMessage={getMessage} key={column.key} />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          columns.map((column) => (
            <div className="shared-grid-columns-modal__row" key={column.key}>
              <GridColumnsModalRow column={column} getMessage={getMessage} />
            </div>
          ))
        )}
      </Space>
    </ModalComponent>
  );
}
