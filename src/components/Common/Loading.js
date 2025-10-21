import React from 'react';
import './Loading.css';

/**
 * Composant de chargement réutilisable
 */
const Loading = ({ message = 'Chargement...' }) => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default Loading;
