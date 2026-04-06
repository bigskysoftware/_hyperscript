import { test as base, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const hsBundle = readFileSync(path.join(__dirname, '.bundle', '_hyperscript.js'), 'utf8')
const htmxBundle = readFileSync(path.join(__dirname, 'vendor', 'htmx.js'), 'utf8')

export { expect }

export const test = base.extend({
    page: async ({ browser }, use) => {
        const page = await browser.newPage()
        await page.setContent([
            '<!DOCTYPE html><html><head><base href="http://localhost/"></head><body>',
            `<script>${htmxBundle}</script>`,
            `<script>htmx.config.mode = "cors";</script>`,
            `<script>${hsBundle}</script>`,
            '<div id="work-area"></div>',
            '</body></html>',
        ].join('\n'))
        await page.waitForFunction(() =>
            typeof _hyperscript !== 'undefined' && typeof htmx !== 'undefined'
        )
        await use(page)
        await page.close()
    },

    html: async ({ page }, use) => {
        await use(async (markup) => {
            await page.evaluate((h) => {
                const wa = document.getElementById('work-area')
                wa.innerHTML = h
                htmx.process(wa)
                _hyperscript.processNode(wa)
            }, markup)
        })
    },

    find: async ({ page }, use) => {
        await use((selector) => page.locator(`#work-area ${selector}`))
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
