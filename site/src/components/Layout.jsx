import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './Layout.css';
import logo from '../assets/logosml.png';

const Layout = () => {
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
                        {localStorage.getItem('adminRole') === 'admin' && (
                            <li><Link to="/admin">Admin</Link></li>
                        )}
                    </ul>
                </nav>
                <div className="auth-buttons-header">
                    {!localStorage.getItem('adminToken') ? (
                        <>
                            <Link to="/register" className="nav-btn-signup">Sign up</Link>
                            <Link to="/login" className="nav-btn-login">Log in</Link>
                        </>
                    ) : (
                        <div className="user-menu">
                            <Link to="/admin" className="nav-btn-login">Dashboard</Link>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('adminToken');
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
            </header>
            <main className="main-content">
                <Outlet />
            </main>
            <footer className="main-footer">
                <p>© 2026 Projet Communautaire Essensys</p>
            </footer>
        </div>
    );
};

export default Layout;
