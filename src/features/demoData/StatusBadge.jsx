export function StatusBadge({ value }) {
  return <span className={`status-badge status-badge--${value.toLowerCase()}`}>{value}</span>;
}
