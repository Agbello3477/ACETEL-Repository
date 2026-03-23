import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = async (email, password) => {
        console.log("AuthContext: Login called with", email);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                if (data.role === 'Student' || data.role === 'student') {
                    return { success: false, message: 'Unauthorized: Admin access only.' };
                }
                setUser(data);
                localStorage.setItem('user', JSON.stringify(data));
                localStorage.setItem('token', data.token);
                return { success: true, data: data };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, message: error.message || 'Server error' };
        }
    };



    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    // Session Timeout Logic
    useEffect(() => {
        let timeout;

        const resetTimer = () => {
            if (!user) return;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                console.log("Session timed out due to inactivity.");
                logout();
                window.location.href = '/';
            }, 180000); // 3 minutes
        };

        if (user) {
            resetTimer();
            window.addEventListener('mousemove', resetTimer);
            window.addEventListener('keydown', resetTimer);
            window.addEventListener('click', resetTimer);
            window.addEventListener('scroll', resetTimer);
        }

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('scroll', resetTimer);
        };
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
