// @ts-nocheck
import { useCallback, useEffect } from 'react';

export function useGridSearch({
  globalFilter,
  globalFilterDraft,
  onSearchPropsChange,
  setGlobalFilter,
  setGlobalFilterDraft,
  setPagination,
}) {
  const applySearch = useCallback(
    (event) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }

      setGlobalFilter((globalFilterDraft ?? '').trim());
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    },
    [globalFilterDraft, setGlobalFilter, setPagination],
  );

  const clearSearch = useCallback(() => {
    setGlobalFilterDraft('');
    setGlobalFilter('');
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [setGlobalFilter, setGlobalFilterDraft, setPagination]);

  useEffect(() => {
    onSearchPropsChange?.({
      appliedSearchTerm: globalFilter,
      clearSearch,
      executeSearch: applySearch,
      inputValue: globalFilterDraft,
      // isSearching is always false: search is synchronous (client-side TanStack filter);
      // there is no async operation, so this is a no-op placeholder kept for API compatibility.
      isSearching: false,
      setInputValue: setGlobalFilterDraft,
    });
  }, [applySearch, clearSearch, globalFilter, globalFilterDraft, onSearchPropsChange, setGlobalFilterDraft]);

  return {
    applySearch,
    clearSearch,
  };
}
