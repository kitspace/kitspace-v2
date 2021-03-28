#!/bin/bash

set -eu -o pipefail

function create_user_and_database() {
	local database=$(echo $1 | tr ':' ' ' | awk  '{print $1}')
	local owner=$(echo $1 | tr ':' ' ' | awk  '{print $2}')
	echo "  Creating user '$owner' and database '$database'"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	    CREATE USER $owner;
	    CREATE DATABASE $database;
	    GRANT ALL PRIVILEGES ON DATABASE $database TO $owner;
EOSQL
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
	echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
	for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
		create_user_and_database $db
	done
	echo "Multiple databases created"
fi
