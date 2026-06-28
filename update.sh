#!/bin/bash

# update.sh - Pull changes, Build, and Restart Service

set -e

# Ensure Go is in path (adjust if necessary)
export PATH=$PATH:/usr/local/go/bin

echo ">>> 1. Pulling latest changes..."
git pull

echo ">>> 2. Building Backend..."
sudo systemctl stop essensys-backend.service
cd backend
go mod tidy
go build -o server ./cmd/server
# Move binary to runtime location
sudo cp server /opt/essensys/backend/server
sudo chmod +x /opt/essensys/backend/server
sudo chown essensys:essensys /opt/essensys/backend/server
cd ..

echo ">>> 3. Building Frontend..."
cd site
npm install
npm run build
# Deploy to Nginx root
# Deploy to Nginx root
TARGET_DIR="/opt/essensys/frontend/dist"
sudo mkdir -p "$TARGET_DIR"
sudo rm -rf "$TARGET_DIR"/*
sudo cp -r dist/* "$TARGET_DIR"/
sudo chown -R essensys:essensys /opt/essensys/frontend
cd ..

echo ">>> 3b. Deploying Maintenance Site..."
MAINT_DIR="/home/ubuntu/essensys-maintenance"
sudo mkdir -p "$MAINT_DIR/assets"
sudo cp maintenance/index.html "$MAINT_DIR/"
sudo cp site/src/assets/fond-inprogress.png "$MAINT_DIR/assets/"
sudo chown -R ubuntu:ubuntu "$MAINT_DIR"

echo ">>> 4. Updating Service Config & Nginx..."
sudo cp backend/essensys-backend.service /etc/systemd/system/essensys-backend.service
# Environment variables handled by .env file in /opt/essensys/backend/
# Ensure service uses EnvironmentFile=/opt/essensys/backend/.env

# Reload & Restart
sudo systemctl daemon-reload
sudo systemctl restart essensys-backend.service
echo "✅ Backend restarted."

echo "🎉 Update Complete!"
