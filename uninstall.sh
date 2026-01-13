#!/bin/bash

# uninstall.sh - Remove Service and Configs

echo ">>> Uninstalling Essensys Site..."

# 1. Stop and Disable Service
echo ">>> Stoping Service..."
sudo systemctl stop essensys-passive.service || true
sudo systemctl disable essensys-passive.service || true
sudo rm -f /etc/systemd/system/essensys-passive.service
sudo systemctl daemon-reload

# 2. Remove Binary
echo ">>> Removing Backend Binary..."
sudo rm -f /usr/local/bin/essensys-passive-backend

# 3. Remove Nginx Config
echo ">>> Removing Nginx Config..."
sudo rm -f /etc/nginx/sites-enabled/essensys
sudo rm -f /etc/nginx/sites-available/essensys
sudo systemctl reload nginx

# 4. (Optional) Cleaning Frontend Files
echo ">>> Removing Frontend Files..."
rm -rf /home/ubuntu/essensys-frontend

echo ">>> Uninstallation Complete."
echo "Note: Dependencies (Go, Node, Nginx) and this repository folder were NOT removed."
