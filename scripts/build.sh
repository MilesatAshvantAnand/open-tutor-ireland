#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Build the pinned browser edition with guest storage and relative Vite assets.
(
  cd upstream/oftly
  ./node_modules/.bin/tsc -b
  VITE_STORAGE=browser VITE_SUPABASE_URL='' VITE_SUPABASE_PUBLISHABLE_KEY='' \
    ./node_modules/.bin/vite build --base=./ --outDir dist-web
  node scripts/build-offline.mjs
)
rm -rf dist
mkdir -p dist/oftly
cp -R site/. dist/
cp -R upstream/oftly/dist-web/. dist/oftly/
cp upstream/oftly/LICENSE upstream/oftly/THIRD-PARTY-NOTICES.md dist/oftly/
node scripts/mount-oftly.mjs
node scripts/version-desk.mjs
