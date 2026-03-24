import {test, expect} from '../fixtures.js'

test.describe("the not expression", () => {

	test("not inverts true", async ({run}) => {
		expect(await run("not true")).toBe(false)
	})

	test("not inverts false", async ({run}) => {
		expect(await run("not false")).toBe(true)
	})

	test("two nots make a true", async ({run}) => {
		expect(await run("not not true")).toBe(true)
	})
})
