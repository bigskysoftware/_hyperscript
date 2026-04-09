import {test, expect} from '../fixtures.js'

test.describe("the closest expression", () => {

	test("basic query return values", async ({html, evaluate}) => {
		await html("<div id='d3'><div id='d1'></div><div id='d2'></div></div>")

		let result = await evaluate(() => {
			const div3 = document.getElementById('d3')
			return _hyperscript("closest <div/>", { me: div3 }) === div3
		})
		expect(result).toBe(true)

		result = await evaluate(() => {
			const div1 = document.getElementById('d1')
			return _hyperscript("closest <div/>", { me: div1 }) === div1
		})
		expect(result).toBe(true)

		result = await evaluate(() => {
			const div1 = document.getElementById('d1')
			const div3 = document.getElementById('d3')
			return _hyperscript("closest <div/> to #d3", { me: div1 }) === div3
		})
		expect(result).toBe(true)

		result = await evaluate(() => {
			const div1 = document.getElementById('d1')
			const div3 = document.getElementById('d3')
			return _hyperscript("closest <div/> to my.parentElement", { me: div1 }) === div3
		})
		expect(result).toBe(true)

		result = await evaluate(() => {
			const div1 = document.getElementById('d1')
			const div3 = document.getElementById('d3')
			return _hyperscript("closest <div/> to parentElement of me", { me: div1 }) === div3
		})
		expect(result).toBe(true)
	})

	test("parent modifier works", async ({html, evaluate}) => {
		await html("<div id='d3'><div id='d1'></div><div id='d2'></div></div>")

		let result = await evaluate(() => {
			const div1 = document.getElementById('d1')
			const div3 = document.getElementById('d3')
			return _hyperscript("closest parent <div/>", { me: div1 }) === div3
		})
		expect(result).toBe(true)

		result = await evaluate(() => {
			const div2 = document.getElementById('d2')
			const div3 = document.getElementById('d3')
			return _hyperscript("closest parent <div/>", { me: div2 }) === div3
		})
		expect(result).toBe(true)
	})

	test("attributes resolve as attributes", async ({html, evaluate}) => {
		await html("<div foo='bar' id='d3'><div id='d1'></div><div id='d2'></div></div>")

		const result = await evaluate(() => {
			const div1 = document.getElementById('d1')
			return _hyperscript("closest @foo", { me: div1 })
		})
		expect(result).toBe("bar")
	})

	test("attributes can be looked up and referred to in same expression", async ({html, find}) => {
		await html("<div foo='bar'><div id='d1' _='on click put closest @foo into me'></div></div>")
		await expect(find('#d1')).toHaveText("")
		await find('#d1').dispatchEvent('click')
		await expect(find('#d1')).toHaveText("bar")
	})

	test("attributes can be set via the closest expression", async ({html, find, evaluate}) => {
		await html("<div id='outerDiv' foo='bar'><div id='d1' _='on click set closest @foo to \"doh\"'></div></div>")
		let value = await evaluate(() => document.getElementById('outerDiv').getAttribute("foo"))
		expect(value).toBe("bar")
		await find('#d1').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('outerDiv').getAttribute("foo"))).toBe("doh")
	})

	test("parenthesizing allows you to nest to modifiers properly", async ({html, find, evaluate}) => {
		await html("<div id='outerDiv' foo='bar'><div id='d1'></div></div><div id='div2' _='on click set (closest @foo to #d1) to \"doh\"'></div>")
		let value = await evaluate(() => document.getElementById('outerDiv').getAttribute("foo"))
		expect(value).toBe("bar")
		await find('#div2').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('outerDiv').getAttribute("foo"))).toBe("doh")
	})

	test("attributes can be set via the closest expression 2", async ({html, find, evaluate}) => {
		await html("<div id='outerDiv2' foo='bar'><div id='d1b' _='on click set closest @foo to \"doh\"'></div></div>")
		let value = await evaluate(() => document.getElementById('outerDiv2').getAttribute("foo"))
		expect(value).toBe("bar")
		await find('#d1b').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('outerDiv2').getAttribute("foo"))).toBe("doh")
	})

	test("closest does not consume a following where clause", async ({html, find}) => {
		await html(
			"<table><tr><td>" +
			"<input type='checkbox' class='cb'>" +
			"<input type='checkbox' class='cb'>" +
			"<input id='master' type='checkbox' " +
			"_=\"set :others to <input[type=checkbox]/> in the closest <table/> where it is not me " +
			"on click put :others.length into #out\">" +
			"</td></tr></table>" +
			"<div id='out'></div>"
		);
		await find('#master').click();
		await expect(find('#out')).toHaveText("2");
	})

	test("closest with to modifier still works after parse change", async ({html, evaluate}) => {
		await html("<div id='outer'><div id='inner'></div></div>")
		let result = await evaluate(() => {
			const inner = document.getElementById('inner')
			const outer = document.getElementById('outer')
			return _hyperscript("closest <div/> to my.parentElement", { me: inner }) === outer
		})
		expect(result).toBe(true)
	})

	test("returns an array where appropriate", async ({html, find, evaluate}) => {
		await html(
			"<div id='d2' class='bar'><div id='d1' class='foo' _='on click add .doh to closest .bar to .foo'></div></div>" +
			"<div id='d3' class='bar'><div class='foo'></div></div>"
		)
		let hasDoh = await evaluate(() => document.getElementById('d2').classList.contains("doh"))
		expect(hasDoh).toBe(false)
		hasDoh = await evaluate(() => document.getElementById('d3').classList.contains("doh"))
		expect(hasDoh).toBe(false)
		await find('#d1').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('d2').classList.contains("doh"))).toBe(true)
		await expect.poll(() => evaluate(() => document.getElementById('d3').classList.contains("doh"))).toBe(true)
	})
})
