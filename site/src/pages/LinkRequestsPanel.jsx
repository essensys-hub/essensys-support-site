import React, { useEffect, useState } from 'react';

const LinkRequestsPanel = ({ token }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/portal/admin/link-requests', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setRequests(await res.json());
            } else {
                setError('Impossible de charger les demandes (portail backend déployé ?)');
            }
        } catch {
            setError('Erreur réseau');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchRequests();
        }
    }, [token]);

    const review = async (id, status) => {
        const res = await fetch(`/api/portal/admin/link-requests/${id}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });
        if (res.ok) {
            fetchRequests();
        } else {
            alert('Échec mise à jour');
        }
    };

    if (loading) {
        return <p>Chargement demandes portail…</p>;
    }
    if (error) {
        return <p style={{ color: '#c33' }}>{error}</p>;
    }

    return (
        <div style={{ marginTop: '2rem' }}>
            <h3>Demandes portail domotique ({requests.length})</h3>
            <p>Après approbation, assignez machine/gateway dans User Manager ci-dessous.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User ID</th>
                        <th>N° série</th>
                        <th>Message</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map((r) => (
                        <tr key={r.id}>
                            <td>{r.id}</td>
                            <td>{r.user_id}</td>
                            <td>{r.machine_serial}</td>
                            <td>{r.message || '—'}</td>
                            <td>
                                <button type="button" onClick={() => review(r.id, 'approved')}>Approuver</button>
                                {' '}
                                <button type="button" onClick={() => review(r.id, 'rejected')}>Refuser</button>
                            </td>
                        </tr>
                    ))}
                    {requests.length === 0 && (
                        <tr><td colSpan="5">Aucune demande en attente.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default LinkRequestsPanel;
