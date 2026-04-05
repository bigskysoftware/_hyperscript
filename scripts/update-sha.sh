#!/bin/bash

DOCS=www/docs/getting-started.md

# Calculate SHAs
MINIFIED_SHA=$(cat dist/_hyperscript.min.js | openssl dgst -sha384 -binary | openssl base64 -A)
FULL_SHA=$(cat dist/_hyperscript.js | openssl dgst -sha384 -binary | openssl base64 -A)
ESM_MIN_SHA=$(cat dist/_hyperscript.esm.min.js | openssl dgst -sha384 -binary | openssl base64 -A)
ESM_SHA=$(cat dist/_hyperscript.esm.js | openssl dgst -sha384 -binary | openssl base64 -A)

echo "Updating $DOCS with new SHAs..."
echo "_hyperscript.min.js:     sha384-$MINIFIED_SHA"
echo "_hyperscript.js:         sha384-$FULL_SHA"
echo "_hyperscript.esm.min.js: sha384-$ESM_MIN_SHA"
echo "_hyperscript.esm.js:     sha384-$ESM_SHA"

awk -v minified="sha384-$MINIFIED_SHA" -v full="sha384-$FULL_SHA" \
    -v esm_min="sha384-$ESM_MIN_SHA" -v esm="sha384-$ESM_SHA" '
/integrity="sha384-[^"]*"/ && /_hyperscript\.esm\.min\.js/ {
    sub(/sha384-[^"]*/, esm_min)
}
/integrity="sha384-[^"]*"/ && /_hyperscript\.esm\.js/ && !/_hyperscript\.esm\.min\.js/ {
    sub(/sha384-[^"]*/, esm)
}
/integrity="sha384-[^"]*"/ && /_hyperscript\.min\.js/ && !/_hyperscript\.esm/ {
    sub(/sha384-[^"]*/, minified)
}
/integrity="sha384-[^"]*"/ && /_hyperscript\.js/ && !/_hyperscript\.min\.js/ && !/_hyperscript\.esm/ {
    sub(/sha384-[^"]*/, full)
}
/integrity="sha384-[^"]*"/ && /hyperscript\.org@/ && !/dist\// {
    sub(/sha384-[^"]*/, minified)
}
{print}
' "$DOCS" > "$DOCS.tmp" && mv "$DOCS.tmp" "$DOCS"

echo "✓ $DOCS updated successfully"
