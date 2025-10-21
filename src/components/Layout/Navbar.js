import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiService } from '../../services/api.service';
import './Navbar.css';

/**
 * Barre de navigation principale
 */
const Navbar = ({ onLogout }) => {
  const location = useLocation();

  const handleLogout = () => {
    apiService.clearApiKey();
    onLogout();
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/">
            <h1>Bug Tracker</h1>
          </Link>
        </div>

        <div className="navbar-menu">
          <Link to="/" className={`navbar-item ${isActive('/')}`}>
            Tableau de bord
          </Link>
          <Link to="/tasks" className={`navbar-item ${isActive('/tasks')}`}>
            Tâches
          </Link>
          <Link to="/projects" className={`navbar-item ${isActive('/projects')}`}>
            Projets
          </Link>
        </div>

        <div className="navbar-actions">
          <button onClick={handleLogout} className="btn-logout">
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
