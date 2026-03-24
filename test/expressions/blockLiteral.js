import {test, expect} from '../fixtures.js'

test.describe("the blockLiteral expression", () => {

	test("basic block literals work", async ({evaluate}) => {
		const result = await evaluate(() => {
			const fn = _hyperscript("\\-> true")
			return fn()
		})
		expect(result).toBe(true)
	})

	test("basic identity works", async ({evaluate}) => {
		const result = await evaluate(() => {
			const fn = _hyperscript("\\ x -> x")
			return fn(true)
		})
		expect(result).toBe(true)
	})

	test("basic two arg identity works", async ({evaluate}) => {
		const result = await evaluate(() => {
			const fn = _hyperscript("\\ x, y -> y")
			return fn(false, true)
		})
		expect(result).toBe(true)
	})

	test("can map an array", async ({evaluate}) => {
		const result = await evaluate(() => {
			return _hyperscript("['a', 'ab', 'abc'].map(\\ s -> s.length )")
		})
		expect(result).toEqual([1, 2, 3])
	})
})
