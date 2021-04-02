#!/bin/bash
set -Eeuo pipefail

# get the latest updates
git pull

sudo docker system prune -f
sudo docker-compose -f docker-compose.yml -f docker-compose.deploy.yml up
