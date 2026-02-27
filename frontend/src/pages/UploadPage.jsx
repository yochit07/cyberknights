import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apkApi } from '../services/api';
import './UploadPage.css';

function RiskBadge({ classification }) {
    const map = { 'Safe': 'badge-safe', 'Medium Risk': 'badge-medium', 'High Risk': 'badge-high' };
    const icons = { 'Safe': '✓', 'Medium Risk': '⚡', 'High Risk': '⚠' };
    return <span className={`badge ${map[classification] || 'badge-info'}`}>{icons[classification]} {classification}</span>;
}

export default function UploadPage() {
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const fileRef = useRef();

    const handleFile = (f) => {
        if (!f) return;
        if (!f.name.endsWith('.apk')) { setError('Only .apk files are supported.'); return; }
        if (f.size > 50 * 1024 * 1024) { setError('File size exceeds 50MB limit.'); return; }
        setFile(f); setError(''); setResult(null);
    };

    const onDrop = useCallback((e) => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files[0];
        handleFile(f);
    }, []);

    const handleScan = async () => {
        if (!file) return;
        setLoading(true); setProgress(0); setError(''); setResult(null);
        try {
            const fd = new FormData();
            fd.append('apk', file);
            const { data } = await apkApi.upload(fd, setProgress);
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Analysis failed. Please try again.');
        } finally { setLoading(false); }
    };

    const risk = result?.analysis?.risk;
    const analysis = result?.analysis;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">APK Scanner</h1>
                <p className="page-subtitle">Upload an Android APK for deep static security analysis</p>
            </div>

            {/* Upload Zone */}
            {!result && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <div
                        className={`dropzone${dragging ? ' dragging' : ''}${file ? ' has-file' : ''}`}
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        onClick={() => fileRef.current?.click()}
                    >
                        <input type="file" ref={fileRef} accept=".apk" style={{ display: 'none' }}
                            onChange={e => handleFile(e.target.files[0])} />
                        <div className="dz-icon">{file ? '📦' : '⬆️'}</div>
                        {file ? (
                            <>
                                <div className="dz-filename">{file.name}</div>
                                <div className="dz-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                            </>
                        ) : (
                            <>
                                <div className="dz-title">Drag & Drop APK File</div>
                                <div className="dz-hint">or click to browse — Max 50MB, .apk only</div>
                            </>
                        )}
                    </div>

                    {error && <div className="alert alert-error" style={{ marginTop: '12px' }}>{error}</div>}

                    {loading && (
                        <div className="scan-progress">
                            <div className="scan-progress-label">
                                <span>{progress < 100 ? '📤 Uploading to Core...' : '⚔ Analyzing Bytecode...'}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                            <div className="scan-steps">
                                {[
                                    { label: 'Upload', min: 0 },
                                    { label: 'AXML Parser', min: 30 },
                                    { label: 'Perm Check', min: 50 },
                                    { label: 'Signature', min: 70 },
                                    { label: 'Risk Model', min: 90 }
                                ].map((step) => (
                                    <span key={step.label} className={`scan-step${progress >= step.min ? ' done' : ''}`}>
                                        {progress >= step.min ? '⚡' : '○'} {step.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {file && !loading && (
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button className="btn btn-primary" onClick={handleScan}>⚔ Run Full Analysis</button>
                            <button className="btn btn-outline" onClick={() => { setFile(null); setError(''); }}>✕ Remove</button>
                        </div>
                    )}
                </div>
            )}

            {/* Result */}
            {result && risk && (
                <div className="result-area">
                    {/* Risk Summary */}
                    <div className={`risk-summary-card risk-${risk.colorCode}`}>
                        <div className="rs-left">
                            <div className="rs-score">{risk.score}</div>
                            <div className="rs-label">/ 100 Risk Score</div>
                        </div>
                        <div className="rs-middle">
                            <RiskBadge classification={risk.classification} />
                            <div className="rs-file">{analysis.fileName}</div>
                            {analysis.malwareMatch && (
                                <div className="alert alert-error" style={{ marginTop: '8px', padding: '8px 12px' }}>
                                    🦠 Malware: <strong>{analysis.malwareName}</strong>
                                </div>
                            )}
                        </div>
                        {result.reportId && (
                            <Link to={`/reports/${result.reportId}`} className="btn btn-outline">View Full Report →</Link>
                        )}
                    </div>

                    {/* Formula Breakdown */}
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '700', color: 'var(--clr-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk Breakdown</h3>
                        <div className="formula-box">{risk.formula}</div>
                        <div className="breakdown-grid">
                            {[
                                { label: 'Dangerous Permissions', value: risk.breakdown.permissions.count, pts: risk.breakdown.permissions.points, icon: '🔒' },
                                { label: 'Malware Match', value: risk.breakdown.malware.match ? 'YES' : 'NO', pts: risk.breakdown.malware.points, icon: '🦠' },
                                { label: 'Embedded URLs', value: risk.breakdown.urls.count, pts: risk.breakdown.urls.points, icon: '🔗' },
                                { label: 'Suspicious APIs', value: risk.breakdown.apis.count, pts: risk.breakdown.apis.points, icon: '⚙️' },
                            ].map(item => (
                                <div className="breakdown-item" key={item.label}>
                                    <div className="bi-icon">{item.icon}</div>
                                    <div className="bi-label">{item.label}</div>
                                    <div className="bi-value">{item.value}</div>
                                    <div className="bi-pts">+{item.pts} pts</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Permissions */}
                    {analysis.permissions?.length > 0 && (
                        <div className="card" style={{ marginBottom: '16px' }}>
                            <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '700' }}>
                                Permissions Detected ({analysis.permissions.length})
                            </h3>
                            <div className="permission-list">
                                {analysis.permissions.map(p => (
                                    <span key={p} className={`perm-tag${analysis.permissions.includes(p) ? ' perm-danger' : ''}`}>{p}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* URLs */}
                    {analysis.embeddedUrls?.length > 0 && (
                        <div className="card" style={{ marginBottom: '16px' }}>
                            <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '700' }}>Embedded URLs ({analysis.embeddedUrls.length})</h3>
                            <div className="url-list">
                                {analysis.embeddedUrls.slice(0, 20).map((u, i) => <div key={i} className="url-item">{u}</div>)}
                            </div>
                        </div>
                    )}

                    {/* Suspicious APIs */}
                    {analysis.suspiciousApis?.length > 0 && (
                        <div className="card" style={{ marginBottom: '16px' }}>
                            <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '700' }}>Suspicious API Calls ({analysis.suspiciousApis.length})</h3>
                            <div className="permission-list">
                                {analysis.suspiciousApis.map(a => <span key={a} className="perm-tag perm-danger">{a}</span>)}
                            </div>
                        </div>
                    )}

                    {/* Sensitive Data */}
                    {analysis.sensitiveData?.length > 0 && (
                        <div className="card" style={{ marginBottom: '16px' }}>
                            <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '700' }}>Sensitive Data Detected ({analysis.sensitiveData.length})</h3>
                            <div className="url-list">
                                {analysis.sensitiveData.map((d, i) => (
                                    <div key={i} className="url-item">
                                        <span className="badge badge-medium" style={{ marginRight: '8px', fontSize: '10px' }}>{d.type}</span>
                                        <span style={{ fontFamily: 'var(--font-mono)' }}>{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button className="btn btn-outline" onClick={() => { setResult(null); setFile(null); }}>⬅ Scan Another APK</button>
                </div>
            )}
        </div>
    );
}
