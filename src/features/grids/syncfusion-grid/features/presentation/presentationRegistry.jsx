import {
    boolCheckmarkTemplate,
    monetaryTemplate,
    simpleDateTemplate,
    threePartsTransTemplate,
} from "../templates/useTemplates.jsx";

function resolveFieldValue(props, fieldName) {
    if (!fieldName) {
        return undefined;
    }

    if (props?.[fieldName] !== undefined) {
        return props[fieldName];
    }

    const pascalFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    return props?.[pascalFieldName];
}

function createBadgeTemplate(options = {}) {
    const {
        backgroundColor = "#e0f2fe",
        textColor = "#0f172a",
    } = options;

    const Component = (props) => {
        const fieldName = props.field || props.column?.field;
        const value = resolveFieldValue(props, fieldName);
        const displayValue = value == null ? "" : String(value);

        return (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: 24,
                    padding: "0 8px",
                    borderRadius: 999,
                    backgroundColor,
                    color: textColor,
                    fontWeight: 600,
                }}
            >
                {displayValue}
            </span>
        );
    };

    Component.displayName = "PresentationBadgeTemplate";
    return Component;
}

function createUppercaseTemplate() {
    const Component = (props) => {
        const fieldName = props.field || props.column?.field;
        const value = resolveFieldValue(props, fieldName);

        return <span>{value == null ? "" : String(value).toUpperCase()}</span>;
    };

    Component.displayName = "PresentationUppercaseTemplate";
    return Component;
}

function createPlainTextTemplate() {
    const Component = (props) => {
        const fieldName = props.field || props.column?.field;
        const value = resolveFieldValue(props, fieldName);

        return <span>{value == null ? "" : String(value)}</span>;
    };

    Component.displayName = "PresentationPlainTextTemplate";
    return Component;
}

export const PRESENTATION_TEMPLATE_DEFINITIONS = [
    {value: "plain-text", label: "Plain text"},
    {value: "uppercase", label: "Uppercase text"},
    {value: "badge", label: "Badge"},
    {value: "boolean-checkmark", label: "Boolean checkmark"},
    {value: "date-simple", label: "Simple date"},
    {value: "money", label: "Monetary"},
    {value: "three-parts", label: "Three-part transaction"},
];

export function createRegisteredTemplate(rule) {
    switch (rule?.templateType) {
        case "plain-text":
            return createPlainTextTemplate();
        case "uppercase":
            return createUppercaseTemplate();
        case "badge":
            return createBadgeTemplate(rule?.templateOptions);
        case "boolean-checkmark":
            return boolCheckmarkTemplate();
        case "date-simple":
            return simpleDateTemplate();
        case "money":
            return monetaryTemplate();
        case "three-parts":
            return threePartsTransTemplate();
        default:
            return createPlainTextTemplate();
    }
}
