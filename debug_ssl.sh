#!/bin/bash
# debug_ssl.sh - Troubleshoot Let's Encrypt / Nginx issues

echo "🔍 DEBUG: Checking Nginx Configuration..."
sudo nginx -t

echo -e "\n🔍 DEBUG: Checking Enabled Sites..."
ls -l /etc/nginx/sites-enabled/

echo -e "\n🔍 DEBUG: Creating Test Challenge File..."
sudo mkdir -p /var/www/certbot/.well-known/acme-challenge/
echo "test-content-ok" | sudo tee /var/www/certbot/.well-known/acme-challenge/test-token > /dev/null
sudo chown -R www-data:www-data /var/www/certbot
sudo chmod -R 755 /var/www/certbot

echo -e "\n🔍 DEBUG: Attempting to fetch test file locally (via HTTP)..."
curl -I http://127.0.0.1/.well-known/acme-challenge/test-token -H "Host: test.essensys.fr"

echo -e "\n🔍 DEBUG: Attempting to fetch test file via public DNS (if curl available)..."
curl -I http://test.essensys.fr/.well-known/acme-challenge/test-token

echo -e "\n🔍 DEBUG: Nginx Access Log (Last 10 lines)..."
sudo tail -n 10 /var/log/nginx/essensys-access.log

echo -e "\n🔍 DEBUG: Nginx Error Log (Last 10 lines)..."
sudo tail -n 10 /var/log/nginx/essensys-error.log

echo -e "\n✅ Debug run complete."
