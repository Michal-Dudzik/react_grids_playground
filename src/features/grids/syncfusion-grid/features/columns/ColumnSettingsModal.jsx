import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {Modal, Table, InputNumber, Checkbox, Button} from 'antd';
import {useIntl} from 'react-intl';
import {SyncOutlined, LoadingOutlined} from '@ant-design/icons';
import {DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import {arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {restrictToVerticalAxis} from '@dnd-kit/modifiers';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {applyGridWidths} from './syncGridWidths.js';

// Utility to assign 1-based orderID for display - memoized
const assignOrderIDs = (cols) => {
    if (!Array.isArray(cols)) return [];
    return cols.map((col, i) => ({...col, orderID: i + 1}));
};

// Sort columns by orderID - memoized function
const sortColumnsByOrder = (columns) => {
    if (!Array.isArray(columns)) return [];
    return [...columns].sort((a, b) => (a.orderID || 9999) - (b.orderID || 9999));
};

// Drag Handle Component - Uses context to get drag props
const DragHandle = () => {
    const dragHandleProps = React.useContext(DragHandleContext);
    
    if (!dragHandleProps) {
        // Fallback if no context (shouldn't happen in normal usage)
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '8px',
                    color: '#ccc',
                    userSelect: 'none'
                }}
            >
                ⋮⋮
            </div>
        );
    }

    const { setActivatorNodeRef, listeners } = dragHandleProps;

    return (
        <div
            ref={setActivatorNodeRef}
            {...listeners}
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'grab',
                padding: '8px',
                color: '#1890ff',
                userSelect: 'none'
            }}
        >
            ⋮⋮
        </div>
    );
};

// Context to pass drag handle props
const DragHandleContext = React.createContext();

// Sortable Row Component
const SortableRow = ({children, ...props}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: props['data-row-key'],
    });

    const style = {
        ...props.style,
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: isDragging ? 'grabbing' : 'default',
        ...(isDragging ? {position: 'relative', zIndex: 9999} : {}),
    };

    const dragHandleProps = {
        setActivatorNodeRef,
        listeners
    };

    return (
        <DragHandleContext.Provider value={dragHandleProps}>
            <tr {...props} ref={setNodeRef} style={style} {...attributes}>
                {children}
            </tr>
        </DragHandleContext.Provider>
    );
};

