import {test, expect} from '../fixtures.js'

test.describe("the in expression", () => {

	test("basic no query return values", async ({run}) => {
		expect(await run("1 in [1, 2, 3]")).toEqual([1])
		expect(await run("[1, 3] in [1, 2, 3]")).toEqual([1, 3])
		expect(await run("[1, 3, 4] in [1, 2, 3]")).toEqual([1, 3])
		expect(await run("[4, 5, 6] in [1, 2, 3]")).toEqual([])
	})

	test("basic query return values", async ({html, evaluate}) => {
		await html("<div id='d1'><p></p><p></p></div>")
		let result = await evaluate(() => _hyperscript("<p/> in #d1").length)
		expect(result).toBe(2)

		await html("<div id='d2'><p class='foo'></p><p></p></div>")
		result = await evaluate(() => _hyperscript("<p.foo/> in #d2").length)
		expect(result).toBe(1)

		await html("<div id='d3'><p class='foo'></p><p></p></div>")
		result = await evaluate(() => _hyperscript("<p.foo/> in <div#d3/>").length)
		expect(result).toBe(1)
	})

	test("id returns values", async ({html, find, evaluate}) => {
		await html("<div id='inDiv' _='on click get #p1 in me then put its id into @result'><p id='p1'></p></div>")
		await find('#inDiv').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('inDiv').getAttribute("result"))).toBe('p1')
	})

	test("id template returns values", async ({html, find, evaluate}) => {
		await html("<div id='inDiv' _='on click get #{\"p1\"} in me then put its id into @result'><p id='p1'></p></div>")
		await find('#inDiv').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('inDiv').getAttribute("result"))).toBe('p1')
	})

	test("class returns values", async ({html, find, evaluate}) => {
		await html("<div id='inDiv' _='on click get the first .p1 in me then put its id into @result'><p id='p1' class='p1'></p></div>")
		await find('#inDiv').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('inDiv').getAttribute("result"))).toBe('p1')
	})

	test("class template returns values", async ({html, find, evaluate}) => {
		await html("<div id='inDiv' _='on click get the first .{\"p1\"} in me then put its id into @result'><p id='p1' class='p1'></p></div>")
		await find('#inDiv').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('inDiv').getAttribute("result"))).toBe('p1')
	})

	test("query returns values", async ({html, find, evaluate}) => {
		await html("<div id='inDiv' _='on click get the first <p/> in me then put its id into @result'><p id='p1' class='p1'></p></div>")
		await find('#inDiv').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('inDiv').getAttribute("result"))).toBe('p1')
	})

	test("query template returns values", async ({html, find, evaluate}) => {
		await html("<div id='inDiv' _='on click get the first <${\"p\"}/> in me then put its id into @result'><p id='p1' class='p1'></p></div>")
		await find('#inDiv').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('inDiv').getAttribute("result"))).toBe('p1')
	})

	test("in expression binds to unaryOperators", async ({html, run}) => {
		await html("<div id='d2'><p class='foo'>bar</p><p></p></div>")
		const result = await run("the innerText of the first <p.foo/> in #d2 is 'bar'")
		expect(result).toBe(true)
	})
})
