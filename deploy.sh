#!/bin/bash
set -Eeuo pipefail

# ge the latest updates
git pull

sudo docker system prune --all
sudo docker-compose -f docker-compose.deploy up
