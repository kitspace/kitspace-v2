#!/usr/bin/env bash

set -Eeuo pipefail -o verbose

docker compose -f docker-compose.yml -f docker-compose.deploy.yml up &

until docker logs kitspace_gitea_1 | grep 'ORM engine initialization successful' ; do sleep 3s; done

docker compose stop
