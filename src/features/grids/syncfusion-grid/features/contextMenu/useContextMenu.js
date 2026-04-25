import {useMemo} from "react";

/**
 * @typedef {Object} SyncfusionContextMenuItem
 * @property {string} text - The label of the menu item.
 * @property {string} [id] - Unique identifier for the menu item.
 * @property {string} [target] - CSS selector for where the item appears (e.g., '.e-headercontent', '.e-rowcell').
 * @property {SyncfusionContextMenuItem[]} [items] - Submenu items.
 * @property {string} [iconCss] - Icon CSS class.
 * @property {boolean} [separator] - Whether to show a separator before this item.
 * @property {boolean} [disabled] - Whether the item is disabled.
 * @property {any} [customProps] - Any additional custom properties.
 */

/**
 * Default context menu items for syncfusion-grid.
 * You can use the `target` property to control where a menu item appears:
 * - `.e-headercontent` for header
 * - `.e-rowcell` for grid body
 * - `.e-footercontent` for footer
 * - Omit for all areas
 */
export const defaultContextMenuItems = [
    "AutoFit",
    "AutoFitAll",
    "SortAscending",
    "SortDescending",
    // "Copy",
    // "Edit",
    // "Delete",
    "FirstPage",
    "PrevPage",
    "LastPage",
    "NextPage"
];

/**
 * Merges default and custom context menu items.
 * Custom items can override default ones by id (if present) or text.
 * @param {Array} defaultItems - The default context menu items.
 * @param {Array} customItems - The custom context menu items.
 * @returns {Array} - The merged context menu items.
 */
export function getContextMenuItems(defaultItems, customItems) {
    if (!customItems || customItems.length === 0) return defaultItems;
    // Prefer id for matching, fallback to text
    const getItemKey = item => (typeof item === 'string' ? item : item.id || item.text);
    const filteredDefaults = defaultItems.filter(item => {
        const key = getItemKey(item);
        return !customItems.some(ci => getItemKey(ci) === key);
    });
    return [...filteredDefaults, ...customItems];
}

/**
 * Handles context menu click events, delegating to a custom handler if provided.
 * @param {Object} args - The Syncfusion context menu click event args.
 * @param {Function} customHandler - Optional custom handler.
 */
export function handleContextMenuClick(args, customHandler) {
    if (typeof customHandler === 'function') {
        customHandler(args);
    }
    // Add more logic here if you want to handle built-in actions
}

/**
 * Build context menu items based on requirements.
 * Only hiding items (via hiddenIds) is reliably supported in Syncfusion React Grid.
 * @param {Array<SyncfusionContextMenuItem|string>} baseItems - The base menu items.
 * @param {Object} options - Options for hiding items.
 * @param {Array<string>|function} [options.hiddenIds] - Array or function returning array of ids to hide.
 * @param {Object} [options.context] - Optional context (e.g., row/cell) for dynamic visibility.
 * @returns {Array} - The processed menu items.
 */
export function useContextMenu(baseItems, {hiddenIds = [], context = undefined} = {}) {
    // Recursively process items
    const processItems = (items) =>
        items
            .filter(item => {
                const id = typeof item === 'string' ? item : item.id;
                const hidden = typeof hiddenIds === 'function' ? hiddenIds(context) : hiddenIds;
                return !hidden.includes(id);
            })
            .map(item => {
                if (item.items) {
                    return {
                        ...item,
                        items: processItems(item.items)
                    };
                }
                return {...item};
            });

    return useMemo(() => processItems(baseItems), [baseItems, hiddenIds, context]);
}

/**
 * Feature-friendly context menu hook for syncfusion-grid.
 *
 * @param {Object} params
 * @param {Array<Object>} params.items - Array of menu item configs. Each item can have:
 *   - id: string (used for localization and as action key)
 *   - iconCss: string (optional)
 *   - action: function (optional, called on click)
 *   - target: string (optional)
 *   - hidden: boolean|function(context):boolean (optional)
 *   - disabled: boolean|function(context):boolean (optional)
 *   - items: array (for submenus, same structure)
 *   - ...other Syncfusion menu item props
 * @param {Object} params.intl - react-intl object for localization
 * @param {Object} [params.context] - Optional context for dynamic hidden/disabled
 * @param {Object} [params.gridRef] - Optional ref to the grid instance
 * @returns {{ contextMenuItems: Array, onContextMenuClick: function, disabledMap: Object }}
 *
 * Usage:
 *   const { contextMenuItems, onContextMenuClick, disabledMap } = useFeatureContextMenu({ items, intl, context });
 *   <syncfusion-grid {...{ contextMenuItems, onContextMenuClick }} ...otherProps />
 */
export function useFeatureContextMenu({items, intl, context, gridRef}) {
    // Helper to process items recursively
    const processItems = (itemsArr) =>
        itemsArr
            .filter(item => {
                if (typeof item.hidden === 'function') return !item.hidden(context);
                if (typeof item.hidden === 'boolean') return !item.hidden;
                return true;
            })
            .map(item => {
                const disabled = typeof item.disabled === 'function' ? item.disabled(context) : item.disabled;
                // Add 'e-disabled' class if disabled
                let cssClass = item.cssClass || '';
                if (disabled) {
                    cssClass = cssClass.includes('e-disabled') ? cssClass : (cssClass ? cssClass + ' e-disabled' : 'e-disabled');
                }
                const processed = {
                    ...item,
                    text: item.text || (item.id ? intl.formatMessage({id: item.id}) : undefined),
                    disabled, // still set for reference, but not used by Syncfusion
                    cssClass,
                };
                if (item.items) {
                    processed.items = processItems(item.items);
                }
                // Remove helper-only props
                delete processed.action;
                delete processed.hidden;
                return processed;
            });

    const contextMenuItems = useMemo(() => processItems(items), [items, intl, context]);

    const actionMap = useMemo(() => {
        const map = {};
        const collect = (arr) => {
            arr.forEach(item => {
                if (item.id && typeof item.action === 'function') map[item.id] = item.action;
                if (item.items) collect(item.items);
            });
        };
        collect(items);
        return map;
    }, [items]);

    const disabledMap = useMemo(() => {
        const map = {};
        const collect = (arr) => {
            arr.forEach(item => {
                const disabled = typeof item.disabled === 'function' ? item.disabled(context) : item.disabled;
                if (item.id) map[item.id] = !!disabled;
                if (item.items) collect(item.items);
            });
        };
        collect(items);
        return map;
    }, [items, context]);

    const onContextMenuClick = (args) => {
        const id = args?.item?.id;
        if (id && !disabledMap[id] && actionMap[id]) {
            actionMap[id](args, gridRef);
        }
    };

    return {contextMenuItems, onContextMenuClick, disabledMap};
} 
