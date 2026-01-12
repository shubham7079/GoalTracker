
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useTheme } from '../App';

const Navbar: React.FC = () => {
  const { auth, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                G
              </div>
              <span className="text-xl font-bold tracking-tight hidden sm:block">GoalTracker</span>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 font-medium">Home</Link>
            {auth.isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 font-medium">Dashboard</Link>
                <Link to="/profile" className="flex items-center gap-2 text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 font-medium">
                  {auth.user?.avatar ? (
                    <img src={auth.user.avatar} alt="Profile" className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                  ) : null}
                  Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 dark:bg-slate-800 rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 font-medium">Login</Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:ring-2 hover:ring-primary-500 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 mr-2">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-600 dark:text-slate-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Sidebar */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <Link to="/" onClick={() => setIsOpen(false)} className="block px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900">Home</Link>
            {auth.isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900">Dashboard</Link>
                <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2">
                  {auth.user?.avatar && <img src={auth.user.avatar} className="w-5 h-5 rounded-full object-cover" />}
                  Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="block px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900">Login</Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="block px-4 py-2 font-bold text-primary-600">Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
