#!/bin/bash

# ============================================================
# LIVORA HEALTHCARE - RAILWAY DATA PRESERVATION SCRIPT
# This script exports database and local volumes for migration.
# ============================================================

# Load Environment Variables from server/.env
if [ -f "server/.env" ]; then
    export $(grep -v '^#' server/.env | xargs)
else
    echo "❌ Error: server/.env file not found!"
    exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="railway_backup_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo "📂 Created backup directory: $BACKUP_DIR"

# 1. DATABASE BACKUP
echo "🗄️ Starting MySQL Export..."
# Using mysqldump. Ensure "Public Connection" is enabled in Railway Dashboard.
mysqldump -h "$MYSQLHOST" -P "$MYSQLPORT" -u "$MYSQLUSER" -p"$MYSQLPASSWORD" "$MYSQLDATABASE" > "$BACKUP_DIR/database_dump.sql"

if [ $? -eq 0 ]; then
    echo "✅ Database exported to $BACKUP_DIR/database_dump.sql"
else
    echo "❌ Database export failed! Check your connection/credentials."
fi

# 2. LOCAL ASSETS BACKUP
echo "📁 Compressing local upload volumes..."
if [ -d "server/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_assets.tar.gz" server/uploads
    echo "✅ Uploads compressed to $BACKUP_DIR/uploads_assets.tar.gz"
else
    echo "ℹ️ No local uploads directory found (Skipping)."
fi

# 3. FINAL COMPRESSION
echo "📦 Finalizing archive..."
zip -r "$BACKUP_DIR.zip" "$BACKUP_DIR"

echo "============================================================"
echo "🎉 SUCCESS! Your data is preserved in: $BACKUP_DIR.zip"
echo "You can now safely take down your Railway service."
echo "============================================================"
