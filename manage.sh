#!/bin/bash

# manage.sh - Helper script to Start/Stop/Restart/Status Essensys services
# Usage: ./manage.sh [start|stop|restart|status]

ACTION=$1

if [ -z "$ACTION" ]; then
    echo "Usage: $0 [start|stop|restart|status]"
    exit 1
fi

echo ">>> Performing '$ACTION' on Essensys Services..."

case "$ACTION" in
    start)
        echo "Starting Nginx..."
        sudo systemctl start nginx
        echo "Starting Essensys Backend..."
        sudo systemctl start essensys-backend
        ;;
    stop)
        echo "Stopping Essensys Backend..."
        sudo systemctl stop essensys-backend
        echo "Stopping Nginx..."
        sudo systemctl stop nginx
        ;;
    restart)
        echo "Restarting Services..."
        sudo systemctl restart nginx
        sudo systemctl restart essensys-backend
        ;;
    status)
        echo "--- Nginx Status ---"
        systemctl is-active nginx
        echo "--- Backend Status ---"
        systemctl is-active essensys-backend
        echo "----------------------"
        echo "Detailed Status:"
        sudo systemctl status essensys-backend nginx --no-pager
        ;;
    logs)
        echo "--- Backend Logs (Last 50 lines) ---"
        sudo journalctl -u essensys-backend -n 50 --no-pager
        ;;
    *)
        echo "Invalid argument. Usage: $0 [start|stop|restart|status|logs]"
        exit 1
        ;;
esac

echo ">>> Done."
