/**
 * Configuration centrale de l'API
 */
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'https://api-backlog-clnwfd9w.ew.gateway.dev',
  TIMEOUT: 60000,
  DEFAULT_API_KEY: process.env.REACT_APP_DEFAULT_API_KEY || '',
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

/**
 * Clés de stockage local
 */
export const STORAGE_KEYS = {
  API_KEY: 'bug_tracker_api_key',
};

/**
 * Endpoints API — source unique de vérité pour tous les services
 */
export const API_ENDPOINTS = {
  TASKS: '/task',
  PROJECTS: '/projects',
  PERSONS: '/person',
  PROJECT_COMMAND: '/project-command',
  FEATURES: '/features',
  SKILLS: '/skill',
};

/**
 * Limites de fetch pour éviter les requêtes massives
 */
export const FETCH_LIMITS = {
  DASHBOARD: 2000,
  PROJECTS_STATUS: 2000,
};

/**
 * Messages d'erreur
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion au serveur',
  UNAUTHORIZED: 'Clé API invalide ou manquante',
  NOT_FOUND: 'Ressource non trouvée',
  SERVER_ERROR: 'Erreur serveur',
  VALIDATION_ERROR: 'Erreur de validation',
};
