import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Shield, User } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'guest' });
    const [error, setError] = useState('');
    const API_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/users`);
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setError('');
        if (!newUser.username || !newUser.password) {
            setError('Username and password are required');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            if (res.ok) {
                setNewUser({ username: '', password: '', role: 'guest' });
                fetchUsers();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to add user');
            }
        } catch (err) {
            console.error('Error adding user:', err);
            setError(`Server error: ${err.message}`);
        }
    };

    const handleDeleteUser = async (username) => {
        if (window.confirm(`Delete user "${username}"?`)) {
            try {
                const res = await fetch(`${API_URL}/users/${username}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    fetchUsers();
                } else {
                    const data = await res.json();
                    alert(data.error);
                }
            } catch (err) {
                console.error('Error deleting user:', err);
            }
        }
    };

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users className="text-primary" />
                User Management
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Add User Form */}
                <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserPlus size={20} />
                        Add New User
                    </h3>

                    <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Username</label>
                            <input
                                type="text"
                                className="input-field"
                                value={newUser.username}
                                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                placeholder="e.g., john_doe"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Password</label>
                            <input
                                type="password"
                                className="input-field"
                                value={newUser.password}
                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Role</label>
                            <select
                                className="input-field"
                                value={newUser.role}
                                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                            >
                                <option value="guest">Guest (View Only)</option>
                                <option value="admin">Admin (Full Access)</option>
                            </select>
                        </div>

                        {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}

                        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                            Create User
                        </button>
                    </form>
                </div>

                {/* User List */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Existing Users</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {users.map(u => (
                            <div key={u.username} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-glass)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        padding: '0.5rem',
                                        borderRadius: '50%',
                                        background: u.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                                        color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)'
                                    }}>
                                        {u.role === 'admin' ? <Shield size={20} /> : <User size={20} />}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 'bold' }}>{u.username}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{u.role}</p>
                                    </div>
                                </div>

                                {u.username !== 'admin' && (
                                    <button
                                        onClick={() => handleDeleteUser(u.username)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--danger)',
                                            cursor: 'pointer',
                                            padding: '0.5rem',
                                            opacity: 0.7
                                        }}
                                        title="Delete User"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
