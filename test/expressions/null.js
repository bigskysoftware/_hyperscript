import {test, expect} from '../fixtures.js'

test.describe("the null literal expression", () => {

	test("null literal work", async ({run}) => {
		const result = await run("null")
		expect(result).toBeNull()
	})
})
