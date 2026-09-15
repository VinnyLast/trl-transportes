#!/bin/bash
# Backup diario do banco de dados e das fotos de romaneio do TRL TRANSPORTES.
#
# Instalacao (rodar uma vez na VPS, como root):
#   1. Crie um arquivo ~/.pgpass com a linha:
#        127.0.0.1:5432:trl_transportes:trl_user:SUA_SENHA_AQUI
#      e proteja o arquivo: chmod 600 ~/.pgpass
#      (isso evita colocar a senha do banco dentro deste script)
#   2. Copie este arquivo para /root/scripts/backup-db.sh e de permissao:
#        chmod +x /root/scripts/backup-db.sh
#   3. Agende no cron (todo dia as 3h da manha):
#        crontab -e
#      adicione a linha:
#        0 3 * * * /root/scripts/backup-db.sh >> /root/backups/trl-transportes/backup.log 2>&1
#
# Os backups ficam em /root/backups/trl-transportes/, um par de arquivos por
# dia (banco + fotos), e backups com mais de 14 dias sao apagados
# automaticamente.
#
# Para restaurar o banco:
#   pg_restore -h 127.0.0.1 -U trl_user -d trl_transportes --clean --if-exists /caminho/do/arquivo.dump
#
# Para restaurar as fotos de romaneio:
#   tar -xzf /caminho/do/arquivo-uploads.tar.gz -C /var/www/trl-transportes/backend/

set -e

BACKUP_DIR="/root/backups/trl-transportes"
DATA=$(date +%Y-%m-%d_%H%M)
ARQUIVO_BANCO="$BACKUP_DIR/trl_transportes_$DATA.dump"
ARQUIVO_UPLOADS="$BACKUP_DIR/trl_transportes_uploads_$DATA.tar.gz"
PASTA_UPLOADS="/var/www/trl-transportes/backend/uploads"

mkdir -p "$BACKUP_DIR"

pg_dump -h 127.0.0.1 -U trl_user -d trl_transportes -F c -f "$ARQUIVO_BANCO"
echo "[$(date)] Backup do banco criado: $ARQUIVO_BANCO ($(du -h "$ARQUIVO_BANCO" | cut -f1))"

if [ -d "$PASTA_UPLOADS" ]; then
  tar -czf "$ARQUIVO_UPLOADS" -C "$(dirname "$PASTA_UPLOADS")" "$(basename "$PASTA_UPLOADS")"
  echo "[$(date)] Backup das fotos criado: $ARQUIVO_UPLOADS ($(du -h "$ARQUIVO_UPLOADS" | cut -f1))"
fi

# Remove backups com mais de 14 dias
find "$BACKUP_DIR" -name "trl_transportes_*.dump" -mtime +14 -delete
find "$BACKUP_DIR" -name "trl_transportes_uploads_*.tar.gz" -mtime +14 -delete
