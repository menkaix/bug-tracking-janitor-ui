# Stage 1: Build de l'application React
FROM node:18-alpine AS build

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --silent

# Copier le code source
COPY . .
#COPY .env .env

# Build de l'application pour la production
RUN npm run build

# Stage 2: Serveur Node.js pour servir l'application avec Express
FROM node:18-alpine

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer seulement les dépendances de production
RUN npm ci --omit=dev

# Copier le serveur Express
COPY server.js .

# Copier le build React depuis l'étape de build
COPY --from=build /app/build ./build

# Exposer le port 3000
EXPOSE 3000

# Démarrer le serveur
CMD ["node", "server.js"]
