#!/bin/bash

# update.sh - Pull changes, Build, and Restart Service

set -e

# Ensure Go is in path
export PATH=$PATH:/usr/local/go/bin

echo ">>> 1. Pulling latest changes..."
git pull

echo ">>> 2. Building Backend..."
cd backend
go build -o essensys-passive-backend ./cmd/server
sudo mv essensys-passive-backend /usr/local/bin/
cd ..

echo ">>> 3. Building Frontend..."
cd site
npm install
npm run build
# Deploy to Nginx root (assuming /home/ubuntu/essensys-frontend as per existing nginx config)
TARGET_DIR="/home/ubuntu/essensys-frontend"
[ ! -d "$TARGET_DIR" ] && mkdir -p "$TARGET_DIR"
rm -rf "$TARGET_DIR"/*
cp -r dist/* "$TARGET_DIR"/
cd ..

echo ">>> 3b. Deploying Maintenance Site..."
MAINT_DIR="/home/ubuntu/essensys-maintenance"
[ ! -d "$MAINT_DIR/assets" ] && mkdir -p "$MAINT_DIR/assets"
cp maintenance/index.html "$MAINT_DIR/"
cp site/src/assets/fond-inprogress.png "$MAINT_DIR/assets/"

echo ">>> 4. Updating Service Config & Nginx..."
sudo cp backend/essensys-passive.service /etc/systemd/system/
# Skip overwriting Nginx config to preserve SSL settings
# sudo cp essensys.nginx /etc/nginx/sites-available/essensys
# [ ! -L /etc/nginx/sites-enabled/essensys ] && sudo ln -s /etc/nginx/sites-available/essensys /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo cp backend/essensys-passive.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart essensys-passive.service
echo "✅ Backend restarted."

echo "🎉 Update Complete!"
