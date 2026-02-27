import { useState } from 'react';
import { urlApi } from '../services/api';
import './UrlScanPage.css';

export default function UrlScanPage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleScan = async (e) => {
        e.preventDefault();
        if (!url) return;
        setLoading(true); setError(''); setResult(null);
        try {
            const { data } = await urlApi.scan(url);
            setResult(data.result);
        } catch (err) {
            setError(err.response?.data?.error || 'URL scan failed.');
        } finally { setLoading(false); }
    };

    const levelColor = { safe: 'var(--clr-green)', suspicious: 'var(--clr-yellow)', malicious: 'var(--clr-red)' };
    const levelBg = { safe: 'var(--clr-green-dim)', suspicious: 'var(--clr-yellow-dim)', malicious: 'var(--clr-red-dim)' };
    const levelBorder = { safe: 'rgba(16,240,138,0.3)', suspicious: 'rgba(245,158,11,0.3)', malicious: 'rgba(239,68,68,0.3)' };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">URL Scanner</h1>
                <p className="page-subtitle">Check any URL for threats and malicious patterns instantly</p>
            </div>

            <div className="card" style={{ maxWidth: '700px' }}>
                <form onSubmit={handleScan} className="url-form">
                    <div className="url-input-wrap">
                        <span className="url-prefix">🔗</span>
                        <input type="url" className="form-input url-input" placeholder="https://example.com or any URL to scan..."
                            value={url} onChange={e => setUrl(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ flexShrink: 0 }}>
                        {loading ? <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> Scanning...</> : '⚔ Scan URL'}
                    </button>
                </form>

                {error && <div className="alert alert-error" style={{ marginTop: '12px' }}>{error}</div>}

                {/* Common examples */}
                <div className="url-examples">
                    <span style={{ fontSize: '12px', color: 'var(--clr-text-muted)' }}>Try:</span>
                    {['https://google.com', 'http://192.168.1.1/malware.apk', 'https://bit.ly/shortened'].map(ex => (
                        <button key={ex} className="example-btn" onClick={() => setUrl(ex)}>{ex}</button>
                    ))}
                </div>
            </div>

            {/* Result */}
            {result && (
                <div className="url-result-card" style={{
                    background: levelBg[result.threatLevel],
                    borderColor: levelBorder[result.threatLevel],
                }}>
                    <div className="url-result-header">
                        <div className="url-result-icon">{result.isSafe ? '✅' : result.threatLevel === 'suspicious' ? '⚠️' : '🚨'}</div>
                        <div>
                            <div className="url-result-status" style={{ color: levelColor[result.threatLevel] }}>
                                {result.isSafe ? 'URL is Safe' : `Threat Detected: ${result.threatType || 'Unknown'}`}
                            </div>
                            <div className="url-result-url">{result.url}</div>
                        </div>
                        <span className="badge" style={{
                            background: levelBg[result.threatLevel],
                            color: levelColor[result.threatLevel],
                            border: `1px solid ${levelBorder[result.threatLevel]}`,
                            textTransform: 'capitalize', alignSelf: 'flex-start'
                        }}>{result.threatLevel}</span>
                    </div>

                    {/* Details */}
                    {Object.keys(result.details || {}).length > 0 && (
                        <div className="url-details">
                            {Object.entries(result.details).map(([k, v]) => (
                                <div className="url-detail-row" key={k}>
                                    <span className="ud-key">{k}</span>
                                    <span className="ud-val">{String(v)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="url-timestamp">Scanned at {new Date(result.checkedAt).toLocaleString()}</div>
                </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-3" style={{ marginTop: '24px' }}>
                {[
                    { icon: '🌐', title: 'Safe Browsing Check', desc: 'URLs checked against Google Safe Browsing and our threat intel database.' },
                    { icon: '🔍', title: 'Heuristic Analysis', desc: 'Pattern-based detection for suspicious domains, TLDs, and IP-based URLs.' },
                    { icon: '⚡', title: 'Instant Results', desc: 'Scan completes in under 2 seconds with detailed threat indicators.' },
                ].map(c => (
                    <div className="card" key={c.title}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>{c.icon}</div>
                        <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '14px' }}>{c.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--clr-text-secondary)' }}>{c.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
