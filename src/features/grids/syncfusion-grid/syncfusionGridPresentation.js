import {useMemo} from "react";
import {useDecoration} from "./features/decoration/useDecoration.js";
import {
    createColTemplateRules,
    createSearchHighlightTemplate,
    useTemplates,
} from "./features/templates/useTemplates.jsx";
import {getContextMenuItems, defaultContextMenuItems} from "./features/contextMenu/useContextMenu.js";
import {getCustomAggregates} from "./features/aggregation/aggregationUtils.js";
import {
    buildDefaultSelectionSettings,
    buildGridKey,
    buildSearchTemplateRules,
} from "./syncfusionGridHelpers.js";
import {
    compilePresentationConfig,
    hasCompiledPresentation,
    mergeDecorationDefinitions,
} from "./features/presentation/presentationCompiler.jsx";

export function useSyncfusionGridPresentation({
    baseColumns,
    decoration,
    appliedSearchTerm,
    searchFields,
    templateRules,
    presentationConfig,
    enableSelectionColumn,
    selectionSettingsProp,
    contextMenuItems,
    showAggregates,
    pagedData,
    filteredData,
    aggregationConfig,
}) {
    const compiledPresentation = useMemo(
        () => compilePresentationConfig(presentationConfig),
        [presentationConfig]
    );
    const shouldApplyPresentation = useMemo(
        () => hasCompiledPresentation(compiledPresentation),
        [compiledPresentation]
    );

    const searchTemplateRules = useMemo(() => buildSearchTemplateRules({
        appliedSearchTerm,
        searchFields,
        baseColumns,
        createSearchHighlightTemplate,
    }), [appliedSearchTerm, searchFields, baseColumns]);

    const colTemplateRules = useMemo(() => createColTemplateRules(), []);

    const allTemplateRules = useMemo(() => ([
        ...(shouldApplyPresentation ? compiledPresentation.templateRules : []),
        ...colTemplateRules,
        ...(templateRules || []),
        ...searchTemplateRules,
    ]), [shouldApplyPresentation, compiledPresentation.templateRules, colTemplateRules, templateRules, searchTemplateRules]);

    const {processColumns} = useTemplates({rules: allTemplateRules});

    const combinedDecoration = useMemo(
        () => (
            shouldApplyPresentation
                ? mergeDecorationDefinitions(decoration, compiledPresentation.decoration)
                : decoration
        ),
        [decoration, shouldApplyPresentation, compiledPresentation.decoration]
    );
    const {queryCellInfo, rowDataBound, columnHeaderBound} = useDecoration(combinedDecoration);

    const defaultSelectionSettings = useMemo(
        () => buildDefaultSelectionSettings(enableSelectionColumn),
        [enableSelectionColumn]
    );
    const selectionSettings = selectionSettingsProp || defaultSelectionSettings;

    const finalColumns = useMemo(() => {
        if (!allTemplateRules.length) {
            return baseColumns;
        }

        return processColumns(baseColumns);
    }, [allTemplateRules, baseColumns, processColumns]);

    const gridKey = useMemo(() => buildGridKey(finalColumns), [finalColumns]);

    const mergedContextMenuItems = useMemo(
        () => getContextMenuItems(defaultContextMenuItems, contextMenuItems),
        [contextMenuItems]
    );

    const customAggregates = useMemo(() => {
        if (!showAggregates) {
            return [];
        }

        return getCustomAggregates(baseColumns, pagedData, filteredData, aggregationConfig);
    }, [showAggregates, baseColumns, pagedData, filteredData, aggregationConfig]);

    return {
        queryCellInfo,
        rowDataBound,
        columnHeaderBound,
        selectionSettings,
        finalColumns,
        gridKey,
        mergedContextMenuItems,
        customAggregates,
    };
}
