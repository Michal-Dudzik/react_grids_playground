import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {renderWithProviders} from "../../../../test/renderWithProviders.jsx";

vi.mock("antd", () => {
    const Select = ({value, onChange, children}) => (
        <select
            aria-label="page-size"
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
        >
            {children}
        </select>
    );

    Select.Option = ({value, children}) => <option value={value}>{children}</option>;

    return {
        Pagination: ({onChange}) => (
            <button type="button" onClick={() => onChange(2)}>
                pagination
            </button>
        ),
        Select,
        Button: ({onClick, disabled, children}) => (
            <button type="button" onClick={onClick} disabled={disabled}>
                {children || "footer-button"}
            </button>
        ),
        Tooltip: ({children}) => children,
        Divider: () => <div data-testid="divider" />,
    };
});

vi.mock("../features/search/SearchBar.jsx", () => ({
    default: ({inputValue}) => <div data-testid="search-bar">{inputValue}</div>,
}));

const {default: CustomGridFooter} = await import("../features/footer/CustomGridFooter.jsx");

describe("CustomGridFooter", () => {
    const messages = {
        txtElementowNaStronie: "Items per page",
    };

    it("renders search, pagination, page size selector, and action buttons", () => {
        const onPageChange = vi.fn();
        const onPageSizeChange = vi.fn();
        const action = vi.fn();

        renderWithProviders(
            <CustomGridFooter
                currentPage={1}
                pageSize={20}
                total={100}
                pageSizeOptions={[20, 50]}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                SearchComponent={{
                    inputValue: "alice",
                    onInputChange: vi.fn(),
                    onSearch: vi.fn(),
                    onClear: vi.fn(),
                    isSearching: false,
                }}
                buttons={[{key: "custom", title: "Custom", onClick: action}]}
            />,
            {withRouter: false, messages}
        );

        expect(screen.getByTestId("search-bar")).toHaveTextContent("alice");
        expect(screen.getByText("Items per page")).toBeInTheDocument();
        expect(screen.getByTestId("divider")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: "pagination"}));
        expect(onPageChange).toHaveBeenCalledWith(2);

        fireEvent.change(screen.getByLabelText("page-size"), {target: {value: "50"}});
        expect(onPageSizeChange).toHaveBeenCalledWith(50);

        fireEvent.click(screen.getByRole("button", {name: "footer-button"}));
        expect(action).toHaveBeenCalled();
    });

    it("hides paging controls when paging is disabled", () => {
        renderWithProviders(
            <CustomGridFooter
                currentPage={1}
                pageSize={20}
                total={100}
                pageSizeOptions={[20, 50]}
                onPageChange={vi.fn()}
                onPageSizeChange={vi.fn()}
                buttons={[]}
                disablePaging={true}
            />,
            {withRouter: false, messages}
        );

        expect(screen.queryByText("Items per page")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "pagination"})).not.toBeInTheDocument();
    });
});
