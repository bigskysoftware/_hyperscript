import {test, expect} from '../fixtures.js'

test.describe("the idRef expression", () => {

	test("basic id ref works", async ({html, evaluate}) => {
		await html("<div id='d1'></div>")
		const result = await evaluate(() => {
			const div = document.getElementById('d1')
			return _hyperscript("#d1") === div
		})
		expect(result).toBe(true)
	})

	test("basic id ref works w no match", async ({html, run}) => {
		await html("<div></div>")
		const result = await run("#d1")
		expect(result).toBeNull()
	})

	test("template id ref works", async ({html, evaluate}) => {
		await html("<div id='d1'></div>")
		const result = await evaluate(() => {
			const div = document.getElementById('d1')
			return _hyperscript("#{'d1'}") === div
		})
		expect(result).toBe(true)
	})

	test("id ref works from a disconnected element", async ({html, evaluate}) => {
		await html("<div id='d1'></div>")
		const result = await evaluate(() => {
			const div = document.getElementById('d1')
			return _hyperscript("#d1", { me: document.createElement('div') }) === div
		})
		expect(result).toBe(true)
	})
})
