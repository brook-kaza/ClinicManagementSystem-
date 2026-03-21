#!/bin/bash
DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep db)
echo "Using DB container: $DB_CONTAINER"
docker exec $DB_CONTAINER psql -U clinic_admin clinic_db -c "DELETE FROM users WHERE username != 'admin';"
docker exec $DB_CONTAINER psql -U clinic_admin clinic_db -c "SELECT id, username, full_name, role FROM users;"
