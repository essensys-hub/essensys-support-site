import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import '../pages/Catalog.css';

/**
 * Two-step admin action: confirm (with an opt-in "also send by email"
 * checkbox, unchecked by default — the screen is the primary channel), then
 * a one-time display of the generated password. Closing the modal is the
 * only way the password leaves the admin's screen; nothing re-fetches the
 * user list while it's open — see the comment on this component's onClose
 * in UserManager.jsx for why that matters.
 *
 * Rendered via a portal into document.body rather than in place: Admin.jsx's
 * .page-content has `backdrop-filter: blur(5px)`, and backdrop-filter (like
 * transform, filter, perspective, and will-change: transform) establishes a
 * new containing block for `position: fixed` descendants per the CSS Filter
 * Effects spec. Without the portal, this modal's `inset: 0` resolves against
 * .page-content's own (scrolled, page-length) box instead of the viewport —
 * on a long user list, scrolling to a row before opening the modal left it
 * rendered hundreds of pixels off-screen. A portal sidesteps the whole class
 * of bug regardless of what a future ancestor's CSS does.
 */
const TemporaryPasswordModal = ({ user, token, onClose }) => {
    const [sendEmail, setSendEmail] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/users/${user.id}/temporary-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ send_email: sendEmail }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error === 'account_forbidden'
                    ? "Ce compte est interdit : levez l'interdiction avant de définir un mot de passe temporaire."
                    : (data.error || "Échec de l'émission"));
                return;
            }
            setResult(data);
        } catch {
            setError('Erreur réseau');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!result?.password) return;
        try {
            await navigator.clipboard.writeText(result.password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API can be unavailable (non-HTTPS origin, denied
            // permission); the password stays visible and selectable either
            // way, so this is not a blocking failure.
        }
    };

    return createPortal(
        <div className="modal-overlay">
            <div className="modal-content">
                {!result ? (
                    <>
                        <h3>Mot de passe temporaire — {user.email}</h3>
                        <p className="device-warning">
                            Le mot de passe actuel de {user.email} sera définitivement remplacé.
                            L'utilisateur devra en choisir un nouveau dès sa prochaine connexion.
                        </p>
                        <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                checked={sendEmail}
                                onChange={(e) => setSendEmail(e.target.checked)}
                            />
                            <span>Envoyer aussi par email</span>
                        </label>
                        {error && <p className="empty-state">{error}</p>}
                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="catalog-button ghost" disabled={loading}>
                                Annuler
                            </button>
                            <button type="button" onClick={handleConfirm} className="catalog-button primary" disabled={loading}>
                                {loading ? 'Émission…' : 'Définir le mot de passe temporaire'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h3>Mot de passe temporaire émis</h3>
                        <p>
                            Communiquez ce mot de passe à {user.email} de vive voix. Il ne sera plus
                            affiché après la fermeture de cette fenêtre.
                        </p>
                        <div
                            className="mono"
                            style={{
                                fontSize: '20px',
                                letterSpacing: '0.05em',
                                padding: '14px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                textAlign: 'center',
                                userSelect: 'all',
                            }}
                        >
                            {result.password}
                        </div>
                        <button type="button" onClick={handleCopy} className="catalog-button ghost">
                            {copied ? 'Copié !' : 'Copier'}
                        </button>
                        <p className="link-meta">
                            Valable jusqu'au {new Date(result.expires_at).toLocaleString()}.
                        </p>
                        <p className="link-meta">
                            {result.email_sent
                                ? 'Email envoyé.'
                                : sendEmail
                                    ? `Email non envoyé : ${result.reason || 'raison inconnue'}. Transmettez le mot de passe par un autre moyen.`
                                    : 'Email non envoyé (non demandé).'}
                        </p>
                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="catalog-button primary">
                                Fermer
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body,
    );
};

export default TemporaryPasswordModal;
