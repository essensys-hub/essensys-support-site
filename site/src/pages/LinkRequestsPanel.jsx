import React, { useCallback, useEffect, useState } from 'react';
import './Catalog.css';

const TABS = [
    { id: 'pending', label: 'En attente' },
    { id: 'history', label: 'Historique' },
];

const statusLabel = (status) => {
    switch (status) {
        case 'approved':
            return 'Approuvée';
        case 'rejected':
            return 'Refusée';
        case 'pending':
            return 'En attente';
        default:
            return status;
    }
};

const formatDateTime = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const userDisplayName = (row) => {
    const parts = [row.first_name, row.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '—';
};

const LinkRequestsPanel = ({ token }) => {
    const [tab, setTab] = useState('pending');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actingId, setActingId] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);

    const fetchPendingCount = useCallback(async () => {
        try {
            const res = await fetch('/api/portal/admin/link-requests?status=pending', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setPendingCount(Array.isArray(data) ? data.length : 0);
            }
        } catch {
            /* badge only */
        }
    }, [token]);

    const fetchRequests = useCallback(async (statusFilter) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/portal/admin/link-requests?status=${statusFilter}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(Array.isArray(data) ? data : []);
                if (statusFilter === 'pending') {
                    setPendingCount(Array.isArray(data) ? data.length : 0);
                }
            } else {
                setError('Impossible de charger les demandes (portail backend déployé ?)');
                setRequests([]);
            }
        } catch {
            setError('Erreur réseau');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchRequests(tab);
            fetchPendingCount();
        }
    }, [token, tab, fetchRequests, fetchPendingCount]);

    const review = async (id, status) => {
        setActingId(id);
        try {
            const res = await fetch(`/api/portal/admin/link-requests/${id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                await fetchRequests(tab);
                await fetchPendingCount();
            } else {
                alert('Échec mise à jour');
            }
        } catch {
            alert('Erreur réseau');
        } finally {
            setActingId(null);
        }
    };

    return (
        <section className="catalog-card link-requests-panel">
            <div className="card-header">
                <div>
                    <h3>Demandes portail domotique</h3>
                    <p className="catalog-subtitle">
                        Validez les demandes de liaison armoire, puis assignez machine/gateway dans la liste utilisateurs ci-dessous.
                    </p>
                </div>
                <button
                    type="button"
                    className="catalog-button ghost"
                    onClick={() => fetchRequests(tab)}
                    disabled={loading}
                >
                    Rafraîchir
                </button>
            </div>

            <div className="link-requests-tabs" role="tablist" aria-label="Filtre demandes portail">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.id}
                        className={`link-requests-tab${tab === t.id ? ' active' : ''}`}
                        onClick={() => setTab(t.id)}
                    >
                        {t.label}
                        {t.id === 'pending' && (
                            <span className="link-requests-tab-count">{pendingCount}</span>
                        )}
                    </button>
                ))}
            </div>

            {error && <p className="link-requests-error">{error}</p>}

            {loading ? (
                <p className="empty-state">Chargement des demandes…</p>
            ) : (
                <div className="table-wrapper">
                    <table className="link-requests-table">
                        <thead>
                            <tr>
                                <th>Demandé le</th>
                                <th>Utilisateur</th>
                                <th>N° série</th>
                                <th>Message</th>
                                {tab === 'history' && (
                                    <>
                                        <th>Statut</th>
                                        <th>Validé par</th>
                                        <th>Validé le</th>
                                    </>
                                )}
                                {tab === 'pending' && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((r) => (
                                <tr key={r.id} className={tab === 'pending' ? 'link-request-row-pending' : ''}>
                                    <td className="mono">{formatDateTime(r.created_at)}</td>
                                    <td>
                                        <div className="link-request-user">
                                            <strong>{r.user_email || `user #${r.user_id}`}</strong>
                                            <span className="device-meta">
                                                {userDisplayName(r)}
                                                {r.user_id ? ` · ID ${r.user_id}` : ''}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="mono table-flag">{r.machine_serial || '—'}</td>
                                    <td className="link-request-message">{r.message || '—'}</td>
                                    {tab === 'history' && (
                                        <>
                                            <td>
                                                <span className={`link-request-status ${r.status}`}>
                                                    {statusLabel(r.status)}
                                                </span>
                                            </td>
                                            <td>{r.reviewed_by || '—'}</td>
                                            <td className="mono">{formatDateTime(r.reviewed_at)}</td>
                                        </>
                                    )}
                                    {tab === 'pending' && (
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    type="button"
                                                    className="catalog-button primary"
                                                    disabled={actingId === r.id}
                                                    onClick={() => review(r.id, 'approved')}
                                                >
                                                    Approuver
                                                </button>
                                                <button
                                                    type="button"
                                                    className="catalog-button danger"
                                                    disabled={actingId === r.id}
                                                    onClick={() => review(r.id, 'rejected')}
                                                >
                                                    Refuser
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={tab === 'history' ? 7 : 5} className="empty-state">
                                        {tab === 'pending'
                                            ? 'Aucune demande en attente.'
                                            : 'Aucune demande traitée pour le moment.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default LinkRequestsPanel;
