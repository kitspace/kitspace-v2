#!/bin/bash
# Create a Gitea admin user in gitea and generate an API token for it.
# Usage: create_gitea_admin_user <username> <password> <email>
# Example: create_gitea_admin_user admin admin
if [ $# -ne 3 ]; then
    echo "Usage: $(basename "$0") <username> <password> <email>"
    exit 1
fi

container=$(docker ps | grep gitea | awk '{print $1}');
# In a shell inside the container, run the gitea admin create-user command
docker exec --user git $container /bin/sh -c "gitea admin user create --username $1 --password $2 --email $3 --admin"

# Generate a new API token for the admin user
docker exec --user git $container /bin/sh -c "gitea admin user generate-access-token --username $1 --raw"
