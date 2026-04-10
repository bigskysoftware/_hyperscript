import {test, expect} from '../fixtures.js'

test.describe("propertyAccess", () => {

	test("can access basic properties", async ({run}) => {
		const result = await run("foo.foo", { locals: { foo: { foo: "foo" } } })
		expect(result).toBe("foo")
	})

	test("is null safe", async ({run}) => {
		const result = await run("foo.foo")
		expect(result).toBeUndefined()
	})

	test("of form works", async ({run}) => {
		const result = await run("foo of foo", { locals: { foo: { foo: "foo" } } })
		expect(result).toBe("foo")
	})

	test("of form works w/ complex left side", async ({run}) => {
		const result = await run("bar.doh of foo", {
			locals: { foo: { bar: { doh: "foo" } } }
		})
		expect(result).toBe("foo")
	})

	test("of form works w/ complex right side", async ({run}) => {
		const result = await run("doh of foo.bar", {
			locals: { foo: { bar: { doh: "foo" } } }
		})
		expect(result).toBe("foo")
	})

	test("works properly w/ boolean properties", async ({html, run}) => {
		await html("<input class='cb' type='checkbox' checked='checked'/> <input class='cb' type='checkbox'/> ")
		const result = await run(".cb.checked")
		expect(result).toEqual([true, false])
	})

	test("chained property access (three levels)", async ({run}) => {
		const result = await run("a.b.c", { locals: { a: { b: { c: "deep" } } } })
		expect(result).toBe("deep")
	})

	test("chained property access (four levels)", async ({run}) => {
		const result = await run("a.b.c.d", { locals: { a: { b: { c: { d: 42 } } } } })
		expect(result).toBe(42)
	})

	test("null-safe access through an undefined intermediate", async ({run}) => {
		const result = await run("a.b.c", { locals: { a: {} } })
		expect(result).toBeUndefined()
	})

	test("property access on function result", async ({run, evaluate}) => {
		await evaluate(() => { window.makeObj = () => ({ name: 'hi' }) })
		expect(await run("makeObj().name")).toBe('hi')
		await evaluate(() => { delete window.makeObj })
	})

	test("of form chains through multiple levels", async ({run}) => {
		const result = await run("c of b of a", { locals: { a: { b: { c: "deep" } } } })
		expect(result).toBe("deep")
	})

	test("mixing dot and of forms", async ({run}) => {
		const result = await run("c of a.b", { locals: { a: { b: { c: "mixed" } } } })
		expect(result).toBe("mixed")
	})
})
