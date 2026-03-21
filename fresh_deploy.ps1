$ErrorActionPreference = "Stop"
$NEW_IP = "128.140.88.200"

Write-Host "Transferring installer script..."
scp -o StrictHostKeyChecking=accept-new -i $HOME/.ssh/clinic_vps_deploy vps_installer.sh root@${NEW_IP}:/root/vps_installer.sh

Write-Host "Running installer script (this takes a few seconds)..."
ssh -o StrictHostKeyChecking=accept-new -i $HOME/.ssh/clinic_vps_deploy root@$NEW_IP "bash /root/vps_installer.sh"

Write-Host "Transferring .env file to /opt/clinic-management-system/.env ..."
scp -o StrictHostKeyChecking=accept-new -i $HOME/.ssh/clinic_vps_deploy .env root@${NEW_IP}:/opt/clinic-management-system/.env

Write-Host "Triggering Docker Compose build and Alembic migration in the background..."
$dockerScript = @"
cd /opt/clinic-management-system
docker-compose --profile all build --no-cache
docker-compose --profile all up -d
docker exec $(docker ps -aqf name=backend) alembic upgrade head
"@
ssh -o StrictHostKeyChecking=accept-new -i $HOME/.ssh/clinic_vps_deploy root@$NEW_IP "nohup bash -c '$dockerScript' > /root/boot.log 2>&1 &"

Write-Host "Deployment triggered gracefully in the background!"
