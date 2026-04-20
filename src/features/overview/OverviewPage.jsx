import { Link } from 'react-router-dom';
import { gridFeatures } from '../grids/featureRegistry';
import { PlaygroundCard } from '../../shared/components/PlaygroundCard';

export function OverviewPage() {
  return (
    <div className="page-grid">
      <PlaygroundCard
        description="A lightweight starting point for testing grid libraries inside one consistent shell."
        eyebrow="Start here"
        footer={<span>Pick a grid page from the menu or jump directly into one of the starter feature slots below.</span>}
        title="Grid playground"
        toolbar={
          <div className="token-row">
            <span className="token token--solid">JavaScript</span>
            <span className="token">Feature based</span>
            <span className="token">Ready for grids</span>
          </div>
        }
      >
        <div className="landing-page">
          <p className="landing-page__intro">
            Use this page as the neutral entry point. Every grid can plug into the same layout, theme, and card
            structure, which keeps comparisons quick and consistent.
          </p>
          <div className="landing-page__actions">
            {gridFeatures.map((feature) => (
              <Link
                className="primary-link"
                key={feature.path}
                to={feature.path}
              >
                Open {feature.shortLabel}
              </Link>
            ))}
          </div>
        </div>
      </PlaygroundCard>
    </div>
  );
}
