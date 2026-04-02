import {test, expect} from '../fixtures.js'

test.describe("the mathOperator expression", () => {

	test("addition works", async ({run}) => {
		expect(await run("1 + 1")).toBe(2)
	})

	test("string concat works", async ({run}) => {
		expect(await run("'a' + 'b'")).toBe("ab")
	})

	test("subtraction works", async ({run}) => {
		expect(await run("1 - 1")).toBe(0)
	})

	test("multiplication works", async ({run}) => {
		expect(await run("1 * 2")).toBe(2)
	})

	test("division works", async ({run}) => {
		expect(await run("1 / 2")).toBe(0.5)
	})

	test("mod works", async ({run}) => {
		expect(await run("3 mod 2")).toBe(1)
	})

	test("addition works w/ more than one value", async ({run}) => {
		expect(await run("1 + 2 + 3")).toBe(6)
	})

	test("unparenthesized expressions with multiple operators cause an error", async ({error}) => {
		const msg = await error("1 + 2 * 3")
		expect(msg).toMatch(/^You must parenthesize math operations with different operators/)
	})

	test("parenthesized expressions with multiple operators work", async ({run}) => {
		expect(await run("1 + (2 * 3)")).toBe(7)
	})

	test("can use mixed expressions", async ({evaluate}) => {
		const result = await evaluate(() => {
			return _hyperscript("1 + promiseAnIntIn(10)").then(v => v)
		})
		expect(result).toBe(43)
	})

	test("array + array concats", async ({run}) => {
		expect(await run("[1, 2] + [3, 4]")).toEqual([1, 2, 3, 4])
	})

	test("array + single value appends", async ({run}) => {
		expect(await run("[1, 2] + 3")).toEqual([1, 2, 3])
	})

	test("array + array does not mutate original", async ({run}) => {
		var result = await run("set a to [1, 2] then set b to a + [3] then return a")
		expect(result).toEqual([1, 2])
	})

	test("array concat chains", async ({run}) => {
		expect(await run("[1] + [2] + [3]")).toEqual([1, 2, 3])
	})

	test("empty array + array works", async ({run}) => {
		expect(await run("[] + [1, 2]")).toEqual([1, 2])
	})
})
