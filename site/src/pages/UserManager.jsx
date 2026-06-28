import React, { useState, useEffect } from 'react';
import './Catalog.css';

const normalizeGatewayKey = (value) => (value ? value.replace(/^gw-/, '').toLowerCase() : '');

const REMOTE_INELIGIBLE_GATEWAY = 'essensys-server';

const isRemoteEligibleGateway = (gatewayId) => {
    if (!gatewayId) return true;
    return normalizeGatewayKey(gatewayId) !== REMOTE_INELIGIBLE_GATEWAY;
};

const userHasPortalGateway = (user) => !!(user?.linked_gateway_id);

const LINK_MODE = {
    ARMOIRE: 'armoire',
    GATEWAY: 'gateway',
    SERVER: 'server',
};

const inferLinkMode = (user) => {
    if (user?.linked_gateway_id) {
        return isRemoteEligibleGateway(user.linked_gateway_id)
            ? LINK_MODE.GATEWAY
            : LINK_MODE.SERVER;
    }
    if (user?.linked_armoire_id || user?.linked_machine_id) {
        return LINK_MODE.ARMOIRE;
    }
    return LINK_MODE.ARMOIRE;
};

const linkModeLabel = (mode) => {
    switch (mode) {
        case LINK_MODE.GATEWAY:
            return 'Armoire + gateway (portail + local)';
        case LINK_MODE.SERVER:
            return 'Serveur legacy (essensys-server)';
        default:
            return 'Armoire seule (portail cloud OVH)';
    }
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

const formatMachineLabel = (m) => `IP ${m.ip || '—'} · ${m.no_serie} · inv. #${m.id}`;

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
    const linkMode = inferLinkMode(user);
    const gatewayStatus = findGateway(gateways, user.linked_gateway_id);
    const portalGw = findPortalGateway(portalGateways, user.linked_gateway_id);
    const cloudMachineId = portalGw?.machine_id ?? user.linked_machine_id;
    const remoteEligible = isRemoteEligibleGateway(user.linked_gateway_id);
    const armoireId = user.linked_armoire_id ?? (linkMode === LINK_MODE.ARMOIRE ? user.linked_machine_id : null);
    const armoire = armoireId ? findMachineById(machines, armoireId) : null;

    const gatewayLabel = gatewayStatus?.hostname || user.linked_gateway_id;

    return {
        linkMode,
        gatewayLabel,
        gatewayIp: gatewayStatus?.ip,
        portalGatewayId: portalGw?.gateway_id,
        cloudMachineId,
        armoire,
        remoteEligible,
        hasGateway: !!(user.linked_gateway_id),
        hasLinks: linkMode === LINK_MODE.ARMOIRE
            ? !!(armoire || user.linked_machine_id)
            : !!(user.linked_gateway_id),
    };
};

const UserLinksSummary = ({
    user,
    linkMode,
    gatewayLabel,
    gatewayIp,
    portalGatewayId,
    cloudMachineId,
    armoire,
    hasLinks,
}) => {
    if (!hasLinks) {
        return <span className="links-empty">Aucune liaison</span>;
    }

    return (
        <div className="user-links-summary">
            <div className="link-row">
                <span className="link-tag">Mode</span>
                <div className="link-body">
                    <span className="link-primary">{linkModeLabel(linkMode)}</span>
                </div>
            </div>
            {linkMode === LINK_MODE.GATEWAY && (
                <>
                    <div className="link-row">
                        <span className="link-tag">GW</span>
                        <div className="link-body">
                            <span className="link-primary">{portalGatewayId || gatewayLabel || user.linked_gateway_id}</span>
                            {gatewayIp && <span className="link-meta">{gatewayIp}</span>}
                        </div>
                    </div>
                    <div className="link-row">
                        <span className="link-tag">Cloud</span>
                        <div className="link-body">
                            <span className="link-primary">
                                {cloudMachineId ? `machine #${cloudMachineId}` : 'non renseigné'}
                            </span>
                        </div>
                    </div>
                </>
            )}
            {linkMode === LINK_MODE.SERVER && (
                <div className="link-row">
                    <span className="link-tag">Srv</span>
                    <div className="link-body">
                        <span className="link-primary">essensys-server</span>
                        <span className="link-meta">local uniquement</span>
                    </div>
                </div>
            )}
            <div className="link-row">
                <span className="link-tag">Armoire</span>
                <div className="link-body">
                    {armoire ? (
                        <>
                            <span className="link-primary">{armoire.no_serie}</span>
                            {armoire.ip && <span className="link-meta">IP {armoire.ip}</span>}
                        </>
                    ) : (
                        <span className="link-muted">non renseignée</span>
                    )}
                </div>
            </div>
        </div>
    );
};

