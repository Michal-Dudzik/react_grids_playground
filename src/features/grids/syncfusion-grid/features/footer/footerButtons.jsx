import {LuFilter, LuFilterX, LuPaintbrush, LuSettings2, LuSigma} from "react-icons/lu";
import {PiMicrosoftExcelLogoFill} from "react-icons/pi";
import {isLikelyAggregateColumn} from "../aggregation/aggregationUtils.js";
import PrintDropdown from "../print/PrintDropdown.jsx";

export function getFooterButtons({
                                     showFilter,
                                     showPrint,
                                     showExportExcel,
                                     showColumnsSettings,
                                     showPresentationSettings,
                                     filtering,
                                     setFiltering,
                                     exportToExcel,
                                     intl,
                                     footerButtons = [],
                                     showAggregation,
                                     onToggleAggregation,
                                     columns = [],
                                     aggregationConfig,
                                     showApiColumnSettings = false,
                                     onColumnSettingsClick,
                                     onPresentationSettingsClick,
                                     columnSettingsActive = false,
                                     presentationSettingsActive = false,
                                     disableApiColumnSettings = false,
                                     apiColumnSettingsLoadingLabel = null,
                                     printMethods = {},
                                     hasSelectedRows = false,
                                     selectedRowsCount = 0,
                                 }) {
    // Check if there are aggregatable columns either by natural detection or explicit config
    const hasNaturalAggregatableColumns = columns.some(isLikelyAggregateColumn);
    const hasConfigAggregatableColumns = Array.isArray(aggregationConfig) && aggregationConfig.length > 0;
    const hasAggregatableColumns = hasNaturalAggregatableColumns || hasConfigAggregatableColumns;

    const shouldShowColumnSettings = showColumnsSettings || showApiColumnSettings;

    const defaultFooterButtons = [
        showFilter && {
            key: "toggle-filter",
            icon: filtering ? <LuFilterX className="footer-icon"/> : <LuFilter className="footer-icon"/>,
            onClick: () => setFiltering(f => !f),
            title: intl.formatMessage({id: filtering ? "txtUkryjFiltry" : "txtPokazFiltry"}),
            className: filtering ? "active" : "",
        },
        hasAggregatableColumns && {
            key: "toggle-aggregation",
            icon: <LuSigma className="footer-icon"/>,
            onClick: onToggleAggregation,
            title: intl.formatMessage({
                id: showAggregation ? "txtUkryjSumy" : "txtPokazSumy",
                defaultMessage: showAggregation ? "Hide sums" : "Show sums"
            }),
            className: showAggregation ? "active" : "",
        },
        showPrint && {
            key: "print-dropdown",
            component: (
                <PrintDropdown
                    printMethods={printMethods}
                    hasSelectedRows={hasSelectedRows}
                    selectedRowsCount={selectedRowsCount}
                    intl={intl}
                    className="footer-style"
                />
            ),
            isCustomComponent: true,
        },
        showExportExcel && {
            key: "export-excel",
            icon: <PiMicrosoftExcelLogoFill className="footer-icon"/>,
            onClick: exportToExcel,
            title: intl.formatMessage({id: "txtEksportujDoExcel"}),
        },
        shouldShowColumnSettings && {
            key: "columns-settings",
            icon: <LuSettings2 className="footer-icon"/>,
            onClick: onColumnSettingsClick ?? (() => {}),
            title: intl.formatMessage({id: "txtKonfiguracjaKolumn"}),
            label: apiColumnSettingsLoadingLabel || intl.formatMessage({id: "txtKonfiguracjaKolumn"}),
            disabled: showApiColumnSettings ? disableApiColumnSettings : false,
            className: columnSettingsActive ? "active" : "",
        },
        showPresentationSettings && {
            key: "presentation-settings",
            icon: <LuPaintbrush className="footer-icon"/>,
            onClick: onPresentationSettingsClick ?? (() => {}),
            title: intl.formatMessage({
                id: "txtKonfiguracjaPrezentacjiGridu",
                defaultMessage: "Edit presentation",
            }),
            className: presentationSettingsActive ? "active" : "",
        },
    ].filter(Boolean);

    // Merge default and custom buttons (custom can override by key)
    return [
        ...defaultFooterButtons.filter(
            defBtn => !footerButtons.some(customBtn => customBtn.key === defBtn.key)
        ),
        ...footerButtons,
    ];
} 
