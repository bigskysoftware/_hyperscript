import {test, expect} from '../fixtures.js'

test.describe("the string postfix expression", () => {

	test("handles basic postfix strings properly", async ({run}) => {
		expect(await run("1em")).toBe("1em")
		expect(await run("1px")).toBe("1px")
		expect(await run("-1px")).toBe("-1px")
		expect(await run("100%")).toBe("100%")
	})

	test("handles basic postfix strings with spaces properly", async ({run}) => {
		expect(await run("1 em")).toBe("1em")
		expect(await run("1 px")).toBe("1px")
		expect(await run("100 %")).toBe("100%")
	})

	test("handles expression roots properly", async ({run}) => {
		expect(await run("(0 + 1) em")).toBe("1em")
		expect(await run("(0 + 1) px")).toBe("1px")
		expect(await run("(100 + 0) %")).toBe("100%")
	})
})
