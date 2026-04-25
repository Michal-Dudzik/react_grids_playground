import {useCallback, useEffect, useMemo, useRef, useState} from "react";

export const useGridSearch = (data, searchFields, customSearch = null) => {
  // Separate input value from applied search term
  const [inputValue, setInputValue] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const clearSearchTimeout = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, []);

  const finishSearch = useCallback(() => {
    clearSearchTimeout();
    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(false);
      searchTimeoutRef.current = null;
    }, 100);
  }, [clearSearchTimeout]);

  // Execute search - only this triggers actual filtering
  const executeSearch = useCallback((term = inputValue) => {
    setIsSearching(true);
    setAppliedSearchTerm(term);

    // Short delay to show loading state
    finishSearch();
  }, [finishSearch, inputValue]);

  // Clear search
  const clearSearch = useCallback(() => {
    clearSearchTimeout();
    setInputValue("");
    setAppliedSearchTerm("");
    setIsSearching(false);
  }, [clearSearchTimeout]);

  // Check if filtering is active
  const isFiltered = Boolean(appliedSearchTerm.trim());

  // Filtering based on applied term only
  const filteredData = useMemo(() => {
    if (!appliedSearchTerm.trim()) return data;
    
    if (customSearch) return customSearch(data, appliedSearchTerm);
    
    const normalizedTerm = appliedSearchTerm.toLowerCase().trim();
    return data.filter(item =>
      searchFields.length > 0
        ? searchFields.some(field => {
            const value = item[field];
            return value != null && String(value).toLowerCase().includes(normalizedTerm);
          })
        : Object.values(item).some(value =>
            value != null && String(value).toLowerCase().includes(normalizedTerm)
          )
    );
  }, [data, appliedSearchTerm, searchFields, customSearch]);

  // Reset search when data changes
  useEffect(() => {
    if (appliedSearchTerm && data) {
      // Re-apply search to new data
      setIsSearching(true);
      finishSearch();
    }
  }, [appliedSearchTerm, data, finishSearch]);

  useEffect(() => {
    return () => {
      clearSearchTimeout();
    };
  }, [clearSearchTimeout]);

  return { 
    filteredData, 
    executeSearch, 
    clearSearch,
    inputValue, 
    setInputValue,
    appliedSearchTerm,
    isSearching,
    isFiltered
  };
};
