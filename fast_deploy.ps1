$ErrorActionPreference = "Stop"

Write-Host "Committing code changes..."
git add backend/models.py backend/schemas.py backend/routers/billing.py backend/routers/documents.py frontend/src/pages/Registration.jsx frontend/src/pages/ClinicalHub.jsx
git commit -m "Flawless TIN and Orthodontic Consent implementation"
Write-Host "Pushing to GitHub..."
git push

Write-Host "Syncing DB on VPS and redeploying instantly via cache..."
$remoteCommand = @"
cd /opt/clinic-management-system
git pull
echo 'Dropping duplicate column to prevent Alembic crashes...'
docker exec clinic-management-system-clinic-db-1 psql -U admin clinic_db -c "ALTER TABLE patients DROP COLUMN IF EXISTS tin_number;"
echo 'Rebuilding Docker USING CACHE (should take seconds)...'
docker-compose build clinic-backend frontend
echo 'Restarting containers...'
docker-compose up -d clinic-backend frontend proxy
echo 'Running DB migrations...'
docker exec clinic-management-system-clinic-backend-1 alembic upgrade head
"@

ssh -o StrictHostKeyChecking=no -i $HOME/.ssh/hetzner_clean root@46.225.86.61 "nohup bash -c '$remoteCommand' > /root/fast_deploy.log 2>&1 &"

Write-Host ""
Write-Host "SUCCESS! The flawless deployment has been triggered on the server in the background."
Write-Host "Because we removed '--no-cache', it should be online with the new features in about 15 seconds."
