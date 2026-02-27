import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import UrlScanPage from './pages/UrlScanPage';
import HistoryPage from './pages/HistoryPage';
import ReportPage from './pages/ReportPage';
import AdminPage from './pages/AdminPage';

function DashboardLayout({ children }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                {children}
            </div>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Protected Routes (with sidebar layout) */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <DashboardLayout><DashboardPage /></DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/scan/apk" element={
                        <ProtectedRoute>
                            <DashboardLayout><UploadPage /></DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/scan/url" element={
                        <ProtectedRoute>
                            <DashboardLayout><UrlScanPage /></DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/history" element={
                        <ProtectedRoute>
                            <DashboardLayout><HistoryPage /></DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/reports/:id" element={
                        <ProtectedRoute>
                            <DashboardLayout><ReportPage /></DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                        <ProtectedRoute requireAdmin>
                            <DashboardLayout><AdminPage /></DashboardLayout>
                        </ProtectedRoute>
                    } />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
