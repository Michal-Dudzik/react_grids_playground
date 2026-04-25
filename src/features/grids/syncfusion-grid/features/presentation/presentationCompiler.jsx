import {createRegisteredTemplate} from "./presentationRegistry.jsx";
import {
    normalizePresentationConfig,
    PRESENTATION_RULE_KIND_TEMPLATE,
    PRESENTATION_RULE_KIND_DECORATION,
    PRESENTATION_TARGET_CELL,
    PRESENTATION_TARGET_HEADER,
    PRESENTATION_TARGET_ROW,
} from "./presentationSchema.js";

function mergeClassNames(...classNames) {
    return classNames.filter(Boolean).join(" ");
}

function mergeStyles(...styles) {
    return Object.assign({}, ...styles.filter(Boolean));
}

function resolveFieldValue(record, fieldName) {
    if (!fieldName) {
        return undefined;
    }

    if (record?.[fieldName] !== undefined) {
        return record[fieldName];
    }

    const pascalFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    return record?.[pascalFieldName];
}

function isEmptyValue(value) {
    return value === undefined || value === null || value === "";
}

function parseNumericComparisonValues(actualValue, compareValue) {
    const parsedActualValue = Number(actualValue);
    const parsedCompareValue = Number(compareValue);

    if (!Number.isFinite(parsedActualValue) || !Number.isFinite(parsedCompareValue)) {
        return null;
    }

    return {
        actualValue: parsedActualValue,
        compareValue: parsedCompareValue,
    };
}

function evaluateCondition(operator, actualValue, compareValue) {
    switch (operator) {
        case "equals":
            return String(actualValue ?? "") === String(compareValue ?? "");
        case "notEquals":
            return String(actualValue ?? "") !== String(compareValue ?? "");
        case "contains":
            return String(actualValue ?? "").toLowerCase().includes(String(compareValue ?? "").toLowerCase());
        case "startsWith":
            return String(actualValue ?? "").toLowerCase().startsWith(String(compareValue ?? "").toLowerCase());
        case "endsWith":
            return String(actualValue ?? "").toLowerCase().endsWith(String(compareValue ?? "").toLowerCase());
        case "gt": {
            const parsedValues = parseNumericComparisonValues(actualValue, compareValue);
            return parsedValues ? parsedValues.actualValue > parsedValues.compareValue : false;
        }
        case "gte": {
            const parsedValues = parseNumericComparisonValues(actualValue, compareValue);
            return parsedValues ? parsedValues.actualValue >= parsedValues.compareValue : false;
        }
        case "lt": {
            const parsedValues = parseNumericComparisonValues(actualValue, compareValue);
            return parsedValues ? parsedValues.actualValue < parsedValues.compareValue : false;
        }
        case "lte": {
            const parsedValues = parseNumericComparisonValues(actualValue, compareValue);
            return parsedValues ? parsedValues.actualValue <= parsedValues.compareValue : false;
        }
        case "isEmpty":
            return isEmptyValue(actualValue);
        case "isNotEmpty":
            return !isEmptyValue(actualValue);
        case "isTrue":
            return actualValue === true || actualValue === 1 || actualValue === "1";
        case "isFalse":
            return actualValue === false || actualValue === 0 || actualValue === "0";
        case "always":
        default:
            return true;
    }
}

function buildDecorationStyle(decoration = {}) {
    const style = {
        ...(decoration.style || {}),
    };

    if (decoration.textColor) {
        style.color = decoration.textColor;
    }

    if (decoration.backgroundColor) {
        style.backgroundColor = decoration.backgroundColor;
    }

    if (decoration.fontWeight) {
        style.fontWeight = decoration.fontWeight;
    }

    if (decoration.textAlign) {
        style.textAlign = decoration.textAlign;
    }

    return Object.keys(style).length > 0 ? style : undefined;
}

function sortRulesForTemplates(rules) {
    return [...rules].sort((left, right) => (right.priority || 0) - (left.priority || 0));
}

function sortRulesForDecorations(rules) {
    return [...rules].sort((left, right) => (left.priority || 0) - (right.priority || 0));
}

function buildRuleTemplate(rule) {
    const RegisteredTemplate = createRegisteredTemplate(rule);

    const Component = (props) => {
        const fieldName = rule.field || props.field || props.column?.field;
        const conditionField = rule.conditionField || fieldName;
        const conditionValue = resolveFieldValue(props, conditionField);

        if (!evaluateCondition(rule.operator, conditionValue, rule.compareValue)) {
            const fallbackValue = resolveFieldValue(props, fieldName);
            return <span>{fallbackValue == null ? "" : String(fallbackValue)}</span>;
        }

        return <RegisteredTemplate {...props} field={fieldName}/>;
    };

    Component.displayName = "CompiledPresentationTemplate";
    return Component;
}

