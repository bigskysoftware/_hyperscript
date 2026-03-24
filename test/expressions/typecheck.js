import {test, expect} from '../fixtures.js'

test.describe("the typecheck expression", () => {

	test("can do basic string typecheck", async ({run}) => {
		const result = await run("'foo' : String")
		expect(result).toBe("foo")
	})

	test("can do null as string typecheck", async ({run}) => {
		const result = await run("null : String")
		expect(result).toBeNull()
	})

	test("can do basic non-string typecheck failure", async ({evaluate}) => {
		const msg = await evaluate(() => {
			try {
				_hyperscript("true : String")
				return null
			} catch (e) {
				return e.message
			}
		})
		expect(msg).toMatch(/^Typecheck failed!/)
	})

	test("can do basic string non-null typecheck", async ({run}) => {
		const result = await run("'foo' : String!")
		expect(result).toBe("foo")
	})

	test("null causes null safe string check to fail", async ({evaluate}) => {
		const msg = await evaluate(() => {
			try {
				_hyperscript("null : String!")
				return null
			} catch (e) {
				return e.message
			}
		})
		expect(msg).toMatch(/^Typecheck failed!/)
	})
})
