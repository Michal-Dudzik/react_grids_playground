import {Input} from "antd";
import {useIntl} from "react-intl";

const SearchBar = ({
                       inputValue,
                       onInputChange,
                       onSearch,
                       onClear,
                       isSearching = false,
                       width = 180,
                   }) => {
    const intl = useIntl();

    const handlePressEnter = () => {
        onSearch(inputValue);
    };

    const handleSearch = (value) => {
        onSearch(value);
    };

    const handleChange = (e) => {
        onInputChange(e.target.value);
    };

    const handleClear = () => {
        if (onClear) {
            onClear();
        } else {
            onInputChange("");
            onSearch("");
        }
    };

    return (
        <Input.Search
            placeholder={intl.formatMessage({id: "txtSzukaj"})}
            value={inputValue}
            onChange={handleChange}
            onSearch={handleSearch}
            onPressEnter={handlePressEnter}
            loading={isSearching}
            allowClear
            onClear={handleClear}
            style={{width}}
            enterButton
            className="custom-search-input"
        />
    );
};

export default SearchBar; 
