import React, { useState, useEffect } from 'react';

const NewsletterManager = ({ token }) => {
    const [newsletters, setNewsletters] = useState([]);
    const [selectedNewsletter, setSelectedNewsletter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchNewsletters();
    }, [token]);

    const fetchNewsletters = async () => {
        try {
            const res = await fetch('/api/admin/newsletters', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Sort by CreatedAt desc
                setNewsletters(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            }
        } catch (err) {
            console.error("Failed to fetch newsletters", err);
        }
    };

    const handleCreate = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/newsletters', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const newNl = await res.json();
                setNewsletters([newNl, ...newsletters]);
                setSelectedNewsletter(newNl);
            }
        } catch (err) {
            setError('Failed to create newsletter');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedNewsletter) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/newsletters/${selectedNewsletter.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(selectedNewsletter)
            });
            if (res.ok) {
                const updated = await res.json();
                setNewsletters(newsletters.map(n => n.id === updated.id ? updated : n));
                setSelectedNewsletter(updated);
            }
        } catch (err) {
            setError('Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!selectedNewsletter) return;

        // Optimistic update for UI responsiveness
        const updated = { ...selectedNewsletter, status: newStatus };
        setSelectedNewsletter(updated);

        // Then save
        setLoading(true);
        try {
            // If sending, call specific endpoint
            if (newStatus === 'sent') {
                const res = await fetch(`/api/admin/newsletters/${selectedNewsletter.id}/send`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const sentNl = await res.json();
                    setNewsletters(newsletters.map(n => n.id === sentNl.id ? sentNl : n));
                    setSelectedNewsletter(sentNl);
                }
            } else {
                // Just status update via PUT
                const res = await fetch(`/api/admin/newsletters/${selectedNewsletter.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ ...selectedNewsletter, status: newStatus })
                });
                if (res.ok) {
                    const saved = await res.json();
                    setNewsletters(newsletters.map(n => n.id === saved.id ? saved : n));
                    setSelectedNewsletter(saved);
                }
            }
        } catch (err) {
            setError('Failed to update status');
            // Revert on error
            fetchNewsletters();
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Supprimer ce brouillon ?")) return;
        try {
            await fetch(`/api/admin/newsletters/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNewsletters(newsletters.filter(n => n.id !== id));
            if (selectedNewsletter && selectedNewsletter.id === id) {
                setSelectedNewsletter(null);
            }
        } catch (err) {
            setError('Failed to delete');
        }
    };

    return (
        <div style={{ marginTop: '20px', background: '#222', padding: '20px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Gestion Newsletters</h3>
                {!selectedNewsletter && (
                    <button onClick={handleCreate} disabled={loading} style={btnStyle('#00C9FF')}>
                        + Nouveau Brouillon
                    </button>
                )}
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {selectedNewsletter ? (
                <div style={{ background: '#333', padding: '20px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <button onClick={() => setSelectedNewsletter(null)} style={{ ...btnStyle('#555'), color: 'white' }}>
                            &larr; Retour
                        </button>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {selectedNewsletter.status === 'draft' && (
                                <button onClick={() => handleStatusChange('ready')} style={btnStyle('#FFA500')}>
                                    Marquer "Prêt"
                                </button>
                            )}
                            {selectedNewsletter.status === 'ready' && (
                                <button onClick={() => handleStatusChange('draft')} style={btnStyle('#555')}>
                                    Remettre en Brouillon
                                </button>
                            )}
                            {selectedNewsletter.status === 'ready' && (
                                <button onClick={() => { if (window.confirm('Confirmer l\'envoi ?')) handleStatusChange('sent') }} style={btnStyle('#92FE9D', '#000')}>
                                    Envoyer
                                </button>
                            )}
                            {selectedNewsletter.status === 'sent' && (
                                <button onClick={() => { if (window.confirm('Renvoyer la newsletter ?')) handleStatusChange('sent') }} style={btnStyle('#FFD700', '#000')}>
                                    Renvoyer
                                </button>
                            )}
                            {selectedNewsletter.status !== 'sent' && (
                                <button onClick={handleSave} disabled={loading} style={btnStyle('#00C9FF')}>
                                    Sauvegarder
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <span style={statusBadgeStyle(selectedNewsletter.status)}>{selectedNewsletter.status.toUpperCase()}</span>
                        <span style={{ marginLeft: '10px', color: '#888' }}>Version: {selectedNewsletter.version}</span>
                        {selectedNewsletter.sent_at && <span style={{ marginLeft: '10px', color: '#92FE9D' }}>Envoyé le: {new Date(selectedNewsletter.sent_at).toLocaleString()}</span>}
                    </div>

                    <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Sujet :</label>
                    <input
                        type="text"
                        value={selectedNewsletter.subject}
                        onChange={(e) => setSelectedNewsletter({ ...selectedNewsletter, subject: e.target.value })}
                        disabled={selectedNewsletter.status === 'sent'}
                        style={inputStyle}
                    />

                    <label style={{ display: 'block', marginTop: '15px', marginBottom: '5px', color: '#ccc' }}>Contenu (Markdown/HTML) :</label>
                    <textarea
                        value={selectedNewsletter.content}
                        onChange={(e) => setSelectedNewsletter({ ...selectedNewsletter, content: e.target.value })}
                        disabled={selectedNewsletter.status === 'sent'}
                        style={{ ...inputStyle, minHeight: '300px', fontFamily: 'monospace' }}
                    />
                </div>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr style={{ background: '#333', color: '#fff' }}>
                            <th style={thStyle}>Date</th>
                            <th style={thStyle}>Sujet</th>
                            <th style={thStyle}>Statut</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {newsletters.map(n => (
                            <tr key={n.id} style={{ borderBottom: '1px solid #444' }}>
                                <td style={tdStyle}>{new Date(n.created_at).toLocaleDateString()}</td>
                                <td style={tdStyle}>{n.subject}</td>
                                <td style={tdStyle}><span style={statusBadgeStyle(n.status)}>{n.status}</span></td>
                                <td style={tdStyle}>
                                    <button onClick={() => setSelectedNewsletter(n)} style={btnStyle('#555', 'white', '5px 10px')}>
                                        {n.status === 'sent' ? 'Voir' : 'Editer'}
                                    </button>
                                    {n.status !== 'sent' && (
                                        <button onClick={() => handleDelete(n.id)} style={{ ...btnStyle('#ff4444', 'white', '5px 10px'), marginLeft: '5px' }}>
                                            X
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

const btnStyle = (bg, color = '#000', padding = '10px 20px') => ({
    padding: padding,
    borderRadius: '4px',
    border: 'none',
    background: bg,
    color: color,
    fontWeight: 'bold',
    cursor: 'pointer'
});

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #444',
    background: '#222',
    color: 'white',
    boxSizing: 'border-box'
};

const thStyle = { padding: '10px', textAlign: 'left' };
const tdStyle = { padding: '10px' };

const statusBadgeStyle = (status) => {
    let color = '#ccc';
    if (status === 'draft') color = '#FFA500';
    if (status === 'ready') color = '#00C9FF';
    if (status === 'sent') color = '#92FE9D';
    return {
        padding: '2px 8px',
        borderRadius: '10px',
        background: color,
        color: '#000',
        fontWeight: 'bold',
        fontSize: '0.8em',
        textTransform: 'uppercase'
    };
};

export default NewsletterManager;
