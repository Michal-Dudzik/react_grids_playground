import { NavLink } from 'react-router-dom';

export function SideNav({ items, mobileOpen, onCloseMobile }) {
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
          mobileOpen ? 'side-nav--mobile-open' : '',
        ].join(' ')}
      >
        <div className="side-nav__section">
          <nav className="side-nav__links">
            {items.map((item) => (
              <NavLink
                key={item.path}
                className={({ isActive }) =>
                  ['side-nav__link', isActive ? 'side-nav__link--active' : ''].filter(Boolean).join(' ')
                }
                to={item.path}
                title={item.navLabel}
              >
                <span className="side-nav__link-pill">{item.shortLabel}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
