import React, { useState, useEffect, Component } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { queryClient } from './queryClient';
import { ConfirmProvider } from './hooks/useConfirm';
import { apiService, apiClient } from './services/api.service';
import authService from './services/auth.service';
import { API_ENDPOINTS } from './config/api.config';
import logger from './services/logger.service';
import ApiKeyLogin from './components/ApiKeyLogin';
import Navbar from './components/Layout/Navbar';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import PersonsPage from './pages/PersonsPage';
import FeatureTreePage from './pages/FeatureTreePage';
import SkillsPage from './pages/SkillsPage';
import IssuesPage from './pages/IssuesPage';
import NetworkActivityOverlay from './components/Common/NetworkActivityOverlay';
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
  const [authError, setAuthError] = useState(null);

  const verifyWithBackend = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ME, { _skipErrorHandling: true });
      const email = response.data?.email;
      if (email && email.includes('@')) {
        logger.info('Backend verification successful', { email });
        return email;
      }
      logger.warn('Backend /me returned no valid email', { data: response.data });
      return null;
    } catch (err) {
      logger.warn('Backend /me verification failed', { error: err.message });
      return null;
    }
  };

  useEffect(() => {
    logger.info('App initializing - checking authentication');

    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        logger.info('Firebase user detected, verifying with backend', { email: firebaseUser.email });
        const email = await verifyWithBackend();
        if (email) {
          setIsAuthenticated(true);
        } else {
          await authService.signOut();
          setAuthError('Votre compte n\'est pas autorisé à accéder à cette application.');
        }
        setLoading(false);
        return;
      }

      // Pas d'utilisateur Firebase — fallback API key
      if (apiService.hasApiKey()) {
        const result = await apiService.testConnection();
        if (result.success) {
          const email = await verifyWithBackend();
          if (email) {
            logger.info('User authenticated via API key');
            setIsAuthenticated(true);
          } else {
            logger.warn('API key valid but /me returned no valid email');
            apiService.clearApiKey();
            setAuthError('Votre compte n\'est pas autorisé à accéder à cette application.');
          }
        } else {
          logger.warn('Invalid API key - clearing');
          apiService.clearApiKey();
        }
      } else {
        logger.info('No authentication found');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Uniquement pour le chemin API key — le chemin Firebase passe par onAuthStateChanged
  const handleLoginSuccess = async () => {
    setLoading(true);
    setAuthError(null);
    const email = await verifyWithBackend();
    if (email) {
      logger.info('User logged in and verified successfully');
      setIsAuthenticated(true);
    } else {
      apiService.clearApiKey();
      setAuthError('Votre compte n\'est pas autorisé à accéder à cette application.');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    logger.info('User logged out');
    await authService.signOut();
    apiService.clearApiKey();
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
        <ApiKeyLogin onLoginSuccess={handleLoginSuccess} authError={authError} />
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
          <ConfirmProvider>
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
                  <Route path="/skills" element={<SkillsPage />} />
                  <Route path="/feature-tree" element={<FeatureTreePage />} />
                  <Route path="/issues" element={<IssuesPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Box>
            </Box>
            <NetworkActivityOverlay />
          </Router>
          </ConfirmProvider>
        </ThemeProvider>
      </SnackbarProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
