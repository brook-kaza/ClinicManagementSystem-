$ErrorActionPreference = "Stop"

Write-Host "Syncing files..."

scp -o StrictHostKeyChecking=no -i $HOME/.ssh/hetzner_clean backend/models.py root@46.225.86.61:/opt/clinic-management-system/backend/models.py
scp -o StrictHostKeyChecking=no -i $HOME/.ssh/hetzner_clean backend/schemas.py root@46.225.86.61:/opt/clinic-management-system/backend/schemas.py
scp -o StrictHostKeyChecking=no -i $HOME/.ssh/hetzner_clean backend/routers/billing.py root@46.225.86.61:/opt/clinic-management-system/backend/routers/billing.py
scp -o StrictHostKeyChecking=no -i $HOME/.ssh/hetzner_clean backend/routers/documents.py root@46.225.86.61:/opt/clinic-management-system/backend/routers/documents.py
scp -o StrictHostKeyChecking=no -i $HOME/.ssh/hetzner_clean frontend/src/pages/Registration.jsx root@46.225.86.61:/opt/clinic-management-system/frontend/src/pages/Registration.jsx

Write-Host "Deploying on server..."
$remoteCommand = @"
cd /opt/clinic-management-system
docker-compose stop clinic-backend frontend proxy
docker rm clinic-management-system-clinic-backend-1 clinic-management-system-frontend-1 clinic-management-system-proxy-1
docker volume rm clinic-management-system_frontend_dist -f
docker-compose build --no-cache clinic-backend frontend
docker-compose up -d clinic-backend frontend proxy
"@
ssh -o StrictHostKeyChecking=no -i $HOME/.ssh/hetzner_clean root@46.225.86.61 $remoteCommand

Write-Host "Done."
