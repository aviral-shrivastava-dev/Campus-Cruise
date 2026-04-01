import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import './Navbar.css';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo" onClick={closeMenus}>
          <span className="logo-icon">🚗</span>
          <span className="logo-text">Campus Cruise</span>
        </Link>

        {/* Hamburger menu for mobile */}
        <button 
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation links */}
        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="nav-link" onClick={closeMenus}>
                Dashboard
              </Link>
              <Link to="/rides" className="nav-link" onClick={closeMenus}>
                Find Rides
              </Link>
              <Link to="/my-rides" className="nav-link" onClick={closeMenus}>
                My Rides
              </Link>
              <Link to="/messages" className="nav-link" onClick={closeMenus}>
                Messages
              </Link>
            </>
          )}
        </div>

        {/* User menu */}
        {isAuthenticated && (
          <div className="user-menu-container">
            {/* Notification Bell */}
            <NotificationBell />
            
            <button 
              className="user-menu-button"
              onClick={toggleUserMenu}
              aria-label="User menu"
            >
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="user-name">{user.name || 'User'}</span>
              <svg 
                className={`dropdown-icon ${isUserMenuOpen ? 'open' : ''}`}
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {isUserMenuOpen && (
              <div className="user-dropdown">
                <Link 
                  to="/profile" 
                  className="dropdown-item"
                  onClick={closeMenus}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Profile
                </Link>
                <Link 
                  to="/history" 
                  className="dropdown-item"
                  onClick={closeMenus}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  History
                </Link>
                <Link 
                  to="/wallet" 
                  className="dropdown-item"
                  onClick={closeMenus}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  Wallet
                </Link>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item logout"
                  onClick={handleLogout}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
