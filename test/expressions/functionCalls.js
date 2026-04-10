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

	test("can pass multiple arguments", async ({html, find, evaluate}) => {
		await evaluate(() => { window.add = (a, b, c) => a + b + c })
		await html(`<div _="on click put add(1, 2, 3) into me"></div>`)
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('6')
		await evaluate(() => { delete window.add })
	})

	test("can pass no arguments", async ({run, evaluate}) => {
		await evaluate(() => { window.getFortyTwo = () => 42 })
		expect(await run("getFortyTwo()")).toBe(42)
		await evaluate(() => { delete window.getFortyTwo })
	})

	test("can chain calls on the result of a call", async ({run, evaluate}) => {
		await evaluate(() => {
			window.getObj = () => ({ greet: () => 'hi' })
		})
		expect(await run("getObj().greet()")).toBe('hi')
		await evaluate(() => { delete window.getObj })
	})

	test("can access a property of a call's result", async ({run, evaluate}) => {
		await evaluate(() => { window.makePoint = (x, y) => ({ x: x, y: y }) })
		expect(await run("makePoint(3, 4).x")).toBe(3)
		expect(await run("makePoint(3, 4).y")).toBe(4)
		await evaluate(() => { delete window.makePoint })
	})

	test("can pass an expression as an argument", async ({run, evaluate}) => {
		await evaluate(() => { window.double = (n) => n * 2 })
		expect(await run("double(3 + 4)")).toBe(14)
		await evaluate(() => { delete window.double })
	})

	test("can pass an object literal as an argument", async ({run, evaluate}) => {
		await evaluate(() => { window.getName = (o) => o.name })
		expect(await run("getName({name: 'Alice'})")).toBe('Alice')
		await evaluate(() => { delete window.getName })
	})

	test("can pass an array literal as an argument", async ({run, evaluate}) => {
		await evaluate(() => { window.sum = (arr) => arr.reduce((a, b) => a + b, 0) })
		expect(await run("sum([1, 2, 3, 4])")).toBe(10)
		await evaluate(() => { delete window.sum })
	})
})
