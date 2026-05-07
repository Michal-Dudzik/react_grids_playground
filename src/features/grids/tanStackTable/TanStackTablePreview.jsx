import { forwardRef, useMemo, useState } from 'react';
import { TanStackGrid } from './TanStackGrid';
import { TanStackTableToolbar } from './components/TanStackTablePanels';
import { pageSizeChoices } from './lib/tableConfig';

export const TanStackTablePreview = forwardRef(function TanStackTablePreview(props, ref) {
  const [selectionMode, setSelectionMode] = useState('multi');
  const [pageSize, setPageSize] = useState(5);
  const [showAllRows, setShowAllRows] = useState(false);
  const [autoPageSize, setAutoPageSize] = useState(false);
  const [rowDensity, setRowDensity] = useState('standard');
  const [editingEnabled, setEditingEnabled] = useState(true);
  const pageSizeOptions = useMemo(
    () =>
      pageSizeChoices.includes(pageSize)
        ? pageSizeChoices
        : [...pageSizeChoices, pageSize].sort((first, second) => first - second),
    [pageSize],
  );

  return (
    <>
      <TanStackTableToolbar
        autoPageSize={autoPageSize}
        editingEnabled={editingEnabled}
        onAutoPageSizeChange={setAutoPageSize}
        onEditingEnabledChange={setEditingEnabled}
        onPageSizeChange={setPageSize}
        onRowDensityChange={setRowDensity}
        onSelectionModeChange={setSelectionMode}
        onShowAllRowsChange={setShowAllRows}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        rowDensity={rowDensity}
        selectionMode={selectionMode}
        showAllRows={showAllRows}
      />
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
