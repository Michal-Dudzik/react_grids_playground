import { forwardRef, useState } from 'react';
import { TanStackGrid } from './TanStackGrid';

export const TanStackTablePreview = forwardRef(function TanStackTablePreview(props, ref) {
  const [selectionMode, setSelectionMode] = useState('multi');
  const [pageSize, setPageSize] = useState(5);
  const [showAllRows, setShowAllRows] = useState(false);
  const [autoPageSize, setAutoPageSize] = useState(false);
  const [rowDensity, setRowDensity] = useState('standard');
  const [editingEnabled, setEditingEnabled] = useState(true);

  return (
    <>
      
      <TanStackGrid
        {...props}
        autoPageSize={autoPageSize}
        editingEnabled={editingEnabled}
        onAutoPageSizeChange={setAutoPageSize}
        onEditingEnabledChange={setEditingEnabled}
        onPageSizeChange={setPageSize}
        onRowDensityChange={setRowDensity}
        onSelectionModeChange={setSelectionMode}
        onShowAllRowsChange={setShowAllRows}
        pageSize={pageSize}
        ref={ref}
        rowDensity={rowDensity}
        selectionMode={selectionMode}
        showAllRows={showAllRows}
      />
    </>
  );
});
