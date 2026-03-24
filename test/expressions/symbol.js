import {test, expect} from '../fixtures.js'

test.describe("the symbol expression", () => {

	test("resolves local context properly", async ({run}) => {
		const result = await run("foo", { locals: { foo: 42 } })
		expect(result).toBe(42)
	})

	test("resolves global context properly", async ({evaluate}) => {
		const result = await evaluate(() => {
			const r = _hyperscript("document", { locals: { foo: 42 } })
			return r === document
		})
		expect(result).toBe(true)
	})
})
