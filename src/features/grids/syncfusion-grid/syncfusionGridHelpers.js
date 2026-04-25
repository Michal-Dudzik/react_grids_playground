export function buildFallbackFilterScope(columns = []) {
    const signature = columns
        ?.map((col, index) => (
            col?.field ||
            col?.alias ||
            col?.headerTextId ||
            col?.headerText ||
            col?.colNo ||
            `col-${index}`
        ))
        ?.filter(Boolean)
        ?.join('|');

    return signature || 'anonymous';
}

function buildStorageKey(prefix, {appId, gridId, fallbackFilterScope}) {
    if (appId && gridId) {
        return `syncfusionGrid_${prefix}_${appId}_${gridId}`;
    }

    return `syncfusionGrid_${prefix}_${fallbackFilterScope}`;
}

export function buildFilterStorageKey({appId, gridId, fallbackFilterScope}) {
    return buildStorageKey("filter", {appId, gridId, fallbackFilterScope});
}

export function buildPresentationStorageKey({appId, gridId, fallbackFilterScope}) {
    return buildStorageKey("presentation", {appId, gridId, fallbackFilterScope});
}

export function buildSearchTemplateRules({
    appliedSearchTerm,
    searchFields = [],
    baseColumns = [],
    createSearchHighlightTemplate,
}) {
    if (!appliedSearchTerm?.trim()) {
        return [];
    }

    if (searchFields.length > 0) {
        return searchFields.map(field => ({
            match: (col) => col.field === field,
            template: createSearchHighlightTemplate(appliedSearchTerm, field),
        }));
    }

    if (!Array.isArray(baseColumns)) {
        return [];
    }

    return baseColumns
        .filter(col => col.field)
        .map(col => ({
            match: (column) => column.field === col.field,
            template: createSearchHighlightTemplate(appliedSearchTerm, col.field),
        }));
}

export function buildDefaultSelectionSettings(enableSelectionColumn) {
    return {
        mode: 'Row',
        type: enableSelectionColumn ? 'Multiple' : 'Single',
        checkboxOnly: enableSelectionColumn,
        persistSelection: false,
        enableToggle: !enableSelectionColumn,
    };
}

export function buildGridKey(columns = []) {
    if (!Array.isArray(columns) || columns.length === 0) {
        return 'default';
    }

    return columns
        .map(col => `${col.colNo ?? col.field ?? ''}-${col.visible ?? true}-${col.width ?? ''}-${col.orderID ?? ''}`)
        .join('|');
}
