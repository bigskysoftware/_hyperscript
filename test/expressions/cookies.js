import {test, expect} from '../fixtures.js'
import path from 'path'
import {fileURLToPath} from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Cookies require a real HTTP origin (not about:blank), so we set up
// a route and navigate to it instead of using the html fixture.
test.describe("the cookies identifier", () => {

	test.beforeEach(async ({page}) => {
		// Route a fake URL so we get a real origin for document.cookie
		await page.route('http://localhost/test', async route => {
			await route.fulfill({
				status: 200,
				contentType: 'text/html',
				body: `<!DOCTYPE html><html><head></head><body><div id="work-area"></div></body></html>`,
			})
		})
		await page.goto('http://localhost/test')
		await page.addScriptTag({
			path: path.join(__dirname, '../.bundle/_hyperscript.js')
		})
		await page.waitForFunction(() => typeof _hyperscript !== 'undefined')
	})

	test("basic set cookie values work", async ({page}) => {
		const result = await page.evaluate(() => {
			const r1 = _hyperscript("cookies.foo")
			_hyperscript("set cookies.foo to 'bar'")
			const r2 = _hyperscript("cookies.foo")
			return { before: r1, after: r2 }
		})
		expect(result.before).toBeUndefined()
		expect(result.after).toBe('bar')
	})

	test("update cookie values work", async ({page}) => {
		const result = await page.evaluate(() => {
			_hyperscript("set cookies.foo to 'bar'")
			const r1 = _hyperscript("cookies.foo")
			_hyperscript("set cookies.foo to 'doh'")
			const r2 = _hyperscript("cookies.foo")
			return { first: r1, second: r2 }
		})
		expect(result.first).toBe('bar')
		expect(result.second).toBe('doh')
	})

	test("basic clear cookie values work", async ({page}) => {
		const result = await page.evaluate(() => {
			_hyperscript("set cookies.foo to 'bar'")
			_hyperscript("cookies.clear('foo')")
			return _hyperscript("cookies.foo")
		})
		expect(result).toBeUndefined()
	})

	test("iterate cookies values work", async ({page}) => {
		const result = await page.evaluate(() => {
			_hyperscript("set cookies.foo to 'bar'")
			const context = { me: [], you: [] }
			_hyperscript("for x in cookies me.push(x.name) then you.push(x.value) end", context)
			return { names: context.me, values: context.you }
		})
		expect(result.names).toContain('foo')
		expect(result.values).toContain('bar')
	})
})
