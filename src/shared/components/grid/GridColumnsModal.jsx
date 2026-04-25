import { ArrowDownOutlined, ArrowUpOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Checkbox, InputNumber, Modal, Space, Tooltip } from 'antd';

export function GridColumnsModal({
  columns = [],
  description,
  onClose,
  onReset,
  open,
  title = 'Edit columns',
}) {
  return (
    <Modal footer={null} onCancel={onClose} open={open} title={title}>
      <Space className="shared-grid-modal__stack" orientation="vertical" size={12}>
        {description ? <p className="shared-grid-modal__description">{description}</p> : null}
        {columns.map((column) => (
          <div className="shared-grid-columns-modal__row" key={column.key}>
            <Checkbox
              checked={column.checked}
              disabled={column.disabled}
              onChange={(event) => column.onChange?.(event.target.checked)}
            >
              {column.label}
            </Checkbox>

            <div className="shared-grid-columns-modal__controls">
              {column.width !== undefined ? (
                <label className="shared-grid-columns-modal__width">
                  <span>Width</span>
                  <InputNumber
                    addonAfter="px"
                    disabled={column.widthDisabled}
                    min={column.minWidth ?? 80}
                    onChange={(value) => column.onWidthChange?.(value)}
                    size="small"
                    value={column.width}
                  />
                </label>
              ) : null}

              {column.onMoveUp || column.onMoveDown ? (
                <Space size={4}>
                  <Tooltip title="Move up">
                    <Button
                      aria-label={`Move ${column.label} up`}
                      disabled={!column.canMoveUp}
                      icon={<ArrowUpOutlined />}
                      onClick={column.onMoveUp}
                      size="small"
                      type="text"
                    />
                  </Tooltip>
                  <Tooltip title="Move down">
                    <Button
                      aria-label={`Move ${column.label} down`}
                      disabled={!column.canMoveDown}
                      icon={<ArrowDownOutlined />}
                      onClick={column.onMoveDown}
                      size="small"
                      type="text"
                    />
                  </Tooltip>
                </Space>
              ) : null}
            </div>
          </div>
        ))}

        {onReset ? (
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            Reset defaults
          </Button>
        ) : null}
      </Space>
    </Modal>
  );
}
