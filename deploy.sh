#!/bin/bash
set -e

export NVM_DIR="/www/server/nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd "$(dirname "$(readlink -f "$0")")"

echo "=== Deploying MC Insurance ==="

echo "1. Removing .next..."
rm -rf .next

echo "2. Building..."
pnpm build

echo "3. Restarting PM2..."
pm2 restart mcins

echo "4. Clearing Nginx cache..."
cd /www
bash clear-nginx-cache.sh

echo "=== Deploy complete ==="
