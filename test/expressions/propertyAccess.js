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
})
