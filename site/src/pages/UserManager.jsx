import React, { useState, useEffect } from 'react';
import './Catalog.css';

const normalizeGatewayKey = (value) => (value ? value.replace(/^gw-/, '') : '');

const findGateway = (gateways, linkedGatewayId) => {
    if (!linkedGatewayId) return null;
    const key = normalizeGatewayKey(linkedGatewayId);
    return gateways.find((g) => (
        g.hostname === linkedGatewayId
        || g.hostname === key
        || normalizeGatewayKey(g.hostname) === key
    )) ?? null;
};

const findPortalGateway = (sessions, linkedGatewayId) => {
    if (!linkedGatewayId || !sessions?.length) return null;
    const key = normalizeGatewayKey(linkedGatewayId);
    return sessions.find((s) => (
        s.gateway_id === linkedGatewayId
        || normalizeGatewayKey(s.gateway_id) === key
    )) ?? null;
};

const findArmoireForGateway = (machines, gatewayStatus) => {
    if (!gatewayStatus?.ip) return null;
    const gatewayIp = gatewayStatus.ip;
    const candidates = machines.filter((m) => (
        m.ip === gatewayIp || (m.ip && m.ip.startsWith('10.0.1.'))
    ));
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];
    const onGatewayIp = candidates.filter((m) => m.ip === gatewayIp);
    const pool = onGatewayIp.length > 0 ? onGatewayIp : candidates;
    return [...pool].sort((a, b) => new Date(b.last_seen || 0) - new Date(a.last_seen || 0))[0];
};

const resolveUserDevices = (user, machines, gateways, portalGateways) => {
    const gatewayStatus = findGateway(gateways, user.linked_gateway_id);
    const portalGw = findPortalGateway(portalGateways, user.linked_gateway_id);
    const cloudMachineId = portalGw?.machine_id ?? user.linked_machine_id;
    const armoire = findArmoireForGateway(machines, gatewayStatus);

    const gatewayLabel = gatewayStatus?.hostname || user.linked_gateway_id;
    const gatewaySubtitle = [
        user.linked_gateway_id && user.linked_gateway_id !== gatewayLabel ? user.linked_gateway_id : null,
        gatewayStatus?.ip,
    ].filter(Boolean).join(' · ');

    const serverSubtitle = [
        portalGw?.eth0_mac ? `eth0 ${portalGw.eth0_mac}` : null,
        portalGw?.eth1_mac ? `eth1 ${portalGw.eth1_mac}` : null,
    ].filter(Boolean).join(' · ');

    return {
        gatewayLabel,
        gatewaySubtitle,
        cloudMachineId,
        serverSubtitle,
        armoire,
    };
};

const DeviceCell = ({ title, subtitle, fallback }) => {
    if (!title && !fallback) {
        return <span className="device-empty">—</span>;
    }
    return (
        <div className="device-cell">
            <div>{title || fallback}</div>
            {subtitle && <div className="device-meta">{subtitle}</div>}
        </div>
    );
};

