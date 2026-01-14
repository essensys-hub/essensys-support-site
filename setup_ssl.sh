#!/bin/bash
# setup_ssl.sh - Automate Let's Encrypt Setup on VPS
# Usage: ./setup_ssl.sh [--staging]

set -e

STAGING_FLAG=""
if [[ "$1" == "--staging" ]]; then
    echo "⚠️  RUNNING IN STAGING MODE (Fake Certificates)"
    STAGING_FLAG="--test-cert"
fi

echo "🔒 Starting SSL Setup..."

# 1. Install Certbot
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
else
    echo "✅ Certbot already installed."
fi

# 2. Create Webroot for Challenges
echo "📂 Creating challenge directory..."
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot

# 3. Request Certificates
# We use --webroot mode because our Nginx config already points /.well-known/acme-challenge/ to /var/www/certbot
echo "🔑 Requesting Certificates..."

# Domain 1: test.essensys.fr
if [ ! -d "/etc/letsencrypt/live/test.essensys.fr" ]; then
    sudo certbot certonly --webroot -w /var/www/certbot \
        -d test.essensys.fr \
        --non-interactive --agree-tos --email contact@essensys.fr $STAGING_FLAG
else
    echo "✅ Certificate for test.essensys.fr already exists."
fi

# Domain 2: mon.essensys.fr & www.essensys.fr
if [ ! -d "/etc/letsencrypt/live/mon.essensys.fr" ]; then
    sudo certbot certonly --webroot -w /var/www/certbot \
        -d mon.essensys.fr -d www.essensys.fr \
        --non-interactive --agree-tos --email contact@essensys.fr $STAGING_FLAG
else
    echo "✅ Certificate for mon.essensys.fr already exists."
fi

# 4. Enable SSL in Nginx Config
echo "⚙️  Enabling SSL in Nginx..."
CONFIG_FILE="/etc/nginx/sites-available/essensys"

# Use sed to uncomment the SSL lines we prepared in essensys.nginx
# We look for the specific commented patterns
sudo sed -i 's/# listen 443 ssl;/listen 443 ssl;/g' "$CONFIG_FILE"
sudo sed -i 's/# ssl_certificate /ssl_certificate /g' "$CONFIG_FILE"
sudo sed -i 's/# ssl_certificate_key /ssl_certificate_key /g' "$CONFIG_FILE"
# Only uncomment the first HSTS header to avoid duplicates if run multiple times?
# Actually sed 's///' replaces all occurrences on line. It's safe if we match the comment char.

echo "✅ SSL Configuration (Commented lines) activated."

# 5. Reload Nginx
echo "🔄 Reloading Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "🎉 SSL Setup Complete! HTTPS is now active."
echo "   - Test: https://test.essensys.fr"
echo "   - Mon:  https://mon.essensys.fr"
echo "   - API HTTP Exception Check: http://mon.essensys.fr/api/serverinfos"
