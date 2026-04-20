import { lazy } from 'react';

const PrimeReactPreview = lazy(() =>
  import('./PrimeReactPreview').then(({ PrimeReactPreview: PreviewComponent }) => ({
    default: PreviewComponent,
  })),
);

export const primeReactFeature = {
  id: 'prime-react',
  path: '/prime-react',
  navLabel: 'PrimeReact',
  shortLabel: 'PR',
  title: 'PrimeReact',
  description: 'Component-heavy React toolkit with a mature data table offering and many built-in interaction patterns.',
  status: 'planned',
  library: 'PrimeReact',
  strengths: ['Rich components', 'Built-in table patterns', 'Mature ecosystem'],
  evaluationFocus: 'Measure how much customization is needed before the table feels consistent with your main app.',
  PreviewComponent: PrimeReactPreview,
};
