import {test, expect} from '../fixtures.js'

test.describe("the attributeRef expression", () => {

	test("attributeRef with no value works", async ({html, evaluate}) => {
		await html("<div id='arDiv' foo='c1'></div>")
		const value = await evaluate(() => _hyperscript("[@foo]", { me: document.getElementById('arDiv') }))
		expect(value).toBe("c1")
	})

	test("attributeRef with dashes name works", async ({html, evaluate}) => {
		await html("<div id='arDiv' data-foo='c1'></div>")
		const value = await evaluate(() => _hyperscript("[@data-foo]", { me: document.getElementById('arDiv') }))
		expect(value).toBe("c1")
	})

	test("attributeRef can be set as symbol", async ({html, find, evaluate}) => {
		await html("<div id='arDiv' _='on click set [@data-foo] to \"blue\"' data-foo='red'></div>")
		await find('#arDiv').dispatchEvent('click')
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can have value used in add commands", async ({html, find, evaluate}) => {
		await html("<div id='arDiv' _='on click add [@data-foo=blue]' data-foo='red'></div>")
		await find('#arDiv').dispatchEvent('click')
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can have value in quotes used in add commands", async ({html, find, evaluate}) => {
		await html("<div id='arDiv' _='on click add [@data-foo=\"blue\"]' data-foo='red'></div>")
		await find('#arDiv').dispatchEvent('click')
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can have value in quotes with spaces used in add commands", async ({html, find, evaluate}) => {
		await html("<div id='arDiv' _='on click add [@data-foo=\"blue green\"]' data-foo='red'></div>")
		await find('#arDiv').dispatchEvent('click')
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue green")
	})

	test("attributeRef can be set as prop", async ({html, evaluate}) => {
		await html("<div id='arDiv' data-foo='red'></div>")
		await evaluate(() => {
			const div = document.getElementById('arDiv')
			_hyperscript("set x[@data-foo] to 'blue'", { locals: { x: div } })
		})
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can be set through possessive", async ({html, find, evaluate}) => {
		await html("<div id='arDiv' _='on click set my [@data-foo] to \"blue\"' data-foo='red'></div>")
		await find('#arDiv').dispatchEvent('click')
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can be set indirectly", async ({html, evaluate}) => {
		await html("<div id='arDiv' data-foo='red'></div>")
		await evaluate(() => {
			const div = document.getElementById('arDiv')
			_hyperscript("set [@data-foo] of x to 'blue'", { locals: { x: div } })
		})
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can be put indirectly", async ({html, evaluate}) => {
		await html("<div id='arDiv' data-foo='red'></div>")
		await evaluate(() => {
			const div = document.getElementById('arDiv')
			_hyperscript("put 'blue' into x[@data-foo]", { locals: { x: div } })
		})
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can be put as symbol", async ({html, find, evaluate}) => {
		await html("<div id='arDiv' _='on click put \"blue\" into [@data-foo]' data-foo='red'></div>")
		await find('#arDiv').dispatchEvent('click')
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef with no value works w/ short syntax", async ({html, evaluate}) => {
		await html("<div id='arDiv' foo='c1'></div>")
		const value = await evaluate(() => _hyperscript("@foo", { me: document.getElementById('arDiv') }))
		expect(value).toBe("c1")
	})

	test("attributeRef with dashes name works w/ short syntax", async ({html, evaluate}) => {
		await html("<div id='arDiv' data-foo='c1'></div>")
		const value = await evaluate(() => _hyperscript("@data-foo", { me: document.getElementById('arDiv') }))
		expect(value).toBe("c1")
	})

	test("attributeRef can be set as symbol w/ short syntax", async ({html, find, evaluate}) => {
		await html("<div id='arDiv' _='on click set @data-foo to \"blue\"' data-foo='red'></div>")
		await find('#arDiv').dispatchEvent('click')
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can be set as prop w/ short syntax", async ({html, evaluate}) => {
		await html("<div id='arDiv' data-foo='red'></div>")
		await evaluate(() => {
			const div = document.getElementById('arDiv')
			_hyperscript("set x@data-foo to 'blue'", { locals: { x: div } })
		})
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can be set through possessive w/ short syntax", async ({html, find, evaluate}) => {
		await html("<div id='arDiv' _='on click set my @data-foo to \"blue\"' data-foo='red'></div>")
		await find('#arDiv').dispatchEvent('click')
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can be set indirectly w/ short syntax", async ({html, evaluate}) => {
		await html("<div id='arDiv' data-foo='red'></div>")
		await evaluate(() => {
			const div = document.getElementById('arDiv')
			_hyperscript("set @data-foo of x to 'blue'", { locals: { x: div } })
		})
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can be put indirectly w/ short syntax", async ({html, evaluate}) => {
		await html("<div id='arDiv' data-foo='red'></div>")
		await evaluate(() => {
			const div = document.getElementById('arDiv')
			_hyperscript("put 'blue' into x@data-foo", { locals: { x: div } })
		})
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can be put as symbol w/ short syntax", async ({html, find, evaluate}) => {
		await html("<div id='arDiv' _='on click put \"blue\" into @data-foo' data-foo='red'></div>")
		await find('#arDiv').dispatchEvent('click')
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can have value used in add commands w/ short syntax", async ({html, find, evaluate}) => {
		await html("<div id='arDiv' _='on click add @data-foo=blue' data-foo='red'></div>")
		await find('#arDiv').dispatchEvent('click')
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can have value in quotes used in add commands w/ short syntax", async ({html, find, evaluate}) => {
		await html("<div id='arDiv' _='on click add @data-foo=\"blue\"' data-foo='red'></div>")
		await find('#arDiv').dispatchEvent('click')
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue")
	})

	test("attributeRef can have value in quotes with spaces used in add commands w/ short syntax", async ({html, find, evaluate}) => {
		await html("<div id='arDiv' _='on click add @data-foo=\"blue green\"' data-foo='red'></div>")
		await find('#arDiv').dispatchEvent('click')
		const value = await evaluate(() => document.getElementById('arDiv').getAttribute("data-foo"))
		expect(value).toBe("blue green")
	})
})
