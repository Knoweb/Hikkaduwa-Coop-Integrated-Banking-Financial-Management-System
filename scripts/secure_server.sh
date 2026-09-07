#!/bin/bash

# SL CERT SERVER HARDENING SCRIPT
# This script configures a fresh Ubuntu server to comply with SL CERT Perimeter & Network Defense (Section 3).
# Run this on both the Primary (Singapore) and DR (Bangalore) servers as root.

echo "Starting SL CERT Server Hardening..."

# Prevent interactive prompts during apt upgrades
export DEBIAN_FRONTEND=noninteractive

# 1. Update and Upgrade Packages
echo "Updating packages..."
apt-get update -y
apt-get upgrade -yq -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"

# 2. Configure UFW (Uncomplicated Firewall) - SL CERT Section 3.3.2 (DENY ALL Policy)
echo "Configuring UFW Firewall..."
apt-get install ufw -y
ufw default deny incoming
ufw default allow outgoing

# Allow only necessary ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP (Traefik will handle this)
ufw allow 443/tcp  # HTTPS (Traefik will handle this)

# IMPORTANT: Do NOT open Database Ports (5432) or Microservice Ports (8081, etc.) to the public!
# They will communicate via the internal Docker network (Screened Subnet).

ufw --force enable
echo "Firewall configured and enabled."

# 3. Install & Configure Fail2Ban (Intrusion Prevention) - SL CERT Section 3.4
echo "Installing Fail2Ban..."
apt-get install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban

# 4. Secure SSH (OS Hardening) - SL CERT Section 2.2.3
echo "Securing SSH..."
# Disable Password Authentication (Force SSH Keys)
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
echo "SSH secured. Password authentication disabled."

# 5. Install Docker (For Kamal)
echo "Installing Docker..."
apt-get install ca-certificates curl gnupg -y
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

echo "SL CERT Server Hardening Complete! Docker is installed and ready for Kamal."
