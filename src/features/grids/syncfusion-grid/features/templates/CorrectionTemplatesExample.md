# Correction Templates Usage Example

This document shows how to use the shared correction templates that were moved from DeclarationVatUE to be reusable
across the entire project.

## Import the Templates

```javascript
import {
    threePartsTransTemplate,
    correctionComparisonTemplate,
    correctionVerticalSplitTemplate,
    correctionLabelTemplate,
    verticalDividerTemplate,
    correctionThreePartsVerticalTemplate,
} from "../elements/syncfusion-grid/features/templates/useTemplates";
```

## Example: Correction Layout (Vertical Split)

```javascript
// Template rules for correction display (top: old, bottom: new)
const correctionRules = [
  {
    match: (col) => col.field === "threePartsTrans",
    template: correctionThreePartsVerticalTemplate(),
  },
  {
    match: (col) => col.field === "correctionLabel",
    template: correctionLabelTemplate(),
  },
  {
    match: (col) => col.field === "valueNum",
    template: correctionVerticalSplitTemplate("valueNum"),
  },
  {
    match: (col) => col.field === "taxID",
    template: correctionVerticalSplitTemplate("taxID"),
  },
  {
    match: (col) => col.field === "countryCode",
    template: correctionVerticalSplitTemplate("countryCode"),
  },
];
```

## Data Structure Requirements

Your data should include before/after values for corrections:

```javascript
const correctionData = [
  {
    posID: 1,
    countryCode: "DE",
    countryCode_before: "DE",
    countryCode_after: "FR",
    taxID: "TAX123",
    taxID_before: "TAX123",
    taxID_after: "TAX456",
    valueNum: 1500.0,
    valueNum_before: 1200.0,
    valueNum_after: 1500.0,
    threePartsTrans: 2,
    threePartsTrans_before: 1,
    threePartsTrans_after: 2,
  },
];
```

## Complete Implementation Example

```javascript
import {useVatUEGridConfig} from "./hooks/useVatUEGridConfig";
import {useTemplates} from "../elements/syncfusion-grid/features/templates/useTemplates";

const MyComponent = () => {
    const [data, setData] = useState([]);
    const [submissionType, setSubmissionType] = useState("submission");

    // Vertical template is always used for corrections

    const {
        data: processedData,
        columns,
        templateRules,
        aggregationConfig,
        rowHeight,
    } = useVatUEGridConfig(data, submissionType, intl);

    const {processColumns} = useTemplates({rules: templateRules});
    const finalColumns = processColumns(columns);

    return (
        <SyncfusionGrid
            data={processedData}
            columns={finalColumns}
            templateRules={templateRules}
            aggregationConfig={aggregationConfig}
            rowHeight={rowHeight}
        />
    );
};
```

## Benefits of Shared Templates

1. **Reusability**: Use correction templates in any grid across the project
2. **Consistency**: Same visual style for corrections everywhere
3. **Maintainability**: Update template logic in one place
4. **Simplicity**: Always uses vertical layout for clear before/after comparison
5. **Documentation**: Centralized template documentation
