import { Button, Modal } from 'antd';

export default function BaseModal({
  children,
  customFooter,
  maxBodyHeight,
  onClose,
  onSubmit,
  showCancel = true,
  showSubmit = true,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  title,
  visible,
  width,
}) {
  const defaultFooter = [
    showCancel && (
      <Button
        key="cancel"
        onClick={onClose}
      >
        {cancelLabel}
      </Button>
    ),
    showSubmit && (
      <Button
        key="submit"
        onClick={onSubmit}
        type="primary"
      >
        {submitLabel}
      </Button>
    ),
  ].filter(Boolean);

  return (
    <Modal
      destroyOnHidden
      footer={customFooter ?? defaultFooter}
      onCancel={onClose}
      open={visible}
      title={title}
      width={width}
    >
      <div style={{ maxHeight: maxBodyHeight, overflowY: maxBodyHeight ? 'auto' : undefined }}>
        {children}
      </div>
    </Modal>
  );
}