const UserManager = ({ token }) => {
    const [users, setUsers] = useState([]);
    const [machines, setMachines] = useState([]);
    const [gateways, setGateways] = useState([]);
    const [portalGateways, setPortalGateways] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Editing State
    const [editingUser, setEditingUser] = useState(null);
    const [editMachine, setEditMachine] = useState('');
    const [editGateway, setEditGateway] = useState('');

    // Default form state
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchDevices();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                setError('Failed to fetch users');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const fetchDevices = async () => {
        try {
            const resM = await fetch('/api/admin/machines', { headers: { 'Authorization': `Bearer ${token}` } });
            if (resM.ok) setMachines(await resM.json());

            const resG = await fetch('/api/admin/gateways', { headers: { 'Authorization': `Bearer ${token}` } });
            if (resG.ok) setGateways(await resG.json());

            const resP = await fetch('/api/portal/admin/gateway-sessions', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (resP.ok) setPortalGateways(await resP.json());
        } catch (err) {
            console.error("Failed to fetch devices");
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
                alert('Role updated successfully');
            } else {
                alert('Failed to update role');
            }
        } catch (err) {
            alert('Error updating role');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: newUser.email,
                    password: newUser.password,
                    first_name: newUser.firstName,
                    last_name: newUser.lastName
                })
            });

            if (res.ok) {
                alert('User created successfully');
                setNewUser({ email: '', password: '', firstName: '', lastName: '' }); // Reset form
                fetchUsers(); // Refresh list
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to create user');
            }
        } catch (err) {
            alert('Error creating user');
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        const gatewayStatus = findGateway(gateways, user.linked_gateway_id);
        const portalGw = findPortalGateway(portalGateways, user.linked_gateway_id);
        setEditGateway(gatewayStatus?.hostname || user.linked_gateway_id || '');
        setEditMachine(String(portalGw?.machine_id ?? user.linked_machine_id ?? ''));
    };

    const handleGatewayChange = (value) => {
        setEditGateway(value);
        const portalGw = findPortalGateway(portalGateways, value);
        if (portalGw?.machine_id) {
            setEditMachine(String(portalGw.machine_id));
        }
    };

    const handleSaveLinks = async () => {
        if (!editingUser) return;
        try {
            const portalGw = findPortalGateway(portalGateways, editGateway);
            const body = {
                linked_machine_id: editMachine ? parseInt(editMachine, 10) : null,
                linked_gateway_id: portalGw?.gateway_id || editGateway || null,
            };

            const res = await fetch(`/api/admin/users/${editingUser.id}/links`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert('Links updated successfully');
                setEditingUser(null);
                fetchUsers(); // Refresh
            } else {
                alert('Failed to update links');
            }
        } catch (err) {
            alert('Error updating links');
        }
    };

    return (
        <div className="catalog-page">
            <h2>Gestion des Utilisateurs</h2>

            <section className="catalog-card">
                <div className="card-header">
                    <h3>Ajouter un Utilisateur</h3>
                </div>
                <form onSubmit={handleCreateUser} className="entry-form">
                    <label className="field">
                        <span>Email</span>
                        <input
                            type="email"
                            placeholder="Email"
                            value={newUser.email}
                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                            required
                        />
                    </label>
                    <label className="field">
                        <span>Mot de passe</span>
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={newUser.password}
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            required
                        />
                    </label>
                    <label className="field">
                        <span>Prénom (Opt)</span>
                        <input
                            type="text"
                            placeholder="Prénom"
                            value={newUser.firstName}
                            onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                        />
                    </label>
                    <label className="field">
                        <span>Nom (Opt)</span>
                        <input
                            type="text"
                            placeholder="Nom"
                            value={newUser.lastName}
                            onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                        />
                    </label>
                    <div className="form-actions">
                        <button type="submit" className="catalog-button primary">Ajouter</button>
                    </div>
                </form>
            </section>

            <section className="catalog-card">
                <div className="card-header">
                    <h3>Liste des utilisateurs</h3>
                </div>
                {loading ? (
                    <p className="empty-state">Chargement...</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Email</th>
                                    <th>Nom</th>
                                    <th>Rôle</th>
                                    <th>Gateway</th>
                                    <th>Serveur</th>
                                    <th>Armoire</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => {
                                    const {
                                        gatewayLabel,
                                        gatewaySubtitle,
                                        cloudMachineId,
                                        serverSubtitle,
                                        armoire,
                                    } = resolveUserDevices(u, machines, gateways, portalGateways);

                                    return (
                                    <tr key={u.id}>
                                        <td>{u.id}</td>
                                        <td>{u.email}</td>
                                        <td>{u.first_name} {u.last_name}</td>
                                        <td>
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                disabled={u.role === 'admin_global' || (localStorage.getItem('adminRole') === 'admin_local' && u.role === 'admin_local')}
                                            >
                                                {localStorage.getItem('adminRole') === 'admin_global' ? (
                                                    <>
                                                        <option value="admin_global">Admin Global</option>
                                                        <option value="admin_local">Admin Local</option>
                                                        <option value="user">User</option>
                                                        <option value="guest_local">Guest Local</option>
                                                        <option value="support">Support</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="user">User</option>
                                                        <option value="guest_local">Guest Local</option>
                                                    </>
                                                )}
                                            </select>
                                        </td>
                                        <td>
                                            <DeviceCell
                                                title={gatewayLabel}
                                                subtitle={gatewaySubtitle || undefined}
                                                fallback={u.linked_gateway_id}
                                            />
                                        </td>
                                        <td>
                                            <DeviceCell
                                                title={cloudMachineId ? `ID ${cloudMachineId}` : undefined}
                                                subtitle={serverSubtitle || undefined}
                                                fallback={u.linked_machine_id ? String(u.linked_machine_id) : undefined}
                                            />
                                        </td>
                                        <td>
                                            <DeviceCell
                                                title={armoire?.no_serie}
                                                subtitle={armoire?.ip ? `IP ${armoire.ip}` : undefined}
                                                fallback={armoire ? `ID ${armoire.id}` : undefined}
                                            />
                                        </td>
                                        <td className="table-actions">
                                            {localStorage.getItem('adminRole') === 'admin_global' && (
                                                <button onClick={() => openEditModal(u)} className="catalog-button ghost">
                                                    Lier Appareils
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    );
                                })}
                                {!loading && users.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="empty-state">Aucun utilisateur trouvé.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                {error && <p className="empty-state">{error}</p>}
            </section>

            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Lier Appareils pour {editingUser.email}</h3>

                        <p className="device-meta" style={{ marginBottom: '1rem' }}>
                            Le serveur cloud (machine_id) est dérivé de la gateway enregistrée sur le portail.
                            L&apos;armoire est détectée sur le même site que la gateway.
                        </p>

                        <label className="field">
                            <span>Gateway</span>
                            <select
                                value={editGateway}
                                onChange={(e) => handleGatewayChange(e.target.value)}
                            >
                                <option value="">-- Aucune --</option>
                                {gateways.map((g) => {
                                    const portalGw = findPortalGateway(portalGateways, g.hostname)
                                        ?? findPortalGateway(portalGateways, `gw-${g.hostname}`);
                                    const cloudId = portalGw?.machine_id;
                                    return (
                                        <option key={g.hostname} value={g.hostname}>
                                            {g.hostname}
                                            {cloudId ? ` · serveur ID ${cloudId}` : ''}
                                            {' · IP '}{g.ip || '—'}
                                        </option>
                                    );
                                })}
                                {portalGateways
                                    .filter((pg) => !gateways.some((g) => (
                                        g.hostname === pg.gateway_id
                                        || `gw-${g.hostname}` === pg.gateway_id
                                    )))
                                    .map((pg) => (
                                        <option key={pg.gateway_id} value={pg.gateway_id}>
                                            {pg.gateway_id} · serveur ID {pg.machine_id}
                                        </option>
                                    ))}
                            </select>
                        </label>

                        <label className="field">
                            <span>Serveur cloud (machine_id)</span>
                            <input
                                type="number"
                                min="1"
                                value={editMachine}
                                onChange={(e) => setEditMachine(e.target.value)}
                                placeholder="Ex. 19"
                            />
                        </label>

                        {editGateway && (() => {
                            const gw = findGateway(gateways, editGateway);
                            const armoire = findArmoireForGateway(machines, gw);
                            return armoire ? (
                                <p className="device-meta">
                                    Armoire détectée : {armoire.no_serie} · IP {armoire.ip || '—'}
                                </p>
                            ) : (
                                <p className="device-meta">Aucune armoire détectée sur cette gateway.</p>
                            );
                        })()}

                        <div className="modal-actions">
                            <button onClick={() => setEditingUser(null)} className="catalog-button ghost">Annuler</button>
                            <button onClick={handleSaveLinks} className="catalog-button primary">Sauvegarder</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManager;
