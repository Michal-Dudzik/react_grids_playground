import { Input } from 'antd';

export function GridSearchBar({
  inputValue,
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
      enterButton="Search"
      loading={isSearching}
      onChange={(event) => onInputChange?.(event.target.value)}
      onClear={onClear}
      onSearch={(value) => onSearch?.(value)}
      placeholder={placeholder}
      value={inputValue}
    />
  );
}
