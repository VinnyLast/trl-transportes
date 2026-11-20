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
#   3. Agende no cron (todo dia as 3h da manha), sem apagar outras linhas:
#        (crontab -l; echo "0 3 * * * /root/scripts/backup-db.sh >> /root/backups/trl-transportes/backup.log 2>&1") | crontab -
#
# Banco: um arquivo .dump por dia em /root/backups/trl-transportes/, os com
# mais de 14 dias sao apagados (o banco e pequeno).
#
# Fotos: uma copia espelho unica em /root/backups/trl-transportes/fotos/.
# Cada execucao so copia as fotos novas (nao duplica centenas de MB por dia).
# Fotos com mais de 60 dias sao apagadas daqui, no mesmo prazo do sistema.
#
# Para restaurar o banco:
#   pg_restore -h 127.0.0.1 -U trl_user -d trl_transportes --clean --if-exists /caminho/do/arquivo.dump
#
# Para restaurar as fotos de romaneio:
#   cp -a --update=none /root/backups/trl-transportes/fotos/. /var/www/trl-transportes/backend/uploads/

set -e

BACKUP_DIR="/root/backups/trl-transportes"
DATA=$(date +%Y-%m-%d_%H%M)
ARQUIVO_BANCO="$BACKUP_DIR/trl_transportes_$DATA.dump"
PASTA_UPLOADS="/var/www/trl-transportes/backend/uploads"
ESPELHO_FOTOS="$BACKUP_DIR/fotos"

mkdir -p "$BACKUP_DIR" "$ESPELHO_FOTOS"

pg_dump -h 127.0.0.1 -U trl_user -d trl_transportes -F c -f "$ARQUIVO_BANCO"
echo "[$(date)] Backup do banco criado: $ARQUIVO_BANCO ($(du -h "$ARQUIVO_BANCO" | cut -f1))"

if [ -d "$PASTA_UPLOADS" ]; then
  # --update=none: nao sobrescreve o que ja existe; sem opcao de apagar, so acrescenta
  cp -a --update=none "$PASTA_UPLOADS/." "$ESPELHO_FOTOS/"
  echo "[$(date)] Fotos sincronizadas em $ESPELHO_FOTOS ($(du -sh "$ESPELHO_FOTOS" | cut -f1))"
fi

# Fotos de romaneio ficam 60 dias (mesmo prazo do sistema) tambem no backup
find "$ESPELHO_FOTOS" -type f -mtime +60 -delete

# Remove backups de banco com mais de 14 dias
find "$BACKUP_DIR" -maxdepth 1 -name "trl_transportes_*.dump" -mtime +14 -delete

# Remove os pacotes antigos de fotos (formato anterior, substituido pelo espelho)
find "$BACKUP_DIR" -maxdepth 1 -name "trl_transportes_uploads_*.tar.gz" -mtime +2 -delete
