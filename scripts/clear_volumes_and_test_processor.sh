#!/usr/bin/env bash
set -eu -o pipefail

function concatenate_args
{
    string=""
    for a in "$@" # Loop over arguments
    do
        if [[ "$string" != "" ]]
        then
            string+=" " # Delimeter
        fi
        string+="$a"
    done
    echo "$string"
}

# clear docker volumes
docker-compose down -v

# you can pass arguments to mocha e.g. `-g multi`
args="$(concatenate_args "$@")"

# We need to install packages, compile ts, and move assets before running the actual testing code.
# The `node` user doesn't have permission to do any of these tasks.
docker-compose run \
    -u root \
    -e LOG_LEVEL=debug \
    -e DATA_DIR=/data/test \
    processor sh -c "yarn install && yarn tsc && yarn cp-assets && yarn cp-test-assets && yarn test ${args}"
