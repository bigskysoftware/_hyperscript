import { test as base, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const hsBundle = readFileSync(path.join(__dirname, '..', '.bundle', '_hyperscript.js'), 'utf8')
const htmxBundle = readFileSync(path.join(__dirname, '..', 'vendor', 'htmx.js'), 'utf8')

const test = base.extend({
    page: async ({ browser }, use) => {
        const page = await browser.newPage()
        await page.setContent([
            '<!DOCTYPE html><html><head><base href="http://localhost/"></head><body>',
            `<script>${htmxBundle}</script>`,
            `<script>htmx.config.mode = "cors"; htmx.config.extensions = "hs-include";</script>`,
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

    /**
     * Intercept fetch in-browser to capture FormData bodies.
     * Returns an async getter for the captured body as a URLSearchParams string.
     */
    capture: async ({ page }, use) => {
        await use(async (method, url, responseBody) => {
            await page.evaluate(({ method, url, responseBody }) => {
                window.__capturedBody = null
                const origFetch = window.fetch
                window.fetch = async function(input, init) {
                    const reqUrl = typeof input === 'string' ? input
                                 : input instanceof Request ? input.url : String(input)
                    if (init?.method?.toUpperCase() === method.toUpperCase() && reqUrl.includes(url)) {
                        const body = init.body
                        if (body instanceof FormData) {
                            var parts = []
                            for (var [k, v] of body.entries()) parts.push(k + '=' + v)
                            window.__capturedBody = parts.join('&')
                        } else if (typeof body === 'string') {
                            window.__capturedBody = body
                        } else {
                            window.__capturedBody = String(body)
                        }
                        return new Response(responseBody || '<span>ok</span>', {
                            status: 200,
                            headers: { 'Content-Type': 'text/html' },
                        })
                    }
                    return origFetch.call(this, input, init)
                }
            }, { method, url, responseBody })
            return () => page.evaluate(() => window.__capturedBody)
        })
    },
})

test.describe('hs-include extension', () => {

    test('includes a named element-scoped variable', async ({ html, find, capture }) => {
        var getBody = await capture('POST', '/api')
        await html(`
            <button _="init set :userId to 42"
                    hs-include=":userId"
                    hx-post="/api" hx-target="#out">Send</button>
            <div id="out"></div>
        `)
        await find('button').click()
        await expect.poll(() => find('#out span').textContent()).toBe('ok')
        expect(await getBody()).toContain('userId=42')
    })

    test('includes multiple named variables', async ({ html, find, capture }) => {
        var getBody = await capture('POST', '/api')
        await html(`
            <button _="init set :a to 1 then set :b to 2"
                    hs-include=":a, :b"
                    hx-post="/api" hx-target="#out">Send</button>
            <div id="out"></div>
        `)
        await find('button').click()
        await expect.poll(() => find('#out span').textContent()).toBe('ok')
        var body = await getBody()
        expect(body).toContain('a=1')
        expect(body).toContain('b=2')
    })

    test('wildcard includes all element-scoped vars', async ({ html, find, capture }) => {
        var getBody = await capture('POST', '/api')
        await html(`
            <button _="init set :x to 10 then set :y to 20"
                    hs-include="*"
                    hx-post="/api" hx-target="#out">Send</button>
            <div id="out"></div>
        `)
        await find('button').click()
        await expect.poll(() => find('#out span').textContent()).toBe('ok')
        var body = await getBody()
        expect(body).toContain('x=10')
        expect(body).toContain('y=20')
    })

    test('resolves inherited var via ^', async ({ html, find, capture }) => {
        var getBody = await capture('POST', '/api')
        await html(`
            <div _="init set :shared to 99">
                <button hs-include="^shared"
                        hx-post="/api" hx-target="#out">Send</button>
            </div>
            <div id="out"></div>
        `)
        await find('button').click()
        await expect.poll(() => find('#out span').textContent()).toBe('ok')
        expect(await getBody()).toContain('shared=99')
    })

    test('resolves var from another element via #selector', async ({ html, find, capture }) => {
        var getBody = await capture('POST', '/api')
        await html(`
            <div id="source" _="init set :data to 'hello'"></div>
            <button hs-include="#source:data"
                    hx-post="/api" hx-target="#out">Send</button>
            <div id="out"></div>
        `)
        await find('button').click()
        await expect.poll(() => find('#out span').textContent()).toBe('ok')
        expect(await getBody()).toContain('data=hello')
    })

    test('JSON-serializes object values', async ({ html, find, capture }) => {
        var getBody = await capture('POST', '/api')
        await html(`
            <button _="init set :obj to {name: 'Alice', age: 30}"
                    hs-include=":obj"
                    hx-post="/api" hx-target="#out">Send</button>
            <div id="out"></div>
        `)
        await find('button').click()
        await expect.poll(() => find('#out span').textContent()).toBe('ok')
        var body = await getBody()
        expect(body).toContain('obj=')
        var params = new URLSearchParams(body)
        expect(JSON.parse(params.get('obj'))).toEqual({ name: 'Alice', age: 30 })
    })

    test('hs-include:inherited applies to descendant triggers', async ({ html, find, capture }) => {
        var getBody = await capture('POST', '/api')
        await html(`
            <div _="init set :ctx to 'parent-val'" hs-include:inherited=":ctx">
                <button hx-post="/api" hx-target="#out">Send</button>
            </div>
            <div id="out"></div>
        `)
        await find('button').click()
        await expect.poll(() => find('#out span').textContent()).toBe('ok')
        expect(await getBody()).toContain('ctx=parent-val')
    })

    test('elements without hs-include are unaffected', async ({ html, find, capture }) => {
        var getBody = await capture('POST', '/api')
        await html(`
            <button _="init set :secret to 42"
                    hx-post="/api" hx-target="#out">Send</button>
            <div id="out"></div>
        `)
        await find('button').click()
        await expect.poll(() => find('#out span').textContent()).toBe('ok')
        var body = (await getBody()) || ''
        expect(body).not.toContain('secret')
    })

    test('missing variables are silently skipped', async ({ html, find, capture }) => {
        var getBody = await capture('POST', '/api')
        await html(`
            <button hs-include=":nonexistent"
                    hx-post="/api" hx-target="#out">Send</button>
            <div id="out"></div>
        `)
        await find('button').click()
        await expect.poll(() => find('#out span').textContent()).toBe('ok')
        var body = (await getBody()) || ''
        expect(body).not.toContain('nonexistent')
    })

    test('direct hs-include takes precedence over inherited', async ({ html, find, capture }) => {
        var getBody = await capture('POST', '/api')
        await html(`
            <div _="init set :parent to 1" hs-include:inherited=":parent">
                <button _="init set :child to 2"
                        hs-include=":child"
                        hx-post="/api" hx-target="#out">Send</button>
            </div>
            <div id="out"></div>
        `)
        await find('button').click()
        await expect.poll(() => find('#out span').textContent()).toBe('ok')
        var body = await getBody()
        expect(body).toContain('child=2')
        expect(body).not.toContain('parent')
    })
})
