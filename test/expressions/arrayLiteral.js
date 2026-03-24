import {test, expect} from '../fixtures.js'

test.describe("the arrayLiteral expression", () => {

	test("empty array literals work", async ({run}) => {
		const result = await run("[]")
		expect(result).toEqual([])
	})

	test("one element array literal works", async ({run}) => {
		const result = await run("[true]")
		expect(result).toEqual([true])
	})

	test("multi element array literal works", async ({run}) => {
		const result = await run("[true, false]")
		expect(result).toEqual([true, false])
	})
})
