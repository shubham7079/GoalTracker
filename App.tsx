
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Theme, User, AuthState } from './types';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import * as authService from './services/authService';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({ theme: 'light', toggleTheme: () => {} });
const AuthContext = createContext<{ 
  auth: AuthState; 
  login: (token: string, user: User) => void; 
  logout: () => void;
  updateUser: (user: User) => void;
}>({
  auth: { user: null, token: null, isAuthenticated: false, loading: true },
  login: () => {},
  logout: () => {},
  updateUser: () => {}
});

export const useTheme = () => useContext(ThemeContext);
export const useAuth = () => useContext(AuthContext);

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const initAuth = async () => {
      const stored = authService.getStoredAuth();
      if (stored.token && stored.user) {
        setAuth({
          token: stored.token,
          user: stored.user,
          isAuthenticated: true,
          loading: false,
        });
      } else {
        setAuth(prev => ({ ...prev, loading: false }));
      }
    };
    initAuth();
  }, []);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const login = (token: string, user: User) => {
    authService.setStoredAuth(token, user);
    setAuth({ token, user, isAuthenticated: true, loading: false });
  };

  const logout = () => {
    authService.clearStoredAuth();
    setAuth({ token: null, user: null, isAuthenticated: false, loading: false });
  };

  const updateUser = (user: User) => {
    const stored = authService.getStoredAuth();
    if (stored.token) {
      authService.setStoredAuth(stored.token, user);
      setAuth(prev => ({ ...prev, user }));
    }
  };

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider value={{ auth, login, logout, updateUser }}>
        <Router>
          <div className="min-h-screen flex flex-col transition-colors duration-300">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={!auth.isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
                <Route path="/register" element={!auth.isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
                <Route 
                  path="/dashboard" 
                  element={auth.isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/profile" 
                  element={auth.isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <footer className="py-12 text-center text-sm text-slate-400 dark:text-slate-600 border-t border-slate-100 dark:border-slate-900 mt-20">
              <div className="font-black text-slate-300 dark:text-slate-800 text-6xl mb-4 select-none tracking-tighter">GOAL TRACKER</div>
              <div className="space-y-1">
                <p>© {new Date().getFullYear()} Daily Goal Tracker. All Rights Reserved.</p>
                <p className="font-bold text-slate-600 dark:text-slate-400 tracking-wide uppercase text-[10px]">
                  By Shubham Singh
                </p>
              </div>
            </footer>
          </div>
        </Router>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;
