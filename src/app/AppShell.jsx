import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHeader } from './components/PageHeader';
import { SideNav } from './components/SideNav';
import { useAppLocale } from './locale';
import { useThemeMode } from './useThemeMode';

export function AppShell({ children, navigationItems }) {
  const location = useLocation();
  const { locale, toggleLocale } = useAppLocale();
  const { themeMode, toggleTheme } = useThemeMode();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  const currentFeature = navigationItems.find((item) => item.path === location.pathname);
  const pageTitle = currentFeature?.title ?? 'React Grids Playground';
  const pageDescription = currentFeature?.description;

  return (
    <div className="app-shell">
      <SideNav
        items={navigationItems}
        mobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />
      <div className="app-shell__content">
        <PageHeader
          description={pageDescription}
          locale={locale}
          onToggleLocale={toggleLocale}
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
