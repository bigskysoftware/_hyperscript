import { defineConfig } from '@playwright/test'

// Istanbul instrumentation slows the bundle ~2-3x, which can make timing-sensitive
// reactivity/async tests flake. When COVERAGE=1, give each test extra headroom
// and allow one retry so the run produces usable coverage data despite the noise.
const coverage = !!process.env.COVERAGE

export default defineConfig({
    testDir: '.',
    testMatch: '**/*.js',
    testIgnore: ['fixtures.js', 'htmx-fixtures.js', 'global-setup.js', 'global-teardown.js', 'entry.js', 'util/**', 'nuetests/**', 'manual/**', 'vendor/**', 'index.html'],
    globalSetup: './global-setup.js',
    globalTeardown: './global-teardown.js',
    fullyParallel: true,
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
        { name: 'firefox', use: { browserName: 'firefox' } },
        { name: 'webkit', use: { browserName: 'webkit' } },
    ],
    timeout: coverage ? 45_000 : 30_000,
    retries: coverage ? 1 : (process.env.CI ? 1 : 0),
    reporter: [['list']],
})
