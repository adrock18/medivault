#!/bin/sh
# Starts MediVault, restoring and replicating the SQLite database with
# Litestream when LITESTREAM_REPLICA_PATH is configured.
set -eu

DATA_DIR="${DATA_DIR:-/data}"
export DATA_DIR
DATABASE="$DATA_DIR/medivault.sqlite"
mkdir -p "$DATA_DIR"

if [ -z "${LITESTREAM_REPLICA_PATH:-}" ]; then
  exec node server/index.ts
fi

echo "Restoring the MediVault database replica if one exists..."
if ! litestream restore -config /etc/litestream.yml -if-db-not-exists -if-replica-exists "$DATABASE"; then
  echo "Database replica restoration failed. Refusing to start with an empty database." >&2
  exit 1
fi

exec litestream replicate -config /etc/litestream.yml -exec "node server/index.ts"
