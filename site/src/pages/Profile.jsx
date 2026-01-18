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
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchProfile();
        fetchNearby();
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
            <div className="auth-card" style={{ maxWidth: '600px' }}>
                <h2>Mon Profil</h2>

                <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                    <p><strong>Nom:</strong> {profile.first_name} {profile.last_name}</p>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Rôle:</strong> {profile.role}</p>
                </div>

                <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />

                <h3>Mes Appareils</h3>
                <p style={{ fontSize: '0.9em', color: '#ccc', marginBottom: '20px' }}>
                    Associez votre compte à vos équipements Essensys.
                    Vous ne pouvez voir que les appareils connectés sur le même réseau (IP: {nearby.user_ip || '...'}).
                </p>

                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                    <label>Armoire Essensys (Machine)</label>
                    <select
                        value={selectedMachine}
                        onChange={(e) => setSelectedMachine(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
                    >
                        <option value="">-- Aucune --</option>
                        {/* Show currently linked even if not nearby? ideally yes, but for now strict nearby list + current */}
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

                <div className="form-group">
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

                <button onClick={handleSave} className="auth-btn" style={{ marginTop: '20px' }}>
                    Enregistrer
                </button>
            </div>
        </div>
    );
};

export default Profile;
