# Quick Start - Bug Tracking Janitor UI

## Installation rapide

### 1. Naviguer dans le dossier

```bash
cd bug-tracking-janitor-ui
```

### 2. Installer les dépendances

```bash
npm install
```

**Note** : Si vous rencontrez des erreurs réseau, réessayez ou utilisez :
```bash
npm install --legacy-peer-deps
```

### 3. Configurer l'API

Le fichier `.env` est déjà créé avec la configuration par défaut :
```
REACT_APP_API_URL=http://localhost:3000
```

Si votre backend tourne sur un autre port, modifiez cette valeur.

### 4. Démarrer l'application

```bash
npm start
```

L'application s'ouvrira automatiquement sur [http://localhost:3000](http://localhost:3000)

### 5. Se connecter

À l'ouverture, vous verrez l'écran de connexion.

**Clé API par défaut du backend** : `your-secret-api-key-here`

(Cette clé est définie dans le fichier `application.properties` de votre backend Spring Boot)

## Vérification du backend

Avant de lancer le frontend, assurez-vous que le backend est démarré :

```bash
cd ../bug-tracking-janitor
./gradlew bootRun
# ou
java -jar build/libs/bugjanitor-0.0.1-SNAPSHOT.jar
```

Le backend devrait être accessible sur `http://localhost:3000`

## Premiers pas

Une fois connecté, vous verrez :

1. **Tableau de bord** - Vue d'ensemble de vos projets et tâches
2. **Menu Tâches** - Créer, modifier, supprimer des tâches
3. **Menu Projets** - Gérer vos projets

### Créer votre premier projet

1. Cliquez sur "Projets" dans le menu
2. Cliquez sur "+ Nouveau Projet"
3. Remplissez les informations :
   - Nom du projet (ex: "Système d'authentification")
   - Code du projet (ex: "AUTH")
   - Description
4. Cliquez sur "Créer"

### Créer votre première tâche

1. Cliquez sur "Tâches" dans le menu
2. Cliquez sur "+ Nouvelle Tâche"
3. Remplissez les informations :
   - Titre (requis)
   - Description (requis)
   - Projet (optionnel)
   - Statut, dates, estimation, etc.
4. Cliquez sur "Créer"

## Fonctionnalités disponibles

### Gestion des tâches
- ✅ Créer, modifier, supprimer des tâches
- ✅ Rechercher des tâches
- ✅ Filtrer par statut (ouvert, en cours, fermé)
- ✅ Pagination
- ✅ Associer des tâches à des projets
- ✅ Définir des dates et estimations

### Gestion des projets
- ✅ Créer, modifier, supprimer des projets
- ✅ Rechercher des projets
- ✅ Vue en grille

### Dashboard
- ✅ Statistiques en temps réel
- ✅ Nombre de projets et tâches
- ✅ Répartition des tâches par statut

## Structure du projet créé

```
bug-tracking-janitor-ui/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── Common/
│   │   │   ├── ErrorMessage.js/css
│   │   │   ├── Loading.js/css
│   │   │   └── Pagination.js/css
│   │   ├── Layout/
│   │   │   └── Navbar.js/css
│   │   └── ApiKeyLogin.js/css
│   ├── config/
│   │   └── api.config.js
│   ├── pages/
│   │   ├── Dashboard.js/css
│   │   ├── TasksPage.js/css
│   │   └── ProjectsPage.js/css
│   ├── services/
│   │   ├── api.service.js
│   │   ├── task.service.js
│   │   └── project.service.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── .env (configuration locale)
├── .env.example (template)
├── .gitignore
├── package.json
├── README.md (documentation complète)
├── ARCHITECTURE.md (architecture détaillée)
├── DEPLOYMENT.md (guide de déploiement)
├── CONTRIBUTING.md (guide de contribution)
└── QUICK_START.md (ce fichier)
```

## Technologies utilisées

- **React 18** - Framework UI
- **React Router DOM** - Navigation entre les pages
- **Axios** - Client HTTP pour les appels API
- **date-fns** - Manipulation et formatage des dates
- **CSS3** - Styles modernes et responsive

## Commandes disponibles

```bash
# Démarrer en mode développement
npm start

# Créer un build de production
npm run build

# Lancer les tests (si configurés)
npm test

# Éjecter la configuration (non recommandé)
npm run eject
```

## Résolution de problèmes courants

### L'application ne se lance pas

**Problème** : Erreur lors de `npm start`

**Solution** :
1. Vérifier que Node.js est installé : `node --version`
2. Réinstaller les dépendances : `rm -rf node_modules && npm install`
3. Vérifier qu'aucun autre processus n'utilise le port 3000

### Erreur "Cannot connect to backend"

**Problème** : L'application ne peut pas se connecter au backend

**Solution** :
1. Vérifier que le backend est démarré
2. Vérifier l'URL dans le fichier `.env`
3. Vérifier la configuration CORS du backend

### Clé API invalide

**Problème** : "Clé API invalide" lors de la connexion

**Solution** :
1. Vérifier la clé API dans `bug-tracking-janitor/src/main/resources/application.properties`
2. La clé par défaut est `your-secret-api-key-here`
3. Si vous l'avez modifiée, utilisez la nouvelle clé

### Page blanche après connexion

**Problème** : Page blanche ou erreur dans la console

**Solution** :
1. Ouvrir la console du navigateur (F12)
2. Vérifier les erreurs JavaScript
3. Vérifier que le backend répond correctement
4. Recharger la page avec Ctrl+F5

## Configuration du backend pour CORS

Si vous rencontrez des erreurs CORS, ajoutez cette configuration dans votre backend Spring Boot :

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                    .allowedOrigins("http://localhost:3000")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .exposedHeaders("X-API-Key");
            }
        };
    }
}
```

## Support et documentation

- **README.md** : Documentation complète de l'application
- **ARCHITECTURE.md** : Détails de l'architecture et des patterns utilisés
- **DEPLOYMENT.md** : Guide complet de déploiement
- **CONTRIBUTING.md** : Guide pour contribuer au projet

## Prochaines étapes

1. ✅ Créer quelques projets
2. ✅ Créer des tâches et les associer aux projets
3. ✅ Tester la recherche et les filtres
4. ✅ Explorer le tableau de bord
5. 📖 Lire ARCHITECTURE.md pour comprendre le code
6. 🚀 Déployer en production (voir DEPLOYMENT.md)

Bon développement ! 🎉
