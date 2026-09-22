# syntax=docker/dockerfile:1

# CanCham Connect — image de production, construite par Railway.
#
# Trois étapes : les dépendances, la compilation, puis l'image qui tourne.
# Celle-ci garde toutes les dépendances, outils compris : la migration de la
# base (`prisma migrate deploy`, au démarrage) et le script de création d'un
# administrateur (`tsx`) s'exécutent dans ce même conteneur.

FROM node:24-bookworm-slim AS base
WORKDIR /app
# Le fuseau de la chambre : « aujourd'hui » se calcule à l'heure
# d'Antananarivo, pas à celle du serveur — sinon, entre minuit et 3 h, la
# plateforme vivrait encore la veille.
ENV TZ=Indian/Antananarivo \
    NEXT_TELEMETRY_DISABLED=1
# OpenSSL pour le moteur de migration de Prisma.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# ---------- Dépendances ----------
FROM base AS deps
# Le schéma accompagne le paquet : l'installation génère le client Prisma.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# ---------- Compilation ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Exécution ----------
FROM base AS run
ENV NODE_ENV=production
# Conversion des ressources en pages consultables : LibreOffice pour les
# DOCX, poppler (`pdftoppm`) pour les PDF. Les polices métriquement
# compatibles avec Arial, Times, Calibri et Cambria gardent la mise en page
# des documents Word.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libreoffice-writer-nogui \
      poppler-utils \
      fonts-liberation2 \
      fonts-dejavu-core \
      fonts-crosextra-carlito \
      fonts-crosextra-caladea \
 && rm -rf /var/lib/apt/lists/*
COPY --from=build /app ./
# Railway fournit le port par la variable PORT, que `next start` lit.
EXPOSE 3000
# Les migrations passent au démarrage, avant le serveur : un code neuf ne
# tourne jamais sur une base qui n'a pas encore ses colonnes — chaque page
# échouerait. Sans effet quand tout est déjà appliqué ; en cas d'échec, le
# conteneur s'arrête, le contrôle de santé échoue, l'ancienne version reste.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && exec node_modules/.bin/next start"]
