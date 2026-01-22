import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NewsletterManager from './NewsletterManager';
import UserManager from './UserManager';
import Catalog from './Catalog';
import './Catalog.css';
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
    const navigate = useNavigate();
    // Check both storages
    const getStoredToken = () => localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || '';
    const getStoredRole = () => localStorage.getItem('adminRole') || sessionStorage.getItem('adminRole');

    const [token, setToken] = useState(getStoredToken());
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [stats, setStats] = React.useState(null);
    const [machines, setMachines] = React.useState([]);
    const [gateways, setGateways] = React.useState([]);
    const [subscribers, setSubscribers] = React.useState([]);
    const [logs, setLogs] = React.useState([]); // Audit Logs
    const [showMachineList, setShowMachineList] = React.useState(false);
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'newsletters', 'users', 'catalog', 'audit'

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
        const urlRole = params.get('role');

        if (urlToken) {
            // Social Login defaults to LocalStorage currently in handlers, but we can default frontend to session if preferable.
            // For now, let's keep consistent with existing behavior or allow user to choose?
            // Actually, backend OAuth redirect logic doesn't know about user preference here.
            // Let's assume Social Login implies "Remember Me" for now or use session.
            // The handlers currently redirect with token in query param.
            // We can default to sessionStorage for safety.
            sessionStorage.setItem('adminToken', urlToken);
            if (urlRole) sessionStorage.setItem('adminRole', urlRole);

            setToken(urlToken);
            // Clear URL
            window.history.replaceState({}, document.title, window.location.pathname);
            checkRoleAndFetch(urlToken, urlRole);
        } else {
            const t = getStoredToken();
            if (t) {
                // Verify token by fetching stats
                const storedRole = getStoredRole();
                setToken(t); // Update state if changed
                checkRoleAndFetch(t, storedRole);
            } else {
                // Not authenticated, redirect to Login
                navigate('/login');
            }
        }
    }, [navigate]);

    const checkRoleAndFetch = (authToken, role) => {
        // Frontend Role Check (Fast fail)
        if (role && !['admin', 'support', 'admin_global', 'admin_local'].includes(role)) {
            setError("Accès refusé. Vous n'avez pas les droits d'administrateur.");
            return;
        }
        fetchStats(authToken);
    };

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
                fetchGatewaysInternal(authToken);
                fetchSubscribers(authToken);
                // fetchUsers(authToken); // Assuming fetchUsers is defined elsewhere or will be added
                fetchLogs(authToken);
            } else {
                // Token invalid
                handleLogout();
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("Erreur chargement données.");
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async (authToken) => {
        try {
            const res = await fetch('/api/admin/audit?limit=100', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Audit Logs fetch failed", error);
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



    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRole');
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminRole');
        window.dispatchEvent(new Event('auth-change'));
        setToken('');
        setIsAuthenticated(false);
        setStats(null);
        setMachines([]);
        setGateways([]);
        setShowMachineList(false);
        navigate('/login');
    };

    if (!isAuthenticated) {
        if (error) {
            return (
                <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>
                    <h3 style={{ color: '#ff4444' }}>Erreur</h3>
                    <p>{error}</p>
                    <button onClick={handleLogout} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
                        Retour à la connexion
                    </button>
                </div>
            );
        }
        return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Chargement...</div>;
    }

    return (
        <div className="page-content">
            <h1>Administration</h1>

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
                        <button
                            onClick={() => setActiveTab('users')}
                            style={activeTab === 'users' ? activeTabStyle : inactiveTabStyle}
                        >
                            Utilisateurs
                        </button>
                        <button
                            onClick={() => setActiveTab('catalog')}
                            style={activeTab === 'catalog' ? activeTabStyle : inactiveTabStyle}
                        >
                            Catalogue
                        </button>
                        <button
                            onClick={() => setActiveTab('audit')}
                            style={activeTab === 'audit' ? activeTabStyle : inactiveTabStyle}
                        >
                            Audit Trail
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
                                <div className="catalog-card" style={{ marginTop: '20px' }}>
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

                                <div className="catalog-card" style={{ marginTop: '40px' }}>
                                    <h3>Liste des Gateways ({gateways.length})</h3>
                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Hostname</th>
                                                    <th>IP / Location</th>
                                                    <th>CPU / RAM</th>
                                                    <th>Services</th>
                                                    <th>Last Seen</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {gateways.map((g, i) => (
                                                    <tr key={i}>
                                                        <td>{g.hostname}</td>
                                                        <td>
                                                            <div>{g.ip || '-'}</div>
                                                            <div style={{ fontSize: '0.8em', color: '#6b7280' }}>{g.geo_location || ''}</div>
                                                        </td>
                                                        <td>
                                                            CPU: {g.cpu_usage_percent}%<br />
                                                            RAM: {g.memory?.percent?.toFixed(1)}%
                                                        </td>
                                                        <td>
                                                            {g.services && Object.entries(g.services).map(([svc, status]) => (
                                                                <span key={svc} style={{ color: status ? '#15803d' : '#b91c1c', marginRight: '5px', fontSize: '0.8em' }}>
                                                                    {svc}: {status ? 'OK' : 'ERR'}
                                                                </span>
                                                            ))}
                                                        </td>
                                                        <td>{g.last_seen ? new Date(g.last_seen).toLocaleString() : '-'}</td>
                                                    </tr>
                                                ))}
                                                {gateways.length === 0 && (
                                                    <tr><td colSpan="5" className="empty-state">Aucune gateway détectée.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="catalog-card" style={{ marginTop: '40px' }}>
                                    <h3>Liste des Machines ({machines.length})</h3>
                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Machine ID</th>
                                                    <th>User / Pass</th>
                                                    <th>IP / Location</th>
                                                    <th>Raw Auth (Base64)</th>
                                                    <th>Last Seen</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {machines.map(m => (
                                                    <tr key={m.id}>
                                                        <td>{m.no_serie}</td>
                                                        <td className="mono">{m.raw_decoded || '-'}</td>
                                                        <td>
                                                            <div>{m.ip || '-'}</div>
                                                            <div style={{ fontSize: '0.8em', color: '#6b7280' }}>{m.geo_location || ''}</div>
                                                        </td>
                                                        <td className="mono" style={{ fontSize: '0.8em', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {m.raw_auth || '-'}
                                                        </td>
                                                        <td>{m.last_seen ? new Date(m.last_seen).toLocaleString() : '-'}</td>
                                                    </tr>
                                                ))}
                                                {machines.length === 0 && (
                                                    <tr><td colSpan="5" className="empty-state">Aucune machine détectée.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {(isAuthenticated && subscribers) && (
                            <div className="catalog-card" style={{ marginTop: '40px' }}>
                                <h3>Abonnés Newsletter ({subscribers.length})</h3>
                                {subscribers.length > 0 ? (
                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Email</th>
                                                    <th>Date d'inscription</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {subscribers.map((s, i) => (
                                                    <tr key={i}>
                                                        <td>{s.email}</td>
                                                        <td>{new Date(s.date_joined).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="empty-state">Aucun abonné pour le moment.</p>
                                )}
                            </div>
                        )}
                    </>
                ) : activeTab === 'newsletters' ? (
                    <NewsletterManager token={token} />
                ) : activeTab === 'users' ? (
                    <UserManager token={token} />
                ) : activeTab === 'catalog' ? (
                    <Catalog />
                ) : activeTab === 'audit' && (
                    <div className="catalog-card">
                        <h3>Audit Trail / Journaux d'activité</h3>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Utilisateur (Email)</th>
                                        <th>Action</th>
                                        <th>Type</th>
                                        <th>Détails</th>
                                        <th>IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr><td colSpan="6" className="empty-state">Aucun log trouvé.</td></tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id}>
                                                <td>{new Date(log.created_at).toLocaleString()}</td>
                                                <td>
                                                    <div style={{ fontWeight: 'bold' }}>{log.username}</div>
                                                    <div style={{ fontSize: '0.8em', color: '#888' }}>ID: {log.user_id}</div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${log.action.includes('FAIL') ? 'offline' : 'online'}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td>{log.resource_type}</td>
                                                <td style={{ maxWidth: '300px', wordWrap: 'break-word' }}>{log.details}</td>
                                                <td>{log.ip_address}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
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
