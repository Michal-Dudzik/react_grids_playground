import { Button, Divider, Pagination, Select, Space, Tooltip } from 'antd';
import type { ButtonProps } from 'antd';
import type { ReactNode } from 'react';
import { GridSearchBar, type GridSearchBarProps } from '../search/GridSearchBar';

export interface GridFooterButtonAction {
  key?: string;
  className?: string;
  component?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  isCustomComponent?: boolean;
  label?: string;
  loading?: boolean;
  onClick?: () => void;
  title?: string;
  type?: ButtonProps['type'];
}

export type GridFooterSearchProps = GridSearchBarProps;

export interface GridFooterProps {
  attached?: boolean;
  buttons?: GridFooterButtonAction[];
  currentPage?: number;
  disablePaging?: boolean;
  hidePageCount?: boolean;
  hidePageSizeSelector?: boolean;
  getMessage?: (key: string, fallback?: string, values?: Record<string, unknown>) => string;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSize?: number;
  pageSizeDisabled?: boolean;
  pageSizeOptions?: number[];
  searchProps?: GridFooterSearchProps;
  total?: number;
  totalPages?: number;
  rowsLabel?: string;
}

interface GridFooterActionProps {
  action: GridFooterButtonAction;
}

function GridFooterAction({ action }: GridFooterActionProps) {
  if (action.isCustomComponent && action.component) {
    const customAction = <div className="shared-grid-footer__custom-action">{action.component}</div>;

    return action.title ? <Tooltip title={action.title}>{customAction}</Tooltip> : customAction;
  }

  const hasIcon = action.icon !== undefined && action.icon !== null;

  return (
    <Tooltip title={action.title}>
      <Button
        aria-label={action.title ?? action.label}
        className={action.className}
        disabled={action.disabled || action.loading}
        icon={hasIcon ? action.icon : null}
        loading={action.loading}
        onClick={action.onClick}
        title={action.title ?? action.label}
        type={action.type ?? 'text'}
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
  onPageSizeChange,
  pageSizeDisabled = false,
  searchProps,
  buttons = [],
  hidePageCount = false,
  hidePageSizeSelector = false,
  getMessage = (key, fallback) => fallback ?? key,
  disablePaging = false,
  attached = false,
  rowsLabel = 'Rows',
}: GridFooterProps) {
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
            disabled={!onPageChange}
            onChange={(page) => onPageChange(page)}
            pageSize={pageSize}
            showSizeChanger={false}
            size="small"
            simple
            total={Math.max(total, totalPages * pageSize)}
          />
        ) : (
          <span className="shared-grid-footer__page-indicator">
            {getMessage('showingAllRows', `Showing all ${total} ${rowsLabel.toLowerCase()}`, {
              rows: rowsLabel.toLowerCase(),
              total,
            })}
          </span>
        )}
      </div>

      <div className="shared-grid-footer__section shared-grid-footer__section--end">
        {!hidePageCount && !hidePageSizeSelector && !disablePaging ? (
          <label className="shared-grid-footer__page-size" htmlFor="shared-grid-footer-page-size">
            <span>{rowsLabel}</span>
            <Select
              disabled={pageSizeDisabled}
              id="shared-grid-footer-page-size"
              onChange={(value) => onPageSizeChange?.(value)}
              options={pageSizeOptions.map((size) => ({
                label: size,
                value: size,
              }))}
              size="small"
              value={pageSize}
            />
          </label>
        ) : null}

        {buttons.length > 0 ? <Divider className="shared-grid-footer__divider" type="vertical" /> : null}

        {buttons.length > 0 ? (
          <Space className="shared-grid-footer__actions" size={8}>
            {buttons.map((action) => {
              if (process.env.NODE_ENV !== 'production' && !action.key) {
                console.warn('[GridFooter] Footer action is missing a stable `key` property.', action);
              }
              return <GridFooterAction action={action} key={action.key} />;
            })}
          </Space>
        ) : null}
      </div>
    </div>
  );
}
