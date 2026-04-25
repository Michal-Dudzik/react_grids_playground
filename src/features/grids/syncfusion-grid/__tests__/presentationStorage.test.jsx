import {describe, expect, it} from "vitest";
import {loadPresentationConfig} from "../features/presentation/presentationStorage.js";

describe("loadPresentationConfig", () => {
    it("merges saved overrides into developer defaults by rule id and keeps user rules", () => {
        const storageKey = "syncfusion-grid-presentation-test";

        window.localStorage.setItem(storageKey, JSON.stringify({
            rules: [
                {
                    id: "default-rule",
                    label: "User-edited default",
                    enabled: false,
                    priority: 300,
                    kind: "template",
                    field: "status",
                    templateType: "uppercase",
                },
                {
                    id: "user-rule",
                    label: "User rule",
                    enabled: true,
                    kind: "decoration",
                    target: "cell",
                    field: "amount",
                    priority: 50,
                },
            ],
        }));

        const merged = loadPresentationConfig(storageKey, {
            rules: [
                {
                    id: "default-rule",
                    label: "Default label",
                    enabled: true,
                    kind: "template",
                    field: "status",
                    templateType: "plain-text",
                    priority: 100,
                },
                {
                    id: "new-default-rule",
                    label: "New default rule",
                    enabled: true,
                    kind: "decoration",
                    target: "row",
                    conditionField: "status",
                    operator: "equals",
                    compareValue: "blocked",
                    priority: 90,
                },
            ],
        });

        expect(merged.rules.map(rule => [rule.id, rule.source])).toEqual([
            ["default-rule", "default"],
            ["new-default-rule", "default"],
            ["user-rule", "user"],
        ]);

        expect(merged.rules[0]).toMatchObject({
            id: "default-rule",
            label: "User-edited default",
            enabled: false,
            priority: 300,
            templateType: "uppercase",
            source: "default",
        });
    });
});
