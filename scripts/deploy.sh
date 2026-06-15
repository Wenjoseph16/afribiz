#!/bin/bash
set -euo pipefail

# ============================================
# AfriBiz Deploy Script
# Usage: bash scripts/deploy.sh [env]
#   env: production | staging (default: production)
# ============================================

ENV=${1:-production}
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.docker"

echo "? Déploiement AfriBiz en environnement: $ENV"

if [ ! -f "$ENV_FILE" ]; then
  echo "? Fichier $ENV_FILE introuvable. Copie depuis .env.example..."
  cp .env.example "$ENV_FILE"
  echo "? Modifiez $ENV_FILE avec vos credentials avant de déployer."
  exit 1
fi

echo "? Pull des dernières images..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

echo "? Redémarrage des services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

echo "? Vérification des health checks..."
sleep 5
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null || echo "000")

if [ "$HEALTH" = "200" ]; then
  echo "? Backend OK (HTTP $HEALTH)"
else
  echo "? Attention: Backend a répondu HTTP $HEALTH"
fi

echo "? Nettoyage des anciennes images..."
docker image prune -f

echo "? Déploiement terminé."
