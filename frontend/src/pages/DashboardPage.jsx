import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

function RiskBadge({ classification }) {
    const map = { 'Safe': 'badge-safe', 'Medium Risk': 'badge-medium', 'High Risk': 'badge-high' };
    const icons = { 'Safe': '✓', 'Medium Risk': '⚡', 'High Risk': '⚠' };
    return <span className={`badge ${map[classification] || 'badge-info'}`}>{icons[classification]} {classification}</span>;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentScans, setRecentScans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [statsRes, reportsRes] = await Promise.all([reportsApi.getStats(), reportsApi.getAll(1)]);
                setStats(statsRes.data);
                setRecentScans(reportsRes.data.reports?.slice(0, 5) || []);
            } catch { }
            setLoading(false);
        };
        load();
    }, []);

    if (loading) return <div className="loading-screen"><div className="spinner" /><span>Loading dashboard...</span></div>;

    const s = stats || {};

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Welcome back, {user?.fullName || 'Analyst'} 👋</h1>
                <p className="page-subtitle">Here's your security analysis overview</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-4" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--clr-cyan-dim)' }}>📦</div>
                    <div className="stat-value" style={{ color: 'var(--clr-cyan)' }}>{s.total ?? '—'}</div>
                    <div className="stat-label">Total Scans</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--clr-green-dim)' }}>✓</div>
                    <div className="stat-value" style={{ color: 'var(--clr-green)' }}>{s.safe ?? '—'}</div>
                    <div className="stat-label">Safe APKs</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--clr-yellow-dim)' }}>⚡</div>
                    <div className="stat-value" style={{ color: 'var(--clr-yellow)' }}>{s.medium ?? '—'}</div>
                    <div className="stat-label">Medium Risk</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--clr-red-dim)' }}>⚠</div>
                    <div className="stat-value" style={{ color: 'var(--clr-red)' }}>{s.high ?? '—'}</div>
                    <div className="stat-label">High Risk</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-2" style={{ marginBottom: '24px', gap: '16px' }}>
                <Link to="/scan/apk" className="quick-action-card">
                    <div className="qa-icon">📦</div>
                    <div>
                        <div className="qa-title">Scan APK File</div>
                        <div className="qa-desc">Upload & analyze an Android application</div>
                    </div>
                    <div className="qa-arrow">→</div>
                </Link>
                <Link to="/scan/url" className="quick-action-card">
                    <div className="qa-icon">🔗</div>
                    <div>
                        <div className="qa-title">Scan URL</div>
                        <div className="qa-desc">Check a URL for threats and malicious patterns</div>
                    </div>
                    <div className="qa-arrow">→</div>
                </Link>
            </div>

            {/* Recent Scans Table */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Recent Scans</h2>
                    <Link to="/history" className="btn btn-outline btn-sm">View All →</Link>
                </div>
                {recentScans.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--clr-text-muted)' }}>
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📂</div>
                        <p>No scans yet. <Link to="/scan/apk" style={{ color: 'var(--clr-cyan)' }}>Upload your first APK.</Link></p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr><th>File</th><th>Risk Score</th><th>Classification</th><th>Date</th><th></th></tr>
                            </thead>
                            <tbody>
                                {recentScans.map(scan => (
                                    <tr key={scan.report_id}>
                                        <td className="mono">{scan.file_name || 'N/A'}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="mini-bar">
                                                    <div className="mini-fill" style={{
                                                        width: `${scan.risk_score}%`,
                                                        background: scan.classification === 'Safe' ? 'var(--clr-green)' : scan.classification === 'Medium Risk' ? 'var(--clr-yellow)' : 'var(--clr-red)'
                                                    }} />
                                                </div>
                                                <span>{scan.risk_score}/100</span>
                                            </div>
                                        </td>
                                        <td><RiskBadge classification={scan.classification} /></td>
                                        <td style={{ color: 'var(--clr-text-muted)', fontSize: '12px' }}>{new Date(scan.created_at).toLocaleDateString()}</td>
                                        <td><Link to={`/reports/${scan.report_id}`} className="btn btn-outline btn-sm">View</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Malware Alert if any */}
            {s.malwareFound > 0 && (
                <div className="alert alert-error" style={{ marginTop: '20px' }}>
                    ⚠ {s.malwareFound} scan{s.malwareFound > 1 ? 's' : ''} detected confirmed malware. Review your reports immediately.
                </div>
            )}
        </div>
    );
}
