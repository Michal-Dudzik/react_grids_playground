import { Space, Tag } from 'antd';

export interface GridSummaryBarItem {
  key?: string;
  label: string;
  value: string | number;
}

export interface GridSummaryBarProps {
  items?: GridSummaryBarItem[];
}

export function GridSummaryBar({ items = [] }: GridSummaryBarProps) {
  return (
    <div className="shared-grid-summary-bar">
      <Space size={[8, 8]} wrap>
        {items.map((item) => (
          <Tag variant="filled" className="shared-grid-summary-bar__tag" key={item.key ?? item.label}>
            <strong>{item.label}:</strong> {item.value}
          </Tag>
        ))}
      </Space>
    </div>
  );
}
