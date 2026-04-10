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

	test("mixed-type array literal works", async ({run}) => {
		expect(await run("[1, 'two', true, null]")).toEqual([1, 'two', true, null])
	})

	test("nested array literals work", async ({run}) => {
		expect(await run("[[1, 2], [3, 4]]")).toEqual([[1, 2], [3, 4]])
	})

	test("deeply nested array literals work", async ({run}) => {
		expect(await run("[[[1]], [[2, 3]]]")).toEqual([[[1]], [[2, 3]]])
	})

	test("arrays containing objects work", async ({run}) => {
		expect(await run("[{a: 1}, {b: 2}]")).toEqual([{a: 1}, {b: 2}])
	})

	test("arrays can contain expressions", async ({run}) => {
		expect(await run("[1 + 1, 2 * 3, 10 - 5]")).toEqual([2, 6, 5])
	})
})
