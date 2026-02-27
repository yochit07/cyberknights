import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsApi } from '../services/api';
import { generatePDFReport } from '../services/pdfGenerator';

function RiskBadge({ classification }) {
    const map = { 'Safe': 'badge-safe', 'Medium Risk': 'badge-medium', 'High Risk': 'badge-high' };
    const icons = { 'Safe': '✓', 'Medium Risk': '⚡', 'High Risk': '⚠' };
    return <span className={`badge ${map[classification] || 'badge-info'}`}>{icons[classification]} {classification}</span>;
}

export default function HistoryPage() {
    const [reports, setReports] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        setLoading(true);
        reportsApi.getAll(page, filter || undefined)
            .then(({ data }) => { setReports(data.reports || []); setTotal(data.total || 0); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [page, filter]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this report?')) return;
        try { await reportsApi.delete(id); setReports(r => r.filter(x => x.report_id !== id)); } catch { }
    };

    const handleDownload = async (id, name) => {
        try {
            const { data } = await reportsApi.download(id);
            const url = window.URL.createObjectURL(new Blob([data]));
            const a = document.createElement('a'); a.href = url;
            a.download = `CyberKnights_${name || id.slice(0, 8)}.txt`; a.click();
            window.URL.revokeObjectURL(url);
        } catch { }
    };

    const pages = Math.ceil(total / 10);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Scan History</h1>
                <p className="page-subtitle">All your previous security analysis reports</p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {[['', 'All'], ['apk', 'APK'], ['url', 'URL']].map(([val, label]) => (
                    <button key={val} className={`btn btn-sm${filter === val ? ' btn-primary' : ' btn-outline'}`}
                        onClick={() => { setFilter(val); setPage(1); }}>{label}</button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--clr-text-secondary)', alignSelf: 'center' }}>
                    {total} scan{total !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading-screen"><div className="spinner" /><span>Loading history...</span></div>
                ) : reports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--clr-text-muted)' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📂</div>
                        <p>No scans found. <Link to="/scan/apk" style={{ color: 'var(--clr-cyan)' }}>Scan your first APK →</Link></p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr><th>File / URL</th><th>Type</th><th>Risk Score</th><th>Classification</th><th>Malware</th><th>Date</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {reports.map(r => (
                                    <tr key={r.report_id}>
                                        <td className="mono" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.file_name || r.report_id?.slice(0, 12) + '...'}
                                        </td>
                                        <td><span className="badge badge-info">{(r.scan_type || 'apk').toUpperCase()}</span></td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: r.risk_score > 60 ? 'var(--clr-red)' : r.risk_score > 30 ? 'var(--clr-yellow)' : 'var(--clr-green)' }}>
                                            {r.risk_score}/100
                                        </td>
                                        <td><RiskBadge classification={r.classification} /></td>
                                        <td>{r.malware_match ? <span className="badge badge-high">🦠 Yes</span> : <span style={{ fontSize: '12px', color: 'var(--clr-text-muted)' }}>—</span>}</td>
                                        <td style={{ fontSize: '12px', color: 'var(--clr-text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <Link to={`/reports/${r.report_id}`} className="btn btn-outline btn-sm">View</Link>
                                                <button className="btn btn-sm btn-outline" style={{ minWidth: '32px' }} onClick={() => handleDownload(r.report_id, r.file_name)} title="Download TXT">📄</button>
                                                <button className="btn btn-sm btn-primary" style={{ minWidth: '32px' }} onClick={() => generatePDFReport(r)} title="Download PDF">📥</button>
                                                <button className="btn btn-sm btn-danger" style={{ minWidth: '32px' }} onClick={() => handleDelete(r.report_id)} title="Delete">🗑</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                    <span style={{ alignSelf: 'center', fontSize: '13px', color: 'var(--clr-text-secondary)' }}>Page {page} of {pages}</span>
                    <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>Next →</button>
                </div>
            )}
        </div>
    );
}
