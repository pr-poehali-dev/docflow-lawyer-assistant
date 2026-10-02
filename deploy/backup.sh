#!/bin/sh
set -eu
apk add --no-cache openssl tar >/dev/null
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
HOUR="${BACKUP_HOUR:-03}"
mkdir -p /backups
while true; do
  NOW_H=$(date +%H)
  if [ "$NOW_H" = "$HOUR" ]; then
    STAMP=$(date +%Y-%m-%d_%H%M)
    TMP=$(mktemp -d)
    pg_dump -h db -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f "$TMP/db.dump"
    tar -C /data -czf "$TMP/files.tar.gz" files 2>/dev/null || true
    tar -C "$TMP" -cf - db.dump files.tar.gz | openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_PASSPHRASE -out "/backups/legis_$STAMP.tar.enc"
    rm -rf "$TMP"
    find /backups -name 'legis_*.tar.enc' -mtime +"$KEEP_DAYS" -exec rm -f {} \;
    echo "Копия создана: legis_$STAMP.tar.enc"
    sleep 3700
  fi
  sleep 600
done
