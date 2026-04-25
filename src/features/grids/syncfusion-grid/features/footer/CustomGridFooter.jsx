import {Pagination, Select, Button, Tooltip, Divider} from "antd";
import {useIntl} from "react-intl";
import SearchBar from "../search/SearchBar.jsx";

const {Option} = Select;

const CustomGridFooter = ({
                              currentPage,
                              pageSize,
                              total,
                              pageSizeOptions,
                              onPageChange,
                              onPageSizeChange,
                              SearchComponent,
                              buttons = [],
                              hidePageCount = false,
                              disablePaging = false,
                          }) => {
    const intl = useIntl();

    return (
        <div className="flex items-center justify-between px-2 py-2 bg-skin-fill border-t border-skin-border w-full">
            {/* Left: Search Component */}
            <div className="flex flex-1 items-center">
                {SearchComponent && (
                    <SearchBar
                        inputValue={SearchComponent.inputValue}
                        onInputChange={SearchComponent.onInputChange}
                        onSearch={SearchComponent.onSearch}
                        onClear={SearchComponent.onClear}
                        isSearching={SearchComponent.isSearching}
                    />
                )}
            </div>

            {/* Center: Pagination - only show if paging is not disabled */}
            <div className="flex flex-1 items-center justify-center">
                {!disablePaging && (
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={total}
                        onChange={onPageChange}
                        showSizeChanger={false}
                        simple
                    />
                )}
            </div>

            {/* Right: Page Size, Divider, Action Buttons */}
            <div className="flex flex-1 items-center justify-end gap-2">
                {/* Page Size Selector - only show if not hidden and paging is not disabled */}
                {!hidePageCount && !disablePaging && (
                    <div className="flex items-center gap-1">
            <span className="text-sm">
              {intl.formatMessage({id: "txtElementowNaStronie"})}
            </span>
                        <Select
                            value={pageSize}
                            onChange={onPageSizeChange}
                            style={{width: 65}}
                        >
                            {pageSizeOptions?.map((size) => (
                                <Option key={size} value={size}>
                                    {size}
                                </Option>
                            ))}
                        </Select></div>
                )}
                {buttons.length > 0 && (
                    <>
                        {/* Only show divider if there are other elements before buttons */}
                        {!hidePageCount && !disablePaging && (
                            <Divider type="vertical" className="h-4 mx-1"/>
                        )}
                        <div className="flex items-center gap-1">
                            {buttons.map((btn, idx) => {
                                // Handle custom features
                                if (btn.isCustomComponent && btn.component) {
                                    return (
                                        <div key={btn.key || idx} className="flex items-center">
                                            {btn.component}
                                        </div>
                                    );
                                }

                                // Handle regular buttons
                                return (
                                    <Tooltip
                                        key={btn.key || idx}
                                        title={btn.title}
                                        placement="top"
                                    >
                                        <Button
                                            type="text"
                                            icon={btn.icon}
                                            onClick={btn.onClick}
                                            className={btn.className}
                                            disabled={btn.disabled}
                                            style={{
                                                fontSize: 24,
                                                height: 32,
                                                width: 32,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                            loading={!!btn.loading}
                                        />
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CustomGridFooter;

