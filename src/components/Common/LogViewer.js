import React, { useState, useEffect } from 'react';
import logger from '../../services/logger.service';
import './LogViewer.css';

/**
 * Composant pour visualiser et gérer les logs de l'application
 * Accessible uniquement en développement via la console ou une route spéciale
 */
const LogViewer = ({ onClose }) => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadLogs();

    if (autoRefresh) {
      const interval = setInterval(loadLogs, 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadLogs = () => {
    setLogs(logger.getLogs());
  };

  const filteredLogs = logs
    .filter(log => filter === 'ALL' || log.level === filter)
    .filter(log => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        log.message.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.context).toLowerCase().includes(searchLower)
      );
    })
    .reverse(); // Les plus récents en premier

  const handleClearLogs = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tous les logs ?')) {
      logger.clearLogs();
      loadLogs();
    }
  };

  const handleExportLogs = () => {
    logger.exportLogs();
  };

  const getLevelClass = (level) => {
    switch (level) {
      case 'ERROR':
        return 'log-level-error';
      case 'WARN':
        return 'log-level-warn';
      case 'INFO':
        return 'log-level-info';
      case 'DEBUG':
        return 'log-level-debug';
      default:
        return '';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  return (
    <div className="log-viewer-overlay">
      <div className="log-viewer">
        <div className="log-viewer-header">
          <h2>Console de Logs</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="log-viewer-controls">
          <div className="control-group">
            <label>Filtrer par niveau:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">Tous</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
              <option value="DEBUG">DEBUG</option>
            </select>
          </div>

          <div className="control-group">
            <label>Rechercher:</label>
            <input
              type="text"
              placeholder="Filtrer les logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Actualisation auto
            </label>
          </div>

          <div className="control-actions">
            <button onClick={loadLogs} className="btn-refresh">
              Actualiser
            </button>
            <button onClick={handleExportLogs} className="btn-export">
              Exporter
            </button>
            <button onClick={handleClearLogs} className="btn-clear">
              Effacer
            </button>
          </div>
        </div>

        <div className="log-viewer-stats">
          <span>Total: {logs.length}</span>
          <span>Filtrés: {filteredLogs.length}</span>
          <span>ERROR: {logs.filter(l => l.level === 'ERROR').length}</span>
          <span>WARN: {logs.filter(l => l.level === 'WARN').length}</span>
          <span>INFO: {logs.filter(l => l.level === 'INFO').length}</span>
          <span>DEBUG: {logs.filter(l => l.level === 'DEBUG').length}</span>
        </div>

        <div className="log-viewer-content">
          {filteredLogs.length === 0 ? (
            <div className="no-logs">Aucun log à afficher</div>
          ) : (
            <table className="log-table">
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Niveau</th>
                  <th>Message</th>
                  <th>Contexte</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr key={index} className={getLevelClass(log.level)}>
                    <td className="log-timestamp">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="log-level">
                      <span className={`level-badge ${getLevelClass(log.level)}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="log-message">{log.message}</td>
                    <td className="log-context">
                      {Object.keys(log.context).length > 0 ? (
                        <details>
                          <summary>Voir contexte</summary>
                          <pre>{JSON.stringify(log.context, null, 2)}</pre>
                        </details>
                      ) : (
                        <span className="no-context">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
