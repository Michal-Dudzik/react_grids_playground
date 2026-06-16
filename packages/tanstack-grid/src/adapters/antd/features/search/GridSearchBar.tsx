import { Input } from 'antd';

export interface GridSearchBarProps {
  inputValue?: string;
  isSearching?: boolean;
  onClear?: () => void;
  onInputChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
}

export function GridSearchBar({
  inputValue = '',
  onInputChange,
  onSearch,
  onClear,
  isSearching = false,
  placeholder = 'Search',
}: GridSearchBarProps) {
  return (
    <Input.Search
      allowClear
      className="shared-grid-search"
      enterButton
      loading={isSearching}
      onChange={(event) => onInputChange?.(event.target.value)}
      onClear={onClear}
      onSearch={(value, _event, info) => info?.source !== 'clear' && onSearch?.(value)}
      placeholder={placeholder}
      value={inputValue}
    />
  );
}
