import React from 'react';
import './ErrorMessage.css';

/**
 * Composant d'affichage d'erreur réutilisable
 */
const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <p className="error-text">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-retry">
          Réessayer
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
