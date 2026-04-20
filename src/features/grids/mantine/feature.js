import { lazy } from 'react';

const MantinePreview = lazy(() =>
  import('./MantinePreview').then(({ MantinePreview: PreviewComponent }) => ({
    default: PreviewComponent,
  })),
);

export const mantineFeature = {
  id: 'mantine',
  path: '/mantine',
  navLabel: 'Mantine',
  shortLabel: 'MN',
  title: 'Mantine',
  description: 'A clean React UI ecosystem that is worth testing for grid-adjacent workflows and styling flexibility.',
  status: 'planned',
  library: 'Mantine',
  strengths: ['Clean styling', 'Modern React fit', 'Design flexibility'],
  evaluationFocus: 'Validate whether the Mantine ecosystem gives you enough table capability without fighting the design layer.',
  PreviewComponent: MantinePreview,
};
