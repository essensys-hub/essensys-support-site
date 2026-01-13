#!/bin/bash
set -e

echo "[INSTALL] Stopping existing service..."
sudo systemctl stop essensys-passive.service || true

if [ -f "essensys-passive-backend.gz" ]; then
    echo "[INSTALL] Unzipping binary..."
    gunzip -f essensys-passive-backend.gz
fi

if [ -f "essensys-passive-backend" ]; then
    echo "[INSTALL] Moving binary to /usr/local/bin..."
    sudo mv essensys-passive-backend /usr/local/bin/
    sudo chmod +x /usr/local/bin/essensys-passive-backend
else
    echo "[ERROR] Binary 'essensys-passive-backend' not found!"
    exit 1
fi

echo "[INSTALL] Installing systemd service..."
sudo mv essensys-passive.service /etc/systemd/system/
sudo systemctl daemon-reload

echo "[INSTALL] Starting service..."
sudo systemctl enable essensys-passive.service
sudo systemctl start essensys-passive.service

echo "[INSTALL] Setup Complete. Checking status..."
sudo systemctl status essensys-passive.service --no-pager
