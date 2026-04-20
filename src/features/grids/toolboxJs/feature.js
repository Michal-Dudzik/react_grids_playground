import { lazy } from 'react';

const ToolboxJsPreview = lazy(() =>
  import('./ToolboxJsPreview').then(({ ToolboxJsPreview: PreviewComponent }) => ({
    default: PreviewComponent,
  })),
);

export const toolboxJsFeature = {
  id: 'toolboxjs',
  path: '/toolboxjs',
  navLabel: 'ToolboxJS',
  shortLabel: 'TB',
  title: 'ToolboxJS',
  description: 'A placeholder slot for testing ToolboxJS in the same shell as the other grid candidates.',
  status: 'planned',
  library: 'ToolboxJS',
  strengths: ['Unknown fit', 'Worth validating', 'Fast comparison slot'],
  evaluationFocus: 'Check whether the API and baseline behavior are competitive enough to justify a deeper integration.',
  PreviewComponent: ToolboxJsPreview,
};