function buildUnifiedDecoration(decorationRules) {
    if (!decorationRules.length) {
        return {};
    }

    const cellRules = decorationRules.filter(rule => rule.target === PRESENTATION_TARGET_CELL);
    const rowRules = decorationRules.filter(rule => rule.target === PRESENTATION_TARGET_ROW);
    const headerRules = decorationRules.filter(rule => rule.target === PRESENTATION_TARGET_HEADER);

    return {
        getCellDecoration: (row, field) => {
            return cellRules.reduce((accumulator, rule) => {
                if (rule.field && rule.field !== field) {
                    return accumulator;
                }

                const conditionValue = resolveFieldValue(row, rule.conditionField || rule.field);
                if (!evaluateCondition(rule.operator, conditionValue, rule.compareValue)) {
                    return accumulator;
                }

                return {
                    className: mergeClassNames(accumulator.className, rule.decoration?.className),
                    style: mergeStyles(accumulator.style, buildDecorationStyle(rule.decoration)),
                };
            }, {});
        },
        getRowDecoration: (row) => {
            return rowRules.reduce((accumulator, rule) => {
                const conditionValue = resolveFieldValue(row, rule.conditionField || rule.field);
                if (!evaluateCondition(rule.operator, conditionValue, rule.compareValue)) {
                    return accumulator;
                }

                return {
                    className: mergeClassNames(accumulator.className, rule.decoration?.className),
                    style: mergeStyles(accumulator.style, buildDecorationStyle(rule.decoration)),
                };
            }, {});
        },
        getColumnDecoration: (field) => {
            return headerRules.reduce((accumulator, rule) => {
                if (rule.field && rule.field !== field) {
                    return accumulator;
                }

                return {
                    className: mergeClassNames(accumulator.className, rule.decoration?.className),
                    style: mergeStyles(accumulator.style, buildDecorationStyle(rule.decoration)),
                };
            }, {});
        },
    };
}

export function mergeDecorationDefinitions(baseDecoration = {}, overrideDecoration = {}) {
    const mergeDecorationResult = (baseFn, overrideFn) => (...args) => {
        const baseResult = typeof baseFn === "function" ? baseFn(...args) || {} : {};
        const overrideResult = typeof overrideFn === "function" ? overrideFn(...args) || {} : {};

        return {
            ...baseResult,
            ...overrideResult,
            className: mergeClassNames(baseResult.className, overrideResult.className),
            style: mergeStyles(baseResult.style, overrideResult.style),
            icon: overrideResult.icon ?? baseResult.icon,
            tooltip: overrideResult.tooltip ?? baseResult.tooltip,
        };
    };

    return {
        ...baseDecoration,
        getCellDecoration: mergeDecorationResult(baseDecoration.getCellDecoration, overrideDecoration.getCellDecoration),
        getRowDecoration: mergeDecorationResult(baseDecoration.getRowDecoration, overrideDecoration.getRowDecoration),
        getColumnDecoration: mergeDecorationResult(baseDecoration.getColumnDecoration, overrideDecoration.getColumnDecoration),
    };
}

export function compilePresentationConfig(config) {
    const normalizedConfig = normalizePresentationConfig(config);
    const enabledRules = normalizedConfig.rules.filter(rule => rule.enabled !== false);

    const templateRules = sortRulesForTemplates(
        enabledRules.filter(rule => (
            rule.kind === PRESENTATION_RULE_KIND_TEMPLATE &&
            rule.field
        ))
    ).map(rule => ({
        match: (column) => column.field === rule.field,
        template: buildRuleTemplate(rule),
    }));

    const decorationRules = sortRulesForDecorations(
        enabledRules.filter(rule => rule.kind === PRESENTATION_RULE_KIND_DECORATION)
    );

    return {
        templateRules,
        decoration: buildUnifiedDecoration(decorationRules),
    };
}

export function hasCompiledPresentation(compiledPresentation) {
    const hasTemplateRules = Array.isArray(compiledPresentation?.templateRules) && compiledPresentation.templateRules.length > 0;
    const hasDecorationRules = Boolean(
        compiledPresentation?.decoration?.getCellDecoration ||
        compiledPresentation?.decoration?.getRowDecoration ||
        compiledPresentation?.decoration?.getColumnDecoration
    );

    return hasTemplateRules || hasDecorationRules;
}
