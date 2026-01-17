import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    password: formData.password
                }),
            });

            if (res.ok) {
                // Success
                navigate('/login');
            } else {
                const data = await res.json(); // Usually backend returns generic text or json
                // Should check content type of error if simple string
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '480px' }}>
                <div className="auth-header">
                    <h2>Créer un compte</h2>
                    <p>Rejoignez Essensys Support</p>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Prénom</label>
                            <input
                                type="text"
                                name="first_name"
                                className="auth-input"
                                placeholder="Jean"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Nom</label>
                            <input
                                type="text"
                                name="last_name"
                                className="auth-input"
                                placeholder="Dupont"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            className="auth-input"
                            placeholder="exemple@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            name="password"
                            className="auth-input"
                            placeholder="Minimum 8 caractères"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirmer le mot de passe</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="auth-input"
                            placeholder="Répétez le mot de passe"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-btn btn-primary" disabled={loading}>
                        {loading ? 'Inscription...' : "S'inscrire"}
                    </button>
                </form>

                <div className="auth-footer">
                    Déjà un compte ?
                    <Link to="/login" className="auth-link">Se connecter</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
