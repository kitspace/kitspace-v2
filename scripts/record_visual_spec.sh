#!/bin/bash
set -Eeuo pipefail

spec_name=$1
cd frontend

npx cypress run --browser chrome --env updateSnapshots=true --spec $spec_name
