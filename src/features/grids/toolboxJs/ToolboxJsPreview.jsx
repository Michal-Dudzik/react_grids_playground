import { createGrid } from '@toolbox-web/grid';
import { useEffect, useRef } from 'react';
import { getDemoRows } from '../../demoData';

const rows = getDemoRows();

const columns = [
  { field: 'id', header: 'Campaign', sortable: true },
  { field: 'owner', header: 'Owner', sortable: true },
  { field: 'region', header: 'Region', sortable: true },
  { field: 'status', header: 'Status', sortable: true },
  { field: 'revenue', header: 'Revenue', sortable: true },
  { field: 'updatedAt', header: 'Updated', sortable: true },
];

export function ToolboxJsPreview() {
  const hostRef = useRef(null);

  useEffect(() => {
    const grid = createGrid({
      columns,
      fitMode: 'stretch',
    });

    grid.rows = rows;
    grid.style.height = '560px';

    const host = hostRef.current;
    host.replaceChildren(grid);

    return () => {
      grid.remove();
      host.replaceChildren();
    };
  }, []);

  return <div className="toolbox-grid-host" ref={hostRef} />;
}
