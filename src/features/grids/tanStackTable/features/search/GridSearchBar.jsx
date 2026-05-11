import { Input } from 'antd';

export function GridSearchBar({
  inputValue = '',
  onInputChange,
  onSearch,
  onClear,
  isSearching = false,
  placeholder = 'Search',
}) {
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
