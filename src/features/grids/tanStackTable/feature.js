import { lazy } from 'react';

const TanStackTablePreview = lazy(() =>
  import('./TanStackTablePreview').then(({ TanStackTablePreview: PreviewComponent }) => ({
    default: PreviewComponent,
  })),
);

export const tanStackTableFeature = {
  id: 'tanstack-table',
  path: '/tanstack-table',
  navLabel: 'TanStack Table',
  shortLabel: 'TS',
  title: 'TanStack Table',
  description: 'Headless table primitives with maximum control when design requirements are not negotiable.',
  status: 'planned',
  library: '@tanstack/react-table',
  strengths: ['Full UI control', 'Composable', 'Lightweight core'],
  evaluationFocus: 'Focus on implementation effort versus the upside of total rendering and behavior control.',
  PreviewComponent: TanStackTablePreview,
};
