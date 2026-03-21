#!/bin/bash
set -e
echo "Updating apt and installing dependencies..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --batch --yes --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-compose git

echo "Cloning repository..."
mkdir -p /opt/clinic-management-system
cd /opt
if [ ! -d "clinic-management-system/.git" ]; then
    rm -rf clinic-management-system
    git clone https://github.com/brook-kaza/ClinicManagementSystem-.git clinic-management-system
else
    cd clinic-management-system
    git fetch --all
    git reset --hard origin/main
fi

echo "Repository loaded. Ready for Docker."
