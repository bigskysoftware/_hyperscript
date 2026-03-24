import {test, expect} from '../fixtures.js'

test.describe("the number expression", () => {

	test("handles numbers properly", async ({run}) => {
		expect(await run("-1")).toBe(-1)
		expect(await run("1")).toBe(1)
		expect(await run("1.1")).toBe(1.1)
		expect(await run("1e6")).toBe(1e6)
		expect(await run("1e-6")).toBe(1e-6)
		expect(await run("1.1e6")).toBe(1.1e6)
		expect(await run("1.1e-6")).toBe(1.1e-6)
		expect(await run("1234567890.1234567890")).toBe(1234567890.123456789)
	})
})
