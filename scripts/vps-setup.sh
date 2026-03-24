#!/bin/bash
# Core iados CRM - VPS Setup Script
# Run as root on a fresh Ubuntu 22.04 VPS
# Usage: curl -sSL https://raw.githubusercontent.com/YOUR_ORG/core_iados/main/scripts/vps-setup.sh | bash

set -e

echo "🚀 Core iados CRM - VPS Setup"
echo "================================"

# Update system
apt-get update && apt-get upgrade -y

# Install Docker
echo "📦 Installing Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin

# Install git, nginx-utils, certbot
apt-get install -y git curl wget unzip

# Create app directory
mkdir -p /opt/core_iados
cd /opt/core_iados

# Clone repo (replace with your GitHub URL)
# git clone https://github.com/YOUR_ORG/core_iados.git .

echo ""
echo "✅ Docker and dependencies installed."
echo ""
echo "Next steps:"
echo "  1. Clone your repo:  git clone https://github.com/YOUR_ORG/core_iados.git /opt/core_iados"
echo "  2. Copy env file:    cp .env.production.example .env.production"
echo "  3. Edit secrets:     nano .env.production"
echo "  4. Deploy:           docker compose up -d"
echo ""
echo "GitHub Actions secrets to set in your repo:"
echo "  VPS_HOST      = your VPS IP address"
echo "  VPS_USER      = root (or deploy user)"
echo "  VPS_SSH_KEY   = private SSH key content"
echo "  VPS_PORT      = 22 (default)"
