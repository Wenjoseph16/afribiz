#!/bin/bash
# ============================================
# JWT Secret Rotation Script
# Usage: bash scripts/rotate-jwt-secrets.sh [--dry-run]
# Generates new JWT secrets and stores old ones
# ============================================

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 DRY RUN — no files will be modified"
fi

ENV_FILE=".env"
BACKUP_DIR="./.secrets-archive"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Generate 64-char hex secrets
NEW_JWT_SECRET=$(openssl rand -hex 64)
NEW_JWT_REFRESH_SECRET=$(openssl rand -hex 64)

echo "🔄 Rotating JWT secrets..."
echo "   Date: $TIMESTAMP"
echo "   Env file: $ENV_FILE"

if $DRY_RUN; then
  echo "   New JWT_SECRET: $NEW_JWT_SECRET"
  echo "   New JWT_REFRESH_SECRET: $NEW_JWT_REFRESH_SECRET"
  echo "   Would backup old secrets to: $BACKUP_DIR/secrets-$TIMESTAMP.env"
  echo "✅ Dry run complete"
  exit 0
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current secrets
if grep -q "JWT_SECRET" "$ENV_FILE" 2>/dev/null; then
  OLD_JWT_SECRET=$(grep "^JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2-)
  OLD_JWT_REFRESH=$(grep "^JWT_REFRESH_SECRET=" "$ENV_FILE" | cut -d'=' -f2-)
  cat > "$BACKUP_DIR/secrets-$TIMESTAMP.env" << EOF
# Backup of JWT secrets from $TIMESTAMP
# Restore with: cp $BACKUP_DIR/secrets-$TIMESTAMP.env .env
JWT_SECRET=$OLD_JWT_SECRET
JWT_REFRESH_SECRET=$OLD_JWT_REFRESH
EOF
  echo "📦 Old secrets backed up: $BACKUP_DIR/secrets-$TIMESTAMP.env"
fi

# Update .env file (macOS/BSD sed uses '' for backup, GNU sed doesn't)
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=$NEW_JWT_SECRET|" "$ENV_FILE" 2>/dev/null || true
  sed -i '' "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$NEW_JWT_REFRESH_SECRET|" "$ENV_FILE" 2>/dev/null || true
else
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$NEW_JWT_SECRET|" "$ENV_FILE" 2>/dev/null || true
  sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$NEW_JWT_REFRESH_SECRET|" "$ENV_FILE" 2>/dev/null || true
fi

echo "✅ JWT secrets rotated successfully"
echo "   Backup: $BACKUP_DIR/secrets-$TIMESTAMP.env"
echo ""
echo "⚠️  IMPORTANT: Restart the server for new secrets to take effect"
echo "   Users with existing sessions will need to log in again"
