import {useState, useCallback} from "react";
import {ExportModal} from "./ExportModal.jsx";
import {useIntl} from "react-intl";
import {toast} from 'react-hot-toast';
import {showErrorToast} from "../../../error-toast/showErrorToast.jsx";

const prepareExportProperties = (params = {}) => ({
    fileName: params.fileName || "GridExport.xlsx",
    exportType: "CurrentPage",
    pageSize: "All",
    allPages: true,
    withoutGridLines: false,
    includeHiddenColumn: false,
    dataSource: params.data || [],
    header: {
        headerRows: 1,
        rows: [],
    },
    theme: {
        header: {
            fontName: "Segoe UI",
            fontColor: "#666666",
            fontSize: 12,
            bold: true,
        },
        record: {
            fontName: "Segoe UI",
            fontColor: "#000000",
            fontSize: 11,
        },
    },
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useGridExport = (gridRef, data = []) => {
    const [isExporting, setIsExporting] = useState(false);
    const intl = useIntl();

    const handleGridExport = useCallback(async () => {
        if (!gridRef?.current) {
            showErrorToast({
                title: intl.formatMessage({id: 'txtBladEksportu'}),
                message: intl.formatMessage({id: 'txtGridNieGotowy'}),
                location: 'syncfusion-grid: export to Excel'
            });
            return;
        }

        const grid = gridRef.current;

        if (typeof grid.excelExport !== "function") {
            showErrorToast({
                title: intl.formatMessage({id: 'txtBladEksportu'}),
                message: intl.formatMessage({
                    id: 'txtFunkcjaEksportuNiedostepna'
                }),
                location: 'syncfusion-grid: export to Excel'
            });
            return;
        }

        const hasAggregates = Array.isArray(grid.aggregates) && grid.aggregates.length > 0;
        const originalAggregates = hasAggregates ? grid.aggregates : null;

        try {
            if (hasAggregates) {
                grid.aggregates = [];
            }

            // Prepare and start export
            const exportProperties = prepareExportProperties({data});
            await grid.excelExport(exportProperties);

            // Add additional delay after export is complete to ensure file download starts
            await delay(2000);

            toast.success(intl.formatMessage({
                id: 'txtEksportZakonczonySukcesem'
            }));
        } catch (error) {
            showErrorToast({
                title: intl.formatMessage({id: 'txtBladEksportu'}),
                error,
                location: 'syncfusion-grid: export to Excel'
            });
            throw error;
        } finally {
            if (hasAggregates && originalAggregates) {
                grid.aggregates = originalAggregates;
            }
        }
    }, [gridRef, data, intl]);

    const exportToExcel = useCallback(async () => {
        setIsExporting(true);

        try {
            // Wait for the next frame to ensure modal is rendered
            await delay(0);

            // Add a small delay to ensure modal is visible
            await delay(100);

            // Start the export
            await handleGridExport();
        } catch (error) {
            // Error already handled in handleGridExport
        } finally {
            setIsExporting(false);
        }
    }, [handleGridExport]);

    // Export the modal component instance
    const ExportLoadingModal = useCallback(
        () => <ExportModal visible={isExporting} intl={intl}/>,
        [isExporting, intl],
    );

    return {
        isExporting,
        exportToExcel,
        ExportLoadingModal,
    };
};
