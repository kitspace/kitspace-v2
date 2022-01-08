#!/bin/bash
set -Eeuo pipefail

POSTGRES="psql --username ${POSTGRES_USER}"

echo "Creating database role: ${READONLY_USER}"

$POSTGRES <<-EOSQL
CREATE USER ${READONLY_USER} WITH PASSWORD '${READONLY_PASS}';
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${READONLY_USER};
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${READONLY_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO ${READONLY_USER};
EOSQL