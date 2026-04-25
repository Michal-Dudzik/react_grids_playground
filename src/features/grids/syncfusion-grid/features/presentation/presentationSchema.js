export const PRESENTATION_CONFIG_VERSION = 1;

export const PRESENTATION_RULE_KIND_TEMPLATE = "template";
export const PRESENTATION_RULE_KIND_DECORATION = "decoration";
export const PRESENTATION_RULE_SOURCE_DEFAULT = "default";
export const PRESENTATION_RULE_SOURCE_USER = "user";

export const PRESENTATION_TARGET_CELL = "cell";
export const PRESENTATION_TARGET_ROW = "row";
export const PRESENTATION_TARGET_HEADER = "header";

export const PRESENTATION_KIND_OPTIONS = [
    {value: PRESENTATION_RULE_KIND_TEMPLATE, label: "Template"},
    {value: PRESENTATION_RULE_KIND_DECORATION, label: "Decoration"},
];

export const PRESENTATION_TARGET_OPTIONS = [
    {value: PRESENTATION_TARGET_CELL, label: "Cell"},
    {value: PRESENTATION_TARGET_ROW, label: "Row"},
    {value: PRESENTATION_TARGET_HEADER, label: "Header"},
];

export const PRESENTATION_CONDITION_OPTIONS = [
    {value: "always", label: "Always"},
    {value: "equals", label: "Equals"},
    {value: "notEquals", label: "Not equals"},
    {value: "contains", label: "Contains"},
    {value: "startsWith", label: "Starts with"},
    {value: "endsWith", label: "Ends with"},
    {value: "gt", label: "Greater than"},
    {value: "gte", label: "Greater or equal"},
    {value: "lt", label: "Less than"},
    {value: "lte", label: "Less or equal"},
    {value: "isEmpty", label: "Is empty"},
    {value: "isNotEmpty", label: "Is not empty"},
    {value: "isTrue", label: "Is true"},
    {value: "isFalse", label: "Is false"},
];

export const PRESENTATION_FONT_WEIGHT_OPTIONS = [
    {value: "normal", label: "Normal"},
    {value: "500", label: "Medium"},
    {value: "600", label: "Semibold"},
    {value: "700", label: "Bold"},
];

export const PRESENTATION_TEXT_ALIGN_OPTIONS = [
    {value: "", label: "Default"},
    {value: "left", label: "Left"},
    {value: "center", label: "Center"},
    {value: "right", label: "Right"},
];

function createRuleId() {
    return `presentation-rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyPresentationRule(field = "", source = PRESENTATION_RULE_SOURCE_USER) {
    return {
        id: createRuleId(),
        label: "",
        enabled: true,
        source,
        kind: PRESENTATION_RULE_KIND_TEMPLATE,
        target: PRESENTATION_TARGET_CELL,
        field,
        conditionField: field,
        operator: "always",
        compareValue: "",
        priority: 100,
        templateType: "badge",
        templateOptions: {
            backgroundColor: "#e0f2fe",
            textColor: "#0f172a",
        },
        decoration: {
            className: "",
            textColor: "",
            backgroundColor: "",
            fontWeight: "",
            textAlign: "",
            style: {},
        },
    };
}

export function needsCompareValue(operator) {
    return ![
        "always",
        "isEmpty",
        "isNotEmpty",
        "isTrue",
        "isFalse",
    ].includes(operator);
}

export function normalizePresentationRule(rule = {}) {
    const baseRule = createEmptyPresentationRule(
        rule.field || "",
        rule.source || PRESENTATION_RULE_SOURCE_USER
    );
    const normalized = {
        ...baseRule,
        ...rule,
        templateOptions: {
            ...baseRule.templateOptions,
            ...(rule.templateOptions || {}),
        },
        decoration: {
            ...baseRule.decoration,
            ...(rule.decoration || {}),
            style: {
                ...baseRule.decoration.style,
                ...(rule.decoration?.style || {}),
            },
        },
    };

    if (normalized.kind === PRESENTATION_RULE_KIND_TEMPLATE) {
        normalized.target = PRESENTATION_TARGET_CELL;
    }

    if (!normalized.conditionField) {
        normalized.conditionField = normalized.field || "";
    }

    return normalized;
}

export function normalizePresentationConfig(config = {}) {
    return {
        version: PRESENTATION_CONFIG_VERSION,
        rules: Array.isArray(config?.rules)
            ? config.rules.map(normalizePresentationRule)
            : [],
    };
}

export function mergePresentationConfigs(defaults = undefined, saved = undefined) {
    const normalizedDefaults = normalizePresentationConfig(defaults);
    const normalizedSaved = normalizePresentationConfig(saved);

    if (normalizedDefaults.rules.length === 0) {
        return normalizedSaved;
    }

    const savedRuleMap = new Map(
        normalizedSaved.rules.map(rule => [rule.id, rule])
    );

    const mergedDefaultRules = normalizedDefaults.rules.map((rule) => normalizePresentationRule({
        ...rule,
        ...(savedRuleMap.get(rule.id) || {}),
        source: PRESENTATION_RULE_SOURCE_DEFAULT,
    }));

    const defaultRuleIds = new Set(normalizedDefaults.rules.map(rule => rule.id));
    const savedUserRules = normalizedSaved.rules
        .filter(rule => !defaultRuleIds.has(rule.id))
        .map(rule => ({
            ...rule,
            source: rule.source || PRESENTATION_RULE_SOURCE_USER,
        }));

    return {
        version: PRESENTATION_CONFIG_VERSION,
        rules: [...mergedDefaultRules, ...savedUserRules],
    };
}
