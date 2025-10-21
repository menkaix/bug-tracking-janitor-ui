import React, { useState } from 'react';
import { apiService } from '../services/api.service';
import logger from '../services/logger.service';
import './ApiKeyLogin.css';

/**
 * Composant de connexion avec saisie d'API Key
 */
const ApiKeyLogin = ({ onLoginSuccess }) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!apiKey.trim()) {
      logger.warn('Login attempt with empty API key');
      setError('Veuillez saisir une clé API');
      return;
    }

    setLoading(true);
    logger.info('Login attempt started');

    try {
      // Sauvegarder la clé API
      apiService.setApiKey(apiKey.trim());

      // Tester la connexion
      const result = await apiService.testConnection();

      if (result.success) {
        logger.info('Login successful');
        onLoginSuccess();
      } else {
        logger.warn('Login failed - invalid API key');
        setError('Clé API invalide. Veuillez vérifier et réessayer.');
        apiService.clearApiKey();
      }
    } catch (err) {
      logger.error('Login error', { error: err.message });
      setError('Erreur lors de la connexion. Veuillez réessayer.');
      apiService.clearApiKey();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Bug Tracking Janitor</h1>
          <p>Système de gestion de tâches</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="apiKey">Clé API</label>
            <input
              id="apiKey"
              type="password"
              className="form-input"
              placeholder="Saisissez votre clé API"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Contactez votre administrateur pour obtenir une clé API
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyLogin;
