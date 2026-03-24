import {test, expect} from '../fixtures.js'

test.describe("function call expressions", () => {

	test("can invoke global function", async ({run, evaluate}) => {
		await evaluate(() => { window.identity = (x) => x })
		const result = await run('identity("foo")')
		expect(result).toBe("foo")
	})

	test("can invoke function on object", async ({run, evaluate}) => {
		await evaluate(() => {
			window.obj = {
				value: "foo",
				getValue: function () { return this.value },
			}
		})
		const result = await run("obj.getValue()")
		expect(result).toBe("foo")
	})

	test("can invoke global function w/ async arg", async ({evaluate}) => {
		await evaluate(() => { window.identity = (x) => x })
		const result = await evaluate(() => {
			return _hyperscript("identity(promiseAnIntIn(10))").then(r => r)
		})
		expect(result).toBe(42)
	})

	test("can invoke function on object w/ async arg", async ({evaluate}) => {
		await evaluate(() => {
			window.obj = { identity: (x) => x }
		})
		const result = await evaluate(() => {
			return _hyperscript("obj.identity(promiseAnIntIn(10))").then(r => r)
		})
		expect(result).toBe(42)
	})

	test("can invoke function on object w/ async root & arg", async ({evaluate}) => {
		await evaluate(() => {
			window.obj = { identity: (x) => x }
		})
		const result = await evaluate(() => {
			return _hyperscript("promiseValueBackIn(obj, 20).identity(promiseAnIntIn(10))").then(r => r)
		})
		expect(result).toBe(42)
	})
})
