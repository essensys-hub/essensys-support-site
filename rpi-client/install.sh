#!/bin/bash

# Essensys PHP Collector Installer
# Installs dependencies and sets up the collection script on a Raspberry Pi (Debian/Ubuntu)

INSTALL_DIR="/opt/essensys-collect"
SCRIPT_NAME="collect.php"
CRON_JOB="0 * * * * php $INSTALL_DIR/$SCRIPT_NAME >> $INSTALL_DIR/collect.log 2>&1"

echo "=== Essensys PHP Collector Installer ==="

# 1. Update and Install Dependencies
echo "[1/4] Installing dependencies..."
if command -v apt-get &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y php-cli php-curl
else
    echo "Warning: 'apt-get' not found. Please ensure php-cli and php-curl are installed manually."
fi

# 2. Create Installation Directory
echo "[2/4] Setting up directory $INSTALL_DIR..."
if [ ! -d "$INSTALL_DIR" ]; then
    sudo mkdir -p "$INSTALL_DIR"
    echo "Directory created."
else
    echo "Directory already exists."
fi

# 3. Copy Script
echo "[3/4] Copying script..."
# Assuming this install.sh is in the same directory as collect.php during install
if [ -f "./$SCRIPT_NAME" ]; then
    sudo cp "./$SCRIPT_NAME" "$INSTALL_DIR/$SCRIPT_NAME"
    sudo chmod +x "$INSTALL_DIR/$SCRIPT_NAME"
    echo "Script copied to $INSTALL_DIR/$SCRIPT_NAME"
else
    echo "Error: $SCRIPT_NAME not found in current directory. Please run this script from the folder containing $SCRIPT_NAME."
    exit 1
fi

# 4. Setup Cron Job
echo "[4/4] Setting up Cron job (Hourly)..."
# Check if job already exists to avoid duplicates
(crontab -l 2>/dev/null | grep -F "$INSTALL_DIR/$SCRIPT_NAME") && echo "Cron job already exists." || (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo ""
echo "=== Installation Complete ==="
echo "You can test the script manually by running:"
echo "php $INSTALL_DIR/$SCRIPT_NAME"
