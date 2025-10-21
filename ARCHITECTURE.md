# Architecture de l'application Bug Tracking Janitor UI

## Vue d'ensemble

Cette application React suit une architecture modulaire et scalable basée sur les bonnes pratiques React modernes.

## Structure des dossiers

```
src/
├── components/         # Composants réutilisables
│   ├── Common/        # Composants communs (Loading, Error, Pagination)
│   └── Layout/        # Composants de mise en page (Navbar)
├── config/            # Fichiers de configuration
├── pages/             # Pages de l'application
├── services/          # Services API et logique métier
├── App.js            # Composant racine avec routing
└── index.js          # Point d'entrée
```

## Patterns et pratiques

### 1. Séparation des préoccupations

- **Components** : Logique UI uniquement
- **Services** : Logique métier et appels API
- **Config** : Configuration centralisée

### 2. Gestion de l'état

- État local avec `useState` pour chaque composant
- Pas de gestion d'état globale (Redux) - volontairement simple
- LocalStorage pour la persistance de l'API key

### 3. Services API

Chaque service encapsule :
- Les appels API spécifiques à une ressource
- La gestion des erreurs
- Le formatage des réponses

**Structure de retour standardisée** :
```javascript
{
  success: boolean,
  data?: any,
  error?: string
}
```

### 4. Configuration centralisée

Le fichier `api.config.js` contient :
- URL de base de l'API
- Timeout des requêtes
- Headers par défaut
- Messages d'erreur
- Clés de stockage

### 5. Intercepteurs Axios

**Request Interceptor** :
- Ajoute automatiquement l'API key à chaque requête

**Response Interceptor** :
- Gère les erreurs HTTP (401, 403, 404, 500)
- Déconnecte automatiquement si la clé API est invalide
- Standardise les messages d'erreur

### 6. Authentification

```
┌─────────────┐
│  LocalStorage│
│   API Key   │
└──────┬──────┘
       │
       v
┌─────────────┐     ┌──────────────┐
│  App.js     │────>│ ApiKeyLogin  │
│  (Guard)    │     │  Component   │
└──────┬──────┘     └──────────────┘
       │
       v (Authenticated)
┌─────────────┐
│   Router    │
│   + Pages   │
└─────────────┘
```

### 7. Routing

Routes protégées avec un guard au niveau App.js :
- `/` - Dashboard (authentifié)
- `/tasks` - Gestion des tâches (authentifié)
- `/projects` - Gestion des projets (authentifié)
- `*` - Redirection vers `/`

### 8. Composants réutilisables

**Loading** : Indicateur de chargement standardisé
**ErrorMessage** : Affichage d'erreur avec retry
**Pagination** : Navigation entre les pages de résultats
**Navbar** : Navigation principale avec déconnexion

### 9. Gestion des formulaires

- Formulaires contrôlés (controlled components)
- État local pour les données du formulaire
- Validation côté client
- Modale pour création/édition

### 10. Styling

- CSS modulaire par composant/page
- Pas de bibliothèque CSS externe (maintien de la simplicité)
- Design responsive mobile-first
- Variables de couleur cohérentes :
  - Primary: `#667eea` → `#764ba2` (gradient)
  - Success: `#48bb78`
  - Warning: `#ed8936`
  - Danger: `#fc8181`

## Flux de données

### Chargement des données

```
Page Component
  │
  ├─> useEffect()
  │     │
  │     └─> Service.getAll()
  │           │
  │           └─> apiClient (Axios)
  │                 │
  │                 ├─> Request Interceptor (+ API Key)
  │                 │
  │                 └─> Backend API
  │                       │
  │                       └─> Response
  │                             │
  │                             └─> Response Interceptor
  │                                   │
  │                                   └─> Page Component
  │                                         │
  │                                         └─> setState()
  │                                               │
  │                                               └─> Re-render
```

### Mutation des données

