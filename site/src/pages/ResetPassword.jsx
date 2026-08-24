import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import './Auth.css';

const MIN_PASSWORD_LENGTH = 8;
const REDIRECT_DELAY_MS = 3000;

/** Token states mirror the backend: only 'valid' renders the password fields. */
const STATUS = {
    CHECKING: 'checking',
    VALID: 'valid',
    EXPIRED: 'expired',
    USED: 'used',
    INVALID: 'invalid',
    DONE: 'done',
};

const DEAD_LINK_COPY = {
    [STATUS.EXPIRED]: 'Ce lien a expiré.',
    [STATUS.USED]: "Ce lien n'est plus valide.",
    [STATUS.INVALID]: 'Lien de réinitialisation invalide.',
};

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [status, setStatus] = useState(token ? STATUS.CHECKING : STATUS.INVALID);
    const [maskedEmail, setMaskedEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Pre-validate before showing the form so a dead link never invites the user
    // to pick a password they cannot save.
    useEffect(() => {
        if (!token) {
            return undefined;
        }
        let cancelled = false;

        const validate = async () => {
            try {
                const res = await fetch(
                    `/api/auth/password/reset/validate?token=${encodeURIComponent(token)}`,
                );
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;

                if (res.ok && data.valid) {
                    setMaskedEmail(data.email_masked || '');
                    setStatus(STATUS.VALID);
                    return;
                }
                setStatus(DEAD_LINK_COPY[data.reason] ? data.reason : STATUS.INVALID);
            } catch {
                if (!cancelled) setStatus(STATUS.INVALID);
            }
        };

        validate();
        return () => {
            cancelled = true;
        };
    }, [token]);

    // No automatic sign-in: the emailed link must not double as a session.
    useEffect(() => {
        if (status !== STATUS.DONE) {
            return undefined;
        }
        const timer = setTimeout(() => navigate('/login'), REDIRECT_DELAY_MS);
        return () => clearTimeout(timer);
    }, [status, navigate]);

    const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
    const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
    const incomplete = tooShort || mismatch || !password || !confirmPassword;

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();
            setError('');

            if (password.length < MIN_PASSWORD_LENGTH) {
                setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
                return;
            }
            if (password !== confirmPassword) {
                setError('Les mots de passe ne correspondent pas');
                return;
            }

            setLoading(true);
            try {
                const res = await fetch('/api/auth/password/reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, password }),
                });
                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    setStatus(STATUS.DONE);
                    return;
                }
                if (res.status === 429) {
                    setError('Trop de tentatives. Merci de réessayer plus tard.');
                    return;
                }
                if (res.status === 403) {
                    setError('Ce compte est désactivé. Contactez le support.');
                    return;
                }
                // invalid_token means the link died under us; anything else is a
                // password the server refused, and the link stays usable.
                if (data.error === 'invalid_token') {
                    setStatus(STATUS.USED);
                    return;
                }
                setError(data.message || 'La réinitialisation a échoué.');
            } catch {
                setError('Erreur de connexion. Merci de réessayer.');
            } finally {
                setLoading(false);
            }
        },
        [confirmPassword, password, token],
    );

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '440px' }}>
                <div className="auth-header">
                    <h2>Nouveau mot de passe</h2>
                    {status === STATUS.VALID && maskedEmail && <p>Compte : {maskedEmail}</p>}
                </div>

                {status === STATUS.CHECKING && <p className="auth-hint">Vérification du lien…</p>}

                {DEAD_LINK_COPY[status] && (
                    <>
                        <div className="error-msg">{DEAD_LINK_COPY[status]}</div>
                        <p className="auth-hint">
                            Demandez un nouveau lien de réinitialisation à{' '}
                            <a href="mailto:support@essensys.fr" className="auth-link">
                                support@essensys.fr
                            </a>
                            .
                        </p>
                        <Link to="/login" className="auth-btn btn-primary auth-btn-link">
                            Retour à la connexion
                        </Link>
                    </>
                )}

                {status === STATUS.DONE && (
                    <>
                        <div className="success-msg">
                            Mot de passe mis à jour. Vous pouvez vous connecter.
                        </div>
                        <Link to="/login" className="auth-btn btn-primary auth-btn-link">
                            Se connecter
                        </Link>
                    </>
                )}

                {status === STATUS.VALID && (
                    <>
                        {error && <div className="error-msg">{error}</div>}

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="reset-password">Nouveau mot de passe</label>
                                <input
                                    id="reset-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    placeholder={`Minimum ${MIN_PASSWORD_LENGTH} caractères`}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    autoFocus
                                />
                                <p className={`auth-strength ${tooShort ? 'is-weak' : 'is-ok'}`}>
                                    {password.length === 0
                                        ? `${MIN_PASSWORD_LENGTH} caractères minimum`
                                        : tooShort
                                          ? `Encore ${MIN_PASSWORD_LENGTH - password.length} caractère(s)`
                                          : 'Longueur suffisante'}
                                </p>
                            </div>

                            <div className="form-group">
                                <label htmlFor="reset-confirm">Confirmer le mot de passe</label>
                                <input
                                    id="reset-confirm"
                                    type={showPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    placeholder="Répétez le mot de passe"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                                {mismatch && (
                                    <p className="auth-strength is-weak">
                                        Les mots de passe ne correspondent pas
                                    </p>
                                )}
                            </div>

                            <label className="auth-remember" htmlFor="reset-show">
                                <input
                                    type="checkbox"
                                    id="reset-show"
                                    checked={showPassword}
                                    onChange={(e) => setShowPassword(e.target.checked)}
                                />
                                <span>Afficher le mot de passe</span>
                            </label>

                            <button
                                type="submit"
                                className={`auth-btn btn-primary${incomplete ? ' is-blocked' : ''}`}
                                disabled={loading || incomplete}
                            >
                                {loading ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                        </form>
                    </>
                )}

                {/* The dead-link and success states already offer a primary
                    action, so the footer link would only repeat it. */}
                {(status === STATUS.CHECKING || status === STATUS.VALID) && (
                    <div className="auth-footer">
                        <Link to="/login" className="auth-link">Retour à la connexion</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