const UserRowActions = ({
    user,
    adminRole,
    remoteEligible,
    onEdit,
    onResend,
    onRemoveArmoire,
    onRemovePortalLink,
    onForbid,
    onUnforbid,
    onDelete,
    menuOpen,
    onToggleMenu,
    onCloseMenu,
}) => {
    const isGlobalAdmin = adminRole === 'admin_global';
    const canModerate = canModerateUser(user, adminRole);

    return (
        <div className="user-row-actions">
            {isGlobalAdmin && (
                <button
                    type="button"
                    onClick={onEdit}
                    className="catalog-button primary"
                    disabled={!!user.forbidden_at}
                >
                    Gérer
                </button>
            )}
            {(isGlobalAdmin || canModerate) && (
                <div className="actions-dropdown">
                    <button
                        type="button"
                        className="catalog-button ghost actions-dropdown-trigger"
                        aria-expanded={menuOpen}
                        aria-haspopup="menu"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleMenu();
                        }}
                    >
                        ⋯
                    </button>
                    {menuOpen && (
                        <>
                            <button
                                type="button"
                                className="actions-dropdown-backdrop"
                                aria-label="Fermer le menu"
                                onClick={onCloseMenu}
                            />
                            <div
                                className="actions-dropdown-panel"
                                role="menu"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {isGlobalAdmin && (
                                    <>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            disabled={!!user.forbidden_at}
                                            onClick={() => { onCloseMenu(); onEdit(); }}
                                        >
                                            Lier appareils…
                                        </button>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            disabled={!!user.forbidden_at}
                                            onClick={() => { onCloseMenu(); onResend(); }}
                                        >
                                            Renvoyer email
                                        </button>
                                        {user.linked_gateway_id && (
                                            <button
                                                type="button"
                                                role="menuitem"
                                                className="danger-text"
                                                disabled={!!user.forbidden_at}
                                                onClick={() => { onCloseMenu(); onRemovePortalLink(); }}
                                            >
                                                Enlever gateway et serveur
                                            </button>
                                        )}
                                        {remoteEligible && (user.linked_armoire_id || (inferLinkMode(user) === LINK_MODE.ARMOIRE && user.linked_machine_id)) && (
                                            <button
                                                type="button"
                                                role="menuitem"
                                                className="danger-text"
                                                disabled={!!user.forbidden_at}
                                                onClick={() => { onCloseMenu(); onRemoveArmoire(); }}
                                            >
                                                Enlever armoire
                                            </button>
                                        )}
                                    </>
                                )}
                                {canModerate && (
                                    <>
                                        {(isGlobalAdmin) && <div className="actions-dropdown-divider" />}
                                        {user.forbidden_at ? (
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={() => { onCloseMenu(); onUnforbid(); }}
                                            >
                                                Réautoriser
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={() => { onCloseMenu(); onForbid(); }}
                                            >
                                                Interdire
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            role="menuitem"
                                            className="danger-text"
                                            onClick={() => { onCloseMenu(); onDelete(); }}
                                        >
                                            Supprimer
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const canModerateUser = (target, adminRole) => {
    if (adminRole === 'admin_global') {
        return true;
    }
    if (adminRole === 'admin_local') {
        return ['user', 'guest_local'].includes(target.role);
    }
    return false;
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
    const [editLinkMode, setEditLinkMode] = useState(LINK_MODE.ARMOIRE);

    // Resend email
    const [resendUser, setResendUser] = useState(null);
    const [resendTemplate, setResendTemplate] = useState('user_welcome');
    const [resendPassword, setResendPassword] = useState('');
    const [openMenuUserId, setOpenMenuUserId] = useState(null);

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
        const mode = inferLinkMode(user);
        setEditingUser(user);
        setEditLinkMode(mode);
        const gatewayStatus = findGateway(gateways, user.linked_gateway_id);
        const portalGw = findPortalGateway(portalGateways, user.linked_gateway_id);
        const detected = findArmoireForGateway(machines, gatewayStatus);
        const armoireId = user.linked_armoire_id
            ?? (mode === LINK_MODE.ARMOIRE ? user.linked_machine_id : detected?.id);
        setEditGateway(gatewayStatus?.hostname || user.linked_gateway_id || '');
        setEditMachine(String(portalGw?.machine_id ?? user.linked_machine_id ?? ''));
        setEditArmoire(armoireId ? String(armoireId) : '');
    };

    const handleLinkModeChange = (mode) => {
        setEditLinkMode(mode);
        if (mode === LINK_MODE.ARMOIRE) {
            setEditGateway('');
            setEditMachine('');
        } else if (mode === LINK_MODE.SERVER) {
            setEditGateway('essensys-server');
            setEditMachine('');
        }
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

    const putUserLinks = async (userId, body) => {
        const res = await fetch(`/api/admin/users/${userId}/links`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Échec mise à jour des liaisons');
        }
    };

    const handleSaveLinks = async () => {
        if (!editingUser) return;
        try {
            const portalLinkLocked = userHasPortalGateway(editingUser) && editLinkMode === LINK_MODE.GATEWAY;
            let body;

            if (editLinkMode === LINK_MODE.ARMOIRE) {
                if (!editArmoire) {
                    alert('Sélectionnez une armoire (inventaire OVH)');
                    return;
                }
                const armoireId = parseInt(editArmoire, 10);
                body = {
                    linked_gateway_id: null,
                    linked_machine_id: armoireId,
                    linked_armoire_id: armoireId,
                };
            } else if (editLinkMode === LINK_MODE.SERVER) {
                body = {
                    linked_gateway_id: 'essensys-server',
                    linked_machine_id: null,
                    linked_armoire_id: editArmoire ? parseInt(editArmoire, 10) : null,
                };
            } else {
                const portalGw = findPortalGateway(portalGateways, editGateway);
                let gatewayId = portalGw?.gateway_id || editGateway || null;
                let machineId = editMachine ? parseInt(editMachine, 10) : null;

                if (portalLinkLocked) {
                    gatewayId = editingUser.linked_gateway_id;
                    if (editingUser.linked_machine_id) {
                        machineId = editingUser.linked_machine_id;
                    }
                } else if (!gatewayId) {
                    alert('Sélectionnez une gateway CM5');
                    return;
                } else if (!machineId) {
                    alert('Renseignez le serveur cloud (machine_id)');
                    return;
                }

                body = {
                    linked_machine_id: machineId,
                    linked_gateway_id: gatewayId,
                    linked_armoire_id: editArmoire ? parseInt(editArmoire, 10) : null,
                };
            }

            await putUserLinks(editingUser.id, body);
            alert('Liaisons enregistrées');
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            alert(err.message || 'Error updating links');
        }
    };

    const handleRemovePortalLink = async (userFromRow) => {
        const target = userFromRow || editingUser;
        if (!target?.linked_gateway_id) return;
        if (!window.confirm(
            `Retirer la gateway et le serveur cloud pour ${target.email} ?\n\nLe portail distant sera désactivé pour cet utilisateur.`,
        )) {
            return;
        }
        try {
            await putUserLinks(target.id, {
                linked_gateway_id: null,
                linked_machine_id: null,
                linked_armoire_id: null,
            });
            alert('Gateway et serveur cloud retirés');
            setEditGateway('');
            setEditMachine('');
            setEditArmoire('');
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            alert(err.message || 'Erreur réseau');
        }
    };

    const handleRemoveArmoire = async (userFromRow) => {
        const target = userFromRow || editingUser;
        if (!target) return;
        if (!window.confirm(`Retirer l'armoire liée pour ${target.email} ?`)) {
            return;
        }
        try {
            const mode = userFromRow ? inferLinkMode(target) : editLinkMode;
            let body;

            if (mode === LINK_MODE.ARMOIRE) {
                // Armoire seule : machine_id et armoire_id désignent la même ressource cloud.
                body = {
                    linked_gateway_id: null,
                    linked_machine_id: null,
                    linked_armoire_id: null,
                };
            } else {
                const gatewayKey = userFromRow
                    ? target.linked_gateway_id
                    : (editGateway || target.linked_gateway_id);
                const portalGw = findPortalGateway(portalGateways, gatewayKey);
                const gatewayId = portalGw?.gateway_id || gatewayKey || null;
                const machineId = userFromRow
                    ? target.linked_machine_id
                    : (editMachine ? parseInt(editMachine, 10) : target.linked_machine_id);
                body = {
                    linked_machine_id: machineId || null,
                    linked_gateway_id: gatewayId,
                    linked_armoire_id: null,
                };
            }

            await putUserLinks(target.id, body);
            alert('Armoire retirée');
            setEditArmoire('');
            setEditMachine('');
            if (!userFromRow) {
                setEditingUser(null);
            }
            fetchUsers();
        } catch (err) {
            alert(err.message || 'Erreur réseau');
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

    const handleForbidUser = async (user) => {
        if (!window.confirm(`Interdire l'accès à ${user.email} ? L'utilisateur sera redirigé vers la page en construction.`)) {
            return;
        }
        try {
            const res = await fetch(`/api/admin/users/${user.id}/forbid`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok || res.status === 204) {
                fetchUsers();
            } else {
                alert(await res.text() || 'Échec interdiction');
            }
        } catch {
            alert('Erreur réseau');
        }
    };

    const handleUnforbidUser = async (user) => {
        if (!window.confirm(`Réautoriser ${user.email} ?`)) {
            return;
        }
        try {
            const res = await fetch(`/api/admin/users/${user.id}/unforbid`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok || res.status === 204) {
                fetchUsers();
            } else {
                alert(await res.text() || 'Échec réautorisation');
            }
        } catch {
            alert('Erreur réseau');
        }
    };

    const handleDeleteUser = async (user) => {
        const confirmEmail = window.prompt(`Supprimer définitivement ${user.email} ? Saisissez l'email pour confirmer :`);
        if (confirmEmail !== user.email) {
            return;
        }
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok || res.status === 204) {
                fetchUsers();
            } else {
                alert(await res.text() || 'Échec suppression');
            }
        } catch {
            alert('Erreur réseau');
        }
    };

    const adminRole = localStorage.getItem('adminRole') || sessionStorage.getItem('adminRole');

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
                                    <th>Liaisons portail</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => {
                                    const devices = resolveUserDevices(u, machines, gateways, portalGateways);

                                    return (
                                    <tr key={u.id}>
                                        <td>{u.id}</td>
                                        <td>
                                            {u.email}
                                            {u.forbidden_at && (
                                                <span className="device-warning" style={{ marginLeft: '8px' }}>Interdit</span>
                                            )}
                                        </td>
                                        <td>{u.first_name} {u.last_name}</td>
                                        <td>
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                disabled={!!u.forbidden_at || u.role === 'admin_global' || (adminRole === 'admin_local' && u.role === 'admin_local')}
                                            >
                                                {adminRole === 'admin_global' ? (
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
                                            <UserLinksSummary user={u} {...devices} />
                                        </td>
                                        <td className="table-actions">
                                            <UserRowActions
                                                user={u}
                                                adminRole={adminRole}
                                                remoteEligible={devices.remoteEligible}
                                                menuOpen={openMenuUserId === u.id}
                                                onToggleMenu={() => setOpenMenuUserId(openMenuUserId === u.id ? null : u.id)}
                                                onCloseMenu={() => setOpenMenuUserId(null)}
                                                onEdit={() => openEditModal(u)}
                                                onResend={() => {
                                                    setResendUser(u);
                                                    setResendTemplate('user_welcome');
                                                    setResendPassword('');
                                                }}
                                                onRemoveArmoire={() => handleRemoveArmoire(u)}
                                                onRemovePortalLink={() => handleRemovePortalLink(u)}
                                                onForbid={() => handleForbidUser(u)}
                                                onUnforbid={() => handleUnforbidUser(u)}
                                                onDelete={() => handleDeleteUser(u)}
                                            />
                                        </td>
                                    </tr>
                                    );
                                })}
                                {!loading && users.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="empty-state">Aucun utilisateur trouvé.</td>
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
                const portalLinkLocked = userHasPortalGateway(editingUser) && editLinkMode === LINK_MODE.GATEWAY;
                const showGatewayFields = editLinkMode === LINK_MODE.GATEWAY;

                return (
                <div className="modal-overlay">
                    <div className="modal-content modal-content-wide">
                        <h3>Lier Appareils pour {editingUser.email}</h3>

                        <p className="device-meta" style={{ marginBottom: '1rem' }}>
                            <strong>1. Armoire seule</strong> — portail <a href="https://mon.essensys.fr/portal/">mon.essensys.fr/portal</a>
                            {' '}(armoire en HTTPS vers OVH, sans CM5).
                            <br />
                            <strong>2. Armoire + gateway</strong> — portail cloud + interface locale{' '}
                            <code>mon.essensys.local/login</code>.
                            <br />
                            <strong>3. Serveur legacy</strong> — essensys-server, local uniquement (pas de portail distant).
                        </p>

                        <label className="field">
                            <span>Mode de liaison</span>
                            <select
                                value={editLinkMode}
                                onChange={(e) => handleLinkModeChange(e.target.value)}
                            >
                                <option value={LINK_MODE.ARMOIRE}>1 — Armoire seule (portail OVH)</option>
                                <option value={LINK_MODE.GATEWAY}>2 — Armoire + gateway CM5</option>
                                <option value={LINK_MODE.SERVER}>3 — Serveur legacy (essensys-server)</option>
                            </select>
                        </label>

                        {portalLinkLocked && (
                            <p className="link-hint" style={{ marginBottom: '1rem' }}>
                                Gateway et serveur cloud verrouillés dans les listes. Utilisez le bouton pour tout retirer.
                            </p>
                        )}

                        {showGatewayFields && (
                        <label className="field">
                            <span>Gateway CM5</span>
                            <select
                                value={editGateway}
                                onChange={(e) => handleGatewayChange(e.target.value)}
                                disabled={portalLinkLocked}
                            >
                                {!portalLinkLocked && <option value="">-- Choisir une gateway --</option>}
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
                        )}

                        {editLinkMode === LINK_MODE.SERVER && (
                            <p className="device-warning">
                                Mode serveur legacy : pas d&apos;accès au portail distant mon.essensys.fr.
                            </p>
                        )}

                        {showGatewayFields && (
                        <label className="field">
                            <span>Serveur cloud (machine_id)</span>
                            <input
                                type="number"
                                min="1"
                                value={editMachine}
                                onChange={(e) => setEditMachine(e.target.value)}
                                placeholder="Ex. 19"
                                disabled={portalLinkLocked}
                                readOnly={portalLinkLocked}
                            />
                        </label>
                        )}

                        <label className="field">
                            <span>Armoire (inventaire OVH){editLinkMode === LINK_MODE.ARMOIRE ? '' : ' — optionnel'}</span>
                            <select
                                value={editArmoire}
                                onChange={(e) => setEditArmoire(e.target.value)}
                            >
                                <option value="">
                                    {editLinkMode === LINK_MODE.ARMOIRE
                                        ? '-- Choisir une armoire --'
                                        : '-- Aucune --'}
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

                        {portalLinkLocked && (
                            <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => handleRemovePortalLink()}
                                    className="catalog-button danger"
                                >
                                    Enlever gateway et serveur du user
                                </button>
                            </div>
                        )}

                        {(editArmoire || editingUser.linked_armoire_id) && (
                            <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveArmoire()}
                                    className="catalog-button danger"
                                >
                                    Enlever armoire du user
                                </button>
                            </div>
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
