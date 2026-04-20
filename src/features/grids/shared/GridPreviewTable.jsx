import { getDemoRows } from '../../demoData';
import { StatusBadge } from '../../demoData/StatusBadge';

export function GridPreviewTable() {
  const rows = getDemoRows();

  return (
    <div className="grid-preview">
      <div className="grid-preview__toolbar">
        <div className="grid-preview__search">Search, filters and bulk actions will sit here</div>
        <div className="grid-preview__metrics">
          <span>Rows: {rows.length}</span>
          <span>Selection: disabled</span>
        </div>
      </div>
      <div className="grid-preview__table-wrap">
        <table className="grid-preview__table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Owner</th>
              <th>Region</th>
              <th>Status</th>
              <th>Revenue</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.owner}</td>
                <td>{row.region}</td>
                <td><StatusBadge value={row.status} /></td>
                <td>{row.revenue}</td>
                <td>{row.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
