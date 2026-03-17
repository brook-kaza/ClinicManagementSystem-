import shutil
import os
from datetime import datetime

def backup_database():
    # Source path - DB is in the parent folder (backend/) relative to this script (backend/scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(script_dir)
    db_path = os.path.join(backend_dir, "dental_management.db")
    
    # Destination path
    backup_root = os.path.join(os.path.dirname(backend_dir), "backups")
    if not os.path.exists(backup_root):
        os.makedirs(backup_root)
        
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"dental_management_backup_{timestamp}.db"
    backup_path = os.path.join(backup_root, backup_filename)
    
    if os.path.exists(db_path):
        try:
            shutil.copy2(db_path, backup_path)
            print(f"SUCCESS: Database backed up to {backup_path}")
            
            # Retention: keep only last 30 backups
            backups = sorted([f for f in os.listdir(backup_root) if f.startswith("dental_management_backup_")])
            if len(backups) > 30:
                for old_backup in backups[:-30]:
                    os.remove(os.path.join(backup_root, old_backup))
                print(f"CLEANUP: Removed {len(backups) - 30} old backup(s).")
                
        except Exception as e:
            print(f"ERROR: Backup failed: {e}")
    else:
        print(f"ERROR: Database file not found at {db_path}")

if __name__ == "__main__":
    backup_database()
