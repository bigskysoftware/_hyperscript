import {test, expect} from '../fixtures.js'

test.describe("the some expression", () => {

	test("some returns false for null", async ({run}) => {
		expect(await run("some null")).toBe(false)
	})

	test("some returns true for non-null", async ({run}) => {
		expect(await run("some 'thing'")).toBe(true)
	})

	test("some returns false for empty array", async ({run}) => {
		expect(await run("some []")).toBe(false)
	})

	test("some returns false for empty selector", async ({run}) => {
		expect(await run("some .aClassThatDoesNotExist")).toBe(false)
	})

	test("some returns true for nonempty selector", async ({run}) => {
		expect(await run("some <html/>")).toBe(true)
	})

	test("some returns true for filled array", async ({run}) => {
		expect(await run("some ['thing']")).toBe(true)
	})
})
