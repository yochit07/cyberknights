import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import './AuthPages.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await authApi.forgotPassword(email);
            setSuccess('Reset link sent! Check your email inbox.');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send reset email.');
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
                <h1 className="auth-title">Reset Password</h1>
                <p className="auth-sub">Enter your email to receive a reset link</p>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">✓ {success}</div>}

                {!success && (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input type="email" className="form-input" placeholder="you@example.com"
                                value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <Link to="/login">← Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
