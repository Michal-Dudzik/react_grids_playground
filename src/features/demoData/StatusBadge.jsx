export function StatusBadge({ value, children }) {
  return <span className={`status-badge status-badge--${value.toLowerCase()}`}>{children ?? value}</span>;
}
