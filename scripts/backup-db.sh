#!/bin/bash
# Backup diario do banco de dados do TRL TRANSPORTES.
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
# Os backups ficam em /root/backups/trl-transportes/, um arquivo por dia,
# e backups com mais de 14 dias sao apagados automaticamente.
#
# Para restaurar um backup:
#   pg_restore -h 127.0.0.1 -U trl_user -d trl_transportes --clean --if-exists /caminho/do/arquivo.dump

set -e

BACKUP_DIR="/root/backups/trl-transportes"
DATA=$(date +%Y-%m-%d_%H%M)
ARQUIVO="$BACKUP_DIR/trl_transportes_$DATA.dump"

mkdir -p "$BACKUP_DIR"

pg_dump -h 127.0.0.1 -U trl_user -d trl_transportes -F c -f "$ARQUIVO"

echo "[$(date)] Backup criado: $ARQUIVO ($(du -h "$ARQUIVO" | cut -f1))"

# Remove backups com mais de 14 dias
find "$BACKUP_DIR" -name "trl_transportes_*.dump" -mtime +14 -delete
