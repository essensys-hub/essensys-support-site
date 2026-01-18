import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                if (rememberMe) {
                    localStorage.setItem('adminToken', data.token);
                    localStorage.setItem('adminRole', data.user.role);
                } else {
                    sessionStorage.setItem('adminToken', data.token);
                    sessionStorage.setItem('adminRole', data.user.role);
                }
                // Dispatch event to notify Layout
                window.dispatchEvent(new Event('auth-change'));

                // Redirect to admin
                navigate('/admin');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Bienvenue</h2>
                    <p>Connectez-vous pour accéder à l'administration</p>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="exemple@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="Votre mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group checkbox-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            style={{ width: 'auto' }}
                        />
                        <label htmlFor="rememberMe" style={{ marginBottom: 0, cursor: 'pointer' }}>Se souvenir de moi</label>
                    </div>

                    <button type="submit" className="auth-btn btn-primary" disabled={loading}>
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <div className="divider">
                    <span>OU</span>
                </div>

                <div className="oauth-buttons">
                    <a href="/api/auth/google/login" className="auth-btn btn-oauth btn-google">
                        <span style={{ marginRight: '10px' }}>G</span> Continuer avec Google
                    </a>
                    <a href="/api/auth/apple/login" className="auth-btn btn-oauth btn-apple">
                        <span style={{ marginRight: '10px' }}></span> Continuer avec Apple
                    </a>
                </div>

                <div className="auth-footer">
                    Pas encore de compte ?
                    <Link to="/register" className="auth-link">S'inscrire</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
