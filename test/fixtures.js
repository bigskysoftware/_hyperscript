import { test as base, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import libCoverage from 'istanbul-lib-coverage'
import { fileURLToPath } from 'url'
import { COVERAGE_RAW_DIR } from './global-setup.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bundlePath = path.join(__dirname, '.bundle', '_hyperscript.js')

export const COVERAGE = !!process.env.COVERAGE

/**
 * Merge per-test coverage from `window.__coverage__` into the given
 * worker-scoped coverage map. Uses istanbul-lib-coverage's built-in merge —
 * fast enough to call once per test without tripping teardown timeouts.
 */
export function accumulateCoverage(accMap, cov) {
    const map = accMap || libCoverage.createCoverageMap({})
    map.merge(cov)
    return map
}

/**
 * Flush the given coverage map to a worker-unique JSON file. Called once
 * per worker at teardown; global-teardown.js reads all shards and merges.
 */
export function flushCoverageShard(accMap) {
    if (!accMap) return
    const shard = `worker-${process.pid}-${Math.random().toString(36).slice(2, 10)}.json`
    fs.writeFileSync(path.join(COVERAGE_RAW_DIR, shard), JSON.stringify(accMap.toJSON()))
}

const BLANK_PAGE = [
    '<!DOCTYPE html><html>',
    '<head><base href="http://localhost/"></head>',
    '<body><div id="work-area"></div></body>',
    '</html>',
].join('')

export { expect }

export const test = base.extend({
    _hsContext: [async ({ browser }, use) => {
        const context = await browser.newContext()
        await context.addInitScript({ path: bundlePath })
        await context.addInitScript(() => {
            window.promiseAnIntIn = (ms) => new Promise(r => setTimeout(() => r(42), ms))
            window.promiseValueBackIn = (val, ms) => new Promise(r => setTimeout(() => r(val), ms))
            if (!window.__initialKeys) {
                window.__initialKeys = new Set(Object.keys(window))
                window.__initialKeys.add('__initialKeys')
            }
        })
        await use(context)
        await context.close()
    }, { scope: 'worker' }],

    // Worker-scoped coverage accumulator. Per-test coverage is merged into
    // `acc.map` and written to a shard JSON at worker teardown. Writing a
    // single file per worker avoids per-test I/O overhead.
    _covAccumulator: [async ({}, use) => {
        const acc = { map: null }
        await use(acc)
        if (COVERAGE) flushCoverageShard(acc.map)
    }, { scope: 'worker' }],

    _hsPage: [async ({ _hsContext }, use) => {
        const page = await _hsContext.newPage()
        await use(page)
        await page.close()
    }, { scope: 'worker' }],

    page: async ({ _hsPage, _covAccumulator }, use) => {
        await _hsPage.evaluate(() => {
            for (const key of Object.keys(window)) {
                if (!window.__initialKeys.has(key)) try { delete window[key] } catch {}
            }
        })
        await _hsPage.setContent(BLANK_PAGE)
        await _hsPage.waitForFunction(() => typeof _hyperscript !== 'undefined')
        await use(_hsPage)
        if (COVERAGE) {
            const cov = await _hsPage.evaluate(() => window.__coverage__ || null)
            if (cov) _covAccumulator.map = accumulateCoverage(_covAccumulator.map, cov)
        }
    },

    html: async ({ page }, use) => {
        await use(async (markup) => {
            await page.evaluate((h) => {
                const wa = document.getElementById('work-area')
                wa.innerHTML = h
                _hyperscript.processNode(wa)
            }, markup)
        })
    },

    find: async ({ page }, use) => {
        await use((selector) => page.locator(`#work-area ${selector}`))
    },

    run: async ({ page }, use) => {
        await use(async (src, ctx) => {
            return page.evaluate(({ src, ctx }) => _hyperscript(src, ctx), { src, ctx })
        })
    },

    error: async ({ page }, use) => {
        await use(async (src) => {
            return page.evaluate((src) => {
                try { _hyperscript(src); return null }
                catch (e) { return e.message }
            }, src)
        })
    },

    evaluate: async ({ page }, use) => {
        await use((...args) => page.evaluate(...args))
    },

    mock: async ({ page }, use) => {
        await use(async (method, url, body, options = {}) => {
            const pattern = url.startsWith('*') ? url : `**${url}`
            await page.route(pattern, async (route) => {
                const req = route.request()
                if (req.method() !== method.toUpperCase()) {
                    await route.fallback()
                    return
                }
                await route.fulfill({
                    status: options.status || 200,
                    contentType: options.contentType || 'text/html',
                    body: typeof body === 'string' ? body : JSON.stringify(body),
                })
            })
        })
    },
})
