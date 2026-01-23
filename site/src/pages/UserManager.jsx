import React, { useState, useEffect } from 'react';
import './Catalog.css';

const UserManager = ({ token }) => {
    const [users, setUsers] = useState([]);
    const [machines, setMachines] = useState([]);
    const [gateways, setGateways] = useState([]);
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
        setEditMachine(user.linked_machine_id || '');
        setEditGateway(user.linked_gateway_id || '');
    };

    const handleSaveLinks = async () => {
        if (!editingUser) return;
        try {
            const body = {
                linked_machine_id: editMachine ? parseInt(editMachine) : null,
                linked_gateway_id: editGateway || null
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
                                    <th>Machine Liée</th>
                                    <th>Gateway Liée</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
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
                                        <td>{u.linked_machine_id ? `ID: ${u.linked_machine_id}` : '-'}</td>
                                        <td>{u.linked_gateway_id ? u.linked_gateway_id : '-'}</td>
                                        <td className="table-actions">
                                            {localStorage.getItem('adminRole') === 'admin_global' && (
                                                <button onClick={() => openEditModal(u)} className="catalog-button ghost">
                                                    Lier Appareils
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {!loading && users.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="empty-state">Aucun utilisateur trouvé.</td>
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

                        <label className="field">
                            <span>Machine (Armoire)</span>
                            <select
                                value={editMachine}
                                onChange={(e) => setEditMachine(e.target.value)}
                            >
                                <option value="">-- Aucune --</option>
                                {machines.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.no_serie} (ID: {m.id}) - {m.ip}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="field">
                            <span>Gateway</span>
                            <select
                                value={editGateway}
                                onChange={(e) => setEditGateway(e.target.value)}
                            >
                                <option value="">-- Aucune --</option>
                                {gateways.map(g => (
                                    <option key={g.hostname} value={g.hostname}>
                                        {g.hostname} ({g.ip})
                                    </option>
                                ))}
                            </select>
                        </label>

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
