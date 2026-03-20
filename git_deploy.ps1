$ErrorActionPreference = "Stop"

Write-Host "Committing and pushing to GitHub..."
git add backend/models.py backend/schemas.py backend/routers/billing.py backend/routers/documents.py frontend/src/pages/Registration.jsx frontend/src/pages/ClinicalHub.jsx
git commit -m "Add TIN Number and separate Orthodontic Consent form"
git push

Write-Host "Triggering deployment on server in background via nohup..."
$remoteCommand = "cd /opt/clinic-management-system && git pull && docker-compose build --no-cache clinic-backend frontend && docker-compose up -d clinic-backend frontend"
ssh -o StrictHostKeyChecking=no -i $HOME/.ssh/hetzner_clean root@46.225.86.61 "nohup bash -c '$remoteCommand' > /root/deploy.log 2>&1 &"

Write-Host "Done. The app is compiling on the server in the background and will restart when ready."
