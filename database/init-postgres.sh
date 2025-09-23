#!/bin/bash

set -e

for f in /docker-entrypoint-initdb.d/tables/*.sql; do
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$f"
done

if [ -d "/docker-entrypoint-initdb.d/relations" ]; then
    for f in /docker-entrypoint-initdb.d/relations/*.sql; do
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$f"
done
fi

