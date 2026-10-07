import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Auth.css';
import useTurnstile, { TURNSTILE_SITE_KEY } from '../hooks/useTurnstile';

/**
 * The server answers every accepted request identically, so this page must not
 * imply anything about whether the address is registered. The confirmation is
 * shown verbatim for a hit and a miss alike.
 */
const CONFIRMATION =
    "Si un compte existe pour cette adresse, un email de réinitialisation vient d'être envoyé. "
    + 'Le lien est valable une heure.';

const ForgotPassword = () => {
    const [searchParams] = useSearchParams();
    // Carried over from the login form so a user who just mistyped their
    // password does not retype their address.
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const { widgetRef, token, ready, reset } = useTurnstile();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!ready) {
            setError('Veuillez valider le captcha.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/password/forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), turnstile_token: token }),
            });
            const data = await res.json().catch(() => ({}));

            if (res.status === 202) {
                setSent(true);
                return;
            }
            if (res.status === 429) {
                setError('Trop de demandes. Merci de réessayer dans une heure.');
            } else if (data.error === 'invalid_email') {
                setError('Adresse email invalide.');
            } else if (data.error === 'captcha_required' || data.error === 'captcha_failed') {
                setError('Échec de la vérification captcha. Merci de réessayer.');
            } else {
                setError('La demande a échoué. Merci de réessayer.');
            }
            reset();
        } catch {
            setError('Erreur de connexion. Merci de réessayer.');
            reset();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '440px' }}>
                <div className="auth-header">
                    <h2>Mot de passe oublié</h2>
                    {!sent && <p>Recevez un lien pour choisir un nouveau mot de passe</p>}
                </div>

                {sent ? (
                    <>
                        <div className="success-msg">{CONFIRMATION}</div>
                        <p className="auth-hint">
                            Pensez à regarder dans vos courriers indésirables. Sans email au bout de
                            quelques minutes, écrivez à{' '}
                            <a href="mailto:support@essensys.fr" className="auth-link">
                                support@essensys.fr
                            </a>
                            .
                        </p>
                        <Link to="/login" className="auth-btn btn-primary auth-btn-link">
                            Retour à la connexion
                        </Link>
                    </>
                ) : (
                    <>
                        {error && <div className="error-msg">{error}</div>}

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="forgot-email">Email</label>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    className="auth-input"
                                    placeholder="exemple@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="username"
                                    autoFocus
                                />
                            </div>

                            {TURNSTILE_SITE_KEY ? (
                                <div className="form-group" style={{ display: 'flex', justifyContent: 'center' }}>
                                    <div ref={widgetRef} />
                                </div>
                            ) : (
                                <p className="auth-hint">
                                    Captcha non configuré pour ce build (VITE_TURNSTILE_SITE_KEY).
                                </p>
                            )}

                            <button
                                type="submit"
                                className={`auth-btn btn-primary${!ready ? ' is-blocked' : ''}`}
                                disabled={loading || !ready}
                            >
                                {loading ? 'Envoi...' : 'Envoyer le lien'}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <Link to="/login" className="auth-link">Retour à la connexion</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
