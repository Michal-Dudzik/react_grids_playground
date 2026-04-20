import { NavLink } from 'react-router-dom';

export function SideNav({ items, expanded, mobileOpen, onCloseMobile, onToggleExpand }) {
  return (
    <>
      <button
        aria-hidden={!mobileOpen}
        className={`side-nav__backdrop ${mobileOpen ? 'side-nav__backdrop--visible' : ''}`}
        onClick={onCloseMobile}
        tabIndex={mobileOpen ? 0 : -1}
        type="button"
      />
      <aside
        className={[
          'side-nav',
          expanded ? 'side-nav--expanded' : 'side-nav--collapsed',
          mobileOpen ? 'side-nav--mobile-open' : '',
        ].join(' ')}
      >
        <div className="side-nav__top-row">
          <NavLink
            className={({ isActive }) =>
              ['side-nav__icon-link', isActive ? 'side-nav__icon-link--active' : ''].filter(Boolean).join(' ')
            }
            to="/overview"
          >
            <svg
              aria-hidden="true"
              className="side-nav__top-icon"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 10.5L12 4L20 10.5V20H14.5V14.5H9.5V20H4V10.5Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </NavLink>

          <button
            aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
            className="side-nav__expand-toggle"
            onClick={onToggleExpand}
            type="button"
          >
            <svg
              aria-hidden="true"
              className={`side-nav__expand-icon ${expanded ? 'side-nav__expand-icon--collapsed' : ''}`}
              viewBox="0 0 24 24"
            >
              <path
                d="M14 6L8 12L14 18"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>

        <div className="side-nav__section">
          <p className="side-nav__section-label">{expanded ? 'Grid Features' : 'GF'}</p>
          <nav className="side-nav__links">
            {items.map((item) => (
              <NavLink
                key={item.path}
                className={({ isActive }) =>
                  ['side-nav__link', isActive ? 'side-nav__link--active' : ''].filter(Boolean).join(' ')
                }
                to={item.path}
              >
                <span className="side-nav__link-pill">{item.shortLabel}</span>
                {expanded ? <span>{item.navLabel}</span> : null}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
