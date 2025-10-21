# Système de Logging

Ce projet utilise un système de logging centralisé pour faciliter le débogage et la surveillance de l'application.

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Niveaux de log](#niveaux-de-log)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Console de logs](#console-de-logs)
- [Stockage des logs](#stockage-des-logs)
- [Logs en production](#logs-en-production)

## Vue d'ensemble

Le système de logging est implémenté via un service centralisé (`logger.service.js`) qui :
- Enregistre tous les événements de l'application
- Filtre les logs selon le niveau configuré
- Stocke les logs dans le localStorage
- Affiche les logs dans la console du navigateur
- Permet l'export des logs en JSON
- Peut envoyer les erreurs critiques au serveur (optionnel)

## Niveaux de log

Le logger supporte 4 niveaux de log, par ordre de priorité :

| Niveau | Priorité | Usage | Exemple |
|--------|----------|-------|---------|
| **ERROR** | 0 | Erreurs critiques | Échec de connexion API, erreurs de requêtes |
| **WARN** | 1 | Avertissements | API key invalide, ressource non trouvée |
| **INFO** | 2 | Informations importantes | Connexion réussie, création/modification de données |
| **DEBUG** | 3 | Détails de débogage | Détails des requêtes HTTP, paramètres de fonction |

Le niveau configuré détermine quels logs sont enregistrés. Par exemple :
- Niveau **INFO** : enregistre ERROR, WARN et INFO (mais pas DEBUG)
- Niveau **DEBUG** : enregistre tous les logs

## Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet (utilisez `.env.example` comme modèle) :

```env
# Niveau de log: ERROR, WARN, INFO, DEBUG
REACT_APP_LOG_LEVEL=DEBUG

# Endpoint optionnel pour envoyer les logs critiques au serveur
REACT_APP_LOG_ENDPOINT=http://localhost:3000/api/logs
```

### Niveaux par défaut

Si `REACT_APP_LOG_LEVEL` n'est pas défini :
- **Développement** : `DEBUG` (tous les logs)
- **Production** : `INFO` (pas de logs DEBUG)

### Configuration programmatique

Vous pouvez modifier la configuration du logger à tout moment :

```javascript
import logger from './services/logger.service';

logger.configure({
  level: 'WARN',           // Niveau de log
  enableConsole: true,     // Afficher dans la console
  enableStorage: true,     // Stocker dans localStorage
  maxStoredLogs: 200,      // Nombre max de logs stockés
});
```

## Utilisation

### Import du logger

```javascript
import logger from './services/logger.service';
```

### Méthodes de base

```javascript
// Erreur critique
logger.error('Message d\'erreur', {
  error: error.message,
  stack: error.stack
});

// Avertissement
logger.warn('Message d\'avertissement', {
  reason: 'API key invalide'
});

// Information
logger.info('Utilisateur connecté', {
  userId: '12345'
});

// Debug
logger.debug('Détails de la requête', {
  url: '/api/tasks',
  params: { page: 0, size: 10 }
});
```

### Méthodes spécialisées

```javascript
// Log d'une requête HTTP
logger.logRequest('GET', '/api/tasks', { page: 0 });

// Log d'une réponse HTTP
logger.logResponse('GET', '/api/tasks', 200, { data: [...] });

// Log d'une erreur avec stack trace
try {
  // code...
} catch (error) {
  logger.logError(error, { context: 'additional info' });
}
```

### Exemples dans le code

#### Dans un composant React

```javascript
import React, { useEffect } from 'react';
import logger from '../services/logger.service';

function MyComponent() {
  useEffect(() => {
    logger.info('Component mounted');

    return () => {
      logger.debug('Component unmounting');
    };
  }, []);

  const handleClick = () => {
    logger.info('Button clicked', { action: 'submit' });
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

#### Dans un service

```javascript
import logger from './logger.service';

const myService = {
  async fetchData(id) {
    try {
      logger.debug('Fetching data', { id });
      const response = await api.get(`/data/${id}`);
      logger.info('Data fetched successfully', { id });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch data', { id, error: error.message });
      throw error;
    }
  }
};
```

## Console de logs

Un composant visuel permet de consulter les logs en temps réel.

### Accès à la console

En mode développement, le logger est exposé dans la console du navigateur :

```javascript
// Ouvrir la console du navigateur (F12)
window.logger

// Voir tous les logs
window.logger.getLogs()

// Voir uniquement les erreurs
window.logger.getLogsByLevel('ERROR')

// Exporter les logs
window.logger.exportLogs()

// Effacer les logs
window.logger.clearLogs()
```

### Composant LogViewer

Pour afficher l'interface graphique des logs :

```javascript
import React, { useState } from 'react';
import LogViewer from './components/Common/LogViewer';

function MyApp() {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <>
      <button onClick={() => setShowLogs(true)}>
        Voir les logs
      </button>

      {showLogs && (
        <LogViewer onClose={() => setShowLogs(false)} />
      )}
    </>
  );
}
```

**Fonctionnalités du LogViewer :**
- ✅ Filtrage par niveau (ERROR, WARN, INFO, DEBUG)
- ✅ Recherche dans les messages et contextes
- ✅ Actualisation automatique en temps réel
- ✅ Statistiques (nombre de logs par niveau)
- ✅ Export en JSON
- ✅ Effacement des logs
- ✅ Interface style VS Code

## Stockage des logs

### localStorage

Les logs sont automatiquement stockés dans le `localStorage` du navigateur :
- **Clé** : `app_logs`
- **Format** : JSON
- **Limite** : 100 logs par défaut (configurable)

Les logs sont conservés entre les sessions et ne sont effacés que :
1. Manuellement via `logger.clearLogs()`
2. Automatiquement si le localStorage est plein

### Structure d'un log

```json
{
  "timestamp": "2025-10-21T14:30:00.123Z",
  "level": "INFO",
  "message": "User logged in successfully",
  "context": {
    "userId": "12345",
    "role": "admin"
  },
  "userAgent": "Mozilla/5.0...",
  "url": "http://localhost:3000/dashboard"
}
```

### Export des logs

```javascript
// Export en JSON (téléchargement automatique)
logger.exportLogs();
// Fichier : app-logs-2025-10-21T14:30:00.123Z.json
```

## Logs en production

### Comportement en production

En production (`NODE_ENV=production`) :
- Niveau par défaut : **INFO**
- Logs DEBUG désactivés
- Stockage dans localStorage activé
- Erreurs critiques envoyées au serveur (si configuré)

### Envoi des erreurs au serveur

Si `REACT_APP_LOG_ENDPOINT` est défini, les erreurs de niveau **ERROR** sont automatiquement envoyées au serveur :

```javascript
// Automatique pour toutes les erreurs
logger.error('Critical error', { details: '...' });
```

**Format de la requête :**
```http
POST /api/logs
Content-Type: application/json

{
  "timestamp": "2025-10-21T14:30:00.123Z",
  "level": "ERROR",
  "message": "Critical error",
  "context": { "details": "..." },
  "userAgent": "Mozilla/5.0...",
  "url": "http://example.com"
}
```

### Monitoring en production

Pour monitorer les logs en production :

1. **Via le serveur** : Implémentez l'endpoint `/api/logs` pour recevoir les erreurs
2. **Via le localStorage** : Les utilisateurs peuvent exporter leurs logs en cas de problème
3. **Via des outils tiers** : Intégrez Sentry, LogRocket, etc.

## Bonnes pratiques

### ✅ À faire

- Utiliser le bon niveau de log pour chaque message
- Inclure du contexte pertinent dans les logs
- Logger les erreurs avec le stack trace
- Logger les actions critiques utilisateur (login, logout, CRUD)
- Logger les requêtes API qui échouent

### ❌ À éviter

- Logger des informations sensibles (mots de passe, tokens)
- Utiliser `console.log()` directement (utiliser le logger)
- Logger trop de détails en production (performance)
- Logger dans des boucles intensives (spam)

### Exemples de bons logs

```javascript
// ✅ Bon - contexte clair et utile
logger.error('Failed to create task', {
  taskTitle: task.title,
  projectId: task.projectId,
  error: error.message
});

// ❌ Mauvais - pas de contexte
logger.error('Error');

// ✅ Bon - action importante tracée
logger.info('Task created', {
  taskId: newTask.id,
  status: newTask.status
});

// ❌ Mauvais - trop de détails en INFO
logger.info('Task object', {
  task: entireTaskObjectWith100Fields
});
```

## Intégration existante

Le logging est déjà intégré dans :

### Services
- ✅ `api.service.js` - Intercepteurs Axios, connexion/déconnexion
- ✅ `task.service.js` - Opérations CRUD sur les tâches
- ✅ `project.service.js` - Opérations CRUD sur les projets

### Composants
- ✅ `App.js` - Authentification, initialisation
- ✅ `ApiKeyLogin.js` - Login/logout

### Requêtes HTTP
- ✅ Toutes les requêtes (méthode, URL, données)
- ✅ Toutes les réponses (status, données)
- ✅ Toutes les erreurs réseau

## Dépannage

### Les logs ne s'affichent pas

1. Vérifiez le niveau de log dans `.env`
2. Vérifiez la console du navigateur
3. Essayez `window.logger.getLogs()` dans la console

### Le localStorage est plein

```javascript
// Effacer les anciens logs
logger.clearLogs();

// Ou augmenter la limite
logger.configure({ maxStoredLogs: 500 });
```

### Les logs ralentissent l'app

- Passez en niveau **WARN** ou **ERROR** en production
- Réduisez `maxStoredLogs`
- Désactivez `enableStorage` si non nécessaire

## Support

Pour toute question sur le système de logging :
- Consultez `src/services/logger.service.js`
- Consultez les exemples d'utilisation dans les services existants
- Utilisez `window.logger` dans la console pour tester
