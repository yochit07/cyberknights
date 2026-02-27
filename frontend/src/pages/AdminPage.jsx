import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

export default function AdminPage() {
    const [stats, setStats] = useState(null);
    const [signatures, setSignatures] = useState([]);
    const [recentScans, setRecentScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [sigForm, setSigForm] = useState({ sha256Hash: '', threatName: '', threatType: 'malware', severity: 'high', description: '' });
    const [sigMsg, setSigMsg] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [statsRes, sigsRes, scansRes] = await Promise.all([
                    adminApi.getStats(), adminApi.getSignatures(), adminApi.getScans()
                ]);
                setStats(statsRes.data); setSignatures(sigsRes.data.signatures || []); setRecentScans(scansRes.data.scans || []);
            } catch { }
            setLoading(false);
        };
        load();
    }, []);

    const handleAddSig = async (e) => {
        e.preventDefault(); setSigMsg('');
        try {
            await adminApi.addSignature(sigForm);
            setSigMsg('✓ Signature added successfully');
            const { data } = await adminApi.getSignatures();
            setSignatures(data.signatures || []);
            setSigForm({ sha256Hash: '', threatName: '', threatType: 'malware', severity: 'high', description: '' });
        } catch (err) { setSigMsg('✕ ' + (err.response?.data?.error || 'Failed')); }
    };

    const handleDeleteSig = async (id) => {
        if (!confirm('Delete this signature?')) return;
        try {
            await adminApi.deleteSignature(id);
            setSignatures(s => s.filter(x => x.signature_id !== id));
        } catch { }
    };

    if (loading) return <div className="loading-screen"><div className="spinner" /><span>Loading admin panel...</span></div>;

    const s = stats || {};

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">🛡️ Admin Panel</h1>
                <p className="page-subtitle">Platform management and monitoring</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--clr-border)', paddingBottom: '12px' }}>
                {[['overview', '📊 Overview'], ['signatures', '🦠 Signatures'], ['scans', '📋 All Scans']].map(([tab, label]) => (
                    <button key={tab} className={`btn btn-sm${activeTab === tab ? ' btn-primary' : ' btn-outline'}`}
                        onClick={() => setActiveTab(tab)}>{label}</button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-4" style={{ marginBottom: '24px' }}>
                        {[
                            { label: 'Total Scans', val: s.totalScans ?? '—', icon: '📦', color: 'var(--clr-cyan)' },
                            { label: 'Malware Found', val: s.malwareFound ?? '—', icon: '🦠', color: 'var(--clr-red)' },
                            { label: 'Signatures in DB', val: s.totalSignatures ?? '—', icon: '🔐', color: 'var(--clr-purple)' },
                            { label: 'URL Scans', val: s.urlScans ?? '—', icon: '🔗', color: 'var(--clr-green)' },
                        ].map(item => (
                            <div className="stat-card" key={item.label}>
                                <div className="stat-icon" style={{ background: `rgba(${item.color === 'var(--clr-cyan)' ? '0,212,255' : item.color === 'var(--clr-red)' ? '239,68,68' : item.color === 'var(--clr-purple)' ? '139,92,246' : '16,240,138'},0.15)` }}>{item.icon}</div>
                                <div className="stat-value" style={{ color: item.color }}>{item.val}</div>
                                <div className="stat-label">{item.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="alert alert-info">🛡️ Admin access grants full platform management. Handle user data and signatures with care.</div>
                </>
            )}

            {activeTab === 'signatures' && (
                <>
                    {/* Add Signature Form */}
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Add Malware Signature</h3>
                        {sigMsg && <div className={`alert ${sigMsg.startsWith('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '12px' }}>{sigMsg}</div>}
                        <form onSubmit={handleAddSig} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px' }}>
                            <div className="form-group">
                                <label className="form-label">SHA-256 Hash</label>
                                <input className="form-input" placeholder="64 hex characters" value={sigForm.sha256Hash}
                                    onChange={e => setSigForm({ ...sigForm, sha256Hash: e.target.value })} required pattern="[a-fA-F0-9]{64}" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Threat Name</label>
                                <input className="form-input" placeholder="e.g. Joker.SMS.Trojan" value={sigForm.threatName}
                                    onChange={e => setSigForm({ ...sigForm, threatName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="form-input" value={sigForm.threatType}
                                    onChange={e => setSigForm({ ...sigForm, threatType: e.target.value })}>
                                    {['malware', 'trojan', 'spyware', 'adware', 'ransomware', 'banking_trojan', 'phishing'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Severity</label>
                                <select className="form-input" value={sigForm.severity}
                                    onChange={e => setSigForm({ ...sigForm, severity: e.target.value })}>
                                    {['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Description (Optional)</label>
                                <input className="form-input" placeholder="Brief threat description" value={sigForm.description}
                                    onChange={e => setSigForm({ ...sigForm, description: e.target.value })} />
                            </div>
                            <div style={{ gridColumn: '1/-1' }}>
                                <button type="submit" className="btn btn-primary">+ Add Signature</button>
                            </div>
                        </form>
                    </div>

                    {/* Signatures Table */}
                    <div className="card">
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Signature Database ({signatures.length})</h3>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead><tr><th>Threat Name</th><th>SHA-256</th><th>Type</th><th>Severity</th><th>Action</th></tr></thead>
                                <tbody>
                                    {signatures.map(sig => (
                                        <tr key={sig.signature_id}>
                                            <td style={{ fontWeight: '600' }}>{sig.threat_name}</td>
                                            <td className="mono" style={{ fontSize: '11px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sig.sha256_hash}</td>
                                            <td><span className="badge badge-info">{sig.threat_type}</span></td>
                                            <td>
                                                <span className={`badge ${sig.severity === 'critical' || sig.severity === 'high' ? 'badge-high' : sig.severity === 'medium' ? 'badge-medium' : 'badge-safe'}`}>
                                                    {sig.severity}
                                                </span>
                                            </td>
                                            <td><button className="btn btn-sm btn-danger" onClick={() => handleDeleteSig(sig.signature_id)}>Delete</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'scans' && (
                <div className="card">
                    <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>All Platform Scans ({recentScans.length})</h3>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead><tr><th>File</th><th>Risk Score</th><th>Classification</th><th>Malware</th><th>Date</th></tr></thead>
                            <tbody>
                                {recentScans.map(r => (
                                    <tr key={r.report_id}>
                                        <td className="mono" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.file_name || '—'}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: r.risk_score > 60 ? 'var(--clr-red)' : r.risk_score > 30 ? 'var(--clr-yellow)' : 'var(--clr-green)' }}>{r.risk_score}/100</td>
                                        <td><span className={`badge ${r.classification === 'Safe' ? 'badge-safe' : r.classification === 'Medium Risk' ? 'badge-medium' : 'badge-high'}`}>{r.classification}</span></td>
                                        <td>{r.malware_match ? '🦠 Yes' : '—'}</td>
                                        <td style={{ fontSize: '12px', color: 'var(--clr-text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
