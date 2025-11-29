import * as esbuild from 'esbuild'

const dev = process.argv.includes('--watch')

const config = {
  entryPoints: ['src/_hyperscript.js'],
  bundle: true,
  outfile: 'dist/_hyperscript.js',
  format: 'esm',
  sourcemap: true,
  platform: 'browser',
  target: 'es2015',
  logLevel: 'info',
  banner: {
    js: '// _hyperscript ES module'
  }
}

if (dev) {
  const ctx = await esbuild.context(config)
  await ctx.watch()
  console.log('👀 Watching src/ for changes...')
  console.log('   Building to dist/_hyperscript.js')
} else {
  await esbuild.build(config)
  console.log('✓ Built dist/_hyperscript.js')
}
