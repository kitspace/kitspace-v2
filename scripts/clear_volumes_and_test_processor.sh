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
docker-compose run -e NODE_ENV=development processor sh -c "nohup yarn start > logs & yarn test ${args}"
