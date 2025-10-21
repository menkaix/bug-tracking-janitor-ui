import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { apiService } from './services/api.service';
import logger from './services/logger.service';
import ApiKeyLogin from './components/ApiKeyLogin';
import Navbar from './components/Layout/Navbar';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import './App.css';

/**
 * Composant principal de l'application
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si une clé API est déjà stockée
    const checkAuth = async () => {
      logger.info('App initializing - checking authentication');
      if (apiService.hasApiKey()) {
        const result = await apiService.testConnection();
        if (result.success) {
          logger.info('User authenticated successfully');
          setIsAuthenticated(true);
        } else {
          logger.warn('Invalid API key - clearing');
          apiService.clearApiKey();
        }
      } else {
        logger.info('No API key found');
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    logger.info('User logged in successfully');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    logger.info('User logged out');
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ApiKeyLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Router>
      <div className="app">
        <Navbar onLogout={handleLogout} />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
