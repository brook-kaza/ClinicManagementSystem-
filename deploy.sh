#!/bin/bash
set -e

echo "Starting deployment for Curson Clinic Management System..."

# Update and install dependencies
sudo apt update && sudo apt install -y python3-venv python3-pip nginx postgresql postgresql-contrib

# 1. Setup Backend
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn psycopg2-binary # Required for Prod 

# Stop database service temporarily if running to run migrations
sudo systemctl stop fastapi || true

# Run Alembic migrations
echo "Running database migrations..."
alembic upgrade head

# Restart API Service
echo "Configuring and restarting FastAPI service..."
sudo cp ../fastapi.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable fastapi
sudo systemctl start fastapi

# 2. Setup Frontend
cd ../frontend
npm install
npm run build

echo "Deployment finished. Make sure to configure NGINX using the provided nginx.conf!"
