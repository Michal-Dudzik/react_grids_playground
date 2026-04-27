import { Button, Divider, Pagination, Select, Space, Tooltip } from 'antd';
import { GridSearchBar } from './GridSearchBar';

function GridFooterAction({ action }) {
  if (action.isCustomComponent && action.component) {
    return <div className="shared-grid-footer__custom-action">{action.component}</div>;
  }

  const hasIcon = action.icon !== undefined && action.icon !== null;

  return (
    <Tooltip title={action.title}>
      <Button
        className={action.className}
        disabled={action.disabled || action.loading}
        icon={hasIcon ? action.icon : null}
        loading={action.loading}
        onClick={action.onClick}
        type={action.className?.includes('active') ? 'primary' : 'text'}
      >
        {hasIcon ? null : action.label}
      </Button>
    </Tooltip>
  );
}

export function GridFooter({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  total = 0,
  pageSizeOptions = [],
  onPageChange,
  onPreviousPage,
  onNextPage,
  onPageSizeChange,
  pageSizeDisabled = false,
  searchProps,
  buttons = [],
  hidePageCount = false,
  disablePaging = false,
  attached = false,
}) {
  return (
    <div className={`shared-grid-footer ${attached ? 'shared-grid-footer--attached' : ''}`.trim()}>
      <div className="shared-grid-footer__section shared-grid-footer__section--start">
        {searchProps ? <GridSearchBar {...searchProps} /> : null}
      </div>

      <div className="shared-grid-footer__section shared-grid-footer__section--center">
        {!disablePaging ? (
          <Pagination
            className="shared-grid-footer__pagination"
            current={currentPage}
            onChange={(page) => {
              if (onPageChange) {
                onPageChange(page);
                return;
              }

              if (page < currentPage) {
                onPreviousPage?.();
              }

              if (page > currentPage) {
                onNextPage?.();
              }
            }}
            pageSize={pageSize}
            showSizeChanger={false}
            simple
            total={Math.max(total, totalPages * pageSize)}
          />
        ) : (
          <span className="shared-grid-footer__page-indicator">Showing all {total} rows</span>
        )}
      </div>

      <div className="shared-grid-footer__section shared-grid-footer__section--end">
        {!hidePageCount && !disablePaging ? (
          <label className="shared-grid-footer__page-size" htmlFor="shared-grid-footer-page-size">
            <span>Rows</span>
            <Select
              disabled={pageSizeDisabled}
              id="shared-grid-footer-page-size"
              onChange={(value) => onPageSizeChange?.(value)}
              options={pageSizeOptions.map((size) => ({
                label: size,
                value: size,
              }))}
              size="middle"
              value={pageSize}
            />
          </label>
        ) : null}

        {buttons.length > 0 ? <Divider className="shared-grid-footer__divider" orientation="vertical" /> : null}

        {buttons.length > 0 ? (
          <Space className="shared-grid-footer__actions" size={8}>
            {buttons.map((action, index) => (
              <GridFooterAction action={action} key={action.key ?? index} />
            ))}
          </Space>
        ) : null}
      </div>
    </div>
  );
}
