#!/usr/bin/env bash

set -Eeuo pipefail -o verbose

IBOM_assets_path=processor/src/tasks/processIBOM/InteractiveHtmlBom/InteractiveHtmlBom/web
public_IBOM_index_path=frontend/public/static/IBOM/index.js

# Copy all javascript files from InteractiveHtmlBom/web submodule to the public file used by fronend
rm $public_IBOM_index_path
find $IBOM_assets_path -maxdepth 1 -name '*.js' -exec cat {} >> $public_IBOM_index_path \;

# formatting
cd frontend
yarn fmt
cd ..
