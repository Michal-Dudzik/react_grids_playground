import { lazy } from 'react';

const ReactDataGridPreview = lazy(() =>
  import('./ReactDataGridPreview').then(({ ReactDataGridPreview: PreviewComponent }) => ({
    default: PreviewComponent,
  })),
);

export const reactDataGridFeature = {
  id: 'react-data-grid',
  path: '/react-data-grid',
  navLabel: 'React Data Grid',
  shortLabel: 'RDG',
  title: 'React Data Grid',
  description: 'Spreadsheet-like behavior out of the box with editing-focused workflows.',
  status: 'planned',
  library: 'react-data-grid',
  strengths: ['Editing flows', 'Virtualization', 'Excel-like feel'],
  evaluationFocus: 'Test how well inline editing and spreadsheet interactions map to your real product workflows.',
  PreviewComponent: ReactDataGridPreview,
};
