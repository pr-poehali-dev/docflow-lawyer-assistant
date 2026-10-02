#!/bin/sh
set -eu
FILE="$1"
openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_PASSPHRASE -in "$FILE" | tar -x -C /tmp
docker compose exec -T db pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < /tmp/db.dump
docker compose cp /tmp/files.tar.gz api:/tmp/files.tar.gz
docker compose exec -T -u root api tar -xzf /tmp/files.tar.gz -C /data
