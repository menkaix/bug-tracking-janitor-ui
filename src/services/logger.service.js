/**
 * Service de logging centralisé pour l'application
 *
 * Niveaux de log:
 * - ERROR: Erreurs critiques
 * - WARN: Avertissements
 * - INFO: Informations générales
 * - DEBUG: Informations de débogage détaillées
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const LOG_LEVEL_NAMES = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG',
};

class Logger {
  constructor() {
    // Niveau de log basé sur l'environnement
    this.level = this.getLogLevel();
    this.enableConsole = true;
    this.enableStorage = process.env.NODE_ENV === 'production';
    this.maxStoredLogs = 100;
    this.logs = this.loadLogsFromStorage();
  }

  /**
   * Détermine le niveau de log selon l'environnement
   */
  getLogLevel() {
    const envLevel = process.env.REACT_APP_LOG_LEVEL;

    if (envLevel && LOG_LEVELS[envLevel.toUpperCase()] !== undefined) {
      return LOG_LEVELS[envLevel.toUpperCase()];
    }

    // Par défaut: DEBUG en dev, INFO en prod
    return process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
  }

  /**
   * Charge les logs depuis le localStorage
   */
  loadLogsFromStorage() {
    try {
      const stored = localStorage.getItem('app_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Sauvegarde les logs dans le localStorage
   */
  saveLogsToStorage() {
    if (this.enableStorage) {
      try {
        // Garder uniquement les N derniers logs
        const logsToStore = this.logs.slice(-this.maxStoredLogs);
        localStorage.setItem('app_logs', JSON.stringify(logsToStore));
      } catch (error) {
        // Si le localStorage est plein, vider les anciens logs
        this.logs = [];
        localStorage.removeItem('app_logs');
      }
    }
  }

  /**
   * Formate un message de log
   */
  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level];

    return {
      timestamp,
      level: levelName,
      message,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  /**
   * Log un message avec un niveau spécifique
   */
  log(level, message, context = {}) {
    if (level > this.level) {
      return; // Ne pas logger si le niveau est trop élevé
    }

    const logEntry = this.formatMessage(level, message, context);

    // Ajouter aux logs en mémoire
    this.logs.push(logEntry);
    this.saveLogsToStorage();

    // Afficher dans la console
    if (this.enableConsole) {
      this.logToConsole(level, logEntry);
    }

    // En production, envoyer les erreurs critiques au serveur (optionnel)
    if (process.env.NODE_ENV === 'production' && level === LOG_LEVELS.ERROR) {
      this.sendToServer(logEntry);
    }
  }

  /**
   * Affiche dans la console avec le bon niveau
   */
  logToConsole(level, logEntry) {
    const { timestamp, level: levelName, message, context } = logEntry;
    const prefix = `[${timestamp}] [${levelName}]`;

    const hasContext = Object.keys(context).length > 0;

    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error(prefix, message, hasContext ? context : '');
        break;
      case LOG_LEVELS.WARN:
        console.warn(prefix, message, hasContext ? context : '');
        break;
      case LOG_LEVELS.INFO:
        console.info(prefix, message, hasContext ? context : '');
        break;
      case LOG_LEVELS.DEBUG:
        console.debug(prefix, message, hasContext ? context : '');
        break;
      default:
        console.log(prefix, message, hasContext ? context : '');
    }
  }

  /**
   * Envoie les logs critiques au serveur (optionnel)
   */
  async sendToServer(logEntry) {
    // Cette fonctionnalité peut être implémentée pour envoyer les logs au backend
    // Pour l'instant, elle est désactivée
    if (process.env.REACT_APP_LOG_ENDPOINT) {
      try {
        await fetch(process.env.REACT_APP_LOG_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry),
        });
      } catch (error) {
        // Ne rien faire si l'envoi échoue
      }
    }
  }

  /**
   * Méthodes publiques pour chaque niveau
   */
  error(message, context = {}) {
    this.log(LOG_LEVELS.ERROR, message, context);
  }

  warn(message, context = {}) {
    this.log(LOG_LEVELS.WARN, message, context);
  }

  info(message, context = {}) {
    this.log(LOG_LEVELS.INFO, message, context);
  }

  debug(message, context = {}) {
    this.log(LOG_LEVELS.DEBUG, message, context);
  }

  /**
   * Log une requête HTTP
   */
  logRequest(method, url, data = null) {
    this.debug(`HTTP Request: ${method} ${url}`, { method, url, data });
  }

  /**
   * Log une réponse HTTP
   */
  logResponse(method, url, status, data = null) {
    const level = status >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;
    this.log(level, `HTTP Response: ${method} ${url} - ${status}`, {
      method,
      url,
      status,
      data,
    });
  }

  /**
   * Log une erreur avec stack trace
   */
  logError(error, context = {}) {
    this.error(error.message || 'Unknown error', {
      ...context,
      stack: error.stack,
      name: error.name,
    });
  }

  /**
   * Récupère tous les logs
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Récupère les logs filtrés par niveau
   */
  getLogsByLevel(level) {
    const levelValue = typeof level === 'string' ? LOG_LEVELS[level.toUpperCase()] : level;
    return this.logs.filter(log => LOG_LEVELS[log.level] === levelValue);
  }

  /**
   * Vide tous les logs
   */
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('app_logs');
    this.info('Logs cleared');
  }

  /**
   * Exporte les logs en JSON
   */
  exportLogs() {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `app-logs-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    this.info('Logs exported', { count: this.logs.length });
  }

  /**
   * Configure le logger
   */
  configure(options = {}) {
    if (options.level !== undefined) {
      this.level = typeof options.level === 'string'
        ? LOG_LEVELS[options.level.toUpperCase()]
        : options.level;
    }
    if (options.enableConsole !== undefined) {
      this.enableConsole = options.enableConsole;
    }
    if (options.enableStorage !== undefined) {
      this.enableStorage = options.enableStorage;
    }
    if (options.maxStoredLogs !== undefined) {
      this.maxStoredLogs = options.maxStoredLogs;
    }

    this.info('Logger configured', options);
  }
}

// Instance singleton du logger
const logger = new Logger();

// Exposer le logger dans la console pour le debug
if (process.env.NODE_ENV === 'development') {
  window.logger = logger;
}

export default logger;
export { LOG_LEVELS };
