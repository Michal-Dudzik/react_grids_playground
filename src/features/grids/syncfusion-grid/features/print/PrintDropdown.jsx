import {useMemo} from 'react';
import {Dropdown, Button} from 'antd';
import {LuPrinter} from 'react-icons/lu';

const PrintDropdown = ({
                           printMethods = {},
                           hasSelectedRows = false,
                           selectedRowsCount = 0,
                           intl,
                           className = ""
                       }) => {

    const handlePrintOption = (printFunction, optionName) => {
        if (printFunction) {
            printFunction();
        }
        console.log(`Print option selected: ${optionName}`);
    };

    const menuItems = useMemo(() => [
        {
            key: 'printAll',
            label: intl?.formatMessage?.({id: 'txtDrukujWszystko'}, {defaultMessage: 'Print All Data'}),
            icon: <LuPrinter size={14}/>,
            onClick: () => handlePrintOption(printMethods.printAll, 'All'),
        },
        {
            key: 'printCurrentPage',
            label: intl?.formatMessage?.({id: 'txtDrukujBiezacaStrone'}, {defaultMessage: 'Print Current View'}),
            icon: <LuPrinter size={14}/>,
            onClick: () => handlePrintOption(printMethods.printCurrentPage, 'Current View'),
        },
        {
            key: 'printSelected',
            label: intl?.formatMessage?.({id: 'txtDrukujWybrane'}, {defaultMessage: `Print Selected (${selectedRowsCount})`}),
            icon: <LuPrinter size={14}/>,
            onClick: () => handlePrintOption(printMethods.printSelected, 'Selected'),
            disabled: !hasSelectedRows
        }
    ], [printMethods, hasSelectedRows, selectedRowsCount, intl]);

    return (
        <Dropdown
            menu={{items: menuItems}}
            placement="topRight"
            trigger={['click']}
            className={className}
        >
            <Button
                type="text"
                icon={<LuPrinter size={24}/>}
                title={intl?.formatMessage?.({id: 'txtOpcjeDrukowania'})}
                style={{ 
                    fontSize: 24, 
                    height: 32, 
                    width: 32, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                }}
            />
        </Dropdown>
    );
};

export default PrintDropdown;
