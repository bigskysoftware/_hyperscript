import {test, expect} from '../fixtures.js'

test.describe("the objectLiteral expression", () => {

	test("empty object literals work", async ({run}) => {
		expect(await run("{}")).toEqual({})
	})

	test("one field object literal works", async ({run}) => {
		expect(await run("{foo:true}")).toEqual({ foo: true })
	})

	test("multi-field object literal works", async ({run}) => {
		expect(await run("{foo:true, bar:false}")).toEqual({ foo: true, bar: false })
	})

	test("strings work in object literal field names", async ({run}) => {
		expect(await run('{"foo":true, "bar":false}')).toEqual({ foo: true, bar: false })
	})

	test("hyphens work in object literal field names", async ({run}) => {
		expect(await run("{-foo:true, bar-baz:false}")).toEqual({ "-foo": true, "bar-baz": false })
	})

	test("allows trailing commas", async ({run}) => {
		expect(await run("{foo:true, bar-baz:false,}")).toEqual({ "foo": true, "bar-baz": false })
	})

	test("expressions work in object literal field names", async ({evaluate}) => {
		const result = await evaluate(() => {
			window.foo = "bar"
			window.bar = function () { return "foo" }
			const r = _hyperscript("{[foo]:true, [bar()]:false}")
			delete window.foo
			delete window.bar
			return r
		})
		expect(result).toEqual({ bar: true, foo: false })
	})
})
