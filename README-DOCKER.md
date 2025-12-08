# Docker - Bug Tracking Janitor UI

Ce guide explique comment dockeriser et déployer l'application Bug Tracking Janitor UI à l'aide de Docker.

## 📦 Fichiers Docker

Le projet contient les fichiers suivants pour Docker :

- **Dockerfile** - Configuration multi-stage pour construire et servir l'application
- **docker-compose.yml** - Orchestration des services
- **.dockerignore** - Fichiers à exclure du build Docker
- **nginx.conf** - Configuration du serveur Nginx
- **.env.production** - Variables d'environnement pour la production

## 🏗️ Architecture Docker

L'application utilise une approche **multi-stage build** :

1. **Stage 1 (Build)** : Utilise Node.js 18 Alpine pour construire l'application React
2. **Stage 2 (Production)** : Utilise Nginx Alpine pour servir les fichiers statiques

Cette approche permet d'obtenir une image finale très légère (~25 MB au lieu de ~500 MB).

## 🚀 Démarrage rapide

### Prérequis

- Docker (version 20.10 ou supérieure)
- Docker Compose (version 2.0 ou supérieure)

### Configuration

1. **Configurer l'URL de l'API backend**

Modifier le fichier `.env.production` :

```bash
REACT_APP_API_URL=http://votre-backend:3000
```

### Option 1 : Utiliser Docker Compose (Recommandé)

```bash
# Démarrer l'application
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter l'application
docker-compose down
```

L'application sera accessible sur [http://localhost:3001](http://localhost:3001)

### Option 2 : Utiliser Docker directement

```bash
# Construire l'image
docker build -t bug-tracking-janitor-ui .

# Lancer le conteneur
docker run -d \
  --name bug-tracking-ui \
  -p 3001:80 \
  bug-tracking-janitor-ui

# Voir les logs
docker logs -f bug-tracking-ui

# Arrêter le conteneur
docker stop bug-tracking-ui
docker rm bug-tracking-ui
```

## 🔧 Commandes utiles

### Gestion des conteneurs

```bash
# Reconstruire l'image après des modifications
docker-compose up -d --build

# Voir les conteneurs en cours d'exécution
docker ps

# Accéder au shell du conteneur
docker exec -it bug-tracking-janitor-ui sh

# Voir les ressources utilisées
docker stats bug-tracking-janitor-ui
```

### Gestion des images

```bash
# Lister les images
docker images

# Supprimer les images non utilisées
docker image prune -a

# Voir la taille de l'image
docker images bug-tracking-janitor-ui
```

### Logs et debugging

```bash
# Voir les logs en temps réel
docker-compose logs -f bug-tracking-ui

# Voir les dernières 100 lignes
docker-compose logs --tail=100 bug-tracking-ui

# Vérifier la configuration Nginx
docker exec bug-tracking-janitor-ui nginx -t
```

## 🌐 Configuration réseau

### Avec le backend dockerisé

Si votre backend est également dockerisé, vous pouvez les connecter au même réseau :

```yaml
# Dans docker-compose.yml du backend
networks:
  bug-tracking-network:
    external: true
```

Puis modifier `.env.production` :

```bash
REACT_APP_API_URL=http://bug-tracking-backend:3000
```

### Avec le backend sur l'hôte

Si le backend tourne sur votre machine hôte :

**Windows/Mac** :
```bash
REACT_APP_API_URL=http://host.docker.internal:3000
```

**Linux** :
```bash
REACT_APP_API_URL=http://172.17.0.1:3000
```

## 🔐 Variables d'environnement

Les variables d'environnement React doivent être définies **au moment du build**, pas au runtime.

Pour changer l'URL de l'API :

1. Modifier `.env.production`
2. Reconstruire l'image :
   ```bash
   docker-compose up -d --build
   ```

## 📊 Optimisations

### Compression Gzip

Nginx est configuré pour compresser automatiquement :
- Fichiers CSS, JS, JSON
- Fichiers texte et XML
- Amélioration des performances de ~70%

### Cache des ressources statiques

- Fichiers statiques (CSS, JS, images) : cache 1 an
- index.html : pas de cache (pour les mises à jour)

### Headers de sécurité

Configuration des headers HTTP sécurisés :
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

## 🐛 Dépannage

### Erreur de connexion au backend

**Problème** : L'application ne peut pas se connecter au backend

**Solutions** :
1. Vérifier que le backend est accessible
2. Vérifier l'URL dans `.env.production`
3. Vérifier la configuration CORS du backend
4. Tester la connexion depuis le conteneur :
   ```bash
   docker exec -it bug-tracking-janitor-ui sh
   wget -O- http://votre-backend:3000
   ```

### Le port 3001 est déjà utilisé

**Solution** : Modifier le port dans `docker-compose.yml` :
```yaml
ports:
  - "8080:80"  # Utiliser le port 8080 au lieu de 3001
```

### Modifications non prises en compte

**Solution** : Reconstruire l'image sans cache :
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Problèmes de routing React

**Problème** : Erreur 404 lors du rafraîchissement sur une route

**Solution** : C'est déjà résolu dans `nginx.conf` avec :
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 🚢 Déploiement en production

### Docker Hub

```bash
# Tag l'image
docker tag bug-tracking-janitor-ui votre-username/bug-tracking-ui:1.0.0

# Push vers Docker Hub
docker push votre-username/bug-tracking-ui:1.0.0

# Pull et lancer sur le serveur
docker pull votre-username/bug-tracking-ui:1.0.0
docker run -d -p 80:80 votre-username/bug-tracking-ui:1.0.0
```

### Avec un reverse proxy (Nginx/Traefik)

Exemple avec Nginx sur l'hôte :

```nginx
server {
    listen 80;
    server_name votredomaine.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Variables d'environnement de production

Créer un fichier `.env.production` spécifique :

```bash
REACT_APP_API_URL=https://api.votredomaine.com
REACT_APP_LOG_LEVEL=WARN
```

## 📈 Monitoring

### Santé du conteneur

```bash
# Vérifier la santé
docker inspect --format='{{.State.Health.Status}}' bug-tracking-janitor-ui

# Ressources utilisées
docker stats bug-tracking-janitor-ui
```

### Logs

```bash
# Suivre les logs Nginx
docker exec bug-tracking-janitor-ui tail -f /var/log/nginx/access.log
docker exec bug-tracking-janitor-ui tail -f /var/log/nginx/error.log
```

## 🔄 Mise à jour de l'application

```bash
# 1. Pull les dernières modifications du code
git pull

# 2. Reconstruire et redémarrer
docker-compose up -d --build

# 3. Vérifier que tout fonctionne
docker-compose logs -f
```

## 📝 Bonnes pratiques

1. **Toujours utiliser des tags de version** pour les images de production
2. **Scanner les images** pour les vulnérabilités :
   ```bash
   docker scan bug-tracking-janitor-ui
   ```
3. **Limiter les ressources** si nécessaire :
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```
4. **Sauvegarder les configurations** : `.env.production`, `nginx.conf`
5. **Utiliser un registre privé** pour les images de production

## 🆘 Support

Pour plus d'informations :
- Documentation Docker : https://docs.docker.com
- Documentation Nginx : https://nginx.org/en/docs/
- Documentation React : https://react.dev

## 📄 Licence

Ce projet fait partie du système Bug Tracking Janitor.
