import { Space, Tag } from 'antd';

export function GridSummaryBar({ items = [] }) {
  return (
    <div className="shared-grid-summary-bar">
      <Space size={[8, 8]} wrap>
        {items.map((item) => (
          <Tag bordered={false} className="shared-grid-summary-bar__tag" key={item.label}>
            <strong>{item.label}:</strong> {item.value}
          </Tag>
        ))}
      </Space>
    </div>
  );
}
