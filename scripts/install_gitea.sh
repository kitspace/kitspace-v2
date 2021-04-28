#!/usr/bin/env bash

set -Eeuo pipefail -o verbose

docker-compose up gitea &

until docker logs kitspace_gitea_1 | grep 'ORM engine initialization successful' ; do sleep 3s; done

docker-compose -f docker-compose.yml -f docker-compose.deploy.yml run gitea \
	gitea admin user create --admin \
		--username "${CYPRESS_GITEA_ADMIN_USERNAME}" \
		--password "${CYPRESS_GITEA_ADMIN_PASSWORD}" \
		--email admin@example.com

docker-compose stop
