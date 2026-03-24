import {test, expect} from '../fixtures.js'

test.describe("the queryRef expression", () => {

	test("basic queryRef works", async ({html, evaluate}) => {
		await html("<div class='c1'></div>")
		const len = await evaluate(() => Array.from(_hyperscript("<.c1/>")).length)
		expect(len).toBe(1)
	})

	test("basic queryRef works w/ multiple matches", async ({html, evaluate}) => {
		await html("<div class='c1'></div><div class='c1'></div><div class='c1'></div>")
		const len = await evaluate(() => Array.from(_hyperscript("<.c1/>")).length)
		expect(len).toBe(3)
	})

	test("basic queryRef works w/ properties", async ({html, evaluate}) => {
		await html("<div title='t1'></div><div title='t2'></div><div title='t3'></div>")
		const len = await evaluate(() => Array.from(_hyperscript("<[title=t2]/>")).length)
		expect(len).toBe(1)
	})

	test("basic queryRef works w/ funny selector", async ({html, evaluate}) => {
		await html("<div title='t1'></div><div title='t2'></div><div title='t3'></div>")
		const len = await evaluate(() => Array.from(_hyperscript("<:active/>")).length)
		expect(len).toBe(0)
	})

	test("basic queryRef works w/ div selector", async ({html, evaluate}) => {
		await html("<div class='c1'></div><div class='c2'></div><div class='c3'></div>")
		const len = await evaluate(() => Array.from(_hyperscript("<div.c1/>")).length)
		expect(len).toBe(1)
	})

	test("basic queryRef works w no match", async ({evaluate}) => {
		const len = await evaluate(() => Array.from(_hyperscript("<.badClassThatDoesNotHaveAnyElements/>")).length)
		expect(len).toBe(0)
	})

	test("basic queryRef works w properties w/ strings", async ({html, evaluate}) => {
		await html("<div class='c1'></div><div foo='bar' class='c2'></div><div class='c3'></div>")
		const len = await evaluate(() => Array.from(_hyperscript("<[foo='bar']/>")).length)
		expect(len).toBe(1)
	})

	test("queryRef w/ $ works", async ({html, evaluate}) => {
		await html("<div class='c1'></div><div foo='bar' class='c2'></div><div class='c3'></div>")
		const len = await evaluate(() => {
			return Array.from(_hyperscript("<[foo='${x}']/>", { locals: { x: "bar" } })).length
		})
		expect(len).toBe(1)
	})

	test("queryRef w/ $ no curlies works", async ({html, evaluate}) => {
		await html("<div id='t1'></div><div id='t2'></div><div id='t3'></div>")
		const result = await evaluate(() => {
			const value = _hyperscript("<#$id/>", { locals: { id: "t2" } })
			return Array.from(value)[0] === document.getElementById("t2")
		})
		expect(result).toBe(true)
	})

	test("can interpolate elements into queries", async ({html, evaluate}) => {
		await html("<div class='a'></div><div class='b'></div>")
		const result = await evaluate(() => {
			const a = document.querySelector('#work-area .a')
			const value = _hyperscript("<${a} + div/>", { locals: { a } })
			return Array.from(value)[0] === document.querySelector('#work-area .b')
		})
		expect(result).toBe(true)
	})

	test("queryRefs support colons properly", async ({html, evaluate}) => {
		await html("<input class='foo' type='checkbox' checked='checked'>")
		const len = await evaluate(() => Array.from(_hyperscript("<input.foo:checked/>")).length)
		expect(len).toBe(1)
	})

	test("queryRefs support tildes properly", async ({html, evaluate}) => {
		await html("<div title='little flower'></div>")
		const len = await evaluate(() => Array.from(_hyperscript('<[title~="flower"]/>')).length)
		expect(len).toBe(1)
	})

	test("queryRefs support dollar properly", async ({html, evaluate}) => {
		await html("<div title='little flower'></div>")
		const len = await evaluate(() => Array.from(_hyperscript('<[title$="flower"]/>')).length)
		expect(len).toBe(1)
	})
})
