#!/bin/bash

# manage_ssl.sh - Manage SSL Certificates (Let's Encrypt)
# Usage: 
#   ./manage_ssl.sh all               -> Renew all certificates
#   ./manage_ssl.sh domain example.com -> Request/Update for specific domain

set -e

show_usage() {
    echo "Usage: $0 [all | domain <domain_name>]"
    echo "  all                 : Renew all installed certificates"
    echo "  domain <domain_name>: Request or reinstall certificate for a specific domain"
    exit 1
}

if [ $# -lt 1 ]; then
    show_usage
fi

ACTION="$1"
shift

case "$ACTION" in
    all)
        echo "🔄 Renewing ALL certificates..."
        # 'renew' attempts to renew any certs that are near expiry
        sudo certbot renew
        
        echo "🔄 Reloading Nginx..."
        sudo systemctl reload nginx
        ;;
        
    domain)
        DOMAIN="$1"
        if [ -z "$DOMAIN" ]; then
            echo "❌ Error: Missing domain name."
            show_usage
        fi
        
        echo "🔒 Requesting/Updating certificate for: $DOMAIN"
        # --nginx plugin automatically edits config and reloads
        sudo certbot --nginx -d "$DOMAIN"
        ;;
        
    *)
        show_usage
        ;;
esac

echo "✅ Done."
