#!/bin/bash
cd /opt/clinic-management-system
docker-compose stop frontend proxy
docker rm clinic-management-system-frontend-1 clinic-management-system-proxy-1
docker volume rm clinic-management-system_frontend_dist -f
docker-compose build --no-cache frontend
docker-compose up -d frontend proxy
echo "Deploy completed!"
