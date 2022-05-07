#!/bin/bash
set -Eeuo pipefail

# Run e2e tests
npx wait-on http://kitspace.test:3000 && cypress run --parallel --record -k $CYPRESS_RECORD_KEY \
    -b $browser --group $group --ci-build-id $GITHUB_TOKEN
