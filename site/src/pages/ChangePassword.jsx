import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Auth.css';
import { redirectAfterAuth } from '../lib/authRedirect';

const MIN_PASSWORD_LENGTH = 8;

const getStoredToken = () => localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || '';
const getStoredRole = () => localStorage.getItem('adminRole') || sessionStorage.getItem('adminRole') || '';

const clearAuth = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRole');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminRole');
    window.dispatchEvent(new Event('auth-change'));
};

/**
 * Forced-change screen for an account carrying an admin-issued temporary
 * password (server-side lock: every other authenticated route answers 409
 * until this succeeds — see lib/passwordChangeGuard.js). No navigation off
 * this page besides signing out: spec forced-password-change-ui requires no
 * echappatoire other than that.
 */
const ChangePassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('return') || '/admin';

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const tooShort = newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH;
    const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
    const incomplete = tooShort || mismatch || !currentPassword || !newPassword || !confirmPassword;

    const handleLogout = useCallback(() => {
        clearAuth();
        navigate('/login');
    }, [navigate]);

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();
            setError('');

            if (newPassword.length < MIN_PASSWORD_LENGTH) {
                setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
                return;
            }
            if (newPassword !== confirmPassword) {
                setError('Les mots de passe ne correspondent pas.');
                return;
            }
            if (newPassword === currentPassword) {
                setError('Choisissez un mot de passe différent du mot de passe temporaire.');
                return;
            }

            const token = getStoredToken();
            if (!token) {
                handleLogout();
                return;
            }

            setLoading(true);
            try {
                const res = await fetch('/api/auth/password/change', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword,
                    }),
                });
                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    // No reissue: the token already held is now fully valid,
                    // so the same redirect used right after login applies —
                    // no reconnection needed.
                    const role = getStoredRole();
                    redirectAfterAuth(returnTo, token, role, navigate);
                    return;
                }
                if (res.status === 429) {
                    setError('Trop de tentatives. Merci de réessayer plus tard.');
                    return;
                }
                if (data.error === 'invalid_current_password') {
                    setError('Le mot de passe temporaire saisi est incorrect.');
                    return;
                }
                setError(data.message || 'Le changement de mot de passe a échoué.');
            } catch {
                setError('Erreur de connexion. Merci de réessayer.');
            } finally {
                setLoading(false);
            }
        },
        [currentPassword, newPassword, confirmPassword, returnTo, navigate, handleLogout],
    );

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '440px' }}>
                <div className="auth-header">
                    <h2>Mot de passe temporaire</h2>
                    <p>
                        Un mot de passe temporaire vous a été communiqué. Choisissez-en un
                        nouveau pour continuer.
                    </p>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="change-current">Mot de passe temporaire reçu</label>
                        <input
                            id="change-current"
                            type={showPassword ? 'text' : 'password'}
                            className="auth-input"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="change-new">Nouveau mot de passe</label>
                        <input
                            id="change-new"
                            type={showPassword ? 'text' : 'password'}
                            className="auth-input"
                            placeholder={`Minimum ${MIN_PASSWORD_LENGTH} caractères`}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                        <p className={`auth-strength ${tooShort ? 'is-weak' : 'is-ok'}`}>
                            {newPassword.length === 0
                                ? `${MIN_PASSWORD_LENGTH} caractères minimum`
                                : tooShort
                                  ? `Encore ${MIN_PASSWORD_LENGTH - newPassword.length} caractère(s)`
                                  : 'Longueur suffisante'}
                        </p>
                    </div>

                    <div className="form-group">
                        <label htmlFor="change-confirm">Confirmer le nouveau mot de passe</label>
                        <input
                            id="change-confirm"
                            type={showPassword ? 'text' : 'password'}
                            className="auth-input"
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

                    <label className="auth-remember" htmlFor="change-show">
                        <input
                            type="checkbox"
                            id="change-show"
                            checked={showPassword}
                            onChange={(e) => setShowPassword(e.target.checked)}
                        />
                        <span>Afficher les mots de passe</span>
                    </label>

                    <button
                        type="submit"
                        className={`auth-btn btn-primary${incomplete ? ' is-blocked' : ''}`}
                        disabled={loading || incomplete}
                    >
                        {loading ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                </form>

                {/* The only way out besides completing the form: no link to
                    any other page of the app belongs on this screen. */}
                <div className="auth-footer">
                    <button type="button" onClick={handleLogout} className="auth-link auth-link-button">
                        Se déconnecter
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
