import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: '.',
    testMatch: '**/*.js',
    testIgnore: ['fixtures.js', 'global-setup.js', 'entry.js', 'util/**', 'nuetests/**', 'manual/**', 'index.html'],
    globalSetup: './global-setup.js',
    fullyParallel: true,
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
        { name: 'firefox', use: { browserName: 'firefox' } },
        { name: 'webkit', use: { browserName: 'webkit' } },
    ],
    retries: process.env.CI ? 1 : 0,
    reporter: [['list']],
})
