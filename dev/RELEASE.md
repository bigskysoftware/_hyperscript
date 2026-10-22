# Release checklist

* Ensure `CHANGELOG.md` is updated with the new version + date
* Bump the version BY HAND in two places:
  * `src/_hyperscript.js` (the `version:` field)
  * `package.json` (`version`), run `npm install` to sync `package-lock.json`
* Build dist: `npm run dist`
* Update SHAs: `npm run update-sha`
  * reads the version from `package.json` and writes `www/_data/integrity.json`
    (`{version, min, full, esmMin, esm}`), the single source of truth the site
    injects into CDN snippets via the `__VERSION__` / `__SRI_*` tokens
* Copy dist into the site: `npm run www` (builds + copies `dist/*` to `www/js/`)
* Run the checks:
  * `npm run release-check` (dist matches src, integrity.json matches dist + package.json, node validator boots)
  * `npm test` (and `npm run test:all` for all browsers)
* Commit all changes (including `dist/`, `www/js/`, and `www/_data/integrity.json`)
* Tag: `git tag X.Y.Z`
* Push, including tags: `git push && git push --tags`
* `npm publish`
* (optional) GitHub release:
  ```bash
  gh release create X.Y.Z --title "X.Y.Z" \
    --notes "$(sed -n '/## X.Y.Z/,/## /p' CHANGELOG.md | sed '$d')"
  ```
* Announce

## Notes

* The CDN version/SRI shown across the docs come from `www/_data/integrity.json`.
  Do NOT hand-edit version pins or `integrity="..."` in docs -- use the tokens
  `__VERSION__`, `__SRI_MIN__`, `__SRI_FULL__`, `__SRI_ESM_MIN__`, `__SRI_ESM__`,
  which `www/eleventy.config.mjs` substitutes at build time.
