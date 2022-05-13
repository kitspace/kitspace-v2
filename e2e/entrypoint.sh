#!/bin/bash
set -Eeuo pipefail

# Run e2e tests
if [[ -z $GITHUB_TOKEN ]]; then
    # The tests are running locally.
    npx wait-on http://kitspace.test:3000 && cypress run -b chrome
else
    # The tests are running in CI.
    npx wait-on http://kitspace.test:3000 && cypress run --parallel --record -k $CYPRESS_RECORD_KEY \
        -b $browser --group $group --ci-build-id $GITHUB_TOKEN
fi
