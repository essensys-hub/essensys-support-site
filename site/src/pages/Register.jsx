import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        website: '', // honeypot
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState('');
    const widgetRef = useRef(null);
    const widgetIdRef = useRef(null);

    const resetTurnstile = useCallback(() => {
        setTurnstileToken('');
        if (window.turnstile && widgetIdRef.current != null) {
            try {
                window.turnstile.reset(widgetIdRef.current);
            } catch {
                /* ignore */
            }
        }
    }, []);

    useEffect(() => {
        if (!TURNSTILE_SITE_KEY) {
            return undefined;
        }

        const renderWidget = () => {
            if (!widgetRef.current || !window.turnstile || widgetIdRef.current != null) {
                return;
            }
            widgetIdRef.current = window.turnstile.render(widgetRef.current, {
                sitekey: TURNSTILE_SITE_KEY,
                callback: (token) => setTurnstileToken(token || ''),
                'expired-callback': () => setTurnstileToken(''),
                'error-callback': () => setTurnstileToken(''),
            });
        };

        if (window.turnstile) {
            renderWidget();
            return undefined;
        }

        const existing = document.querySelector('script[data-essensys-turnstile]');
        if (existing) {
            existing.addEventListener('load', renderWidget);
            return () => existing.removeEventListener('load', renderWidget);
        }

        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.dataset.essensysTurnstile = '1';
        script.addEventListener('load', renderWidget);
        document.head.appendChild(script);
        return () => script.removeEventListener('load', renderWidget);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const parseErrorMessage = async (res) => {
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            if (data.message) return data.message;
        } catch {
            /* plain text */
        }
        if (res.status === 403) return 'Captcha verification failed. Please try again.';
        if (res.status === 429) return 'Too many registration attempts. Please try again later.';
        if (res.status === 409) return 'An account with this email already exists.';
        return text || 'Registration failed';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (TURNSTILE_SITE_KEY && !turnstileToken) {
            setError('Please complete the captcha verification.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    password: formData.password,
                    turnstile_token: turnstileToken,
                    website: formData.website,
                }),
            });

            if (res.ok) {
                navigate('/login');
                return;
            }

            setError(await parseErrorMessage(res));
            resetTurnstile();
        } catch {
            setError('Connection error. Please try again.');
            resetTurnstile();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '480px' }}>
                <div className="auth-header">
                    <h2>Créer un compte</h2>
                    <p>Rejoignez Essensys Support</p>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {/* Honeypot — leave empty */}
                    <div
                        aria-hidden="true"
                        style={{ position: 'absolute', left: '-9999px', top: '-9999px', height: 0, overflow: 'hidden' }}
                    >
                        <label htmlFor="website">Website</label>
                        <input
                            type="text"
                            id="website"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            value={formData.website}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Prénom</label>
                            <input
                                type="text"
                                name="first_name"
                                className="auth-input"
                                placeholder="Jean"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Nom</label>
                            <input
                                type="text"
                                name="last_name"
                                className="auth-input"
                                placeholder="Dupont"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            className="auth-input"
                            placeholder="exemple@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            name="password"
                            className="auth-input"
                            placeholder="Minimum 8 caractères"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirmer le mot de passe</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="auth-input"
                            placeholder="Répétez le mot de passe"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {TURNSTILE_SITE_KEY ? (
                        <div className="form-group" style={{ display: 'flex', justifyContent: 'center' }}>
                            <div ref={widgetRef} />
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.85rem', color: '#888', margin: '0 0 12px' }}>
                            Captcha is not configured for this build (set VITE_TURNSTILE_SITE_KEY).
                        </p>
                    )}

                    <button type="submit" className="auth-btn btn-primary" disabled={loading}>
                        {loading ? 'Inscription...' : "S'inscrire"}
                    </button>
                </form>

                <div className="auth-footer">
                    Déjà un compte ?
                    <Link to="/login" className="auth-link">Se connecter</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
