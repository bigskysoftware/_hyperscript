import { build } from 'esbuild'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default async function globalSetup() {
    await build({
        entryPoints: [path.join(__dirname, 'entry.js')],
        bundle: true,
        format: 'iife',
        outfile: path.join(__dirname, '.bundle', '_hyperscript.js'),
    })
}
