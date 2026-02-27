import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import './Sidebar.css';

const navItems = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/scan/apk', icon: '📦', label: 'APK Scanner' },
    { to: '/scan/url', icon: '🔗', label: 'URL Scanner' },
    { to: '/history', icon: '📋', label: 'Scan History' },
];

const adminItems = [
    { to: '/admin', icon: '🛡️', label: 'Admin Panel' },
];

export function Sidebar() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try { await authApi.logout(); } catch { }
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="logo-icon">⚔️</div>
                <div>
                    <div className="logo-title">CyberKnights</div>
                    <div className="logo-sub">Threat Analysis Platform</div>
                </div>
            </div>

            <div className="sidebar-divider" />

            {/* Nav */}
            <nav className="sidebar-nav">
                <div className="nav-section-label">MAIN MENU</div>
                {navItems.map(item => (
                    <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
                {isAdmin && (
                    <>
                        <div className="nav-section-label" style={{ marginTop: '18px' }}>ADMIN</div>
                        {adminItems.map(item => (
                            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                                <span className="nav-icon">{item.icon}</span>
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </>
                )}
            </nav>

            {/* User footer */}
            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">{(user?.fullName || user?.email || 'U')[0].toUpperCase()}</div>
                    <div className="user-details">
                        <div className="user-name">{user?.fullName || 'User'}</div>
                        <div className="user-email">{user?.email}</div>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout} title="Logout">⏻</button>
            </div>
        </aside>
    );
}
