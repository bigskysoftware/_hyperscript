import {test, expect} from '../fixtures.js'

test.describe("the positional expression", () => {

	test("first works", async ({run}) => {
		expect(await run("the first of [1, 2, 3]")).toBe(1)
	})

	test("last works", async ({run}) => {
		expect(await run("the last of [1, 2, 3]")).toBe(3)
	})

	test("first works w/ array-like", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div>" +
			"<div id='d2' class='c1'></div>" +
			"<div id='d3' class='c1'></div>"
		)
		const result = await evaluate(() => {
			return _hyperscript("the first of .c1") === document.getElementById("d1")
		})
		expect(result).toBe(true)
	})

	test("last works w/ array-like", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div>" +
			"<div id='d2' class='c1'></div>" +
			"<div id='d3' class='c1'></div>"
		)
		const result = await evaluate(() => {
			return _hyperscript("the last of .c1") === document.getElementById("d3")
		})
		expect(result).toBe(true)
	})

	test("first works w/ node", async ({html, evaluate}) => {
		await html(
			"<div id='outerDiv'><div id='d1' class='c1'></div>" +
			"<div id='d2' class='c1'></div>" +
			"<div id='d3' class='c1'></div></div>"
		)
		const result = await evaluate(() => {
			const div = document.getElementById('outerDiv')
			return _hyperscript("the first of div", { locals: { div: div } }) === document.getElementById("d1")
		})
		expect(result).toBe(true)
	})

	test("last works w/ node", async ({html, evaluate}) => {
		await html(
			"<div id='outerDiv'><div id='d1' class='c1'></div>" +
			"<div id='d2' class='c1'></div>" +
			"<div id='d3' class='c1'></div></div>"
		)
		const result = await evaluate(() => {
			const div = document.getElementById('outerDiv')
			return _hyperscript("the last of div", { locals: { div: div } }) === document.getElementById("d3")
		})
		expect(result).toBe(true)
	})

	test("is null safe", async ({run}) => {
		const result = await run("the first of null")
		expect(result).toBeUndefined()
	})
})
