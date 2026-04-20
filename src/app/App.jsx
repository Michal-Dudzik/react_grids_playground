import { Navigate, Route, Routes } from 'react-router-dom';
import { OverviewPage } from '../features/overview/OverviewPage';
import { gridFeatures } from '../features/grids/featureRegistry';
import { GridFeaturePage } from '../features/grids/shared/GridFeaturePage';
import { AppShell } from './AppShell';

export function App() {
  return (
    <AppShell navigationItems={gridFeatures}>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              replace
              to="/overview"
            />
          }
        />
        <Route
          path="/overview"
          element={<OverviewPage />}
        />
        {gridFeatures.map((feature) => (
          <Route
            key={feature.path}
            path={feature.path}
            element={<GridFeaturePage feature={feature} />}
          />
        ))}
      </Routes>
    </AppShell>
  );
}
