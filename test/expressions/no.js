import {test, expect} from '../fixtures.js'

test.describe("the no expression", () => {

	test("no returns true for null", async ({run}) => {
		expect(await run("no null")).toBe(true)
	})

	test("no returns false for non-null", async ({run}) => {
		expect(await run("no 'thing'")).toBe(false)
	})

	test("no returns true for empty array", async ({run}) => {
		expect(await run("no []")).toBe(true)
	})

	test("no returns true for empty selector", async ({run}) => {
		expect(await run("no .aClassThatDoesNotExist")).toBe(true)
	})

	test("no returns false for non-empty array", async ({run}) => {
		expect(await run("no ['thing']")).toBe(false)
	})
})
