import React, { useState, useEffect } from 'react';
import './Auth.css'; // Reusing auth styles for form

const UserManager = ({ token }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Default form state
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
    });

    useEffect(() => {
        fetchUsers();
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
                // Update local state without refresh
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
                        <label style={{ fontSize: '0.8em', marginBottom: '5px' }}>Prénom</label>
                        <input
                            type="text"
                            placeholder="Prénom"
                            value={newUser.firstName}
                            onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.8em', marginBottom: '5px' }}>Nom</label>
                        <input
                            type="text"
                            placeholder="Nom"
                            value={newUser.lastName}
                            onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                            style={inputStyle}
                        />
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
                                <th style={thStyle}>Date Création</th>
                                <th style={thStyle}>Rôle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #444' }}>
                                    <td style={tdStyle}>{u.id}</td>
                                    <td style={tdStyle}>{u.email}</td>
                                    <td style={tdStyle}>{u.first_name} {u.last_name}</td>
                                    <td style={tdStyle}>{new Date(u.created_at).toLocaleDateString()}</td>
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Simple Styles
const inputStyle = {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #444',
    background: '#333',
    color: 'white',
    minWidth: '200px'
};

const buttonStyle = {
    padding: '9px 20px',
    borderRadius: '4px',
    border: 'none',
    background: '#00C9FF',
    color: 'black',
    fontWeight: 'bold',
    cursor: 'pointer'
};

const selectStyle = {
    padding: '5px',
    borderRadius: '4px',
    background: '#333',
    color: 'white',
    border: '1px solid #555'
};

const thStyle = { padding: '12px', textAlign: 'left' };
const tdStyle = { padding: '12px' };

export default UserManager;
