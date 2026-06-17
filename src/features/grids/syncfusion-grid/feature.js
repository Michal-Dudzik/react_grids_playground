import { lazy } from 'react';

const SyncfusionGridPreview = lazy(() =>
  import('./SyncfusionGridPreview').then(({ SyncfusionGridPreview: PreviewComponent }) => ({
    default: PreviewComponent,
  })),
);

export const syncfusionGridFeature = {
  id: 'syncfusion-grid',
  path: '/syncfusion-grid',
  navLabel: 'Syncfusion Grid',
  shortLabel: 'SF',
  title: 'Syncfusion Grid',
  description: 'Feature-rich data grid with built-in filtering, sorting, export, selection, and column tooling.',
  status: 'in-progress',
  library: '@syncfusion/ej2-react-grids',
  strengths: ['Integrated grid UI', 'Excel-style filtering', 'Export and print tooling'],
  evaluationFocus: 'Focus on ready-made grid behaviors and the wrapper work needed for app-specific presentation rules.',
  PreviewComponent: SyncfusionGridPreview,
};
