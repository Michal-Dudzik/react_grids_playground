import { Navigate, Route, Routes } from 'react-router-dom';
import { gridFeatures } from '../features/grids/featureRegistry';
import { GridFeaturePage } from '../features/grids/shared/GridFeaturePage';
import { AppShell } from './AppShell';

export function App() {
  const defaultPath = gridFeatures[0]?.path ?? '/';

  return (
    <AppShell navigationItems={gridFeatures}>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              replace
              to={defaultPath}
            />
          }
        />
        {gridFeatures.map((feature) => (
          <Route
            key={feature.path}
            path={feature.path}
            element={<GridFeaturePage feature={feature} />}
          />
        ))}
        <Route
          path="*"
          element={
            <Navigate
              replace
              to={defaultPath}
            />
          }
        />
      </Routes>
    </AppShell>
  );
}
