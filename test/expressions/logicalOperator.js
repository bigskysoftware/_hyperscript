import {test, expect} from '../fixtures.js'

test.describe("the logicalOperator expression", () => {

	test("and works", async ({run}) => {
		const result = await run("true and false")
		expect(result).toBe(false)
	})

	test("or works", async ({run}) => {
		const result = await run("true or false")
		expect(result).toBe(true)
	})

	test("and works w/ more than one value", async ({run}) => {
		const result = await run("true and true and false")
		expect(result).toBe(false)
	})

	test("unparenthesized expressions with multiple operators cause an error", async ({error}) => {
		const msg = await error("true and false or true")
		expect(msg).toMatch(/^You must parenthesize logical operations with different operators/)
	})

	test("parenthesized expressions with multiple operators work", async ({run}) => {
		const result = await run("true and (false or true)")
		expect(result).toBe(true)
	})

	test("should short circuit with and expression", async ({evaluate}) => {
		const result = await evaluate(() => {
			let func1Called = false
			let func2Called = false
			const func1 = () => { func1Called = true; return false }
			const func2 = () => { func2Called = true; return false }
			const r = _hyperscript("func1() and func2()", {locals: {func1, func2}})
			return { result: r, func1Called, func2Called }
		})
		expect(result.result).toBe(false)
		expect(result.func1Called).toBe(true)
		expect(result.func2Called).toBe(false)
	})

	test("should short circuit with or expression", async ({evaluate}) => {
		const result = await evaluate(() => {
			let func1Called = false
			let func2Called = false
			const func1 = () => { func1Called = true; return true }
			const func2 = () => { func2Called = true; return true }
			const r = _hyperscript("func1() or func2()", {locals: {func1, func2}})
			return { result: r, func1Called, func2Called }
		})
		expect(result.result).toBe(true)
		expect(result.func1Called).toBe(true)
		expect(result.func2Called).toBe(false)
	})
})
