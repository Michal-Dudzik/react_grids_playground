import {describe, expect, it} from "vitest";
import {highlightSearchText} from "../features/search/highlightSearchText.jsx";

describe("highlightSearchText", () => {
    it("wraps matched text in a highlight span and escapes regex characters", () => {
        expect(highlightSearchText("A+B test", "A+B")).toBe(
            '<span class="search-highlight">A+B</span> test'
        );
    });

    it("returns the raw string value when the text is not highlightable or the term is empty", () => {
        expect(highlightSearchText(12345, "23")).toBe('1<span class="search-highlight">23</span>45');
        expect(highlightSearchText(null, "abc")).toBe("null");
        expect(highlightSearchText("Alice", "")).toBe("Alice");
    });
});
