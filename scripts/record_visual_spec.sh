#!/bin/bash
set -Eeuo pipefail

# Set the viewport for firefox, see https://github.com/cypress-io/cypress/issues/15481#issuecomment-810062823
export MOZ_HEADLESS_WIDTH=1500
export MOZ_HEADLESS_HEIGHT=800

spec_name=$1
browsers=('edge' 'electron' 'chrome' 'firefox')

cd frontend

for browser in ${browsers[@]}; do
    npx cypress run --browser $browser --env updateSnapshots=true --spec $spec_name
done

