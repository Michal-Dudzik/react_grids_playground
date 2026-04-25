# gridTemplates Feature

This feature provides a flexible, rule-based system for applying templates to SyncfusionGrid columns, even when columns
are fetched dynamically from an API.

## Overview

- **useTemplates**: A hook for defining and applying template rules to columns.
- **boolCheckmarkTemplate**: A ready-to-use template for rendering a checkmark icon in boolean columns.
- **threePartsTransTemplate**: Template for three-part transaction status with color indicators.
- **Correction Templates**: Templates for displaying before/after data in correction grids (vertical layout):
  - **correctionVerticalSplitTemplate**: Vertical format (top: old, bottom: new)
  - **correctionLabelTemplate**: "Było/Jest" labels for correction mode
  - **correctionThreePartsVerticalTemplate**: Special vertical template for three-part transactions
  - **correctionComparisonTemplate**: Horizontal format (old → new) - available but not used in DeclarationVatUE
  - **verticalDividerTemplate**: Same value in both halves with visual divider

## Usage

### 1. Import the Feature

```js
import {
  useTemplates,
  boolCheckmarkTemplate,
} from "./features/templates/useTemplates";
import { LuCheck } from "react-icons/lu";
```

### 2. Define Template Rules

Each rule has a `match` function (receives a column object) and a `template` (a function/component to render for
matching columns).

```js
const templateRules = [
  {
    match: (col) =>
      col.dataType === "boolean" || /bool|flag|is_|czy_/.test(col.field),
    template: boolCheckmarkTemplate({ icon: <LuCheck /> }),
  },
  // Add more rules for other templates as needed
];
```

### 3. Process Columns

Use the `useTemplates` hook to get a `processColumns` function. Pass your API-fetched columns through it before
rendering the grid:

```js
const {processColumns} = useTemplates({rules: templateRules});
const columns = processColumns(apiColumns); // apiColumns fetched from API

<SyncfusionGrid
    columns={columns}
  ...
/>
```

### 4. boolCheckmarkTemplate

This template replaces the cell content with a checkmark icon if the value is considered "true" (supports true/false,
0/1, 'prawda', 'fałsz', 'true', 'false', '1', '0', 'TAK', 'tak', 'T', 't').

```js
import { boolCheckmarkTemplate } from "./features/templates/useTemplates";
import { LuCheck } from "react-icons/lu";

const checkmarkTemplate = boolCheckmarkTemplate({ icon: <LuCheck /> });
```

### 5. Correction Templates

These templates are designed for displaying before/after correction data:

```js
import {
  correctionComparisonTemplate,
  correctionVerticalSplitTemplate,
  correctionLabelTemplate,
  threePartsTransTemplate,
} from "./features/templates/useTemplates";

// Correction templates: vertical split (top: old, bottom: new)
const correctionRules = [
  {
    match: (col) => col.field === "correctionLabel",
    template: correctionLabelTemplate(),
  },
  {
    match: (col) => col.field === "valueNum",
    template: correctionVerticalSplitTemplate("valueNum"),
  },
];
```

**Data Requirements**: Correction templates expect data with `${field}_before` and `${field}_after` properties (e.g., `valueNum_before`, `valueNum_after`).

## Extending

- Add more rules for other templates (e.g., custom buttons, progress bars, etc.).
- You can match columns by any property (field name, dataType, custom API metadata, etc.).
- Template functions receive Syncfusion's cell props and can render any React content.

## Best Practices

- Keep template rules in a central place for maintainability.
- Use templates for advanced rendering; use decoration for simple visual cues.
- Combine with the decoration API for maximum flexibility.

---

For more advanced examples or custom templates, see the codebase or ask for a template for your specific use case.
