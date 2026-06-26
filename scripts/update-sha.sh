#!/bin/bash

JSON=www/_data/integrity.json

# Version is the single source of truth in package.json; the site reads it from here.
VERSION=$(node -p "require('./package.json').version")

# Calculate SHAs
MINIFIED_SHA=$(cat dist/_hyperscript.min.js | openssl dgst -sha384 -binary | openssl base64 -A)
FULL_SHA=$(cat dist/_hyperscript.js | openssl dgst -sha384 -binary | openssl base64 -A)
ESM_MIN_SHA=$(cat dist/_hyperscript.esm.min.js | openssl dgst -sha384 -binary | openssl base64 -A)
ESM_SHA=$(cat dist/_hyperscript.esm.js | openssl dgst -sha384 -binary | openssl base64 -A)

echo "Updating $JSON for hyperscript.org@$VERSION..."
echo "_hyperscript.min.js:     sha384-$MINIFIED_SHA"
echo "_hyperscript.js:         sha384-$FULL_SHA"
echo "_hyperscript.esm.min.js: sha384-$ESM_MIN_SHA"
echo "_hyperscript.esm.js:     sha384-$ESM_SHA"

cat > "$JSON" <<EOF
{
    "version": "$VERSION",
    "min": "sha384-$MINIFIED_SHA",
    "full": "sha384-$FULL_SHA",
    "esmMin": "sha384-$ESM_MIN_SHA",
    "esm": "sha384-$ESM_SHA"
}
EOF

echo "✓ $JSON updated successfully"
