export function PageHeader({
  title,
  description,
  themeMode,
  locale,
  onToggleLocale,
  onToggleTheme,
  onToggleMobileMenu,
}) {
  const isPolish = locale === 'pl-PL';
  const nextLocale = isPolish ? 'EN' : 'PL';
  const nextLanguage = isPolish ? 'English' : 'Polish';
  const currentLanguage = isPolish ? 'Polski' : 'English';

  return (
    <header className="page-header">
      <div className="page-header__title-group">
        <button
          aria-label="Toggle navigation"
          className="page-header__menu-button"
          onClick={onToggleMobileMenu}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
        <div>
          <h1>{title}</h1>
          {description ? <p className="page-header__description">{description}</p> : null}
        </div>
      </div>
      <div className="page-header__actions">
        <button
          aria-label={'Switch language to ' + nextLanguage}
          aria-pressed={isPolish}
          className={[
            'theme-toggle',
            'locale-toggle',
            isPolish ? 'locale-toggle--pl' : 'locale-toggle--en',
          ].join(' ')}
          onClick={onToggleLocale}
          type="button"
        >
          <span className="theme-toggle__track locale-toggle__track" aria-hidden="true">
            <span className="locale-toggle__choice locale-toggle__choice--en">EN</span>
            <span className="locale-toggle__choice locale-toggle__choice--pl">PL</span>
            <span className="theme-toggle__thumb locale-toggle__thumb" />
          </span>
          <span className="theme-toggle__label">{currentLanguage}</span>
        </button>
        <button
          aria-label={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
          className="theme-toggle"
          onClick={onToggleTheme}
          type="button"
        >
          <span className="theme-toggle__track">
            <span className="theme-toggle__thumb" />
          </span>
          <span className="theme-toggle__label">{themeMode === 'light' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </header>
  );
}
