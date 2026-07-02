import { Alert, Empty, Modal, Spin } from 'antd';
import type {
  GridEmptyStateProps,
  GridErrorPanelProps,
  GridLoadingOverlayProps,
  GridModalProps,
  GridSpinnerProps,
} from '../types';

export function GridSpinner({ label, size = 'default' }: GridSpinnerProps) {
  return <Spin size={size} tip={label} />;
}

export function GridLoadingOverlay({ label, Spinner = GridSpinner }: GridLoadingOverlayProps) {
  return (
    <div className="tanstack-grid__loading-overlay" role="status">
      <Spinner label={label} />
    </div>
  );
}

export function GridModal({
  centered = false,
  children,
  className = 'shared-grid-modal',
  footer,
  onClose,
  open,
  title,
  width,
}: GridModalProps) {
  return (
    <Modal
      centered={centered}
      footer={footer}
      onCancel={onClose}
      open={open}
      rootClassName={className}
      title={title}
      width={width}
    >
      {children}
    </Modal>
  );
}

export function GridErrorPanel({ className, description, message, type = 'error' }: GridErrorPanelProps) {
  return <Alert className={className} description={description} message={message} showIcon type={type} />;
}

export function GridEmptyState({ description }: GridEmptyStateProps) {
  return <Empty description={description} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
}

export const defaultGridComponents = {
  EmptyState: GridEmptyState,
  ErrorPanel: GridErrorPanel,
  LoadingOverlay: GridLoadingOverlay,
  Modal: GridModal,
  Spinner: GridSpinner,
};
