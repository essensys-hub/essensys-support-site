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
                        {/* <li><Link to="/admin">Admin</Link></li> Link moved to auth buttons */}
                    </ul>
                </nav>
                <div className="auth-buttons-header">
                    {!localStorage.getItem('adminToken') ? (
                        <>
                            <Link to="/register" className="nav-btn-signup">Sign up</Link>
                            <Link to="/login" className="nav-btn-login">Log in</Link>
                        </>
                    ) : (
                        <Link to="/admin" className="nav-btn-login">Dashboard</Link>
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
