import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css'; // Reuse Auth styles for consistency

const Profile = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('adminToken');
    const [profile, setProfile] = useState(null);
    const [nearby, setNearby] = useState({ machines: [], gateways: [] });
    const [selectedMachine, setSelectedMachine] = useState('');
    const [selectedGateway, setSelectedGateway] = useState('');
    const [logs, setLogs] = useState([]); // User's own logs
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchProfile();
        fetchNearby();
        fetchMyLogs();
    }, [token, navigate]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setSelectedMachine(data.linked_machine_id || '');
                setSelectedGateway(data.linked_gateway_id || '');
            } else {
                setError('Failed to load profile');
            }
        } catch (err) {
            setError('Error loading profile');
        }
    };

    const fetchNearby = async () => {
        try {
            const res = await fetch('/api/devices/nearby', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNearby(data);
            }
        } catch (err) {
            console.error("Failed to fetch nearby devices");
        }
    };

    const fetchMyLogs = async () => {
        // Users can use the same admin endpoint if they have role 'user'
        // Backend handles filtering to return only their own logs.
        try {
            const res = await fetch('/api/admin/audit?limit=20', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (err) {
            console.error("Failed to fetch logs");
        }
    };

    const handleSave = async () => {
        setMessage('');
        setError('');

        try {
            const body = {
                linked_machine_id: selectedMachine ? parseInt(selectedMachine) : null,
                linked_gateway_id: selectedGateway || null
            };

            const res = await fetch('/api/profile/links', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setMessage('Profil mis à jour avec succès !');
                fetchProfile(); // Refresh
            } else {
                const txt = await res.text();
                setError(`Erreur: ${txt}`);
            }
        } catch (err) {
            setError('Erreur de connexion');
        }
    };

    if (!profile) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Chargement...</div>;

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '800px' }}>
                <h2 style={{ borderBottom: '1px solid #444', paddingBottom: '10px' }}>Mon Profil</h2>

                <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' }}>
                    <div>
                        <h4 style={{ marginTop: 0 }}>Informations</h4>
                        <p><strong>Nom:</strong> {profile.first_name} {profile.last_name}</p>
                        <p><strong>Email:</strong> {profile.email}</p>
                        <p><strong>Rôle:</strong> {profile.role}</p>
                    </div>
                </div>

                <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />

                <h3 style={{ textAlign: 'left' }}>Mes Appareils</h3>
                <p style={{ fontSize: '0.9em', color: '#ccc', marginBottom: '20px', textAlign: 'left' }}>
                    Associez votre compte à vos équipements Essensys.
                    Vous ne pouvez voir que les appareils connectés sur le même réseau (IP: {nearby.user_ip || '...'}).
                </p>

                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}

                <div className="form-group" style={{ textAlign: 'left' }}>
                    <label>Armoire Essensys (Machine)</label>
                    <select
                        value={selectedMachine}
                        onChange={(e) => setSelectedMachine(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
                    >
                        <option value="">-- Aucune --</option>
                        {profile.linked_machine_id && !nearby.machines.find(m => m.id === profile.linked_machine_id) && (
                            <option value={profile.linked_machine_id}>Actuelle (ID: {profile.linked_machine_id}) - Hors ligne ou autre IP</option>
                        )}
                        {nearby.machines.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.no_serie} (IP: {m.ip})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group" style={{ textAlign: 'left' }}>
                    <label>Passerelle (Gateway)</label>
                    <select
                        value={selectedGateway}
                        onChange={(e) => setSelectedGateway(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
                    >
                        <option value="">-- Aucune --</option>
                        {profile.linked_gateway_id && !nearby.gateways.find(g => g.hostname === profile.linked_gateway_id) && (
                            <option value={profile.linked_gateway_id}>Actuelle ({profile.linked_gateway_id}) - Hors ligne ou autre IP</option>
                        )}
                        {nearby.gateways.map(g => (
                            <option key={g.hostname} value={g.hostname}>
                                {g.hostname} (IP: {g.ip})
                            </option>
                        ))}
                    </select>
                </div>

                <button onClick={handleSave} className="auth-btn" style={{ marginTop: '20px', marginBottom: '30px' }}>
                    Enregistrer
                </button>

                <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />

                <h3 style={{ textAlign: 'left' }}>Modifier mes informations</h3>
                <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                    <div className="form-group">
                        <label>Prénom</label>
                        <input
                            type="text"
                            defaultValue={profile.first_name}
                            id="edit-firstname"
                            style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '4px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Nom</label>
                        <input
                            type="text"
                            defaultValue={profile.last_name}
                            id="edit-lastname"
                            style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '4px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Nouveau Mot de passe (laisser vide pour ne pas changer)</label>
                        <input
                            type="password"
                            id="edit-password"
                            placeholder="********"
                            style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '4px' }}
                        />
                    </div>
                    <button onClick={async () => {
                        const firstName = document.getElementById('edit-firstname').value;
                        const lastName = document.getElementById('edit-lastname').value;
                        const password = document.getElementById('edit-password').value;

                        try {
                            const res = await fetch('/api/profile', {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ first_name: firstName, last_name: lastName, password: password })
                            });
                            if (res.ok) {
                                setMessage('Profil mis à jour !');
                                fetchProfile();
                            } else {
                                setError('Erreur lors de la mise à jour.');
                            }
                        } catch (e) { setError('Erreur réseau'); }
                    }} className="auth-btn" style={{ background: '#555' }}>Mettre à jour</button>
                </div>

                <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />

                <h3 style={{ textAlign: 'left' }}>Gestion des données (RGPD)</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        // onClick={() => window.open(`/api/profile/export?token=${token}`, '_blank')} // Simple GET trigger if token in query or handle via fetch/blob
                        // Better approach for Auth header: fetch blob
                        onClick={async () => {
                            try {
                                const res = await fetch('/api/profile/export', {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) {
                                    const blob = await res.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `essensys_export_${profile.id}.json`;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                } else {
                                    setError('Erreur export');
                                }
                            } catch (e) { setError('Erreur réseau'); }
                        }}
                        className="auth-btn"
                        style={{ background: '#006699', flex: 1 }}
                    >
                        Exporter mes données
                    </button>

                    <button
                        onClick={async () => {
                            if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
                                try {
                                    const res = await fetch('/api/profile', {
                                        method: 'DELETE',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    if (res.ok) {
                                        alert("Compte supprimé.");
                                        localStorage.removeItem('adminToken');
                                        navigate('/');
                                    } else {
                                        setError('Erreur suppression');
                                    }
                                } catch (e) { setError('Erreur réseau'); }
                            }
                        }}
                        className="auth-btn"
                        style={{ background: '#990000', flex: 1 }}
                    >
                        Supprimer mon compte
                    </button>
                </div>

                <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />

                <h3 style={{ textAlign: 'left' }}>Mon Historique (Audit Trail)</h3>
                <div className="table-container" style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                        <thead>
                            <tr style={{ background: '#333', color: 'white' }}>
                                <th style={{ padding: '8px' }}>Date</th>
                                <th style={{ padding: '8px' }}>Action</th>
                                <th style={{ padding: '8px' }}>Détails</th>
                                <th style={{ padding: '8px' }}>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: '10px', textAlign: 'center', color: '#888' }}>Aucune activité récente.</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #444' }}>
                                        <td style={{ padding: '8px' }}>{new Date(log.created_at).toLocaleString()}</td>
                                        <td style={{ padding: '8px' }}>
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: log.action.includes('FAIL') ? '#522' : '#242',
                                                color: log.action.includes('FAIL') ? '#f88' : '#8f8'
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '8px' }}>{log.details}</td>
                                        <td style={{ padding: '8px' }}>{log.ip_address}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default Profile;
