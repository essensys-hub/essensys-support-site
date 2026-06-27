import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import './Auth.css';

/** OAuth cloud — désactivé temporairement (réactiver quand les providers sont prêts). */
const OAUTH_PROVIDERS_ENABLED = false;

const persistAuth = (token, role) => {
    // Portail /portal/ et admin lisent adminToken (localStorage + sessionStorage).
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

                    <div className="form-group checkbox-group auth-remember">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <label htmlFor="rememberMe">Se souvenir de moi</label>
                    </div>

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
                    <Link to="/register" className="auth-link">S'inscrire</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
