import { Suspense } from 'react';
import { GridPreviewTable } from './GridPreviewTable';

export function GridFeaturePage({ feature }) {
  const PreviewComponent = feature.PreviewComponent || GridPreviewTable;

  return (
    <div className="page-grid">
      <section className="grid-page-card">
        <Suspense fallback={<div className="grid-preview-loading">Loading grid…</div>}>
          <PreviewComponent />
        </Suspense>
      </section>
    </div>
  );
}
