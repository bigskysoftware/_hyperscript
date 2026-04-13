#!/usr/bin/env node
//
// release-check -- verify the repository is in a publishable state.
//
// Checks:
//   1. dist/ is up to date with src/ (rebuilds to a temp dir, compares bytes)
//   2. The SHA-384 integrity attributes in www/docs/getting-started.md match
//      the current dist files
//
// Exits 0 on success, 1 on any failure. Does NOT mutate dist/ or the docs.

import { createHash } from 'node:crypto'
import { readFileSync, rmSync, mkdtempSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const distDir = join(repoRoot, 'dist')
const docsFile = join(repoRoot, 'www/docs/getting-started.md')

let failures = 0
function fail(msg) { failures++; console.error('  ✗ ' + msg) }
function ok(msg)   { console.log('  ✓ ' + msg) }
function section(name) { console.log('\n' + name) }

// -----------------------------------------------------------------------------
// Check 1: dist/ matches a fresh build from src/
// -----------------------------------------------------------------------------

section('Checking dist/ is built from current src/...')

const tmp = mkdtempSync(join(tmpdir(), 'hs-release-check-'))
try {
    execSync(`node build.config.mjs`, {
        cwd: repoRoot,
        env: { ...process.env, HS_OUT_DIR: tmp },
        stdio: 'pipe',
    })
} catch (e) {
    fail('build failed: ' + (e.stderr?.toString() || e.message))
    rmSync(tmp, { recursive: true, force: true })
    process.exit(1)
}

function walk(dir, base = dir) {
    const out = []
    for (const name of readdirSync(dir)) {
        const full = join(dir, name)
        if (statSync(full).isDirectory()) out.push(...walk(full, base))
        else out.push(relative(base, full))
    }
    return out
}

function hashFile(path) {
    return createHash('sha256').update(readFileSync(path)).digest('hex')
}

// Only compare files that exist in both trees. Ignore sourcemaps (which embed
// absolute paths) and .br brotli files (which aren't byte-reproducible across
// runs due to compressor internals).
const IGNORE = /\.(map|br|d\.ts)$/

const distFiles = new Set(walk(distDir).filter(f => !IGNORE.test(f)))
const tmpFiles = new Set(walk(tmp).filter(f => !IGNORE.test(f)))

const onlyInDist = [...distFiles].filter(f => !tmpFiles.has(f))
const onlyInTmp = [...tmpFiles].filter(f => !distFiles.has(f))

if (onlyInDist.length) fail(`files in dist/ not produced by build: ${onlyInDist.join(', ')}`)
if (onlyInTmp.length)  fail(`build produced files missing from dist/: ${onlyInTmp.join(', ')}`)

const shared = [...distFiles].filter(f => tmpFiles.has(f))
const mismatched = []
for (const f of shared) {
    const a = hashFile(join(distDir, f))
    const b = hashFile(join(tmp, f))
    if (a !== b) mismatched.push(f)
}

rmSync(tmp, { recursive: true, force: true })

if (mismatched.length) {
    fail('dist/ is out of date (run `npm run build`):')
    for (const f of mismatched) console.error('      ' + f)
} else if (!onlyInDist.length && !onlyInTmp.length) {
    ok(`dist/ matches a fresh build (${shared.length} files checked)`)
}

// -----------------------------------------------------------------------------
// Check 2: SRI integrity attributes match the current dist files
// -----------------------------------------------------------------------------

section('Checking SHA-384 integrity attributes...')

function sri(path) {
    return 'sha384-' + createHash('sha384').update(readFileSync(path)).digest('base64')
}

const sriMap = {
    '_hyperscript.min.js':     sri(join(distDir, '_hyperscript.min.js')),
    '_hyperscript.js':         sri(join(distDir, '_hyperscript.js')),
    '_hyperscript.esm.min.js': sri(join(distDir, '_hyperscript.esm.min.js')),
    '_hyperscript.esm.js':     sri(join(distDir, '_hyperscript.esm.js')),
}

const docs = readFileSync(docsFile, 'utf8')
// Match <script ... src="...filename..." integrity="sha384-..." ...>
// Extract all such tags with their filename + integrity value.
const tagRe = /<script\s+[^>]*?(?:src|href)="([^"]+)"[^>]*?integrity="(sha384-[^"]*)"[^>]*>/g
let m, found = 0
// Match the *longest* candidate first so esm.min.js is checked before min.js.
const sriNames = Object.keys(sriMap).sort((a, b) => b.length - a.length)
while ((m = tagRe.exec(docs)) !== null) {
    const url = m[1]
    const actualSri = m[2]
    const filename = sriNames.find(name => url.endsWith('/' + name) || url.endsWith(name))
    if (!filename) continue
    found++
    const expected = sriMap[filename]
    if (actualSri !== expected) {
        fail(`${filename}: integrity mismatch`)
        console.error(`      in docs:  ${actualSri}`)
        console.error(`      expected: ${expected}`)
        console.error(`      (run \`npm run update-sha\` to fix)`)
    }
}

if (found === 0) fail(`no integrity="sha384-..." attributes found in ${relative(repoRoot, docsFile)}`)
else if (failures === 0) ok(`all ${found} integrity attributes match`)

// -----------------------------------------------------------------------------

console.log('')
if (failures > 0) {
    console.error(`release-check failed (${failures} issue${failures === 1 ? '' : 's'})`)
    process.exit(1)
}
console.log('release-check passed ✓')
