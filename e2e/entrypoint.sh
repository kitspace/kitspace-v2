#!/bin/bash
set -Eeuo pipefail

# Run e2e tests
if [[ -z $GITHUB_TOKEN ]]; then
    # The tests are running locally.
    npx wait-on http://kitspace.test:3000 && cypress run -b chrome
else
    escaped_commit_info=$(python3 -c "import shlex; print(shlex.quote('''$COMMIT_INFO_MESSAGE'''))")
    echo $escaped_commit_info
    # The tests are running in CI.
    npx wait-on http://kitspace.test:3000 && cypress run --parallel --record -k $CYPRESS_RECORD_KEY \
        -b $browser --group $group --ci-build-id $BUILD_ID \
        -e COMMIT_INFO_BRANCH=$COMMIT_INFO_BRANCH \
        -e COMMIT_INFO_MESSAGE=$escaped_commit_info \
        -e COMMIT_INFO_EMAIL=$COMMIT_INFO_EMAIL \
        -e COMMIT_INFO_AUTHOR=$COMMIT_INFO_AUTHOR \
        -e COMMIT_INFO_SHA=$COMMIT_INFO_SHA \
        -e COMMIT_INFO_TIMESTAMP=$COMMIT_INFO_TIMESTAMP
fi
