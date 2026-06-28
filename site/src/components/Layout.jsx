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

    return (
        <div className="layout-container">
            <header className="main-header">
                <div className="logo">
                    <img src={logo} alt="Essensys" />
                </div>

                {/* Hamburger button — visible on mobile only (CSS controls display) */}
                <button
                    className="hamburger-btn"
                    aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                    aria-expanded={menuOpen}
                    aria-controls="main-nav"
                    onClick={() => setMenuOpen(prev => !prev)}
                >
                    {menuOpen ? '✕' : '☰'}
                </button>

                <nav id="main-nav" className={menuOpen ? 'nav-open' : ''}>
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
                    {!adminToken ? (
                        <>
                            <Link to="/register" className="nav-btn-signup">Sign up</Link>
                            <Link to="/login" className="nav-btn-login">Log in</Link>
                        </>
                    ) : (
                        <div className="user-menu" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <a href="/portal/" className="nav-btn-login">
                                Portail remote
                            </a>
                            <Link to="/profile" className="nav-btn-login">Profil</Link>
                            {['admin_global', 'admin_local', 'admin'].includes(adminRole) && (
                                <Link to="/admin" className="nav-btn-login">Dashboard</Link>
                            )}
                            <button
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
                    )}
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
