const isHighlightable = (value) => {
    if (value == null) return false;
    const type = typeof value;
    return type === 'string' || type === 'number';
};

export const highlightSearchText = (text, searchTerm) => {
    if (!isHighlightable(text) || !searchTerm?.trim()) {
        return String(text);
    }

    const textStr = String(text);
    const term = searchTerm.toLowerCase().trim();
    
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    
    return textStr.replace(regex, '<span class="search-highlight">$1</span>');
};