```
User Action (Submit)
  │
  └─> handleSubmit()
        │
        ├─> Service.create/update/delete()
        │     │
        │     └─> apiClient (Axios)
        │           │
        │           └─> Backend API
        │                 │
        │                 └─> Response
        │
        └─> Success?
              ├─> Yes: Close Modal + Reload Data
              └─> No: Show Error
```

## Gestion des erreurs

### Niveaux de gestion

1. **Intercepteur Axios** : Erreurs HTTP globales
2. **Service Layer** : Erreurs métier spécifiques
3. **Component Layer** : Affichage des erreurs à l'utilisateur

### Types d'erreurs

- **Network Error** : Impossible de joindre le backend
- **401/403** : API key invalide → Déconnexion automatique
- **404** : Ressource non trouvée
- **500** : Erreur serveur

## Performance

### Optimisations implémentées

1. **Debouncing** : Recherche avec délai de 500ms
2. **Pagination** : Limitation des résultats (10 par page)
3. **Lazy Loading** : Composants chargés à la demande via React Router
4. **Memoization** : Calculs coûteux (dates, filtres) mis en cache

### Optimisations possibles

- React.memo pour les composants enfants
- useMemo/useCallback pour les fonctions/valeurs coûteuses
- Virtualisation des listes longues
- Code splitting par route
- Service Worker pour cache offline

## Sécurité

### Mesures implémentées

1. **API Key Storage** : LocalStorage (non exposé au backend)
2. **HTTPS Only** : Production doit utiliser HTTPS
3. **XSS Protection** : React échappe automatiquement
4. **CSRF** : Pas de cookies, pas de vulnérabilité CSRF

### Recommandations

- Utiliser HTTPS en production
- Implémenter un mécanisme de refresh token
- Ajouter rate limiting côté backend
- Valider les entrées côté serveur

## Extensibilité

### Ajout d'une nouvelle entité

1. Créer le service dans `services/`
2. Créer la page dans `pages/`
3. Ajouter la route dans `App.js`
4. Ajouter le lien dans `Navbar.js`

### Ajout d'une fonctionnalité globale

1. Créer le composant dans `components/Common/`
2. Exporter et réutiliser dans les pages

## Tests

### Stratégie de test recommandée

- **Unit Tests** : Services et fonctions utilitaires
- **Integration Tests** : Composants avec interactions
- **E2E Tests** : Parcours utilisateur complets

### Outils suggérés

- Jest (déjà configuré)
- React Testing Library (déjà installé)
- Cypress ou Playwright pour E2E

## Déploiement

### Build de production

```bash
npm run build
```

Génère un dossier `build/` optimisé pour production :
- Minification JS/CSS
- Optimisation des images
- Tree shaking
- Hash des fichiers pour cache busting

### Environnements

- **Développement** : `npm start` (port 3000)
- **Production** : Servir le dossier `build/` via nginx/apache

### Variables d'environnement

- `.env` : Configuration locale (non versionné)
- `.env.example` : Template de configuration

## Maintenance

### Mises à jour des dépendances

```bash
# Vérifier les mises à jour
npm outdated

# Mettre à jour les dépendances mineures
npm update

# Mettre à jour les dépendances majeures
npm install <package>@latest
```

### Linting

Ajouter ESLint et Prettier pour maintenir la qualité du code :

```bash
npm install --save-dev eslint prettier
```

## Évolutions futures

### Fonctionnalités potentielles

- [ ] Tableau Kanban pour les tâches
- [ ] Notifications en temps réel (WebSocket)
- [ ] Export CSV/PDF des données
- [ ] Graphiques et statistiques avancées
- [ ] Mode dark
- [ ] Internationalisation (i18n)
- [ ] Commentaires sur les tâches
- [ ] Pièces jointes
- [ ] Historique des modifications
- [ ] Assignation d'utilisateurs

### Améliorations techniques

- [ ] Migration vers TypeScript
- [ ] Ajout de Redux ou Context API pour état global
- [ ] PWA (Progressive Web App)
- [ ] Tests unitaires et E2E
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Monitoring et analytics
