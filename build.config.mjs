import * as esbuild from 'esbuild'
import { cpSync, mkdirSync, readdirSync } from 'fs'
import { execSync } from 'child_process'

const dev = process.argv.includes('--watch')
const OUT = process.env.HS_OUT_DIR || 'dist'

const coreEntry = ['src/_hyperscript.js']
const extEntries = [
  'src/ext/hdb.js',
  'src/ext/component.js',
  'src/ext/socket.js',
  'src/ext/worker.js',
  'src/ext/eventsource.js',
  'src/ext/tailwind.js',
]

const shared = {
  bundle: true,
  sourcemap: true,
  platform: 'browser',
  target: 'es2022',
}

function builds(entryPoints, outOptions) {
  return [
    // IIFE (default - plain <script> tag)
    {
      ...shared,
      format: 'iife',
      entryPoints,
      ...outOptions.iife,
    },
    // ESM (import)
    {
      ...shared,
      format: 'esm',
      entryPoints,
      ...outOptions.esm,
    },
    // IIFE minified
    {
      ...shared,
      format: 'iife',
      minify: true,
      sourcemap: false,
      entryPoints,
      ...outOptions.iifeMin,
    },
    // ESM minified
    {
      ...shared,
      format: 'esm',
      minify: true,
      sourcemap: false,
      entryPoints,
      ...outOptions.esmMin,
    },
  ]
}

const maxEntry = ['src/_hyperscript-max.js']

const coreBuildConfigs = builds(coreEntry, {
  iife:    { outfile: `${OUT}/_hyperscript.js` },
  esm:     { outfile: `${OUT}/_hyperscript.esm.js` },
  iifeMin: { outfile: `${OUT}/_hyperscript.min.js` },
  esmMin:  { outfile: `${OUT}/_hyperscript.esm.min.js` },
})

const maxBuildConfigs = [
  { ...shared, format: 'iife', entryPoints: maxEntry, outfile: `${OUT}/_hyperscript-max.js` },
  { ...shared, format: 'iife', minify: true, sourcemap: false, entryPoints: maxEntry, outfile: `${OUT}/_hyperscript-max.min.js` },
]

const extBuildConfigs = builds(extEntries, {
  iife:    { outdir: `${OUT}/ext` },
  esm:     { outdir: `${OUT}/ext`, outExtension: { '.js': '.esm.js' } },
  iifeMin: { outdir: `${OUT}/ext`, outExtension: { '.js': '.min.js' } },
  esmMin:  { outdir: `${OUT}/ext`, outExtension: { '.js': '.esm.min.js' } },
})

function brotliCompress() {
  const minFiles = [
    `${OUT}/_hyperscript.min.js`,
    `${OUT}/_hyperscript.esm.min.js`,
    `${OUT}/_hyperscript-max.min.js`,
  ]
  // Add extension min files
  for (const f of readdirSync(`${OUT}/ext`)) {
    if (f.endsWith('.min.js')) {
      minFiles.push(`${OUT}/ext/` + f)
    }
  }
  for (const f of minFiles) {
    execSync(`brotli -f ${f}`)
  }
}

function copyPlatformScripts() {
  mkdirSync(`${OUT}/platform`, { recursive: true })
  cpSync('src/platform', `${OUT}/platform`, { recursive: true })
}

if (dev) {
  // Watch mode - just build IIFE for speed
  const ctx = await esbuild.context({
    ...shared,
    format: 'iife',
    entryPoints: coreEntry,
    outfile: `${OUT}/_hyperscript.js`,
  })
  await ctx.watch()
  console.log(`Watching src/ for changes...`)
} else {
  const allConfigs = [...coreBuildConfigs, ...maxBuildConfigs, ...extBuildConfigs]
  await Promise.all(allConfigs.map(c => esbuild.build(c)))
  copyPlatformScripts()
  brotliCompress()
  console.log(`Built ${OUT}/`)
}
