#!/bin/bash
# =============================================
# PARKU API - BACKUP DE BASE DE DATOS
# =============================================
# Genera un volcado completo (esquema + datos) con pg_dump y lo guarda en
# backups/ con marca de tiempo, para no sobrescribir respaldos anteriores.
#
# Uso:
#   npm run backup
#   RETENCION_DIAS=30 npm run backup     # cambia la retención (default 14 días)
#
# Requiere pg_dump instalado y DATABASE_URL (o DB_HOST/DB_PORT/DB_USER/
# DB_PASSWORD/DB_NAME) en el entorno o en .env.
#
# Restauración:
#   psql "$DATABASE_URL" -f backups/parku_<fecha>.sql

set -euo pipefail

DIR_RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIR_BACKUPS="$DIR_RAIZ/backups"
RETENCION_DIAS="${RETENCION_DIAS:-14}"

mkdir -p "$DIR_BACKUPS"

# Carga .env si existe (sin pisar variables ya exportadas en el entorno).
if [ -f "$DIR_RAIZ/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$DIR_RAIZ/.env"
  set +a
fi

if [ -z "${DATABASE_URL:-}" ] && [ -z "${DB_HOST:-}" ]; then
  echo "Error: define DATABASE_URL o DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME." >&2
  exit 1
fi

MARCA="$(date +%Y-%m-%d_%H-%M-%S)"
ARCHIVO="$DIR_BACKUPS/parku_${MARCA}.sql"

echo "Generando respaldo en $ARCHIVO ..."

if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "$DATABASE_URL" --no-owner --no-privileges -f "$ARCHIVO"
else
  PGPASSWORD="${DB_PASSWORD:-}" pg_dump \
    --host="${DB_HOST}" \
    --port="${DB_PORT:-5432}" \
    --username="${DB_USER:-postgres}" \
    --dbname="${DB_NAME:-parku}" \
    --no-owner --no-privileges \
    -f "$ARCHIVO"
fi

# El archivo puede contener datos personales (documento, placas, horarios de
# acceso): acceso restringido al propio usuario, en línea con la Ley 1581 de
# 2012 de protección de datos personales.
chmod 600 "$ARCHIVO"

echo "Respaldo completado: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"

# Retención: borra respaldos más viejos que RETENCION_DIAS.
echo "Aplicando retención de ${RETENCION_DIAS} días..."
find "$DIR_BACKUPS" -name 'parku_*.sql' -type f -mtime "+${RETENCION_DIAS}" -print -delete

echo "Backups actuales:"
ls -lh "$DIR_BACKUPS"/parku_*.sql 2>/dev/null || echo "  (ninguno)"
