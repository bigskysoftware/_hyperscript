import {test, expect} from '../fixtures.js'

test.describe("the relative positional expression", () => {

	test("next works properly among siblings", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div>" +
			"<div id='d2' class='c1'></div>" +
			"<div id='d3' class='c1'></div>"
		)
		let result = await evaluate(() => _hyperscript("the next <div/> from #d1") === document.getElementById("d2"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the next <div/> from #d2") === document.getElementById("d3"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the next <div/> from #d3"))
		expect(result).toBeUndefined()
	})

	test("next works properly among siblings with wrapping", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div>" +
			"<div id='d2' class='c1'></div>" +
			"<div id='d3' class='c1'></div>"
		)
		let result = await evaluate(() => _hyperscript("the next <div/> from #d1 within the #work-area with wrapping") === document.getElementById("d2"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the next <div/> from #d2 within the #work-area with wrapping") === document.getElementById("d3"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the next <div/> from #d3 within the #work-area with wrapping") === document.getElementById("d1"))
		expect(result).toBe(true)
	})

	test("relative next works properly among siblings w/ query", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' _='on click add .foo to next <div/>' class='c1'></div>" +
			"<div id='d2' class='c1'></div>"
		)
		await find('#d1').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('d2').classList.contains('foo'))).toBe(true)
	})

	test("relative next works properly among siblings w/ class", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' _='on click add .foo to next .c1' class='c1'></div>" +
			"<div id='d2' class='c1'></div>"
		)
		await find('#d1').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('d2').classList.contains('foo'))).toBe(true)
	})

	test("relative next works properly among siblings w/ query & class", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' _='on click add .foo to next <div.c1/>' class='c1'></div>" +
			"<div id='d2' class='c1'></div>"
		)
		await find('#d1').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('d2').classList.contains('foo'))).toBe(true)
	})

	test("previous works properly among siblings", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div>" +
			"<div id='d2' class='c1'></div>" +
			"<div id='d3' class='c1'></div>"
		)
		let result = await evaluate(() => _hyperscript("the previous <div/> from #d1 within #work-area"))
		expect(result).toBeUndefined()
		result = await evaluate(() => _hyperscript("the previous <div/> from #d2") === document.getElementById("d1"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the previous <div/> from #d3") === document.getElementById("d2"))
		expect(result).toBe(true)
	})

	test("previous works properly among siblings with wrapping", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div>" +
			"<div id='d2' class='c1'></div>" +
			"<div id='d3' class='c1'></div>"
		)
		let result = await evaluate(() => _hyperscript("the previous <div/> from #d1 within the #work-area with wrapping") === document.getElementById("d3"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the previous <div/> from #d2 within the #work-area with wrapping") === document.getElementById("d1"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the previous <div/> from #d3 within the #work-area with wrapping") === document.getElementById("d2"))
		expect(result).toBe(true)
	})

	test("relative previous works properly among siblings w/ query", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div>" +
			"<div id='d2' _='on click add .foo to previous <div/>' class='c1'></div>"
		)
		await find('#d2').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('d1').classList.contains('foo'))).toBe(true)
	})

	test("relative previous works properly among siblings w/ class", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div>" +
			"<div id='d2' _='on click add .foo to previous .c1' class='c1'></div>"
		)
		await find('#d2').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('d1').classList.contains('foo'))).toBe(true)
	})

	test("relative previous works properly among siblings w/ query & class", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div>" +
			"<div id='d2' _='on click add .foo to previous <div.c1/>' class='c1'></div>"
		)
		await find('#d2').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('d1').classList.contains('foo'))).toBe(true)
	})

	test("properly constrains via the within modifier", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'><div id='d2' class='c1'></div><div id='d3' class='c1'></div></div><div id='d4' class='c1'></div>"
		)
		let result = await evaluate(() => _hyperscript("the next .c1 from #d2 within #d1") === document.getElementById("d3"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the next .c1 from #d3 within #d1"))
		expect(result).toBeUndefined()
		result = await evaluate(() => _hyperscript("the next .c1 from #d3 within the #work-area") === document.getElementById("d4"))
		expect(result).toBe(true)
	})

	test("next works properly with array-like", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div><p class='c1'></p>" +
			"<div id='d2' class='c1'></div><p class='c1'></p>" +
			"<div id='d3' class='c1'></div>"
		)
		let result = await evaluate(() => _hyperscript("the next <div/> from #d1 in .c1") === document.getElementById("d2"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the next <div/> from #d2 in .c1") === document.getElementById("d3"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the next <div/> from #d3 in .c1"))
		expect(result).toBeUndefined()
	})

	test("next works properly with array-like and wrap", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div><p class='c1'></p>" +
			"<div id='d2' class='c1'></div><p class='c1'></p>" +
			"<div id='d3' class='c1'></div>"
		)
		let result = await evaluate(() => _hyperscript("the next <div/> from #d1 in .c1 with wrapping") === document.getElementById("d2"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the next <div/> from #d2 in .c1  with wrapping") === document.getElementById("d3"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the next <div/> from #d3 in .c1  with wrapping") === document.getElementById("d1"))
		expect(result).toBe(true)
	})

	test("next works properly with array-like no match", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div><p class='c1'></p>" +
			"<div id='d2' class='c1'></div><p class='c1'></p>" +
			"<div id='d3' class='c1'></div>"
		)
		expect(await evaluate(() => _hyperscript("the next <h1/> from #d1 in .c1"))).toBeUndefined()
		expect(await evaluate(() => _hyperscript("the next <h1/> from #d2 in .c1"))).toBeUndefined()
		expect(await evaluate(() => _hyperscript("the next <h1/> from #d3 in .c1"))).toBeUndefined()
	})

	test("next works properly with array-like no match and wrap", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div><p class='c1'></p>" +
			"<div id='d2' class='c1'></div><p class='c1'></p>" +
			"<div id='d3' class='c1'></div>"
		)
		expect(await evaluate(() => _hyperscript("the next <h1/> from #d1 in .c1 with wrapping"))).toBeUndefined()
		expect(await evaluate(() => _hyperscript("the next <h1/> from #d2 in .c1 with wrapping"))).toBeUndefined()
		expect(await evaluate(() => _hyperscript("the next <h1/> from #d3 in .c1 with wrapping"))).toBeUndefined()
	})

	test("previous works properly with array-like", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div><p class='c1'></p>" +
			"<div id='d2' class='c1'></div><p class='c1'></p>" +
			"<div id='d3' class='c1'></div>"
		)
		expect(await evaluate(() => _hyperscript("the previous <div/> from #d1 in .c1"))).toBeUndefined()
		let result = await evaluate(() => _hyperscript("the previous <div/> from #d2 in .c1") === document.getElementById("d1"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the previous <div/> from #d3 in .c1") === document.getElementById("d2"))
		expect(result).toBe(true)
	})

	test("previous works properly with array-like and wrap", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div><p class='c1'></p>" +
			"<div id='d2' class='c1'></div><p class='c1'></p>" +
			"<div id='d3' class='c1'></div>"
		)
		let result = await evaluate(() => _hyperscript("the previous <div/> from #d1 in .c1 with wrapping") === document.getElementById("d3"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the previous <div/> from #d2 in .c1  with wrapping") === document.getElementById("d1"))
		expect(result).toBe(true)
		result = await evaluate(() => _hyperscript("the previous <div/> from #d3 in .c1  with wrapping") === document.getElementById("d2"))
		expect(result).toBe(true)
	})

	test("previous works properly with array-like no match", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div><p class='c1'></p>" +
			"<div id='d2' class='c1'></div><p class='c1'></p>" +
			"<div id='d3' class='c1'></div>"
		)
		expect(await evaluate(() => _hyperscript("the previous <h1/> from #d1 in .c1"))).toBeUndefined()
		expect(await evaluate(() => _hyperscript("the previous <h1/> from #d2 in .c1"))).toBeUndefined()
		expect(await evaluate(() => _hyperscript("the previous <h1/> from #d3 in .c1"))).toBeUndefined()
	})

	test("previous works properly with array-like no match and wrap", async ({html, evaluate}) => {
		await html(
			"<div id='d1' class='c1'></div><p class='c1'></p>" +
			"<div id='d2' class='c1'></div><p class='c1'></p>" +
			"<div id='d3' class='c1'></div>"
		)
		expect(await evaluate(() => _hyperscript("the previous <h1/> from #d1 in .c1 with wrapping"))).toBeUndefined()
		expect(await evaluate(() => _hyperscript("the previous <h1/> from #d2 in .c1 with wrapping"))).toBeUndefined()
		expect(await evaluate(() => _hyperscript("the previous <h1/> from #d3 in .c1 with wrapping"))).toBeUndefined()
	})

	// ================================================================
	// Possessive access on positional expressions
	// ================================================================

	test("can access property of next element with possessive", async ({html, evaluate}) => {
		await html('<div id="d1"></div><div id="d2">hello</div>')
		let result = await evaluate(() => _hyperscript("the next <div/>'s textContent", {me: document.getElementById('d1')}))
		expect(result).toBe('hello')
	})

	test("can access property of previous element with possessive", async ({html, evaluate}) => {
		await html('<div id="d1">world</div><div id="d2"></div>')
		let result = await evaluate(() => _hyperscript("the previous <div/>'s textContent", {me: document.getElementById('d2')}))
		expect(result).toBe('world')
	})

	test("can access style of next element with possessive", async ({html, find, evaluate}) => {
		await html('<div id="d1"></div><div id="d2" style="color: red"></div>')
		let result = await evaluate(() => _hyperscript("the next <div/>'s *color", {me: document.getElementById('d1')}))
		expect(result).toBe('red')
	})

	test("can write to next element with put command", async ({html, find, evaluate}) => {
		await evaluate(() => {
			var wa = document.getElementById('work-area');
			wa.innerHTML = '<div id="d1"></div><div id="d2">original</div>';
			wa.querySelector('#d1').setAttribute('_', "on click put 'updated' into the next <div/>'s textContent");
			_hyperscript.process(wa);
		});
		await find('#d1').dispatchEvent('click');
		await expect(find('#d2')).toHaveText('updated');
	})
})
