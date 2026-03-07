import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  Container,
  InputAdornment,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  VpnKey as VpnKeyIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';
import { apiService } from '../services/api.service';
import logger from '../services/logger.service';

/**
 * Composant de connexion avec saisie d'API Key - Style Material UI 2025
 */
const ApiKeyLogin = ({ onLoginSuccess }) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!apiKey.trim()) {
      logger.warn('Login attempt with empty API key');
      setError({ title: 'Clé API manquante', detail: 'Veuillez saisir une clé API.' });
      return;
    }

    setLoading(true);
    logger.info('Login attempt started');

    try {
      apiService.setApiKey(apiKey.trim());
      const result = await apiService.testConnection();

      if (result.success) {
        logger.info('Login successful');
        onLoginSuccess();
      } else {
        logger.warn('Login failed', { error: result.error });
        apiService.clearApiKey();
        setError({
          title: 'Connexion échouée',
          detail: result.error || 'Clé API invalide ou serveur inaccessible.',
        });
      }
    } catch (err) {
      logger.error('Login error', { error: err.message });
      apiService.clearApiKey();
      setError({
        title: 'Erreur de connexion',
        detail: err.message || 'Une erreur inattendue est survenue.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
          theme.palette.secondary.main,
          0.1
        )} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.15)} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        },
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            backdropFilter: 'blur(10px)',
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            {/* En-tête */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  mb: 3,
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                <BugReportIcon sx={{ fontSize: 48, color: 'white' }} />
              </Box>
              <Typography
                variant="h4"
                fontWeight={700}
                gutterBottom
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Bug Tracking Janitor
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Système de gestion de tâches
              </Typography>
            </Box>

            {/* Formulaire */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                id="apiKey"
                label="Clé API"
                type={showPassword ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={loading}
                autoFocus
                placeholder="Saisissez votre clé API"
                variant="outlined"
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  <AlertTitle>{error.title}</AlertTitle>
                  {error.detail}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </Box>

            {/* Pied de page */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Contactez votre administrateur pour obtenir une clé API
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ApiKeyLogin;
