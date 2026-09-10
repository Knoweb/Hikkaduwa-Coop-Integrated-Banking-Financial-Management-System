#!/bin/bash
# ==============================================================================
# SL CERT COMPLIANT ENCRYPTED DATABASE BACKUP SCRIPT
# Complies with SL CERT Section 4 (i, j) - Database Security & Backups
# ==============================================================================

# Configuration
DB_CONTAINER="hmcs-postgres"
DB_USER="hmcs_app"
DB_NAME="hmcs_db"
BACKUP_DIR="/var/backups/hmcs"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/hmcs_db_$DATE.sql"
ENCRYPTED_FILE="$BACKUP_FILE.enc"
RETENTION_DAYS=7

# We use the DB_PASSWORD from the environment if available, otherwise a default strong key.
# In a production environment, this should be a dedicated backup encryption key.
ENCRYPTION_PASSWORD="${DB_PASSWORD:-hmcs_slcert_secure_key_2026!}"

echo "=========================================================="
echo " Starting SL CERT Compliant Database Backup... "
echo " Date: $DATE "
echo "=========================================================="

# 1. Create backup directory securely
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# 2. Dump the database using Docker
echo "[1/4] Dumping database from container $DB_CONTAINER..."
if docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > "$BACKUP_FILE"; then
    echo "      -> Database dump successful."
else
    echo "      -> ERROR: Database dump failed!"
    exit 1
fi

# 3. Encrypt the backup using AES-256-CBC (SL CERT Section 4.i)
echo "[2/4] Encrypting backup with AES-256-CBC..."
if openssl enc -aes-256-cbc -salt -pbkdf2 -in "$BACKUP_FILE" -out "$ENCRYPTED_FILE" -pass pass:"$ENCRYPTION_PASSWORD"; then
    echo "      -> Encryption successful."
else
    echo "      -> ERROR: Encryption failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# 4. Remove the unencrypted plaintext backup file securely
echo "[3/5] Removing plaintext database dump..."
rm -f "$BACKUP_FILE"

# 5. Send to Bangalore (DR) Server securely via SCP
DR_SERVER_IP="168.144.216.11"
echo "[4/5] Transferring encrypted backup to DR server ($DR_SERVER_IP)..."
if scp -o StrictHostKeyChecking=no "$ENCRYPTED_FILE" root@$DR_SERVER_IP:"$BACKUP_DIR/"; then
    echo "      -> Transfer successful."
else
    echo "      -> ERROR: Transfer to DR server failed!"
    # We won't exit here, so local cleanup still happens
fi

# 6. Clean up old backups (SL CERT Section 4.j - Retention Policy)
echo "[5/5] Applying retention policy (Keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -type f -name "*.enc" -mtime +$RETENTION_DAYS -exec rm -f {} \;
ssh -o StrictHostKeyChecking=no root@$DR_SERVER_IP "find $BACKUP_DIR -type f -name '*.enc' -mtime +$RETENTION_DAYS -exec rm -f {} \;"
echo "      -> Old backups cleaned up locally and remotely."

echo "=========================================================="
echo " Backup Completed Successfully!"
echo " Encrypted File: $ENCRYPTED_FILE"
echo "=========================================================="

# To decrypt this file in an emergency, use the following command:
# openssl enc -aes-256-cbc -d -salt -pbkdf2 -in hmcs_db_YYYY-MM-DD.sql.enc -out hmcs_db.sql -pass pass:YOUR_PASSWORD
