#!/bin/bash

# install.sh - Initial Setup for Essensys Support Site on Ubuntu VPS
# Run with sudo if necessary, or script handles sudo calls.

set -e

echo ">>> Starting Installation..."

# 1. Update System & Install Dependencies
echo ">>> Installing Dependencies (Git, Nginx, Go, Node.js)..."
sudo apt-get update
sudo apt-get install -y git nginx curl postgresql postgresql-contrib

# Install Go (if not present)
if ! command -v go &> /dev/null; then
    echo ">>> Installing Go..."
    mod_file="backend/go.mod"
    # Extract Go version from go.mod (e.g. 1.23.0) 
    # Fallback to 1.23.0 if logic fails, but try to be dynamic or static "stable".
    GO_VERSION="1.23.4" 
    wget https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz
    sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz
    rm go${GO_VERSION}.linux-amd64.tar.gz
    # Add to path for this session
    export PATH=$PATH:/usr/local/go/bin
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
else
    echo ">>> Go is already installed."
fi

# Install Node.js (if not present)
if ! command -v node &> /dev/null; then
    echo ">>> Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo ">>> Node.js is already installed."
fi

# 2. Setup Nginx
echo ">>> Configuring Nginx..."
sudo cp essensys.nginx /etc/nginx/sites-available/essensys
# Enable site (force link)
sudo ln -sf /etc/nginx/sites-available/essensys /etc/nginx/sites-enabled/
# Remove default if exists? make optional
# sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 3. Setup Systemd Service
echo ">>> Configuring Systemd Service..."
# Adjust paths in service file if necessary, assuming /home/ubuntu/essensys-support-site
# We might need to copy/modify the service file dynamically if username differs, 
# but specifically for 'ubuntu' user on this VPS it should match.
sudo cp backend/essensys-passive.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable essensys-passive.service

# 3b. Setup PostgreSQL & Backups
echo ">>> Configuring PostgreSQL..."
if systemctl is-active --quiet postgresql; then
    # Create User
    if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='essensys'" | grep -q 1; then
        echo "Creating PostgreSQL user 'essensys'..."
        sudo -u postgres psql -c "CREATE USER essensys WITH PASSWORD 'essensys_db_pass';"
    else
        echo "PostgreSQL user 'essensys' already exists."
    fi

    # Create DB
    if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='essensys'" | grep -q 1; then
        echo "Creating database 'essensys'..."
        sudo -u postgres psql -c "CREATE DATABASE essensys OWNER essensys;"
    else
        echo "Database 'essensys' already exists."
    fi
else
    echo "WARNING: PostgreSQL is not active. Skipping DB setup."
fi

echo ">>> Configuring Daily Backups..."
BACKUP_DIR="/var/backups/essensys"
if [ ! -d "$BACKUP_DIR" ]; then
    sudo mkdir -p "$BACKUP_DIR"
    sudo chown postgres:postgres "$BACKUP_DIR"
    sudo chmod 700 "$BACKUP_DIR"
fi

# Create Backup Script
sudo tee /usr/local/bin/essensys-backup-db.sh > /dev/null <<EOF
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/essensys"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
FILENAME="\$BACKUP_DIR/essensys_db_\$TIMESTAMP.sql.gz"

# Dump and compress
pg_dump -U postgres essensys | gzip > "\$FILENAME"

# Cleanup > 200 days
find "\$BACKUP_DIR" -type f -name "essensys_db_*.sql.gz" -mtime +200 -delete
EOF
sudo chmod +x /usr/local/bin/essensys-backup-db.sh

# Create Service
sudo tee /etc/systemd/system/essensys-backup.service > /dev/null <<EOF
[Unit]
Description=Essensys Database Backup
After=network.target postgresql.service

[Service]
Type=oneshot
User=root
ExecStart=/usr/local/bin/essensys-backup-db.sh
EOF

# Create Timer
sudo tee /etc/systemd/system/essensys-backup.timer > /dev/null <<EOF
[Unit]
Description=Run Essensys Database Backup daily

[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable essensys-backup.timer
sudo systemctl start essensys-backup.timer
echo ">>> Backup timer configured."

# 4. Initial Build & Start
echo ">>> Running initial Update/Build..."
chmod +x update.sh
./update.sh

echo ">>> Installation Complete!"
