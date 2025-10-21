import axios from 'axios';
import { API_CONFIG, STORAGE_KEYS, ERROR_MESSAGES } from '../config/api.config';
import logger from './logger.service';

/**
 * Instance Axios configurée avec l'API key
 */
const createApiInstance = () => {
  const instance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS,
  });

  // Intercepteur de requête pour ajouter l'API key
  instance.interceptors.request.use(
    (config) => {
      const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
      if (apiKey) {
        config.headers['X-API-Key'] = apiKey;
      }

      // Log de la requête
      logger.logRequest(config.method.toUpperCase(), config.url, config.data);

      return config;
    },
    (error) => {
      logger.error('Request interceptor error', { error: error.message });
      return Promise.reject(error);
    }
  );

  // Intercepteur de réponse pour gérer les erreurs
  instance.interceptors.response.use(
    (response) => {
      // Log de la réponse réussie
      logger.logResponse(
        response.config.method.toUpperCase(),
        response.config.url,
        response.status,
        response.data
      );
      return response;
    },
    (error) => {
      // Log de l'erreur de réponse
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      const url = error.config?.url || 'UNKNOWN';
      const status = error.response?.status || 'NO_RESPONSE';

      logger.logResponse(method, url, status, error.response?.data);

      if (error.response) {
        switch (error.response.status) {
          case 401:
          case 403:
            // Clé API invalide - rediriger vers la page de connexion
            logger.warn('Unauthorized access - API key invalid', {
              status: error.response.status,
              url,
            });
            localStorage.removeItem(STORAGE_KEYS.API_KEY);
            window.location.href = '/';
            return Promise.reject(new Error(ERROR_MESSAGES.UNAUTHORIZED));
          case 404:
            logger.warn('Resource not found', { url });
            return Promise.reject(new Error(ERROR_MESSAGES.NOT_FOUND));
          case 500:
            logger.error('Server error', { url, data: error.response.data });
            return Promise.reject(new Error(ERROR_MESSAGES.SERVER_ERROR));
          default:
            logger.error('HTTP error', {
              status: error.response.status,
              url,
              data: error.response.data,
            });
            return Promise.reject(error);
        }
      } else if (error.request) {
        logger.error('Network error - no response received', { url });
        return Promise.reject(new Error(ERROR_MESSAGES.NETWORK_ERROR));
      }
      logger.error('Request setup error', { message: error.message });
      return Promise.reject(error);
    }
  );

  return instance;
};

const apiClient = createApiInstance();

/**
 * Service API générique
 */
const apiService = {
  /**
   * Teste la connexion avec l'API key
   */
  testConnection: async () => {
    try {
      logger.info('Testing API connection');
      const response = await apiClient.get('/');
      logger.info('API connection successful');
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('API connection failed', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * Sauvegarde l'API key
   */
  setApiKey: (apiKey) => {
    logger.info('API key saved');
    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
  },

  /**
   * Récupère l'API key
   */
  getApiKey: () => {
    return localStorage.getItem(STORAGE_KEYS.API_KEY);
  },

  /**
   * Supprime l'API key
   */
  clearApiKey: () => {
    logger.info('API key cleared - user logged out');
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  },

  /**
   * Vérifie si l'API key est présente
   */
  hasApiKey: () => {
    return !!localStorage.getItem(STORAGE_KEYS.API_KEY);
  },
};

export { apiClient, apiService };
