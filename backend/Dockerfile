FROM node:20-alpine AS builder

WORKDIR /app

# Nettoyer le répertoire dist s'il existe
RUN rm -rf dist

COPY package*.json ./
RUN npm ci

COPY . .

# Build et vérification
RUN npm run build

# Vérifier que main.js existe
RUN if [ ! -f "dist/main.js" ]; then \
      echo "❌ ERREUR: dist/main.js n'existe pas après le build!"; \
      echo "Contenu de dist:"; \
      ls -la dist/ || echo "dist/ n'existe pas"; \
      exit 1; \
    else \
      echo "✅ dist/main.js existe"; \
    fi

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]
