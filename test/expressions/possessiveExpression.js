import {test, expect} from '../fixtures.js'

test.describe("possessiveExpression", () => {

	test("can access basic properties", async ({run}) => {
		const result = await run("foo's foo", { locals: { foo: { foo: "foo" } } })
		expect(result).toBe("foo")
	})

	test("is null safe", async ({run}) => {
		const result = await run("foo's foo")
		expect(result).toBeUndefined()
	})

	test("can access my properties", async ({run}) => {
		const result = await run("my foo", { me: { foo: "foo" } })
		expect(result).toBe("foo")
	})

	test("my property is null safe", async ({run}) => {
		const result = await run("my foo")
		expect(result).toBeUndefined()
	})

	test("can access its properties", async ({run}) => {
		const result = await run("its foo", { result: { foo: "foo" } })
		expect(result).toBe("foo")
	})

	test("its property is null safe", async ({run}) => {
		const result = await run("its foo")
		expect(result).toBeUndefined()
	})

	test("can access properties on idrefs", async ({html, run}) => {
		await html("<div id='foo' style='display: inline'></div>")
		const result = await run("the display of #foo's style")
		expect(result).toBe("inline")
	})

	test("can access properties on idrefs 2", async ({html, run}) => {
		await html("<div id='foo' style='display: inline'></div>")
		const result = await run("#foo's style's display")
		expect(result).toBe("inline")
	})

	test("can access properties on classrefs", async ({html, run}) => {
		await html("<div class='foo' style='display: inline'></div>")
		const result = await run("the display of .foo's style")
		expect(result).toEqual(["inline"])
	})

	test("can access properties on classrefs 2", async ({html, run}) => {
		await html("<div class='foo' style='display: inline'></div>")
		const result = await run(".foo's style's display")
		expect(result).toEqual(["inline"])
	})

	test("can access properties on queryrefs", async ({html, run}) => {
		await html("<div class='foo' style='display: inline'></div>")
		const result = await run("the display of <.foo/>'s style")
		expect(result).toEqual(["inline"])
	})

	test("can access properties on queryrefs 2", async ({html, run}) => {
		await html("<div class='foo' style='display: inline'></div>")
		const result = await run("<.foo/>'s style's display")
		expect(result).toEqual(["inline"])
	})

	test("can access basic attribute", async ({html, evaluate}) => {
		await html("<div id='pDiv' data-foo='bar'></div>")
		const result = await evaluate(() => {
			const div = document.getElementById('pDiv')
			return _hyperscript("foo's [@data-foo]", { locals: { foo: div } })
		})
		expect(result).toBe("bar")
	})

	test("can access my attribute", async ({html, evaluate}) => {
		await html("<div id='pDiv' data-foo='bar'></div>")
		const result = await evaluate(() => {
			const div = document.getElementById('pDiv')
			return _hyperscript("my @data-foo", { me: div })
		})
		expect(result).toBe("bar")
	})

	test("can access multiple basic attributes", async ({html, run}) => {
		await html("<div class='c1' data-foo='bar'></div><div class='c1' data-foo='bar'></div>")
		const result = await run(".c1's [@data-foo]")
		expect(result).toEqual(["bar", "bar"])
	})

	test("can set basic attributes", async ({html, evaluate}) => {
		await html("<div id='pDiv' data-foo='bar'></div>")
		await evaluate(() => {
			const div = document.getElementById('pDiv')
			_hyperscript("set foo's [@data-foo] to 'blah'", { locals: { foo: div } })
		})
		const value = await evaluate(() => document.getElementById('pDiv').getAttribute("data-foo"))
		expect(value).toBe("blah")
	})

	test("can set multiple basic attributes", async ({html, evaluate}) => {
		await html("<div id='d1' class='c1' data-foo='bar'></div><div id='d2' class='c1' data-foo='bar'></div>")
		await evaluate(() => _hyperscript("set .c1's [@data-foo] to 'blah'"))
		const v1 = await evaluate(() => document.getElementById('d1').getAttribute('data-foo'))
		const v2 = await evaluate(() => document.getElementById('d2').getAttribute('data-foo'))
		expect(v1).toBe('blah')
		expect(v2).toBe('blah')
	})

	test("can access basic style", async ({html, evaluate}) => {
		await html("<div id='pDiv' style='color:red'></div>")
		const result = await evaluate(() => {
			const div = document.getElementById('pDiv')
			return _hyperscript("foo's *color", { locals: { foo: div } })
		})
		expect(result).toBe("red")
	})

	test("can access my style", async ({html, evaluate}) => {
		await html("<div id='pDiv' style='color:red'></div>")
		const result = await evaluate(() => {
			const div = document.getElementById('pDiv')
			return _hyperscript("my *color", { me: div })
		})
		expect(result).toBe("red")
	})

	test("can access multiple basic styles", async ({html, run}) => {
		await html("<div class='c1' style='color:red'></div><div class='c1' style='color:red'></div>")
		const result = await run(".c1's *color")
		expect(result).toEqual(["red", "red"])
	})

	test("can set root styles", async ({html, evaluate}) => {
		await html("<div id='pDiv' style='color:red'></div>")
		await evaluate(() => {
			const div = document.getElementById('pDiv')
			_hyperscript("set *color to 'blue'", { me: div })
		})
		const value = await evaluate(() => document.getElementById('pDiv').style.color)
		expect(value).toBe("blue")
	})

	test("can set basic styles", async ({html, evaluate}) => {
		await html("<div id='pDiv' style='color:red'></div>")
		await evaluate(() => {
			const div = document.getElementById('pDiv')
			_hyperscript("set foo's *color to 'blue'", { locals: { foo: div } })
		})
		const value = await evaluate(() => document.getElementById('pDiv').style.color)
		expect(value).toBe("blue")
	})

	test("can set multiple basic styles", async ({html, evaluate}) => {
		await html("<div id='d1' class='c1' style='color:red'></div><div id='d2' class='c1' style='color:red'></div>")
		await evaluate(() => _hyperscript("set .c1's *color to 'blue'"))
		const v1 = await evaluate(() => document.getElementById('d1').style.color)
		const v2 = await evaluate(() => document.getElementById('d2').style.color)
		expect(v1).toBe('blue')
		expect(v2).toBe('blue')
	})
})
