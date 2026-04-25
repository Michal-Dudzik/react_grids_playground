import {useEffect, useRef, useState} from 'react';

function readStoredFilterState(storageKey, defaultValue) {
    try {
        const stored = localStorage.getItem(storageKey);
        return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch (error) {
        console.warn('Failed to load filter state from localStorage:', error);
        return defaultValue;
    }
}

export const useFilterState = (storageKey, defaultValue) => {
    const [filtering, setFiltering] = useState(() => readStoredFilterState(storageKey, defaultValue));
    const previousStorageKeyRef = useRef(storageKey);

    useEffect(() => {
        if (previousStorageKeyRef.current !== storageKey) {
            previousStorageKeyRef.current = storageKey;
            setFiltering(readStoredFilterState(storageKey, defaultValue));
            return;
        }

        try {
            localStorage.setItem(storageKey, JSON.stringify(filtering));
        } catch (error) {
            console.warn('Failed to save filter state to localStorage:', error);
        }
    }, [defaultValue, filtering, storageKey]);

    return [filtering, setFiltering];
};
