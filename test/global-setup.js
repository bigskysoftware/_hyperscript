import { build } from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createInstrumenter } from 'istanbul-lib-instrument'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

export const COVERAGE_DIR = path.join(repoRoot, 'coverage-reports')
export const COVERAGE_RAW_DIR = path.join(COVERAGE_DIR, 'raw')

// esbuild plugin: instruments src/**/*.js with istanbul before bundling.
// Only enabled when COVERAGE=1 is set, so npm test runs the real iife bundle.
function istanbulPlugin() {
    const instrumenter = createInstrumenter({
        esModules: true,
        produceSourceMap: true,
        compact: false,
    })
    return {
        name: 'istanbul',
        setup(build) {
            build.onLoad({ filter: /\.js$/ }, async (args) => {
                if (!args.path.startsWith(path.join(repoRoot, 'src') + path.sep)) return
                const source = await fs.promises.readFile(args.path, 'utf8')
                const code = await new Promise((resolve, reject) => {
                    instrumenter.instrument(source, args.path, (err, out) => {
                        if (err) reject(err); else resolve(out)
                    })
                })
                return { contents: code, loader: 'js' }
            })
        },
    }
}

export default async function globalSetup() {
    await build({
        entryPoints: [path.join(__dirname, 'entry.js')],
        bundle: true,
        format: 'iife',
        sourcemap: 'inline',
        outfile: path.join(__dirname, '.bundle', '_hyperscript.js'),
        plugins: process.env.COVERAGE ? [istanbulPlugin()] : [],
    })

    if (process.env.COVERAGE) {
        // Clean previous run's raw shards so stale worker data doesn't leak in
        await fs.promises.rm(COVERAGE_DIR, { recursive: true, force: true })
        await fs.promises.mkdir(COVERAGE_RAW_DIR, { recursive: true })
    }
}
