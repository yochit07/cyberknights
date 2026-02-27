import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, requireAdmin = false }) {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="loading-screen">
            <div className="spinner"></div>
            <span>Loading...</span>
        </div>
    );

    if (!user) return <Navigate to="/login" replace />;
    if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

    return children;
}
