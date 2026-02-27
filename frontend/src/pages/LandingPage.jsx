import { Link } from 'react-router-dom';
import './LandingPage.css';

const features = [
    { icon: '📦', title: 'APK Static Analysis', desc: 'Extract AndroidManifest.xml, detect dangerous permissions, and analyze embedded code patterns.' },
    { icon: '🔗', title: 'URL Threat Scanner', desc: 'Check URLs against threat intelligence databases and heuristic patterns in real-time.' },
    { icon: '⚖️', title: 'Risk Score Engine', desc: 'Transparent weighted formula: R = (P×5) + (M×40) + (U×10) + (A×8) with explainable results.' },
    { icon: '🔐', title: 'Malware Signature DB', desc: 'SHA-256 hash comparison against a curated malware signature database.' },
    { icon: '📄', title: 'Downloadable Reports', desc: 'Generate and download detailed security analysis reports for each scan.' },
    { icon: '📊', title: 'Dashboard Analytics', desc: 'Track scan history, risk trends, and threat statistics over time.' },
];

export default function LandingPage() {
    return (
        <div className="landing">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="nav-brand">
                    <span className="brand-icon">⚔️</span>
                    <span className="brand-text">CyberKnights</span>
                </div>
                <div className="nav-links">
                    <Link to="/login" className="btn btn-outline btn-sm">Sign In</Link>
                    <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-badge">🛡️ Pre-Installation Security Analysis Platform</div>
                <h1 className="hero-title">
                    Detect Threats<br />
                    <span className="gradient-text">Before Installation</span>
                </h1>
                <p className="hero-desc">
                    Cyber Knights performs deep static analysis of Android APK files and URLs to detect
                    malware, dangerous permissions, and embedded threats — before you install.
                </p>
                <div className="hero-cta">
                    <Link to="/register" className="btn btn-primary btn-lg">Start Free Analysis →</Link>
                    <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
                </div>

                {/* Stats row */}
                <div className="hero-stats">
                    {[['0–15s', 'Scan Time'], ['100pts', 'Risk Scale'], ['5', 'Analysis Modules'], ['SHA-256', 'Hash Detection']].map(([val, label]) => (
                        <div className="hero-stat" key={label}>
                            <div className="hero-stat-val">{val}</div>
                            <div className="hero-stat-label">{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Formula Section */}
            <section className="formula-section">
                <div className="formula-card">
                    <div className="formula-label">Risk Scoring Formula</div>
                    <div className="formula-eq">R = (P×5) + (M×40) + (U×10) + (A×8)</div>
                    <div className="formula-vars">
                        {[['P', 'Dangerous Permissions'], ['M', 'Malware Signature Match'], ['U', 'Suspicious URLs'], ['A', 'Suspicious API Calls']].map(([k, v]) => (
                            <div className="formula-var" key={k}><span className="fv-key">{k}</span><span className="fv-sep">=</span><span className="fv-desc">{v}</span></div>
                        ))}
                    </div>
                    <div className="risk-levels">
                        <div className="rl safe">0–30 → Safe</div>
                        <div className="rl medium">31–60 → Medium Risk</div>
                        <div className="rl high">61–100 → High Risk</div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <h2 className="section-title">Everything You Need</h2>
                <p className="section-sub">A complete pre-installation security analysis platform</p>
                <div className="features-grid">
                    {features.map(f => (
                        <div className="feature-card" key={f.title}>
                            <span className="feature-icon">{f.icon}</span>
                            <h3 className="feature-title">{f.title}</h3>
                            <p className="feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Banner */}
            <section className="cta-section">
                <h2>Ready to Secure Your Apps?</h2>
                <p>Start scanning APKs and URLs for free. No credit card required.</p>
                <Link to="/register" className="btn btn-primary btn-lg">Create Free Account →</Link>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <span>⚔️ Cyber Knights © 2025</span>
                <span>Next-Gen APK & URL Threat Analysis Platform</span>
            </footer>
        </div>
    );
}
