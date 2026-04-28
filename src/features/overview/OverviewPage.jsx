import { useState } from 'react';
import { gridFeatures } from '../grids/featureRegistry';
import { getChecklistSectionTotals, getChecklistTotals, gridChecklistSections } from '../grids/checklist';
import { PlaygroundCard } from '../../shared/components/PlaygroundCard';

export function OverviewPage() {
  const [activeFeatureId, setActiveFeatureId] = useState(gridFeatures[0]?.id ?? '');

  const activeFeature = gridFeatures.find((feature) => feature.id === activeFeatureId) ?? gridFeatures[0];

  return (
    <div className="page-grid">
      <PlaygroundCard
        footer={<span>Track TanStack wrapper parity here while keeping Syncfusion in the codebase for comparison work.</span>}
      >
        <div className="overview-checklist">
          <div
            aria-label="Grid checklist tabs"
            className="overview-checklist__tabs"
            role="tablist"
          >
            {gridFeatures.map((feature) => {
              const totals = getChecklistTotals(feature.checklist);
              const isActive = feature.id === activeFeature.id;

              return (
                <button
                  aria-controls={`overview-panel-${feature.id}`}
                  aria-selected={isActive}
                  className={`overview-checklist__tab ${isActive ? 'overview-checklist__tab--active' : ''}`}
                  id={`overview-tab-${feature.id}`}
                  key={feature.id}
                  onClick={() => setActiveFeatureId(feature.id)}
                  role="tab"
                  type="button"
                >
                  <span className="overview-checklist__tab-label">{feature.navLabel}</span>
                  <span className="overview-checklist__tab-meta">{totals.checked} / {totals.total}</span>
                </button>
              );
            })}
          </div>

          <section
            aria-labelledby={`overview-tab-${activeFeature.id}`}
            className="overview-checklist__panel"
            id={`overview-panel-${activeFeature.id}`}
            role="tabpanel"
          >
            {activeFeature.checklist.summary ? (
              <div className="overview-checklist__summary">
                {activeFeature.checklist.summary}
              </div>
            ) : null}
            <div className="overview-checklist__sections">
              {gridChecklistSections.map((section) => {
                const sectionTotals = getChecklistSectionTotals(activeFeature.checklist, section);

                return (
                  <section
                    className="overview-checklist__section"
                    key={section.id}
                  >
                    <div className="overview-checklist__section-header">
                      <div>
                        <h4>{section.title}</h4>
                      </div>
                      <span className="token">
                        {sectionTotals.checked} / {sectionTotals.total}
                      </span>
                    </div>

                    <div className="overview-checklist__table">
                      <div className="overview-checklist__table-head">
                        <span>Functionality</span>
                        <span>Has it</span>
                        <span>Notes</span>
                      </div>

                      {section.items.map((item) => {
                        const checklistItem = activeFeature.checklist.items[item.id];

                        return (
                          <div
                            className="overview-checklist__row"
                            key={item.id}
                          >
                            <span className="overview-checklist__feature">{item.label}</span>
                            <span className="overview-checklist__status-cell">
                              <span
                                aria-label={checklistItem.checked ? 'Supported' : 'Missing'}
                                className={`overview-checklist__status ${
                                  checklistItem.checked
                                    ? 'overview-checklist__status--checked'
                                    : 'overview-checklist__status--missing'
                                }`}
                                title={checklistItem.checked ? 'Supported' : 'Missing'}
                              >
                                {checklistItem.checked ? '✓' : '×'}
                              </span>
                            </span>
                            <span className="overview-checklist__note">
                              {checklistItem.note || 'No note yet.'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        </div>
      </PlaygroundCard>
    </div>
  );
}
