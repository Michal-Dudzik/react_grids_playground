import {render, renderHook, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {
    createColTemplateRules,
    createSearchHighlightTemplate,
    simpleDateTemplate,
    useTemplates,
} from "../features/templates/useTemplates.jsx";

describe("useTemplates", () => {
    it("applies the first matching rule to each column", () => {
        const templateA = vi.fn();
        const templateB = vi.fn();

        const {result} = renderHook(() => useTemplates({
            rules: [
                {match: (column) => column.field === "name", template: templateA},
                {match: () => true, template: templateB},
            ],
        }));

        expect(result.current.processColumns([
            {field: "name"},
            {field: "amount"},
        ])).toEqual([
            {field: "name", template: templateA},
            {field: "amount", template: templateB},
        ]);
    });

    it("keeps the processor stable when the rule set is unchanged", () => {
        const rules = [
            {match: (column) => column.field === "name", template: vi.fn()},
        ];

        const {result, rerender} = renderHook(() => useTemplates({rules}));
        const firstProcessor = result.current.processColumns;

        rerender();

        expect(result.current.processColumns).toBe(firstProcessor);
    });
});

describe("createSearchHighlightTemplate", () => {
    it("renders matched fragments with highlight spans", () => {
        const Template = createSearchHighlightTemplate("ali", "name");

        render(<Template name="Alice" />);

        const highlights = screen.getAllByText(/ali/i);
        expect(highlights).toHaveLength(1);
        expect(highlights[0]).toHaveClass("search-highlight");
        expect(screen.getByText("ce")).toBeInTheDocument();
    });

    it("resolves PascalCase field names and preserves zero values", () => {
        const Template = createSearchHighlightTemplate("0", "valueNum");

        render(<Template ValueNum={0} />);

        expect(screen.getByText("0")).toBeInTheDocument();
    });
});

describe("simpleDateTemplate", () => {
    it("formats valid dates and hides the default 1900 date", () => {
        const DateTemplate = simpleDateTemplate();

        const {rerender} = render(<DateTemplate paymentDate="2024-07-12T08:15:00" field="paymentDate" />);
        expect(screen.getByText("2024-07-12")).toBeInTheDocument();

        rerender(<DateTemplate paymentDate="1900-01-01T00:00:00" field="paymentDate" />);
        expect(document.body.textContent).toBe("");
    });
});

describe("createColTemplateRules", () => {
    it("creates rules for date, money, checkmark, and threePartsTrans accessors", () => {
        const rules = createColTemplateRules();

        expect(rules).toHaveLength(4);
        expect(rules.map((rule) => rule.match({colValueAccessor: "date"}))).toContain(true);
        expect(rules.map((rule) => rule.match({colValueAccessor: "money"}))).toContain(true);
        expect(rules.map((rule) => rule.match({colValueAccessor: "checkmark"}))).toContain(true);
        expect(rules.map((rule) => rule.match({colValueAccessor: "threePartsTrans"}))).toContain(true);
    });
});
