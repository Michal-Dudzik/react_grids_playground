import {forwardRef} from "react";
import {
    GridComponent,
    ColumnDirective,
    ColumnsDirective,
    Inject,
    Filter,
    Sort,
    Resize,
    Selection,
    ExcelExport,
    ContextMenu,
    Print,
    ColumnChooser,
    Edit,
} from "@syncfusion/ej2-react-grids";
import "./styles/gridbase.css";

const GridBase = forwardRef(({
                                 data,
                                 columns,
                                 enableSelectionColumn = false,
                                 allowEditing = false,
                                 editSettings = {},
                                 ...gridProps
                             }, ref) => {

    return (
        <GridComponent
            ref={ref}
            dataSource={data}
            cssClass="syncfusion-grid-base"
            height="100%"
            gridLines="Both"
            enableHover={true}
            enableAltRow={true}
            allowResizing={true}
            allowExcelExport={true}
            enablePersistence={false}
            filterSettings={{type: 'Excel'}}
            editSettings={allowEditing ? {
                allowEditing: true,
                allowAdding: false,
                allowDeleting: false,
                mode: 'Normal',
                ...editSettings
            } : undefined}

            // resizeSettings={{ mode: 'Normal' }}
            // autoFit={false}
            {...gridProps}
        >
            <ColumnsDirective>
                {enableSelectionColumn && (
                    <ColumnDirective 
                        type='checkbox' 
                        width='35'
                        minWidth='35'
                        maxWidth='35'
                        allowFiltering={false}
                        allowSorting={false}
                        allowResizing={false}
                        showInColumnChooser={false}
                    />
                )}
                {columns && columns.map((col, idx) => (
                    <ColumnDirective 
                        key={col.colNo || col.field || `col-${idx}`} 
                        field={col.field}
                        headerText={col.headerText}
                        {...col} 
                    />
                ))}
            </ColumnsDirective>
            <Inject
                services={[
                    Filter,
                    Sort,
                    Resize,
                    Selection,
                    ExcelExport,
                    ContextMenu,
                    Print,
                    ColumnChooser,
                    ...(allowEditing ? [Edit] : [])
                ]}/>
        </GridComponent>
    );
});

GridBase.displayName = 'GridBase';

export default GridBase; 
