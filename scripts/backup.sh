#!/usr/bin/env bash
# Backup automatico do CRM ivillar (deploy nativo PM2 + Postgres local)
# Rodar via cron: 0 2 * * * /var/www/crm/scripts/backup.sh

set -euo pipefail

DATE=$(date '+%Y%m%d_%H%M%S')
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/ivillar}"
RETAIN_DAYS="${RETAIN_DAYS:-7}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup..."

# Backup do PostgreSQL (le DATABASE_URL do .env de producao)
DB_URL=$(grep -m1 '^DATABASE_URL=' "$PROJECT_DIR/server/.env" | cut -d'=' -f2-)
if [ -n "$DB_URL" ]; then
    pg_dump "$DB_URL" | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"
else
    echo "AVISO: DATABASE_URL nao encontrado em server/.env"
fi

# Backup dos uploads
if [ -d "$PROJECT_DIR/server/uploads" ]; then
    tar czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$PROJECT_DIR/server" uploads
fi

# Backup da sessao WhatsApp (Baileys)
if [ -d "$PROJECT_DIR/server/.wa_auth" ]; then
    tar czf "$BACKUP_DIR/wa_auth_$DATE.tar.gz" -C "$PROJECT_DIR/server" .wa_auth 2>/dev/null || true
fi

# Limpar backups antigos
find "$BACKUP_DIR" -name "*.gz" -mtime "+$RETAIN_DAYS" -delete

echo "[$(date)] Backup concluido. Arquivos em $BACKUP_DIR"
ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null | tail -5
