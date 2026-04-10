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

	test("nested object literals work", async ({run}) => {
		expect(await run("{outer: {inner: 1}}")).toEqual({ outer: { inner: 1 } })
	})

	test("deeply nested object literals work", async ({run}) => {
		expect(await run("{a: {b: {c: 'deep'}}}")).toEqual({ a: { b: { c: 'deep' } } })
	})

	test("object literals can contain arrays", async ({run}) => {
		expect(await run("{items: [1, 2, 3], count: 3}")).toEqual({ items: [1, 2, 3], count: 3 })
	})

	test("object literal values can be expressions", async ({run}) => {
		expect(await run("{sum: 1 + 2, product: 3 * 4}")).toEqual({ sum: 3, product: 12 })
	})

	test("mixed field name styles in one literal", async ({run}) => {
		expect(await run('{plain: 1, "quoted": 2, -dashed: 3}')).toEqual({
			plain: 1, quoted: 2, "-dashed": 3
		})
	})
})
