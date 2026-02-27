import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportsApi } from '../services/api';
import { generatePDFReport } from '../services/pdfGenerator';

function RiskBadge({ classification }) {
    const map = { 'Safe': 'badge-safe', 'Medium Risk': 'badge-medium', 'High Risk': 'badge-high' };
    const icons = { 'Safe': '✓', 'Medium Risk': '⚡', 'High Risk': '⚠' };
    return <span className={`badge ${map[classification] || 'badge-info'}`}>{icons[classification]} {classification}</span>;
}

export default function ReportPage() {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        reportsApi.getOne(id)
            .then(({ data }) => setReport(data.report))
            .catch(() => setError('Report not found or access denied.'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const { data } = await reportsApi.download(id);
            const url = window.URL.createObjectURL(new Blob([data], { type: 'text/plain' }));
            const a = document.createElement('a'); a.href = url;
            a.download = `CyberKnights_Report_${id.slice(0, 8)}.txt`; a.click();
            window.URL.revokeObjectURL(url);
        } catch { alert('Download failed.'); }
        finally { setDownloading(false); }
    };

    if (loading) return <div className="loading-screen"><div className="spinner" /><span>Loading report...</span></div>;
    if (error) return <div className="page-container"><div className="alert alert-error">{error}</div><Link to="/history" className="btn btn-outline" style={{ marginTop: '16px' }}>← Back</Link></div>;
    if (!report) return null;

    const scoreColor = report.classification === 'Safe' ? 'var(--clr-green)' : report.classification === 'Medium Risk' ? 'var(--clr-yellow)' : 'var(--clr-red)';
    const permissions = Array.isArray(report.permissions) ? report.permissions : [];
    const urls = Array.isArray(report.urls) ? report.urls : [];
    const apis = Array.isArray(report.suspicious_apis) ? report.suspicious_apis : [];

    return (
        <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <Link to="/history" style={{ color: 'var(--clr-text-muted)', fontSize: '13px' }}>← History</Link>
                <span style={{ color: 'var(--clr-text-muted)' }}>›</span>
                <span style={{ fontSize: '13px' }}>Report Detail</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary" onClick={() => generatePDFReport(report)}>
                        📥 Download PDF
                    </button>
                    <button className="btn btn-outline" onClick={handleDownload} disabled={downloading}>
                        {downloading ? '...' : '📄 TXT'}
                    </button>
                </div>
            </div>

            {/* Report Header */}
            <div className="card" style={{ marginBottom: '20px', background: `linear-gradient(135deg, ${report.classification === 'Safe' ? 'rgba(16,240,138,0.05)' : report.classification === 'Medium Risk' ? 'rgba(245,158,11,0.05)' : 'rgba(239,68,68,0.05)'}, var(--clr-bg-glass))` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '64px', fontWeight: '900', color: scoreColor, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{report.risk_score}</div>
                        <div style={{ fontSize: '12px', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Risk Score</div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <RiskBadge classification={report.classification} />
                        <div style={{ fontSize: '18px', fontWeight: '800', margin: '8px 0 4px', fontFamily: 'var(--font-mono)' }}>
                            {report.file_name || 'Unknown File'}
                        </div>
                        {report.malware_match && (
                            <div className="alert alert-error" style={{ padding: '8px 12px', marginTop: '8px', display: 'inline-flex' }}>
                                🦠 Malware Detected: <strong style={{ marginLeft: '6px' }}>{report.malware_name}</strong>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-2" style={{ gap: '20px' }}>
                {/* File Details */}
                <div className="card">
                    <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--clr-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>File Details</h3>
                    {[
                        ['File Name', report.file_name],
                        ['SHA-256 Hash', report.file_hash],
                        ['File Size', `${report.file_size_kb || 0} KB`],
                        ['Scan Date', new Date(report.created_at).toLocaleString()],
                        ['Scan Type', (report.scan_type || 'APK').toUpperCase()],
                    ].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--clr-border)', padding: '8px 0', fontSize: '12px' }}>
                            <span style={{ color: 'var(--clr-text-muted)', minWidth: '110px' }}>{k}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{v}</span>
                        </div>
                    ))}
                </div>

                {/* Risk Breakdown */}
                <div className="card">
                    <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--clr-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk Breakdown</h3>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--clr-cyan)', background: 'rgba(0,212,255,0.06)', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px' }}>
                        R = ({report.permission_count}×5) + ({report.malware_match ? 1 : 0}×40) + ({report.url_count}×10) + ({report.api_count}×8) = {report.risk_score}
                    </div>
                    {[
                        { label: 'Dangerous Permissions', val: report.permission_count, pts: report.permission_count * 5, icon: '🔒' },
                        { label: 'Malware Match', val: report.malware_match ? 'YES' : 'NO', pts: report.malware_match ? 40 : 0, icon: '🦠' },
                        { label: 'Embedded URLs', val: report.url_count, pts: report.url_count * 10, icon: '🔗' },
                        { label: 'Suspicious APIs', val: report.api_count, pts: report.api_count * 8, icon: '⚙️' },
                    ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--clr-border)', padding: '8px 0' }}>
                            <span>{item.icon}</span>
                            <span style={{ flex: 1, fontSize: '12px' }}>{item.label}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{item.val}</span>
                            <span style={{ fontSize: '11px', color: 'var(--clr-purple)', fontFamily: 'var(--font-mono)', minWidth: '50px', textAlign: 'right' }}>+{item.pts} pts</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Permissions */}
            {permissions.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '700' }}>Permissions ({permissions.length})</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {permissions.map(p => (
                            <span key={p} style={{
                                fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontFamily: 'var(--font-mono)',
                                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--clr-border)', color: 'var(--clr-text-secondary)'
                            }}>
                                {p}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* URLs */}
            {urls.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '700' }}>Embedded URLs ({urls.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                        {urls.slice(0, 30).map((u, i) => (
                            <div key={i} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--clr-text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '4px 10px', borderRadius: '4px', wordBreak: 'break-all' }}>
                                {u}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Suspicious APIs */}
            {apis.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '700' }}>Suspicious API Calls ({apis.length})</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {apis.map(a => (
                            <span key={a} style={{
                                fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontFamily: 'var(--font-mono)',
                                background: 'var(--clr-red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--clr-red)'
                            }}>
                                {a}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Sensitive Data */}
            {report.sensitive_data?.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '700' }}>Sensitive Data Detected ({report.sensitive_data.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {report.sensitive_data.map((d, i) => (
                            <div key={i} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--clr-text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '4px 10px', borderRadius: '4px', display: 'flex', gap: '8px' }}>
                                <span style={{ color: 'var(--clr-yellow)', fontWeight: 'bold' }}>[{d.type}]</span>
                                <span style={{ wordBreak: 'break-all' }}>{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendation */}
            <div className={`alert ${report.classification === 'High Risk' ? 'alert-error' : report.classification === 'Medium Risk' ? 'alert-warning' : 'alert-success'}`} style={{ marginTop: '20px', fontSize: '14px' }}>
                {report.classification === 'High Risk' ? '⚠ DO NOT INSTALL — This APK exhibits high-risk malware characteristics. Avoid installation.'
                    : report.classification === 'Medium Risk' ? '⚡ CAUTION — Medium risk detected. Review permissions carefully before installing.'
                        : '✓ LOW RISK — No significant threats detected. Standard precautions recommended.'}
            </div>
        </div>
    );
}
