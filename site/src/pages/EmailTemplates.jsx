import React, { useState, useEffect } from 'react';

const PLACEHOLDER_HELP = '{{first_name}}, {{last_name}}, {{email}}, {{role}}, {{portal_url}}, {{temporary_password}}, {{gateway_name}}, {{gateway_ip}}, {{armoire_label}}, {{armoire_ip}}, {{support_email}}';

const EmailTemplates = ({ token }) => {
    const [templates, setTemplates] = useState([]);
    const [selected, setSelected] = useState(null);
    const [smtpOk, setSmtpOk] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchHealth();
        fetchTemplates();
    }, [token]);

    const fetchHealth = async () => {
        try {
            const res = await fetch('/api/admin/email/health', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSmtpOk(!!data.configured);
            }
        } catch {
            setSmtpOk(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/admin/email-templates', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            setError('Impossible de charger les modèles');
        }
    };

    const selectTemplate = async (slug) => {
        try {
            const res = await fetch(`/api/admin/email-templates/${slug}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSelected(data);
                setPreview(null);
            }
        } catch {
            setError('Erreur chargement modèle');
        }
    };

    const handleSave = async () => {
        if (!selected) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/email-templates/${selected.slug}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(selected),
            });
            if (res.ok) {
                const updated = await res.json();
                setSelected(updated);
                setTemplates(templates.map((t) => (t.slug === updated.slug ? updated : t)));
                setMsg('Modèle enregistré');
                setTimeout(() => setMsg(''), 3000);
            } else {
                setError('Échec enregistrement');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async () => {
        if (!selected) return;
        const res = await fetch(`/api/admin/email-templates/${selected.slug}/preview`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: '{}',
        });
        if (res.ok) {
            setPreview(await res.json());
        }
    };

    const handleTestSend = async () => {
        if (!selected) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/email-templates/test', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ template_slug: selected.slug }),
            });
            if (res.ok) {
                const data = await res.json();
                setMsg(`Email test envoyé à ${data.to}`);
                setTimeout(() => setMsg(''), 4000);
            } else {
                const text = await res.text();
                setError(text || 'Échec envoi test');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {smtpOk === false && (
                <div style={{
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    color: '#92400e',
                }}
                >
                    Emails transactionnels désactivés — vérifiez la configuration SMTP (`vault_smtp_*` / Ansible).
                </div>
            )}

            {msg && <p style={{ color: '#15803d' }}>{msg}</p>}
            {error && <p className="empty-state">{error}</p>}

            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                <div className="catalog-card" style={{ minWidth: '220px' }}>
                    <h3>Modèles</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {templates.map((t) => (
                            <li key={t.slug} style={{ marginBottom: '8px' }}>
                                <button
                                    type="button"
                                    className="catalog-button ghost"
                                    onClick={() => selectTemplate(t.slug)}
                                    style={{ width: '100%', textAlign: 'left' }}
                                >
                                    {t.name || t.slug}
                                    {t.enabled && <span style={{ color: '#15803d' }}> ✓</span>}
                                    {t.auto_send && <span style={{ fontSize: '0.75em' }}> (auto)</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {selected && (
                    <div className="catalog-card" style={{ flex: 1 }}>
                        <h3>{selected.name}</h3>
                        <p className="device-meta" style={{ marginBottom: '12px' }}>
                            Variables : {PLACEHOLDER_HELP}
                        </p>

                        <label className="field">
                            <span>Sujet</span>
                            <input
                                type="text"
                                value={selected.subject}
                                onChange={(e) => setSelected({ ...selected, subject: e.target.value })}
                            />
                        </label>

                        <label className="field">
                            <span>Corps HTML</span>
                            <textarea
                                rows={12}
                                value={selected.body_html}
                                onChange={(e) => setSelected({ ...selected, body_html: e.target.value })}
                                style={{ width: '100%', fontFamily: 'monospace' }}
                            />
                        </label>

                        <label className="field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                checked={selected.enabled}
                                onChange={(e) => setSelected({ ...selected, enabled: e.target.checked })}
                            />
                            <span>Modèle activé</span>
                        </label>

                        <label className="field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                checked={selected.auto_send}
                                onChange={(e) => setSelected({ ...selected, auto_send: e.target.checked })}
                            />
                            <span>Envoi automatique (création utilisateur / allocation)</span>
                        </label>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                            <button type="button" className="catalog-button" onClick={handleSave} disabled={loading}>
                                Enregistrer
                            </button>
                            <button type="button" className="catalog-button ghost" onClick={handlePreview}>
                                Aperçu
                            </button>
                            <button type="button" className="catalog-button ghost" onClick={handleTestSend} disabled={loading}>
                                Envoyer un test
                            </button>
                        </div>

                        {preview && (
                            <div style={{ marginTop: '20px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                                <strong>Aperçu — {preview.subject}</strong>
                                <div dangerouslySetInnerHTML={{ __html: preview.body_html }} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailTemplates;
