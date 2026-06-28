import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import './Auth.css';
import logo from '../assets/logosml.png';
import fondImage from '../assets/fond-inprogress.png';

/** OAuth cloud — désactivé temporairement (réactiver quand les providers sont prêts). */
const OAUTH_PROVIDERS_ENABLED = false;

const persistAuth = (token, role) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminRole', role);
    sessionStorage.setItem('adminToken', token);
    sessionStorage.setItem('adminRole', role);
};

const Login = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('return') || '/admin';
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

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                persistAuth(data.token, data.user.role);
                window.dispatchEvent(new Event('auth-change'));

                if (returnTo.startsWith('/')) {
                    window.location.href = returnTo;
                } else {
                    navigate(returnTo);
                }
            } else if (data.error === 'account_forbidden' && data.redirect) {
                window.location.href = data.redirect;
            } else {
                setError(data.message || data.error || 'Login failed');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="auth-login-root auth-login-aurora"
            style={{ '--auth-fond': `url(${fondImage})` }}
        >
            <div className="auth-aurora__mesh" aria-hidden />
            <div className="auth-aurora__content">
                <div className="auth-aurora__panel">
                    <div className="auth-card">
                        <div className="auth-header">
                            <img src={logo} alt="mon Essensys" className="auth-card-logo" />
                            <h1>Bienvenue</h1>
                            <p>Connectez-vous pour accéder à l&apos;administration</p>
                        </div>

                        {error && <div className="error-msg">{error}</div>}

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="login-email">Email</label>
                                <input
                                    id="login-email"
                                    type="email"
                                    className="auth-input"
                                    placeholder="exemple@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="login-password">Mot de passe</label>
                                <input
                                    id="login-password"
                                    type="password"
                                    className="auth-input"
                                    placeholder="Votre mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>

                            <label className="auth-remember" htmlFor="rememberMe">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Se souvenir de moi</span>
                            </label>

                            <button type="submit" className="auth-btn btn-primary" disabled={loading}>
                                {loading ? 'Connexion...' : 'Se connecter'}
                            </button>
                        </form>

                        <div className="divider" aria-hidden>
                            <span>OU</span>
                        </div>

                        <div className="oauth-buttons">
                            <button
                                type="button"
                                className="auth-btn btn-oauth btn-google"
                                disabled={!OAUTH_PROVIDERS_ENABLED}
                                title={OAUTH_PROVIDERS_ENABLED ? undefined : 'Bientôt disponible'}
                                aria-disabled={!OAUTH_PROVIDERS_ENABLED}
                            >
                                <span className="oauth-icon" aria-hidden>G</span>
                                Continuer avec Google
                            </button>
                            <button
                                type="button"
                                className="auth-btn btn-oauth btn-apple"
                                disabled={!OAUTH_PROVIDERS_ENABLED}
                                title={OAUTH_PROVIDERS_ENABLED ? undefined : 'Bientôt disponible'}
                                aria-disabled={!OAUTH_PROVIDERS_ENABLED}
                            >
                                <span className="oauth-icon" aria-hidden></span>
                                Continuer avec Apple
                            </button>
                        </div>

                        <div className="auth-footer">
                            Pas encore de compte ?
                            <Link to="/register" className="auth-link">S&apos;inscrire</Link>
                        </div>
                    </div>
                </div>
                <aside className="auth-aurora__hero">
                    <h2>Votre domotique Essensys, partout</h2>
                    <p>
                        Même expérience que sur votre gateway locale — optimisé pour iPhone, iPad,
                        écran mural et poste de contrôle.
                    </p>
                </aside>
            </div>
        </div>
    );
};

export default Login;
