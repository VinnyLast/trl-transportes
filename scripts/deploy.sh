#!/bin/bash
# Deploy completo do TRL TRANSPORTES na VPS, sempre na mesma ordem.
# Uso:  bash /var/www/trl-transportes/scripts/deploy.sh
# Para no primeiro erro (set -e), sem reiniciar nada pela metade.

set -e
RAIZ="/var/www/trl-transportes"

echo "==> Atualizando codigo"
cd "$RAIZ"
# package-lock.json e regerado pelo npm na VPS; descarta so ele para o pull nao travar
git checkout -- backend/package-lock.json frontend/package-lock.json 2>/dev/null || true
git pull

echo "==> Backend: dependencias, banco e cliente Prisma"
cd "$RAIZ/backend"
npm install
npx prisma migrate deploy
npx prisma generate

echo "==> Frontend: build"
cd "$RAIZ/frontend"
npm install
npm run build

echo "==> Reiniciando backend"
pm2 restart trl-backend

echo "==> Atualizando script de backup"
cp "$RAIZ/scripts/backup-db.sh" /root/scripts/backup-db.sh
chmod +x /root/scripts/backup-db.sh

echo ""
echo "Deploy concluido. No navegador, use Ctrl+Shift+R para carregar a versao nova."
