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

echo ">>> 4. Restarting Backend Service..."
sudo systemctl restart essensys-passive.service

echo ">>> Update Complete! (Backend restarted & Frontend deployed)"
