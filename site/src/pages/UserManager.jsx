import React, { useState, useEffect } from 'react';
import './Auth.css'; // Reusing auth styles for form

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
        <div style={{ color: 'white', marginTop: '20px' }}>
            <h2>Gestion des Utilisateurs</h2>

            {/* Create User Form - Compact */}
            <div style={{ background: '#2a2a2a', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                <h3 style={{ marginTop: 0 }}>Ajouter un Utilisateur</h3>
                <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.8em', marginBottom: '5px' }}>Email</label>
                        <input
                            type="email"
                            placeholder="Email"
                            value={newUser.email}
                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                            required
                            style={inputStyle}
                        />
                    </div>
                    {/* ... (Other inputs can stay concise, reused style) ... */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.8em', marginBottom: '5px' }}>Mot de passe</label>
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={newUser.password}
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            required
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.8em', marginBottom: '5px' }}>Prénom (Opt)</label>
                        <input type="text" placeholder="Prénom" value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.8em', marginBottom: '5px' }}>Nom (Opt)</label>
                        <input type="text" placeholder="Nom" value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} style={inputStyle} />
                    </div>
                    <button type="submit" style={buttonStyle}>Ajouter</button>
                </form>
            </div>

            {/* User List */}
            {loading ? <p>Chargement...</p> : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#222' }}>
                        <thead>
                            <tr style={{ background: '#333', color: '#fff' }}>
                                <th style={thStyle}>ID</th>
                                <th style={thStyle}>Email</th>
                                <th style={thStyle}>Nom</th>
                                <th style={thStyle}>Rôle</th>
                                <th style={thStyle}>Machine Liée</th>
                                <th style={thStyle}>Gateway Liée</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #444' }}>
                                    <td style={tdStyle}>{u.id}</td>
                                    <td style={tdStyle}>{u.email}</td>
                                    <td style={tdStyle}>{u.first_name} {u.last_name}</td>
                                    <td style={tdStyle}>
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="user">User</option>
                                            <option value="support">Support</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td style={tdStyle}>
                                        {u.linked_machine_id ? `ID: ${u.linked_machine_id}` : '-'}
                                    </td>
                                    <td style={tdStyle}>
                                        {u.linked_gateway_id ? u.linked_gateway_id : '-'}
                                    </td>
                                    <td style={tdStyle}>
                                        <button onClick={() => openEditModal(u)} style={editLinkStyle}>Lier Appareils</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal Overlay */}
            {editingUser && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3>Lier Appareils pour {editingUser.email}</h3>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Machine (Armoire)</label>
                            <select
                                value={editMachine}
                                onChange={(e) => setEditMachine(e.target.value)}
                                style={{ ...inputStyle, width: '100%' }}
                            >
                                <option value="">-- Aucune --</option>
                                {machines.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.no_serie} (ID: {m.id}) - {m.ip}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Gateway</label>
                            <select
                                value={editGateway}
                                onChange={(e) => setEditGateway(e.target.value)}
                                style={{ ...inputStyle, width: '100%' }}
                            >
                                <option value="">-- Aucune --</option>
                                {gateways.map(g => (
                                    <option key={g.hostname} value={g.hostname}>
                                        {g.hostname} ({g.ip})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setEditingUser(null)} style={{ ...buttonStyle, background: '#555', color: 'white' }}>Annuler</button>
                            <button onClick={handleSaveLinks} style={buttonStyle}>Sauvegarder</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles
const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white', minWidth: '150px' };
const buttonStyle = { padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#00C9FF', color: 'black', fontWeight: 'bold', cursor: 'pointer' };
const selectStyle = { padding: '5px', borderRadius: '4px', background: '#333', color: 'white', border: '1px solid #555' };
const thStyle = { padding: '12px', textAlign: 'left' };
const tdStyle = { padding: '12px' };
const editLinkStyle = { background: 'transparent', border: '1px solid #00C9FF', color: '#00C9FF', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' };

const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalContentStyle = {
    background: '#222', padding: '30px', borderRadius: '8px', width: '400px', border: '1px solid #444'
};

export default UserManager;
