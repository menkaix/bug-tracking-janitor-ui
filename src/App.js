import React, { useState, useEffect, Component } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { queryClient } from './queryClient';
import { apiService } from './services/api.service';
import logger from './services/logger.service';
import ApiKeyLogin from './components/ApiKeyLogin';
import Navbar from './components/Layout/Navbar';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import PersonsPage from './pages/PersonsPage';
import FeatureTreePage from './pages/FeatureTreePage';
import theme from './theme/theme';
import './App.css';

/**
 * Capture les erreurs React non gérées et affiche un écran de secours.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 4 }}>
          <Typography variant="h5" color="error" gutterBottom>Une erreur inattendue s'est produite</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{this.state.error?.message}</Typography>
          <button onClick={() => this.setState({ hasError: false, error: null })}>Réessayer</button>
        </Box>
      );
    }
    return this.props.children;
  }
}

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: 'background.default',
          }}
        >
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
            Chargement...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ApiKeyLogin onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar onLogout={handleLogout} />
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  backgroundColor: 'background.default',
                  pt: 3,
                  pb: 4,
                }}
              >
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/persons" element={<PersonsPage />} />
                  <Route path="/feature-tree" element={<FeatureTreePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Box>
            </Box>
          </Router>
        </ThemeProvider>
      </SnackbarProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
