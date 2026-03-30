import * as esbuild from 'esbuild'
import { cpSync, mkdirSync, readdirSync } from 'fs'
import { execSync } from 'child_process'

const dev = process.argv.includes('--watch')

const coreEntry = ['src/_hyperscript.js']
const extEntries = [
  'src/ext/hdb.js',

  'src/ext/socket.js',
  'src/ext/worker.js',
  'src/ext/eventsource.js',
  'src/ext/tailwind.js',
]

const shared = {
  bundle: true,
  sourcemap: true,
  platform: 'browser',
  target: 'es2015',
}

function builds(entryPoints, outOptions) {
  return [
    // IIFE (default — plain <script> tag)
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

const coreBuildConfigs = builds(coreEntry, {
  iife:    { outfile: 'dist/_hyperscript.js' },
  esm:     { outfile: 'dist/_hyperscript.esm.js' },
  iifeMin: { outfile: 'dist/_hyperscript.min.js' },
  esmMin:  { outfile: 'dist/_hyperscript.esm.min.js' },
})

const extBuildConfigs = builds(extEntries, {
  iife:    { outdir: 'dist/ext' },
  esm:     { outdir: 'dist/ext', outExtension: { '.js': '.esm.js' } },
  iifeMin: { outdir: 'dist/ext', outExtension: { '.js': '.min.js' } },
  esmMin:  { outdir: 'dist/ext', outExtension: { '.js': '.esm.min.js' } },
})

function brotliCompress() {
  const minFiles = [
    'dist/_hyperscript.min.js',
    'dist/_hyperscript.esm.min.js',
  ]
  // Add extension min files
  for (const f of readdirSync('dist/ext')) {
    if (f.endsWith('.min.js')) {
      minFiles.push('dist/ext/' + f)
    }
  }
  for (const f of minFiles) {
    execSync(`brotli -f ${f}`)
  }
}

function copyPlatformScripts() {
  mkdirSync('dist/platform', { recursive: true })
  cpSync('src/platform', 'dist/platform', { recursive: true })
}

if (dev) {
  // Watch mode — just build IIFE for speed
  const ctx = await esbuild.context({
    ...shared,
    format: 'iife',
    entryPoints: coreEntry,
    outfile: 'dist/_hyperscript.js',
  })
  await ctx.watch()
  console.log('Watching src/ for changes...')
} else {
  const allConfigs = [...coreBuildConfigs, ...extBuildConfigs]
  await Promise.all(allConfigs.map(c => esbuild.build(c)))
  copyPlatformScripts()
  brotliCompress()
  console.log('Built dist/')
}
