import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './Layout.css';
import logo from '../assets/logosml.png';

const Layout = ({ children }) => {
    // Check for admin token in both storages
    const [adminToken, setAdminToken] = React.useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
    const [adminRole, setAdminRole] = React.useState(localStorage.getItem('adminRole') || sessionStorage.getItem('adminRole'));

    React.useEffect(() => {
        const handleAuthChange = () => {
            setAdminToken(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
            setAdminRole(localStorage.getItem('adminRole') || sessionStorage.getItem('adminRole'));
        };

        window.addEventListener('auth-change', handleAuthChange);
        window.addEventListener('storage', handleAuthChange); // Also listen to cross-tab storage changes

        return () => {
            window.removeEventListener('auth-change', handleAuthChange);
            window.removeEventListener('storage', handleAuthChange);
        };
    }, []);

    return (
        <div className="layout-container">
            <header className="main-header">
                <div className="logo">
                    <img src={logo} alt="Essensys" />
                </div>
                <nav>
                    <ul>
                        <li><Link to="/">Accueil</Link></li>
                        <li><Link to="/support">Support</Link></li>
                        <li><Link to="/raspberrypi">Raspberry Pi</Link></li>
                        {['admin_global', 'admin_local', 'admin'].includes(adminRole) && (
                            <li><Link to="/admin">Admin</Link></li>
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
                        <div className="user-menu">
                            <Link to="/profile" className="nav-btn-login" style={{ marginRight: '10px' }}>Profil</Link>
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
                                style={{ marginLeft: '10px', background: 'transparent', border: '1px solid white', borderRadius: '20px', padding: '6px 16px', color: 'white', cursor: 'pointer' }}
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </header >
            <main className="main-content">
                {children}
            </main>
            <footer className="main-footer">
                <p>© 2026 Projet Communautaire Essensys - v1.0.0</p>
            </footer>
        </div >
    );
};
export default Layout;
