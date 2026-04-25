import {render, screen} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {
    compilePresentationConfig,
    mergeDecorationDefinitions,
} from "../features/presentation/presentationCompiler.jsx";

describe("compilePresentationConfig", () => {
    it("builds template rules from serializable presentation config", () => {
        const compiled = compilePresentationConfig({
            rules: [
                {
                    id: "rule-1",
                    enabled: true,
                    kind: "template",
                    field: "status",
                    operator: "always",
                    templateType: "uppercase",
                    priority: 200,
                },
            ],
        });

        expect(compiled.templateRules).toHaveLength(1);
        expect(compiled.templateRules[0].match({field: "status"})).toBe(true);

        const Template = compiled.templateRules[0].template;
        render(<Template status="paid"/>);

        expect(screen.getByText("PAID")).toBeInTheDocument();
    });

    it("builds decoration handlers for cell, row, and header targets", () => {
        const compiled = compilePresentationConfig({
            rules: [
                {
                    id: "cell-rule",
                    enabled: true,
                    kind: "decoration",
                    target: "cell",
                    field: "amount",
                    conditionField: "amount",
                    operator: "gt",
                    compareValue: "10",
                    decoration: {
                        className: "cell-warning",
                        textColor: "#ff0000",
                    },
                    priority: 100,
                },
                {
                    id: "row-rule",
                    enabled: true,
                    kind: "decoration",
                    target: "row",
                    conditionField: "status",
                    operator: "equals",
                    compareValue: "blocked",
                    decoration: {
                        className: "row-blocked",
                        backgroundColor: "#fff1f2",
                    },
                    priority: 100,
                },
                {
                    id: "header-rule",
                    enabled: true,
                    kind: "decoration",
                    target: "header",
                    field: "amount",
                    operator: "always",
                    decoration: {
                        className: "header-amount",
                        textAlign: "right",
                    },
                    priority: 100,
                },
            ],
        });

        expect(compiled.decoration.getCellDecoration({amount: 12}, "amount")).toEqual({
            className: "cell-warning",
            style: {color: "#ff0000"},
        });
        expect(compiled.decoration.getRowDecoration({status: "blocked"})).toEqual({
            className: "row-blocked",
            style: {backgroundColor: "#fff1f2"},
        });
        expect(compiled.decoration.getColumnDecoration("amount")).toEqual({
            className: "header-amount",
            style: {textAlign: "right"},
        });
    });
});

describe("mergeDecorationDefinitions", () => {
    it("merges class names and styles from base and override decoration handlers", () => {
        const merged = mergeDecorationDefinitions(
            {
                getCellDecoration: () => ({
                    className: "base-cell",
                    style: {fontWeight: "600"},
                }),
            },
            {
                getCellDecoration: () => ({
                    className: "override-cell",
                    style: {color: "red"},
                }),
            }
        );

        expect(merged.getCellDecoration({}, "name")).toEqual({
            className: "base-cell override-cell",
            style: {
                fontWeight: "600",
                color: "red",
            },
            icon: undefined,
            tooltip: undefined,
        });
    });
});
