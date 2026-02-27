import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const savedToken = localStorage.getItem('ck_token');
            const savedUser = localStorage.getItem('ck_user');
            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            }
        } catch { }
        setLoading(false);
    }, []);

    const login = (userData, accessToken) => {
        setUser(userData);
        setToken(accessToken);
        localStorage.setItem('ck_token', accessToken);
        localStorage.setItem('ck_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('ck_token');
        localStorage.removeItem('ck_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin: user?.role === 'admin' }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
