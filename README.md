# Bug Tracking Janitor - Interface Web

Interface web React pour le système de gestion de tâches Bug Tracking Janitor.

## 🚀 Fonctionnalités

- **Authentification par API Key** - Écran de connexion sécurisé avec saisie d'API key
- **Tableau de bord** - Vue d'ensemble des projets et tâches
- **Gestion des tâches** - Créer, modifier, supprimer et rechercher des tâches
- **Gestion des projets** - Organiser vos projets
- **Interface moderne** - Design responsive et intuitif
- **Pagination** - Navigation efficace dans les listes
- **Recherche et filtres** - Filtrage avancé des tâches par statut

## 📋 Prérequis

- Node.js (version 14 ou supérieure)
- npm ou yarn
- Backend Bug Tracking Janitor en cours d'exécution

## 🔧 Installation

1. Cloner le repository et naviguer dans le dossier :
```bash
cd bug-tracking-janitor-ui
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer l'URL de l'API :
   - Copier `.env.example` vers `.env`
   - Modifier `REACT_APP_API_URL` si nécessaire (par défaut: http://localhost:3000)

```bash
cp .env.example .env
```

## 🏃 Démarrage

### Mode développement

```bash
npm start
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Build pour production

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `build/`

## 🔑 Connexion

1. Au premier lancement, vous serez redirigé vers l'écran de connexion
2. Saisissez votre clé API (configurée dans le backend)
3. La clé API sera stockée localement et utilisée pour toutes les requêtes

**Clé API par défaut du backend** : `your-secret-api-key-here`

## 📁 Structure du projet

```
bug-tracking-janitor-ui/
├── public/              # Fichiers statiques
├── src/
│   ├── components/      # Composants réutilisables
│   │   ├── Common/      # Composants communs (Loading, Error, Pagination)
│   │   ├── Layout/      # Composants de mise en page (Navbar)
│   │   └── ApiKeyLogin.js
│   ├── config/          # Configuration de l'application
│   │   └── api.config.js
│   ├── pages/           # Pages de l'application
│   │   ├── Dashboard.js
│   │   ├── TasksPage.js
│   │   └── ProjectsPage.js
│   ├── services/        # Services API
│   │   ├── api.service.js
│   │   ├── task.service.js
│   │   └── project.service.js
│   ├── App.js           # Composant principal
│   ├── App.css
│   ├── index.js         # Point d'entrée
│   └── index.css
├── .env                 # Configuration locale
├── .env.example         # Exemple de configuration
├── package.json
└── README.md
```

## 🎨 Fonctionnalités détaillées

### Tableau de bord
- Statistiques en temps réel
- Nombre total de projets et tâches
- Répartition des tâches ouvertes/fermées
- Accès rapide aux sections

### Gestion des tâches
- Création de nouvelles tâches avec formulaire complet
- Modification des tâches existantes
- Suppression avec confirmation
- Recherche en temps réel
- Filtrage par statut (ouvert, en cours, fermé)
- Pagination pour navigation efficace
- Champs disponibles :
  - Titre et description
  - Projet associé
  - Statut
  - Dates de début et échéance
  - Estimation
  - Référence de suivi externe

### Gestion des projets
- Création de nouveaux projets
- Modification des projets (nom et description)
- Suppression avec confirmation
- Vue en grille responsive
- Recherche en temps réel

## 🛠️ Technologies utilisées

- **React 18** - Framework UI
- **React Router DOM** - Navigation
- **Axios** - Client HTTP
- **date-fns** - Manipulation des dates
- **CSS3** - Stylisation moderne

## 🔒 Sécurité

- Authentification par API key
- Stockage sécurisé de la clé dans localStorage
- Intercepteurs Axios pour gestion automatique des erreurs
- Déconnexion automatique en cas de clé invalide

## 🌐 API Backend

L'application communique avec le backend via les endpoints suivants :

- `GET /` - Test de connexion
- `GET /task` - Liste des tâches (avec pagination, recherche, filtres)
- `POST /task` - Création de tâche
- `PUT /task/{id}` - Mise à jour de tâche
- `DELETE /task/{id}` - Suppression de tâche
- `GET /project` - Liste des projets
- `POST /project` - Création de projet
- `PUT /project/{id}` - Mise à jour de projet
- `DELETE /project/{id}` - Suppression de projet

## 📱 Responsive Design

L'application est entièrement responsive et s'adapte aux :
- Desktop (1400px+)
- Tablettes (768px - 1400px)
- Mobiles (< 768px)

## 🐛 Résolution des problèmes

### Erreur de connexion au serveur
- Vérifier que le backend est démarré
- Vérifier l'URL dans le fichier `.env`
- Vérifier la configuration CORS du backend

### Clé API invalide
- Vérifier la clé API dans le backend (`application.properties`)
- Essayer de vous déconnecter et reconnecter
- Vérifier la console du navigateur pour les erreurs

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet fait partie du système Bug Tracking Janitor.

## 📞 Support

Pour toute question ou problème, veuillez contacter l'administrateur système.