export default function ColumnSettingsModal({open, onClose, columns, onSave, isLoading, onReset, onSyncWithGrid}) {
    const intl = useIntl();

    const initialColumns = useMemo(() => {
        return assignOrderIDs(sortColumnsByOrder(columns));
    }, [columns]);

    const [localColumns, setLocalColumns] = useState(initialColumns);
    const [resetting, setResetting] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        setLocalColumns(assignOrderIDs(sortColumnsByOrder(columns)));
    }, [columns, open]);

    // Sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 1,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Optimized handlers with useCallback
    const handleWidthChange = useCallback((idx, value) => {
        setLocalColumns(cols => {
            const newCols = [...cols];
            newCols[idx] = {...newCols[idx], width: value};
            return newCols;
        });
    }, []);

    const handleVisibleChange = useCallback((idx, value) => {
        setLocalColumns(cols => {
            const newCols = [...cols];
            newCols[idx] = {...newCols[idx], visible: value};
            return newCols;
        });
    }, []);

    // Handle drag end
    const handleDragEnd = useCallback((event) => {
        const {active, over} = event;

        if (active.id !== over?.id) {
            setLocalColumns((cols) => {
                const oldIndex = cols.findIndex((col) => col.colNo === active.id);
                const newIndex = cols.findIndex((col) => col.colNo === over.id);

                const newCols = arrayMove(cols, oldIndex, newIndex);
                // Update orderID based on new positions
                return newCols.map((col, i) => ({...col, orderID: i + 1}));
            });
        }
    }, []);

    // Optimized save handler
    const handleSave = useCallback(() => {
        if (!Array.isArray(localColumns) || !Array.isArray(columns)) return;

        // Create lookup map for better performance
        const origByColNo = new Map();
        columns.forEach(col => {
            if (col.colNo != null) {
                origByColNo.set(col.colNo, {...col});
            }
        });

        // Build final payload
        const fullPayload = localColumns.map((col, idx) => {
            const orig = origByColNo.get(col.colNo) || {};
            return {
                ...orig,
                ...col,
                orderID: idx + 1,
            };
        });

        onSave(fullPayload);
    }, [localColumns, columns, onSave]);

    // Optimized reset handler
    const handleReset = useCallback(async () => {
        if (!onReset) return;

        setResetting(true);
        try {
            await onReset();
        } catch (error) {
            console.error('Error resetting columns:', error);
        } finally {
            setResetting(false);
        }
    }, [onReset]);

    // Sync column widths from grid
    const handleSyncWithGrid = useCallback(async () => {
        if (!onSyncWithGrid) return;

        setSyncing(true);
        
        // Small delay to ensure loading state is visible
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
            const widthMap = onSyncWithGrid();
            if (!widthMap) {
                setSyncing(false);
                return;
            }

            setLocalColumns(cols => applyGridWidths(cols, widthMap));
        } catch (error) {
            console.error('Error syncing with grid:', error);
        } finally {
            setSyncing(false);
        }
    }, [onSyncWithGrid]);

    // Memoized table columns definition
    const tableColumns = useMemo(() => [
        {
            title: intl.formatMessage({id: 'txtPozycja'}),
            dataIndex: 'orderID',
            width: 60,
            align: 'center',
        },
        {
            title: intl.formatMessage({id: 'txtKolumna'}),
            dataIndex: 'headerText',
            render: (text, record) => record.headerText || record.field || record.alias,
        },
        {
            title: intl.formatMessage({id: 'txtSzerokosc'}),
            dataIndex: 'width',
            width: 90,
            align: 'center',
            render: (value, record, idx) => (
                <InputNumber
                    min={20}
                    max={1000}
                    value={value}
                    style={{width: 70}}
                    onChange={val => handleWidthChange(idx, val)}
                />
            ),
        },
        {
            title: intl.formatMessage({id: 'txtWidocznosc'}),
            dataIndex: 'visible',
            width: 80,
            align: 'center',
            render: (value, record, idx) => (
                <Checkbox
                    checked={value}
                    onChange={e => handleVisibleChange(idx, e.target.checked)}
                />
            ),
        },
        {
            title: intl.formatMessage({id: 'txtPrzesunKolumne'}),
            width: 80,
            align: 'center',
            render: () => <DragHandle />,
        },
    ], [intl, handleWidthChange, handleVisibleChange]);

    // Memoized row class name function
    const getRowClassName = useCallback((record) => {
        return record.visible ? '' : 'ant-table-row-invisible';
    }, []);

    // Custom footer with all buttons inline
    const renderFooter = () => {
        return [
            <Button
                key="reset"
                danger
                onClick={handleReset}
                loading={resetting}
                disabled={isLoading || resetting || syncing}
            >
                {intl.formatMessage({
                    id: 'txtResetujDoDomyslnych'
                })}
            </Button>,
            onSyncWithGrid && (
                <Button
                    key="sync"
                    icon={syncing ? <LoadingOutlined spin /> : <SyncOutlined />}
                    onClick={handleSyncWithGrid}
                    disabled={isLoading || resetting || syncing}
                >
                    {intl.formatMessage({
                        id: 'txtSynchronizujSzerokosciZSiatki'
                    })}
                </Button>
            ),
            <Button
                key="cancel"
                onClick={onClose}
                disabled={isLoading || resetting || syncing}
            >
                {intl.formatMessage({id: 'txtAnuluj'})}
            </Button>,
            <Button
                key="submit"
                type="primary"
                onClick={handleSave}
                loading={isLoading}
                disabled={resetting || syncing}
                className="bg-skin-button-accent hover:bg-skin-button-accent-hover"
            >
                {intl.formatMessage({id: 'txtZapisz'})}
            </Button>
        ].filter(Boolean);
    };

    return (
        <Modal
            title={intl.formatMessage({id: 'txtKonfiguracjaKolumn'})}
            open={open}
            onCancel={onClose}
            centered={true}
            width={750}
            footer={renderFooter()}
            styles={{
                body: {
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingRight: '24px'
                }
            }}
        >
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
            >
                <SortableContext
                    items={localColumns.map(col => col.colNo)}
                    strategy={verticalListSortingStrategy}
                >
                    <Table
                        dataSource={localColumns}
                        columns={tableColumns}
                        rowKey="colNo"
                        pagination={false}
                        size="small"
                        rowClassName={getRowClassName}
                        style={{marginBottom: 0}}
                        components={{
                            body: {
                                row: SortableRow,
                            },
                        }}
                    />
                </SortableContext>
            </DndContext>

            <style>{`
                .ant-table-row-invisible td {
                    color: #888 !important;
                    font-style: italic;
                    background: #f8f8f8;
                }
            `}</style>
        </Modal>
    );
} 
