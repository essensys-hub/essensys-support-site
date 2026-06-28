#!/bin/bash

# uninstall.sh - Remove Service and Configs

echo ">>> Uninstalling Essensys Site..."

# 1. Stop and Disable Service
echo ">>> Stoping Service..."
sudo systemctl stop essensys-backend.service || true
sudo systemctl disable essensys-backend.service || true
sudo rm -f /etc/systemd/system/essensys-backend.service
sudo systemctl daemon-reload

# Also stop old service if exists
sudo systemctl stop essensys-passive.service || true
sudo systemctl disable essensys-passive.service || true
sudo rm -f /etc/systemd/system/essensys-passive.service

# 2. Remove Files
echo ">>> Removing App Files..."
sudo rm -rf /opt/essensys

# 3. Remove Nginx Config
echo ">>> Removing Nginx Config..."
sudo rm -f /etc/nginx/sites-enabled/essensys
sudo rm -f /etc/nginx/sites-available/essensys
sudo systemctl reload nginx

echo ">>> Uninstallation Complete."
echo "Note: PostgreSQL database 'essensys_db' and user 'essensys' were NOT removed to preserve data."
