import {test, expect} from '../fixtures.js'

test.describe("the boolean literal expression", () => {

	test("true boolean literals work", async ({run}) => {
		const result = await run("true")
		expect(result).toBe(true)
	})

	test("false boolean literals work", async ({run}) => {
		const result = await run("false")
		expect(result).toBe(false)
	})
})
