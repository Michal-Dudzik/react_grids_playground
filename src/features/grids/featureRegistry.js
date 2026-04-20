import { buildGridChecklist } from './checklist';
import { mantineFeature } from './mantine/feature';
import { primeReactFeature } from './primeReact/feature';
import { reactDataGridFeature } from './reactDataGrid/feature';
import { tanStackTableFeature } from './tanStackTable/feature';
import { toolboxJsFeature } from './toolboxJs/feature';

export const gridFeatures = [
  {
    ...tanStackTableFeature,
    checklist: buildGridChecklist({
      summary:
        'Current baseline covers local columns, sorting, and custom React cell rendering. The shared wrapper feature set is still mostly pending for this grid.',
      supported: [
        'core-local-columns',
        'core-sorting',
        'columns-local-mode',
        'templates-custom-react',
        'templates-status-rendering',
      ],
      notes: {
        'core-sorting': 'Sorting is wired through TanStack state in the preview table.',
        'templates-custom-react': 'Status cells render through a custom React component.',
      },
    }),
  },
  {
    ...reactDataGridFeature,
    checklist: buildGridChecklist({
      summary:
        'Current baseline covers local columns, sorting, and custom React cell rendering. The demo also has resizable columns and a frozen first column outside the shared checklist.',
      supported: [
        'core-local-columns',
        'core-sorting',
        'columns-local-mode',
        'templates-custom-react',
        'templates-status-rendering',
      ],
      notes: {
        'core-sorting': 'Columns are sortable through defaultColumnOptions and per-column config.',
        'columns-local-mode': 'The current preview is configured from a local columns array.',
      },
    }),
  },
  {
    ...toolboxJsFeature,
    checklist: buildGridChecklist({
      summary:
        'Current baseline only covers local columns and sortable headers. No shared wrapper behaviors or custom render pipeline are in place yet.',
      supported: ['core-local-columns', 'core-sorting', 'columns-local-mode'],
      notes: {
        'core-sorting': 'Sortable headers are enabled through the Toolbox grid column config.',
      },
    }),
  },
  {
    ...primeReactFeature,
    checklist: buildGridChecklist({
      summary:
        'Current baseline covers local columns, sorting, and custom React cell rendering. Shared wrapper behaviors like search, persistence, footer actions, and print/export still need implementation.',
      supported: [
        'core-local-columns',
        'core-sorting',
        'columns-local-mode',
        'templates-custom-react',
        'templates-status-rendering',
      ],
      notes: {
        'core-sorting': 'PrimeReact sortable columns are enabled on each preview column.',
        'templates-custom-react': 'The status column uses a custom body renderer.',
      },
    }),
  },
  {
    ...mantineFeature,
    checklist: buildGridChecklist({
      summary:
        'Current baseline is mostly presentational: local columns plus custom React status rendering. Sorting, selection, paging, and wrapper-level integration still need to be added.',
      supported: ['core-local-columns', 'columns-local-mode', 'templates-custom-react', 'templates-status-rendering'],
      notes: {
        'templates-custom-react': 'The status column uses a custom render function.',
      },
    }),
  },
];
