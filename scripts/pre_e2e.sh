#!/bin/bash
set -Eeuo pipefail

# Generate big files which are used during testing
# `uploadProject.spec.js` -> should reject files bigger than `MAX_FILE_SIZE`
auto_gen_fixtures_path=e2e/cypress/fixtures/auto-gen
mkdir $auto_gen_fixtures_path
truncate -s "${MAX_FILE_SIZE}" "${auto_gen_fixtures_path}/big.txt"
