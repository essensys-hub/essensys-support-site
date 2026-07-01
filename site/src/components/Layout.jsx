import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './Layout.css';
import logo from '../assets/logosml.png';

const Layout = () => {
    const [adminToken, setAdminToken] = React.useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
    const [adminRole, setAdminRole] = React.useState(localStorage.getItem('adminRole') || sessionStorage.getItem('adminRole'));
    const [menuOpen, setMenuOpen] = React.useState(false);

    React.useEffect(() => {
        const handleAuthChange = () => {
            setAdminToken(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
            setAdminRole(localStorage.getItem('adminRole') || sessionStorage.getItem('adminRole'));
        };

        window.addEventListener('auth-change', handleAuthChange);
        window.addEventListener('storage', handleAuthChange);

        return () => {
            window.removeEventListener('auth-change', handleAuthChange);
            window.removeEventListener('storage', handleAuthChange);
        };
    }, []);

    const closeMenu = () => setMenuOpen(false);

    const authButtons = !adminToken ? (
        <>
            <Link to="/register" className="nav-btn-signup" onClick={closeMenu}>Sign up</Link>
            <Link to="/login" className="nav-btn-login" onClick={closeMenu}>Log in</Link>
        </>
    ) : (
        <div className="user-menu">
            <a href="https://mon.essensys.fr/" className="nav-btn-login" onClick={closeMenu} target="_blank" rel="noopener noreferrer">
                Portail
            </a>
            <Link to="/profile" className="nav-btn-login" onClick={closeMenu}>Profil</Link>
            {['admin_global', 'admin_local', 'admin'].includes(adminRole) && (
                <Link to="/admin" className="nav-btn-login" onClick={closeMenu}>Dashboard</Link>
            )}
            <button
                type="button"
                onClick={() => {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminRole');
                    sessionStorage.removeItem('adminToken');
                    sessionStorage.removeItem('adminRole');
                    window.dispatchEvent(new Event('auth-change'));
                    window.location.reload();
                }}
                className="nav-btn-logout"
            >
                Logout
            </button>
        </div>
    );

    return (
        <div className="layout-container">
            <div
                className={`nav-overlay${menuOpen ? ' visible' : ''}`}
                onClick={closeMenu}
                aria-hidden="true"
            />
            <header className="main-header">
                <div className="header-inner">
                    <div className="logo">
                        <img src={logo} alt="Essensys" />
                    </div>

                    <button
                        type="button"
                        className="hamburger-btn"
                        aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                        aria-expanded={menuOpen}
                        aria-controls="main-nav"
                        onClick={() => setMenuOpen((prev) => !prev)}
                    >
                        {menuOpen ? '✕' : '☰'}
                    </button>

                    <div className={`header-menu${menuOpen ? ' menu-open' : ''}`}>
                        <nav id="main-nav">
                            <ul>
                                <li><Link to="/" onClick={closeMenu}>Accueil</Link></li>
                                <li><Link to="/support" onClick={closeMenu}>Support</Link></li>
                                <li><Link to="/blog" onClick={closeMenu}>Blog</Link></li>
                                <li><Link to="/raspberrypi" onClick={closeMenu}>Raspberry Pi</Link></li>
                                <li>
                                    <a
                                        href={import.meta.env.VITE_DOCS_URL || '/docs/'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={closeMenu}
                                    >
                                        Documentation
                                    </a>
                                </li>
                                {['admin_global', 'admin_local', 'admin'].includes(adminRole) && (
                                    <li><Link to="/admin" onClick={closeMenu}>Admin</Link></li>
                                )}
                            </ul>
                        </nav>

                        <div className="auth-buttons-header">
                            {authButtons}
                        </div>
                    </div>
                </div>
            </header>
            <main className="main-content">
                <Outlet />
            </main>
            <footer className="main-footer">
                <p>© 2026 Projet Communautaire Essensys - v1.0.0</p>
            </footer>
        </div>
    );
};
export default Layout;
