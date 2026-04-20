import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHeader } from './components/PageHeader';
import { SideNav } from './components/SideNav';
import { useThemeMode } from './useThemeMode';

export function AppShell({ children, navigationItems }) {
  const location = useLocation();
  const { themeMode, toggleTheme } = useThemeMode();
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  const currentFeature = navigationItems.find((item) => item.path === location.pathname);
  const pageTitle = currentFeature?.title ?? 'Grid Comparison Overview';
  const pageDescription = currentFeature ? undefined : 'Choose a grid from the menu and start testing.';

  return (
    <div className="app-shell">
      <SideNav
        expanded={isNavExpanded}
        items={navigationItems}
        mobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        onToggleExpand={() => setIsNavExpanded((currentValue) => !currentValue)}
      />
      <div className="app-shell__content">
        <PageHeader
          description={pageDescription}
          onToggleMobileMenu={() => setIsMobileNavOpen((currentValue) => !currentValue)}
          onToggleTheme={toggleTheme}
          themeMode={themeMode}
          title={pageTitle}
        />
        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
}
