#!/bin/bash
# Clinic Management System - Automated Backup Script
# Runs nightly via cron to backup database + uploads to Google Drive

DATE=$(date +%F)
BACKUP_DIR="/root/clinic_backups"
DB_CONTAINER="clinic-management-system-db-1"
DB_USER="clinic_admin"
UPLOADS_DIR="/opt/clinic-management-system/backend/uploads"
LOG_FILE="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"
echo "[$DATE $(date +%T)] Starting backup..." >> "$LOG_FILE"

# 1. Dump Database
docker exec -t "$DB_CONTAINER" pg_dumpall -c -U "$DB_USER" > "$BACKUP_DIR/clinic_db_$DATE.sql" 2>> "$LOG_FILE"

# 2. Compress Uploads
if [ -d "$UPLOADS_DIR" ]; then
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$(dirname $UPLOADS_DIR)" "$(basename $UPLOADS_DIR)" 2>> "$LOG_FILE"
fi

# 3. Upload to Google Drive (use absolute path to rclone for cron)
/usr/bin/rclone copy "$BACKUP_DIR/clinic_db_$DATE.sql" gdrive:ClinicBackups/ 2>> "$LOG_FILE"
/usr/bin/rclone copy "$BACKUP_DIR/uploads_$DATE.tar.gz" gdrive:ClinicBackups/ 2>> "$LOG_FILE"

# 4. Cleanup old local files
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
echo "[$DATE $(date +%T)] Backup complete!" >> "$LOG_FILE"
