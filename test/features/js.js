import {test, expect} from '../fixtures.js'

test.describe('The (top-level) js feature', () => {

	test('can run js at the top level', async ({html, evaluate}) => {
		await evaluate(() => window.testSuccess = false)
		await html("<script type=text/hyperscript>  js     window.testSuccess = true   end ")
		const result = await evaluate(() => window.testSuccess)
		expect(result).toBe(true)
	})

	test('can expose globals', async ({html, evaluate}) => {
		await html("<script type=text/hyperscript>  js     return { foo: 'test succeeded' };   end ")
		const result = await evaluate(() => window.foo)
		expect(result).toBe('test succeeded')
	})

	test('can expose functions', async ({html, evaluate}) => {
		await html("<script type=text/hyperscript>  js     function foo() {       return 'test succeeded';     }     return { foo: foo };   end ")
		const result = await evaluate(() => window.foo())
		expect(result).toBe('test succeeded')
	})

	test('can hide functions', async ({html, evaluate}) => {
		await html("<script type=text/hyperscript>  js     function bar() {}     function foo() {       return 'test succeeded';     }     return { foo: foo };   end ")
		const result = await evaluate(() => window.foo())
		expect(result).toBe('test succeeded')
		const hasBar = await evaluate(() => 'bar' in window)
		expect(hasBar).toBe(false)
	})

	test('does not expose variables', async ({html, evaluate}) => {
		await html("<script type=text/hyperscript>  js     var foo = 'foo'     let bar = 'bar'     const baz = 'baz'   end ")
		const hasFoo = await evaluate(() => 'foo' in window)
		const hasBar = await evaluate(() => 'bar' in window)
		const hasBaz = await evaluate(() => 'baz' in window)
		expect(hasFoo).toBe(false)
		expect(hasBar).toBe(false)
		expect(hasBaz).toBe(false)
	})

})
