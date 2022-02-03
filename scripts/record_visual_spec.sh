#!/bin/bash
set -Eeuo pipefail

spec_name=$1
browsers=('edge' 'electron' 'chrome' 'firefox')

cd frontend

for browser in ${browsers[@]}; do
    npx cypress run --browser $browser --env updateSnapshots=true --spec $spec_name
done

