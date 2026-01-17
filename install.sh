#!/bin/bash

# install.sh - Initial Setup for Essensys Support Site on Ubuntu VPS
# Run with sudo if necessary, or script handles sudo calls.

set -e

echo ">>> Starting Installation..."

# 1. Update System & Install Dependencies
echo ">>> Installing Dependencies (Git, Nginx, Go, Node.js, PostgreSQL)..."
sudo apt-get update
sudo apt-get install -y git nginx curl postgresql postgresql-contrib

# Install Go (if not present)
if ! command -v go &> /dev/null; then
    echo ">>> Installing Go..."
    GO_VERSION="1.23.4"
    wget https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz
    sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz
    rm go${GO_VERSION}.linux-amd64.tar.gz
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

# 2. Setup System User
echo ">>> Creating essensys system user..."
if ! id -u essensys > /dev/null 2>&1; then
    sudo useradd -r -s /bin/false essensys
    echo "User 'essensys' created."
else
    echo "User 'essensys' already exists."
fi

# 3. Setup Directories
echo ">>> Setting up /opt/essensys..."
sudo mkdir -p /opt/essensys/backend
sudo mkdir -p /opt/essensys/frontend/dist
sudo mkdir -p /opt/essensys/maintenance
sudo chown -R essensys:essensys /opt/essensys

# 4. Setup PostgreSQL
echo ">>> Configuring PostgreSQL..."
if systemctl is-active --quiet postgresql; then
    # Create User
    if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='essensys'" | grep -q 1; then
        echo "Creating PostgreSQL user 'essensys'..."
        # Default password, user should change it in .env
        sudo -u postgres psql -c "CREATE USER essensys WITH PASSWORD 'essensys_secure_password';"
    else
        echo "PostgreSQL user 'essensys' already exists."
    fi

    # Create DB
    if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='essensys_db'" | grep -q 1; then
        echo "Creating database 'essensys_db'..."
        sudo -u postgres psql -c "CREATE DATABASE essensys_db OWNER essensys;"
    else
        echo "Database 'essensys_db' already exists."
    fi
else
    echo "WARNING: PostgreSQL is not active. Skipping DB setup."
fi

# 5. Setup Service
echo ">>> Configuring Systemd Service..."
sudo cp backend/essensys-backend.service /etc/systemd/system/essensys-backend.service
# Modify service to point to EnvironmentFile if not already there
# (Assuming the source file has been updated or we sed it here)
# We will create a template .env
if [ ! -f /opt/essensys/backend/.env ]; then
    echo "Creating default .env file..."
    cat <<EOF | sudo tee /opt/essensys/backend/.env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=essensys
DB_PASSWORD=essensys_secure_password
DB_NAME=essensys_db
JWT_SECRET=changeme_random_secret
ADMIN_TOKEN=admin-token-secret
FRONTEND_URL=https://mon.essensys.fr/
PORT=8080
EOF
fi

# Edit service to use EnvironmentFile if not present in source
# (Actually, better to update the source file in repo, but for now enforcing here)
sudo sed -i '/\[Service\]/a EnvironmentFile=/opt/essensys/backend/.env' /etc/systemd/system/essensys-backend.service

sudo systemctl daemon-reload
sudo systemctl enable essensys-backend.service

# 6. Setup Nginx
echo ">>> Configuring Nginx..."
sudo cp essensys.nginx /etc/nginx/sites-available/essensys
sudo ln -sf /etc/nginx/sites-available/essensys /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 7. Initial Build & Start
echo ">>> Running initial Update/Build..."
chmod +x update.sh
./update.sh

echo ">>> Installation Complete!"
