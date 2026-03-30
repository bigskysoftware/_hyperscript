import {test, expect} from '../fixtures.js'

test.describe("the comparisonOperator expression", () => {

	test("less than works", async ({run}) => {
		expect(await run("1 < 2")).toBe(true)
		expect(await run("2 < 1")).toBe(false)
		expect(await run("2 < 2")).toBe(false)
	})

	test("less than or equal works", async ({run}) => {
		expect(await run("1 <= 2")).toBe(true)
		expect(await run("2 <= 1")).toBe(false)
		expect(await run("2 <= 2")).toBe(true)
	})

	test("greater than works", async ({run}) => {
		expect(await run("1 > 2")).toBe(false)
		expect(await run("2 > 1")).toBe(true)
		expect(await run("2 > 2")).toBe(false)
	})

	test("greater than or equal works", async ({run}) => {
		expect(await run("1 >= 2")).toBe(false)
		expect(await run("2 >= 1")).toBe(true)
		expect(await run("2 >= 2")).toBe(true)
	})

	test("equal works", async ({run}) => {
		expect(await run("1 == 2")).toBe(false)
		expect(await run("2 == 1")).toBe(false)
		expect(await run("2 == 2")).toBe(true)
	})

	test("triple equal works", async ({run}) => {
		expect(await run("1 === 2")).toBe(false)
		expect(await run("2 === 1")).toBe(false)
		expect(await run("2 === 2")).toBe(true)
	})

	test("not equal works", async ({run}) => {
		expect(await run("1 != 2")).toBe(true)
		expect(await run("2 != 1")).toBe(true)
		expect(await run("2 != 2")).toBe(false)
	})

	test("triple not equal works", async ({run}) => {
		expect(await run("1 !== 2")).toBe(true)
		expect(await run("2 !== 1")).toBe(true)
		expect(await run("2 !== 2")).toBe(false)
	})

	test("is works", async ({run}) => {
		expect(await run("1 is 2")).toBe(false)
		expect(await run("2 is 1")).toBe(false)
		expect(await run("2 is 2")).toBe(true)
	})

	test("equals works", async ({run}) => {
		expect(await run("1 equals 2")).toBe(false)
		expect(await run("2 equals 1")).toBe(false)
		expect(await run("2 equals 2")).toBe(true)
	})

	test("is equal to works", async ({run}) => {
		expect(await run("1 is equal to 2")).toBe(false)
		expect(await run("2 is equal to 1")).toBe(false)
		expect(await run("2 is equal to 2")).toBe(true)
	})

	test("is really equal to works", async ({run}) => {
		expect(await run("1 is really equal to 2")).toBe(false)
		expect(await run("2 is really equal to 1")).toBe(false)
		expect(await run("2 is really equal to '2'")).toBe(false)
		expect(await run("2 is really equal to 2")).toBe(true)
	})

	test("really equals works", async ({run}) => {
		expect(await run("1 really equals 2")).toBe(false)
		expect(await run("2 really equals 1")).toBe(false)
		expect(await run("2 really equals 2")).toBe(true)
	})

	test("is not works", async ({run}) => {
		expect(await run("1 is not 2")).toBe(true)
		expect(await run("2 is not 1")).toBe(true)
		expect(await run("2 is not 2")).toBe(false)
	})

	test("is not equal to works", async ({run}) => {
		expect(await run("1 is not equal to 2")).toBe(true)
		expect(await run("2 is not equal to 1")).toBe(true)
		expect(await run("2 is not equal to 2")).toBe(false)
	})

	test("is not really equal to works", async ({run}) => {
		expect(await run("1 is not really equal to 2")).toBe(true)
		expect(await run("2 is not really equal to 1")).toBe(true)
		expect(await run("2 is not really equal to '2'")).toBe(true)
		expect(await run("2 is not really equal to 2")).toBe(false)
	})

	test("is in works", async ({run}) => {
		expect(await run("1 is in [1, 2]")).toBe(true)
		expect(await run("2 is in [1, 2]")).toBe(true)
		expect(await run("3 is in [1, 2]")).toBe(false)
		expect(await run("3 is in null")).toBe(false)
	})

	test("is not in works", async ({run}) => {
		expect(await run("1 is not in [1, 2]")).toBe(false)
		expect(await run("2 is not in [1, 2]")).toBe(false)
		expect(await run("3 is not in [1, 2]")).toBe(true)
		expect(await run("3 is not in null")).toBe(true)
	})

	test("I am in works", async ({run}) => {
		expect(await run("I am in [1, 2]", { me: 1 })).toBe(true)
		expect(await run("I am in [1, 2]", { me: 2 })).toBe(true)
		expect(await run("I am in [1, 2]", { me: 3 })).toBe(false)
		expect(await run("I am in null", { me: null })).toBe(false)
	})

	test("I am not in works", async ({run}) => {
		expect(await run("I am not in [1, 2]", { me: 1 })).toBe(false)
		expect(await run("I am not in [1, 2]", { me: 2 })).toBe(false)
		expect(await run("I am not in [1, 2]", { me: 3 })).toBe(true)
		expect(await run("I am not in null", { me: null })).toBe(true)
	})

	test("match works", async ({html, evaluate}) => {
		await html("<div id='mDiv' class='foo'></div>")
		let result = await evaluate(() => {
			const div = document.getElementById('mDiv')
			return _hyperscript("I match .foo", { me: div })
		})
		expect(result).toBe(true)

		result = await evaluate(() => {
			const div = document.getElementById('mDiv')
			return _hyperscript("x matches .foo", { locals: { x: div } })
		})
		expect(result).toBe(true)

		result = await evaluate(() => {
			const div = document.getElementById('mDiv')
			return _hyperscript("I match .bar", { me: div })
		})
		expect(result).toBe(false)

		result = await evaluate(() => {
			const div = document.getElementById('mDiv')
			return _hyperscript("x matches .bar", { locals: { x: div } })
		})
		expect(result).toBe(false)
	})

	test("does not match works", async ({html, evaluate}) => {
		await html("<div id='mDiv' class='foo'></div>")
		let result = await evaluate(() => {
			const div = document.getElementById('mDiv')
			return _hyperscript("I do not match .foo", { me: div })
		})
		expect(result).toBe(false)

		result = await evaluate(() => {
			const div = document.getElementById('mDiv')
			return _hyperscript("x does not match .foo", { locals: { x: div } })
		})
		expect(result).toBe(false)

		result = await evaluate(() => {
			const div = document.getElementById('mDiv')
			return _hyperscript("I do not match .bar", { me: div })
		})
		expect(result).toBe(true)

		result = await evaluate(() => {
			const div = document.getElementById('mDiv')
			return _hyperscript("x does not match .bar", { locals: { x: div } })
		})
		expect(result).toBe(true)
	})

	test("match works w/ strings", async ({run}) => {
		expect(await run("'a' matches '.*'")).toBe(true)
		expect(await run("'a' matches 'b'")).toBe(false)
	})

	test("does not match works w/ strings", async ({run}) => {
		expect(await run("'a' does not match '.*'")).toBe(false)
		expect(await run("'a' does not match 'b'")).toBe(true)
	})

	test("contains works with elts", async ({html, evaluate}) => {
		await html("<div id='outer'><div id='inner'></div></div>")

		let result = await evaluate(() => {
			const outer = document.getElementById('outer')
			const inner = document.getElementById('inner')
			return _hyperscript("I contain that", { me: outer, locals: { that: inner } })
		})
		expect(result).toBe(true)

		result = await evaluate(() => {
			const outer = document.getElementById('outer')
			const inner = document.getElementById('inner')
			return _hyperscript("I contain that", { me: inner, locals: { that: outer } })
		})
		expect(result).toBe(false)

		result = await evaluate(() => {
			const outer = document.getElementById('outer')
			const inner = document.getElementById('inner')
			return _hyperscript("that contains me", { me: outer, locals: { that: inner } })
		})
		expect(result).toBe(false)

		result = await evaluate(() => {
			const outer = document.getElementById('outer')
			const inner = document.getElementById('inner')
			return _hyperscript("that contains me", { me: inner, locals: { that: outer } })
		})
		expect(result).toBe(true)
	})

	test("contains works with arrays", async ({run}) => {
		expect(await run("I contain that", { me: [1, 2, 3], locals: { that: 1 } })).toBe(true)
		expect(await run("that contains me", { me: 1, locals: { that: [1, 2, 3] } })).toBe(true)
	})

	test("contains works with css literals", async ({html, run}) => {
		await html("<div id='d1' class='outer'><div id='d2'></div></div>")
		expect(await run(".outer contains #d2")).toBe(true)
		expect(await run("#d2 contains #d1")).toBe(false)
	})

	test("include works", async ({run}) => {
		expect(await run("foo includes foobar", { locals: { foo: "foo", foobar: "foobar" } })).toBe(false)
		expect(await run("foobar includes foo", { locals: { foo: "foo", foobar: "foobar" } })).toBe(true)
		expect(await run("foo does not include foobar", { locals: { foo: "foo", foobar: "foobar" } })).toBe(true)
		expect(await run("foobar does not include foo", { locals: { foo: "foo", foobar: "foobar" } })).toBe(false)
	})

	test("includes works with arrays", async ({run}) => {
		expect(await run("I include that", { me: [1, 2, 3], locals: { that: 1 } })).toBe(true)
		expect(await run("that includes me", { me: 1, locals: { that: [1, 2, 3] } })).toBe(true)
	})

	test("includes works with css literals", async ({html, run}) => {
		await html("<div id='d1' class='outer'><div id='d2'></div></div>")
		expect(await run(".outer includes #d2")).toBe(true)
		expect(await run("#d2 includes #d1")).toBe(false)
	})

	test("does not contain works", async ({html, evaluate}) => {
		await html("<div id='outer'><div id='inner'></div></div>")

		let result = await evaluate(() => {
			const outer = document.getElementById('outer')
			const inner = document.getElementById('inner')
			return _hyperscript("I do not contain that", { me: outer, locals: { that: inner } })
		})
		expect(result).toBe(false)

		result = await evaluate(() => {
			const outer = document.getElementById('outer')
			const inner = document.getElementById('inner')
			return _hyperscript("I do not contain that", { me: inner, locals: { that: outer } })
		})
		expect(result).toBe(true)

		result = await evaluate(() => {
			const outer = document.getElementById('outer')
			const inner = document.getElementById('inner')
			return _hyperscript("that does not contains me", { me: outer, locals: { that: inner } })
		})
		expect(result).toBe(true)

		result = await evaluate(() => {
			const outer = document.getElementById('outer')
			const inner = document.getElementById('inner')
			return _hyperscript("that does not contains me", { me: inner, locals: { that: outer } })
		})
		expect(result).toBe(false)
	})

	test("is empty works", async ({run}) => {
		expect(await run("undefined is empty")).toBe(true)
		expect(await run("'' is empty")).toBe(true)
		expect(await run("[] is empty")).toBe(true)
		expect(await run("'not empty' is empty")).toBe(false)
		expect(await run("1000 is empty")).toBe(false)
		expect(await run("[1,2,3] is empty")).toBe(false)
		expect(await run(".aClassThatDoesNotExist is empty")).toBe(true)
	})

	test("is not empty works", async ({run}) => {
		expect(await run("undefined is not empty")).toBe(false)
		expect(await run("'' is not empty")).toBe(false)
		expect(await run("[] is not empty")).toBe(false)
		expect(await run("'not empty' is not empty")).toBe(true)
		expect(await run("1000 is not empty")).toBe(true)
		expect(await run("[1,2,3] is not empty")).toBe(true)
	})

	test("is a works", async ({run}) => {
		expect(await run("null is a String")).toBe(true)
		expect(await run("null is a String!")).toBe(false)
		expect(await run("'' is a String!")).toBe(true)
	})

	test("is not a works", async ({run}) => {
		expect(await run("null is not a String")).toBe(false)
		expect(await run("null is not a String!")).toBe(true)
		expect(await run("'' is not a String!")).toBe(false)
	})

	test("is an works", async ({run}) => {
		expect(await run("null is an String")).toBe(true)
		expect(await run("null is an String!")).toBe(false)
		expect(await run("'' is an String!")).toBe(true)
	})

	test("is not an works", async ({run}) => {
		expect(await run("null is not an String")).toBe(false)
		expect(await run("null is not an String!")).toBe(true)
		expect(await run("'' is not an String!")).toBe(false)
	})

	test("is a works with instanceof fallback", async ({html, find, evaluate}) => {
		await html("<div id='d1' _='on click if I am a Element put \"yes\" into me'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("yes");
	})

	test("is a Node works via instanceof", async ({html, find, evaluate}) => {
		await html("<div id='d1' _='on click if I am a Node put \"yes\" into me'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("yes");
	})

	test("is not a works with instanceof fallback", async ({html, find}) => {
		await html("<div id='d1' _='on click if \"hello\" is not a Element put \"yes\" into me'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("yes");
	})

	test("english less than works", async ({run}) => {
		expect(await run("1 is less than 2")).toBe(true)
		expect(await run("2 is less than 1")).toBe(false)
		expect(await run("2 is less than 2")).toBe(false)
	})

	test("english less than or equal works", async ({run}) => {
		expect(await run("1 is less than or equal to 2")).toBe(true)
		expect(await run("2 is less than or equal to 1")).toBe(false)
		expect(await run("2 is less than or equal to 2")).toBe(true)
	})

	test("english greater than works", async ({run}) => {
		expect(await run("1 is greater than 2")).toBe(false)
		expect(await run("2 is greater than 1")).toBe(true)
		expect(await run("2 is greater than 2")).toBe(false)
	})

	test("english greater than or equal works", async ({run}) => {
		expect(await run("1 is greater than or equal to 2")).toBe(false)
		expect(await run("2 is greater than or equal to 1")).toBe(true)
		expect(await run("2 is greater than or equal to 2")).toBe(true)
	})

	test("exists works", async ({html, run}) => {
		expect(await run("undefined exists")).toBe(false)
		expect(await run("null exists")).toBe(false)
		expect(await run("#doesNotExist exists")).toBe(false)
		expect(await run(".aClassThatDoesNotExist exists")).toBe(false)
		expect(await run("<.aClassThatDoesNotExist/> exists")).toBe(false)

		await html(
			"<div id='d1' class='c1'></div>" +
			"<div id='d2' class='c1'></div>" +
			"<div id='d3' class='c1'></div>"
		)

		expect(await run("#d1 exists")).toBe(true)
		expect(await run(".c1 exists")).toBe(true)
		expect(await run("<body/> exists")).toBe(true)
	})

	test("does not exist works", async ({run}) => {
		expect(await run("undefined does not exist")).toBe(true)
		expect(await run("null does not exist")).toBe(true)
		expect(await run("#doesNotExist does not exist")).toBe(true)
		expect(await run(".aClassThatDoesNotExist does not exist")).toBe(true)
		expect(await run("<.aClassThatDoesNotExist/> does not exist")).toBe(true)
		expect(await run("<body/> does not exist")).toBe(false)
	})

	test("is ignoring case works", async ({run}) => {
		expect(await run("'Hello' is 'hello' ignoring case")).toBe(true)
		expect(await run("'Hello' is 'HELLO' ignoring case")).toBe(true)
		expect(await run("'Hello' is 'world' ignoring case")).toBe(false)
	})

	test("is not ignoring case works", async ({run}) => {
		expect(await run("'Hello' is not 'world' ignoring case")).toBe(true)
		expect(await run("'Hello' is not 'hello' ignoring case")).toBe(false)
	})

	test("contains ignoring case works", async ({run}) => {
		expect(await run("'Hello World' contains 'hello' ignoring case")).toBe(true)
		expect(await run("'Hello World' contains 'WORLD' ignoring case")).toBe(true)
		expect(await run("'Hello World' contains 'missing' ignoring case")).toBe(false)
	})

	test("matches ignoring case works", async ({run}) => {
		expect(await run("'Hello' matches 'hello' ignoring case")).toBe(true)
		expect(await run("'Hello' matches 'HELLO' ignoring case")).toBe(true)
	})

	test("starts with works", async ({run}) => {
		expect(await run("'hello world' starts with 'hello'")).toBe(true)
		expect(await run("'hello world' starts with 'world'")).toBe(false)
		expect(await run("'hello' starts with 'hello'")).toBe(true)
		expect(await run("'' starts with 'x'")).toBe(false)
	})

	test("ends with works", async ({run}) => {
		expect(await run("'hello world' ends with 'world'")).toBe(true)
		expect(await run("'hello world' ends with 'hello'")).toBe(false)
		expect(await run("'hello' ends with 'hello'")).toBe(true)
		expect(await run("'' ends with 'x'")).toBe(false)
	})

	test("does not start with works", async ({run}) => {
		expect(await run("'hello world' does not start with 'hello'")).toBe(false)
		expect(await run("'hello world' does not start with 'world'")).toBe(true)
	})

	test("does not end with works", async ({run}) => {
		expect(await run("'hello world' does not end with 'world'")).toBe(false)
		expect(await run("'hello world' does not end with 'hello'")).toBe(true)
	})

	test("starts with null is false", async ({run}) => {
		expect(await run("null starts with 'x'")).toBe(false)
		expect(await run("null does not start with 'x'")).toBe(true)
	})

	test("ends with null is false", async ({run}) => {
		expect(await run("null ends with 'x'")).toBe(false)
		expect(await run("null does not end with 'x'")).toBe(true)
	})

	test("starts with ignoring case works", async ({run}) => {
		expect(await run("'Hello World' starts with 'hello' ignoring case")).toBe(true)
		expect(await run("'Hello World' starts with 'HELLO' ignoring case")).toBe(true)
		expect(await run("'Hello World' starts with 'world' ignoring case")).toBe(false)
	})

	test("ends with ignoring case works", async ({run}) => {
		expect(await run("'Hello World' ends with 'world' ignoring case")).toBe(true)
		expect(await run("'Hello World' ends with 'WORLD' ignoring case")).toBe(true)
		expect(await run("'Hello World' ends with 'hello' ignoring case")).toBe(false)
	})

	test("starts with coerces to string", async ({run}) => {
		expect(await run("123 starts with '12'")).toBe(true)
		expect(await run("123 starts with '23'")).toBe(false)
	})

	test("ends with coerces to string", async ({run}) => {
		expect(await run("123 ends with '23'")).toBe(true)
		expect(await run("123 ends with '12'")).toBe(false)
	})

	test("is between works", async ({run}) => {
		expect(await run("5 is between 1 and 10")).toBe(true)
		expect(await run("1 is between 1 and 10")).toBe(true)
		expect(await run("10 is between 1 and 10")).toBe(true)
		expect(await run("0 is between 1 and 10")).toBe(false)
		expect(await run("11 is between 1 and 10")).toBe(false)
	})

	test("is not between works", async ({run}) => {
		expect(await run("5 is not between 1 and 10")).toBe(false)
		expect(await run("0 is not between 1 and 10")).toBe(true)
		expect(await run("11 is not between 1 and 10")).toBe(true)
		expect(await run("1 is not between 1 and 10")).toBe(false)
		expect(await run("10 is not between 1 and 10")).toBe(false)
	})

	test("between works with strings", async ({run}) => {
		expect(await run("'b' is between 'a' and 'c'")).toBe(true)
		expect(await run("'d' is between 'a' and 'c'")).toBe(false)
	})

	test("I am between works", async ({run}) => {
		expect(await run("I am between 1 and 10", { me: 5 })).toBe(true)
		expect(await run("I am between 1 and 10", { me: 0 })).toBe(false)
	})

	test("I am not between works", async ({run}) => {
		expect(await run("I am not between 1 and 10", { me: 5 })).toBe(false)
		expect(await run("I am not between 1 and 10", { me: 0 })).toBe(true)
	})
})
