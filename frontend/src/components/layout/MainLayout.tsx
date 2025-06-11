import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { isAuthenticated, login, logout } = useAuth();

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-50">
      <div className="container mx-auto px-6 py-3 bg-black/30 backdrop-blur-xl border border-white/10 rounded-full shadow-lg">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-white">
            Careerate
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">Dashboard</Link>
            <Link to="/settings" className="text-gray-300 hover:text-white transition-colors">Settings</Link>
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="bg-white/10 border border-white/20 text-white py-2 px-4 rounded-full transition-all duration-300 hover:bg-white/20 hover:scale-105"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={login}
                className="bg-white/10 border border-white/20 text-white py-2 px-4 rounded-full transition-all duration-300 hover:bg-white/20 hover:scale-105"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Footer = () => (
    <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-50">
        <div className="text-center text-gray-500 text-sm bg-black/30 backdrop-blur-xl border border-white/10 rounded-full shadow-lg py-3">
            © 2025 Careerate • Made with ♥ for your career
        </div>
    </footer>
);

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navbar />
      <main className="pt-24 pb-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout; 