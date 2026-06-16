import React, { useState, useEffect } from 'react';
import './Catalog.css';

const normalizeGatewayKey = (value) => (value ? value.replace(/^gw-/, '').toLowerCase() : '');

const REMOTE_INELIGIBLE_GATEWAY = 'essensys-server';

const isRemoteEligibleGateway = (gatewayId) => {
    if (!gatewayId) return true;
    return normalizeGatewayKey(gatewayId) !== REMOTE_INELIGIBLE_GATEWAY;
};

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

const findMachineById = (machines, id) => {
    if (!id) return null;
    return machines.find((m) => m.id === id) ?? null;
};

const formatMachineLabel = (m) => `${m.no_serie} · inv. #${m.id} · IP ${m.ip || '—'}`;

const sortMachinesForPicker = (machines, gatewayStatus) => {
    const gwIp = gatewayStatus?.ip;
    const onGateway = gwIp ? machines.filter((m) => m.ip === gwIp) : [];
    const onLan = machines.filter(
        (m) => m.ip?.startsWith('10.0.1.') && !onGateway.some((x) => x.id === m.id),
    );
    const others = machines
        .filter((m) => !onGateway.some((x) => x.id === m.id) && !onLan.some((x) => x.id === m.id))
        .sort((a, b) => new Date(b.last_seen || 0) - new Date(a.last_seen || 0));
    return { onGateway, onLan, others };
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
    const remoteEligible = isRemoteEligibleGateway(user.linked_gateway_id);
    const armoire = remoteEligible && user.linked_armoire_id
        ? findMachineById(machines, user.linked_armoire_id)
        : remoteEligible
            ? findArmoireForGateway(machines, gatewayStatus)
            : null;

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
        remoteEligible,
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
    const [editArmoire, setEditArmoire] = useState('');

    // Resend email
    const [resendUser, setResendUser] = useState(null);
    const [resendTemplate, setResendTemplate] = useState('user_welcome');
    const [resendPassword, setResendPassword] = useState('');

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
                setUsers(Array.isArray(data) ? data : []);
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
            if (resM.ok) {
                const data = await resM.json();
                setMachines(Array.isArray(data) ? data : []);
            }

            const resG = await fetch('/api/admin/gateways', { headers: { 'Authorization': `Bearer ${token}` } });
            if (resG.ok) {
                const data = await resG.json();
                setGateways(Array.isArray(data) ? data : []);
            }

            const resP = await fetch('/api/portal/admin/gateway-sessions', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (resP.ok) {
                const data = await resP.json();
                setPortalGateways(Array.isArray(data) ? data : []);
            }
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
        const detected = findArmoireForGateway(machines, gatewayStatus);
        setEditGateway(gatewayStatus?.hostname || user.linked_gateway_id || '');
        setEditMachine(String(portalGw?.machine_id ?? user.linked_machine_id ?? ''));
        setEditArmoire(String(user.linked_armoire_id ?? detected?.id ?? ''));
    };

    const handleGatewayChange = (value) => {
        setEditGateway(value);
        if (!isRemoteEligibleGateway(value)) {
            setEditMachine('');
            setEditArmoire('');
            return;
        }
        const portalGw = findPortalGateway(portalGateways, value);
        if (portalGw?.machine_id) {
            setEditMachine(String(portalGw.machine_id));
        }
        const gw = findGateway(gateways, value);
        const detected = findArmoireForGateway(machines, gw);
        if (detected) {
            setEditArmoire(String(detected.id));
        }
    };

    const handleSaveLinks = async () => {
        if (!editingUser) return;
        try {
            const portalGw = findPortalGateway(portalGateways, editGateway);
            const gatewayId = portalGw?.gateway_id || editGateway || null;
            const remoteEligible = isRemoteEligibleGateway(gatewayId || editGateway);
            const body = {
                linked_machine_id: remoteEligible && editMachine ? parseInt(editMachine, 10) : null,
                linked_gateway_id: gatewayId,
                linked_armoire_id: remoteEligible && editArmoire ? parseInt(editArmoire, 10) : null,
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

    const handleResendEmail = async () => {
        if (!resendUser) return;
        try {
            const res = await fetch(`/api/admin/users/${resendUser.id}/resend-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    template_slug: resendTemplate,
                    password: resendPassword || undefined,
                }),
            });
            if (res.ok) {
                alert('Email renvoyé avec succès');
                setResendUser(null);
                setResendPassword('');
            } else {
                const text = await res.text();
                alert(text || 'Échec envoi email');
            }
        } catch {
            alert('Erreur réseau');
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
                                        remoteEligible,
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
                                            {!remoteEligible ? (
                                                <span className="device-meta">Portail distant N/A</span>
                                            ) : (
                                                <DeviceCell
                                                    title={cloudMachineId ? `ID ${cloudMachineId}` : undefined}
                                                    subtitle={serverSubtitle || undefined}
                                                    fallback={u.linked_machine_id ? String(u.linked_machine_id) : undefined}
                                                />
                                            )}
                                        </td>
                                        <td>
                                            {!remoteEligible ? (
                                                <span className="device-meta">— (essensys-server)</span>
                                            ) : (
                                                <DeviceCell
                                                    title={armoire?.no_serie}
                                                    subtitle={armoire?.ip ? `IP ${armoire.ip}` : undefined}
                                                    fallback={armoire ? `ID ${armoire.id}` : undefined}
                                                />
                                            )}
                                        </td>
                                        <td className="table-actions">
                                            {localStorage.getItem('adminRole') === 'admin_global' && (
                                                <>
                                                <button onClick={() => openEditModal(u)} className="catalog-button ghost">
                                                    Lier Appareils
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setResendUser(u);
                                                        setResendTemplate('user_welcome');
                                                        setResendPassword('');
                                                    }}
                                                    className="catalog-button ghost"
                                                    style={{ marginLeft: '8px' }}
                                                >
                                                    Renvoyer email
                                                </button>
                                                </>
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

            {editingUser && (() => {
                const gw = findGateway(gateways, editGateway);
                const { onGateway, onLan, others } = sortMachinesForPicker(machines, gw);
                const selectedArmoire = findMachineById(machines, editArmoire ? parseInt(editArmoire, 10) : null);
                const remoteEligible = isRemoteEligibleGateway(editGateway);

                return (
                <div className="modal-overlay">
                    <div className="modal-content modal-content-wide">
                        <h3>Lier Appareils pour {editingUser.email}</h3>

                        <p className="device-meta" style={{ marginBottom: '1rem' }}>
                            Gateway et serveur cloud pilotent le portail distant.
                            L&apos;armoire (inventaire OVH) sert au repérage admin — choisissez-la dans la liste.
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

                        {!remoteEligible && editGateway && (
                            <p className="device-warning">
                                essensys-server : pas de portail distant mon.essensys.fr.
                                Seule la gateway peut être enregistrée (sans armoire ni serveur cloud).
                            </p>
                        )}

                        <label className="field">
                            <span>Serveur cloud (machine_id)</span>
                            <input
                                type="number"
                                min="1"
                                value={editMachine}
                                onChange={(e) => setEditMachine(e.target.value)}
                                placeholder="Ex. 19"
                                disabled={!remoteEligible}
                            />
                        </label>

                        <label className="field">
                            <span>Armoire (inventaire OVH)</span>
                            <select
                                value={editArmoire}
                                onChange={(e) => setEditArmoire(e.target.value)}
                                disabled={!remoteEligible}
                            >
                                <option value="">
                                    {remoteEligible ? '-- Choisir une armoire --' : '-- Non applicable (essensys-server) --'}
                                </option>
                                {onGateway.length > 0 && (
                                    <optgroup label={`Sur la gateway (${gw?.ip || 'IP'})`}>
                                        {onGateway.map((m) => (
                                            <option key={m.id} value={m.id}>{formatMachineLabel(m)}</option>
                                        ))}
                                    </optgroup>
                                )}
                                {onLan.length > 0 && (
                                    <optgroup label="Segment armoire 10.0.1.x">
                                        {onLan.map((m) => (
                                            <option key={m.id} value={m.id}>{formatMachineLabel(m)}</option>
                                        ))}
                                    </optgroup>
                                )}
                                <optgroup label="Toutes les armoires">
                                    {others.map((m) => (
                                        <option key={m.id} value={m.id}>{formatMachineLabel(m)}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </label>

                        {selectedArmoire && (
                            <p className="device-meta">
                                Armoire sélectionnée : {selectedArmoire.no_serie} · inv. #{selectedArmoire.id}
                                {selectedArmoire.ip ? ` · IP ${selectedArmoire.ip}` : ''}
                            </p>
                        )}

                        <div className="modal-actions">
                            <button onClick={() => setEditingUser(null)} className="catalog-button ghost">Annuler</button>
                            <button onClick={handleSaveLinks} className="catalog-button primary">Sauvegarder</button>
                        </div>
                    </div>
                </div>
                );
            })()}

            {resendUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Renvoyer un email — {resendUser.email}</h3>
                        <label className="field">
                            <span>Modèle</span>
                            <select value={resendTemplate} onChange={(e) => setResendTemplate(e.target.value)}>
                                <option value="user_welcome">Bienvenue utilisateur</option>
                                <option value="device_allocation">Allocation appareils</option>
                                <option value="password_reset">Réinitialisation mot de passe</option>
                                <option value="role_updated">Changement de rôle</option>
                            </select>
                        </label>
                        {(resendTemplate === 'user_welcome' || resendTemplate === 'password_reset') && (
                            <label className="field">
                                <span>Mot de passe (optionnel, pour le corps du mail)</span>
                                <input
                                    type="text"
                                    value={resendPassword}
                                    onChange={(e) => setResendPassword(e.target.value)}
                                    placeholder="Laisser vide si non requis"
                                />
                            </label>
                        )}
                        <div className="modal-actions">
                            <button type="button" onClick={() => setResendUser(null)} className="catalog-button ghost">Annuler</button>
                            <button type="button" onClick={handleResendEmail} className="catalog-button primary">Envoyer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManager;
