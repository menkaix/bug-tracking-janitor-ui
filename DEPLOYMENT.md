# Guide de déploiement - Bug Tracking Janitor UI

## Prérequis

- Node.js 14+ installé
- npm ou yarn
- Backend Bug Tracking Janitor accessible

## Configuration de l'environnement

### 1. Fichier `.env`

Créer un fichier `.env` à la racine du projet :

```env
REACT_APP_API_URL=http://localhost:3000
```

Pour la production, remplacer par l'URL réelle du backend :

```env
REACT_APP_API_URL=https://api.votredomaine.com
```

### 2. Configuration CORS du backend

S'assurer que le backend autorise les requêtes depuis l'origine du frontend :

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                    .allowedOrigins("http://localhost:3000", "https://votredomaine.com")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

## Déploiement en développement

### Étapes

1. Installer les dépendances :
```bash
npm install
```

2. Démarrer le serveur de développement :
```bash
npm start
```

3. Accéder à l'application :
```
http://localhost:3000
```

### Port personnalisé

Pour changer le port (si 3000 est déjà utilisé) :

**Windows :**
```cmd
set PORT=3001 && npm start
```

**Linux/Mac :**
```bash
PORT=3001 npm start
```

## Build de production

### 1. Créer le build

```bash
npm run build
```

Cela génère un dossier `build/` contenant :
- HTML/CSS/JS minifiés
- Assets optimisés
- Service worker (si configuré)

### 2. Tester le build localement

Installer `serve` :
```bash
npm install -g serve
```

Servir le build :
```bash
serve -s build -l 3000
```

## Déploiement sur serveur web

### Option 1 : Nginx

#### 1. Configuration Nginx

Créer un fichier de configuration `/etc/nginx/sites-available/bug-tracker` :

```nginx
server {
    listen 80;
    server_name votredomaine.com;

    root /var/www/bug-tracker-ui/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Route all requests to index.html (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### 2. Activer le site

```bash
sudo ln -s /etc/nginx/sites-available/bug-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. HTTPS avec Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votredomaine.com
```

### Option 2 : Apache

#### 1. Configuration Apache

Créer `/etc/apache2/sites-available/bug-tracker.conf` :

```apache
<VirtualHost *:80>
    ServerName votredomaine.com
    DocumentRoot /var/www/bug-tracker-ui/build

    <Directory /var/www/bug-tracker-ui/build>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # Route all requests to index.html
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Enable compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
        AddOutputFilterByType DEFLATE application/javascript application/json
    </IfModule>

    # Cache static files
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType text/css "access plus 1 month"
        ExpiresByType application/javascript "access plus 1 month"
    </IfModule>
</VirtualHost>
```

#### 2. Activer le site

```bash
sudo a2enmod rewrite expires deflate
sudo a2ensite bug-tracker
sudo systemctl reload apache2
```

### Option 3 : Serveur Node.js (avec Express)

Créer un fichier `server.js` :

```javascript
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'build')));

// Route toutes les requêtes vers index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

Installer Express :
```bash
npm install express
```

Démarrer :
```bash
node server.js
```

## Déploiement cloud

### Option 1 : Netlify

1. Installer Netlify CLI :
```bash
npm install -g netlify-cli
```

2. Build et déploiement :
```bash
npm run build
netlify deploy --prod --dir=build
```

**Fichier `netlify.toml` (optionnel)** :
```toml
[build]
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  REACT_APP_API_URL = "https://api.votredomaine.com"
```

### Option 2 : Vercel

1. Installer Vercel CLI :
```bash
npm install -g vercel
```

2. Déployer :
```bash
vercel --prod
```

**Fichier `vercel.json`** :
```json
{
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": { "cache-control": "s-maxage=31536000,immutable" },
      "dest": "/static/$1"
    },
    { "src": "/(.*)", "dest": "/" }
  ],
  "env": {
    "REACT_APP_API_URL": "https://api.votredomaine.com"
  }
}
```

### Option 3 : AWS S3 + CloudFront

1. Build :
```bash
npm run build
```

2. Créer un bucket S3 :
```bash
aws s3 mb s3://bug-tracker-ui
```

3. Uploader les fichiers :
```bash
aws s3 sync build/ s3://bug-tracker-ui --delete
```

4. Configurer en site web statique :
```bash
aws s3 website s3://bug-tracker-ui \
  --index-document index.html \
  --error-document index.html
```

5. Créer une distribution CloudFront pour HTTPS et CDN

### Option 4 : Docker

**Dockerfile** :
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf** :
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Build et run** :
```bash
docker build -t bug-tracker-ui .
docker run -p 8080:80 bug-tracker-ui
```

**docker-compose.yml** :
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "8080:80"
    environment:
      - REACT_APP_API_URL=http://localhost:3000
    restart: unless-stopped
```

## Variables d'environnement

### En production

Les variables d'environnement sont injectées au moment du build.

**Important** : Changer `REACT_APP_API_URL` nécessite un nouveau build !

Pour différents environnements :

**Staging** :
```bash
REACT_APP_API_URL=https://api-staging.votredomaine.com npm run build
```

**Production** :
```bash
REACT_APP_API_URL=https://api.votredomaine.com npm run build
```

## Monitoring et logs

### 1. Google Analytics (optionnel)

Ajouter dans `public/index.html` :
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 2. Sentry (monitoring d'erreurs)

```bash
npm install @sentry/react
```

Dans `index.js` :
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
});
```

### 3. Logs nginx/apache

**Nginx** :
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

**Apache** :
```bash
tail -f /var/log/apache2/access.log
tail -f /var/log/apache2/error.log
```

## Checklist de déploiement

- [ ] Build de production créé (`npm run build`)
- [ ] Variables d'environnement configurées
- [ ] CORS activé sur le backend
- [ ] HTTPS configuré (production)
- [ ] Compression gzip activée
- [ ] Cache des assets configuré
- [ ] Routing SPA configuré (toutes les routes → index.html)
- [ ] Headers de sécurité ajoutés
- [ ] Monitoring configuré (optionnel)
- [ ] Tests de l'application effectués
- [ ] Documentation mise à jour

## Résolution de problèmes

### "Cannot GET /tasks" en production

**Cause** : Le serveur ne route pas toutes les requêtes vers `index.html`

**Solution** : Configurer le serveur pour SPA (voir configurations nginx/apache ci-dessus)

### CORS errors

**Cause** : Backend n'autorise pas l'origine du frontend

**Solution** : Configurer CORS dans le backend Spring Boot

### Variables d'environnement non prises en compte

**Cause** : Variables changées après le build

**Solution** : Reconstruire l'application avec les nouvelles variables

### Performance lente

**Solutions** :
- Activer la compression gzip
- Configurer le cache des assets
- Utiliser un CDN (CloudFront, Cloudflare)
- Optimiser les images
