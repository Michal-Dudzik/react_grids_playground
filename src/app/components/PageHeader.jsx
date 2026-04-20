export function PageHeader({ title, description, themeMode, onToggleTheme, onToggleMobileMenu }) {
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
