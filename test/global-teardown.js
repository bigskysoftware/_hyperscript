import fs from 'fs'
import path from 'path'
import libCoverage from 'istanbul-lib-coverage'
import libReport from 'istanbul-lib-report'
import reports from 'istanbul-reports'
import { COVERAGE_DIR, COVERAGE_RAW_DIR } from './global-setup.js'

export default async function globalTeardown() {
    if (!process.env.COVERAGE) return

    // Read all per-worker coverage shards and merge into one coverage map.
    const shards = fs.existsSync(COVERAGE_RAW_DIR)
        ? fs.readdirSync(COVERAGE_RAW_DIR).filter(f => f.endsWith('.json'))
        : []
    if (shards.length === 0) {
        console.warn('[coverage] no shards found in ' + COVERAGE_RAW_DIR)
        return
    }

    const map = libCoverage.createCoverageMap({})
    for (const shard of shards) {
        const data = JSON.parse(fs.readFileSync(path.join(COVERAGE_RAW_DIR, shard), 'utf8'))
        map.merge(data)
    }

    // Generate reports: lcov (per-file drill-down), lcovonly (for CI), text-summary.
    const context = libReport.createContext({
        dir: COVERAGE_DIR,
        defaultSummarizer: 'nested',
        coverageMap: map,
    })
    reports.create('lcov').execute(context)
    reports.create('text-summary').execute(context)
}
