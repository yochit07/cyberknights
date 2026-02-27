import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function RegisterPage() {
    const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (form.password !== form.confirm) return setError('Passwords do not match');
        if (form.password.length < 6) return setError('Password must be at least 6 characters');
        setLoading(true);
        try {
            await authApi.register({ email: form.email, password: form.password, fullName: form.fullName });
            setSuccess('Account created! Check your email to confirm, then sign in.');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed.');
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
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-sub">Start securing your apps today</p>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {!success && (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input type="text" className="form-input" placeholder="John Doe"
                                value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input type="email" className="form-input" placeholder="you@example.com"
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input type="password" className="form-input" placeholder="Min. 6 characters"
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input type="password" className="form-input" placeholder="••••••••"
                                value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account →'}
                        </button>
                    </form>
                )}
                {success && (
                    <Link to="/login" className="btn btn-outline btn-full" style={{ marginTop: '12px' }}>Go to Login →</Link>
                )}

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
