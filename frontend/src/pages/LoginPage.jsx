import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const { data } = await authApi.login(form);
            login(data.user, data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg" />
            <div className="auth-card">
                <div className="auth-logo">
                    <span className="auth-logo-icon">⚔️</span>
                    <span>CyberKnights</span>
                </div>
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-sub">Sign in to your security dashboard</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-input" placeholder="you@example.com"
                            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input type="password" className="form-input" placeholder="••••••••"
                            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    <div className="auth-forgot">
                        <Link to="/forgot-password">Forgot password?</Link>
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Signing in...</> : 'Sign In →'}
                    </button>

                    {import.meta.env.MODE === 'development' && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--clr-border)', textAlign: 'center' }}>
                            <p style={{ fontSize: '10px', color: 'var(--clr-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Developer Access</p>
                            <button
                                type="button"
                                className="btn btn-outline btn-full btn-sm"
                                style={{ fontSize: '11px', height: '32px' }}
                                onClick={() => setForm({ email: 'admin@cyberknights.io', password: 'admin123' })}
                            >
                                ⚡ Load Demo Admin
                            </button>
                        </div>
                    )}
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
                </div>
            </div>
        </div>
    );
}
