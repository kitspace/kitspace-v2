#!/bin/bash
set -Eeuo pipefail

# Generate big files which is during testing
# `uploadProject.spec.js` -> should reject files bigger than `MAX_FILE_SIZE`
mkdir cypress/fixtures/auto-gen
truncate -s "${MAX_FILE_SIZE}" cypress/fixtures/auto-gen/big.txt
