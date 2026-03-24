import {test, expect} from '../fixtures.js'

test.describe("as operator", () => {

	test("converts null as null", async ({run}) => {
		const result = await run("null as String")
		expect(result).toBeNull()
	})

	test("converts value as String", async ({run}) => {
		let result = await run("10 as String")
		expect(result).toBe("10")
		result = await run("true as String")
		expect(result).toBe("true")
	})

	test("converts value as Int", async ({run}) => {
		let result = await run("'10' as Int")
		expect(result).toBe(10)
		result = await run("'10.4' as Int")
		expect(result).toBe(10)
	})

	test("converts value as Float", async ({run}) => {
		let result = await run("'10' as Float")
		expect(result).toBe(10)
		result = await run("'10.4' as Float")
		expect(result).toBe(10.4)
	})

	test("converts value as Fixed", async ({run}) => {
		let result = await run("'10.4' as Fixed")
		expect(result).toBe('10')
		result = await run("'10.4899' as Fixed:2")
		expect(result).toBe('10.49')
	})

	test("converts value as Number", async ({run}) => {
		let result = await run("'10' as Number")
		expect(result).toBe(10)
		result = await run("'10.4' as Number")
		expect(result).toBe(10.4)
	})

	test("converts value as Date", async ({evaluate}) => {
		const result = await evaluate(() => {
			const r = _hyperscript("1 as Date")
			return r.getTime()
		})
		expect(result).toBe(new Date(1).getTime())
	})

	test("can use the a modifier if you like", async ({evaluate}) => {
		const result = await evaluate(() => {
			const r = _hyperscript("1 as a Date")
			return r.getTime()
		})
		expect(result).toBe(new Date(1).getTime())
	})

	test("converts value as JSON", async ({run}) => {
		const result = await run("{foo:'bar'} as JSON")
		expect(result).toBe('{"foo":"bar"}')
	})

	test("converts string as Object", async ({run}) => {
		const result = await run('\'{"foo":"bar"}\' as Object')
		expect(result["foo"]).toBe("bar")
	})

	test("can use the an modifier if you'd like", async ({run}) => {
		const result = await run('\'{"foo":"bar"}\' as an Object')
		expect(result["foo"]).toBe("bar")
	})

	test("converts value as Object", async ({run}) => {
		const result = await run("x as Object", { locals: { x: { foo: "bar" } } })
		expect(result["foo"]).toBe("bar")
	})

	test("converts an input element into Values", async ({evaluate}) => {
		const result = await evaluate(() => {
			const node = document.createElement("input")
			node.name = "test-name"
			node.value = "test-value"
			return _hyperscript("x as Values", { locals: { x: node } })
		})
		expect(result["test-name"]).toBe("test-value")
	})

	test("converts a form element into Values", async ({evaluate}) => {
		const result = await evaluate(() => {
			const node = document.createElement("form")
			node.innerHTML = `
				<input name="firstName" value="John"><br>
				<input name="lastName" value="Connor"><br>
				<div>
					<input name="areaCode" value="213">
					<input name="phone" value="555-1212">
				</div>`
			return _hyperscript("x as Values", { locals: { x: node } })
		})
		expect(result.firstName).toBe("John")
		expect(result.lastName).toBe("Connor")
		expect(result.areaCode).toBe("213")
		expect(result.phone).toBe("555-1212")
	})

	test("converts a query selector into Values", async ({html, find, evaluate}) => {
		await html(`<div id="qsdiv" _="on click put <input.include/> as Values into my.customData">
			<input class="include" name="firstName" value="John"><br>
			<input class="include" name="lastName" value="Connor"><br>
			<input class="include" name="areaCode" value="213">
			<input class="dont-include" name="phone" value="555-1212">
		</div>`)
		await find('#qsdiv').dispatchEvent('click')
		const data = await evaluate(() => {
			const div = document.getElementById('qsdiv')
			return {
				firstName: div.customData?.firstName,
				lastName: div.customData?.lastName,
				areaCode: div.customData?.areaCode,
				phone: div.customData?.phone,
			}
		})
		expect(data.firstName).toBe("John")
		expect(data.lastName).toBe("Connor")
		expect(data.areaCode).toBe("213")
		expect(data.phone).toBeUndefined()
	})

	test("converts radio buttons into a Value correctly", async ({evaluate}) => {
		const result = await evaluate(() => {
			const node = document.createElement("form")
			node.innerHTML = `
				<div>
					<input type="radio" name="gender" value="Male" checked>
					<input type="radio" name="gender" value="Female">
					<input type="radio" name="gender" value="Other">
				</div>`
			return _hyperscript("x as Values", { locals: { x: node } })
		})
		expect(result.gender).toBe("Male")
	})

	test("converts checkboxes into a Value correctly", async ({evaluate}) => {
		const result = await evaluate(() => {
			const node = document.createElement("form")
			node.innerHTML = `
				<div>
					<input type="checkbox" name="gender" value="Male" checked>
					<input type="checkbox" name="gender" value="Female" checked>
					<input type="checkbox" name="gender" value="Other" checked>
				</div>`
			return _hyperscript("x as Values", { locals: { x: node } })
		})
		expect(result.gender[0]).toBe("Male")
		expect(result.gender[1]).toBe("Female")
		expect(result.gender[2]).toBe("Other")
	})

	test("converts multiple selects into a Value correctly", async ({evaluate}) => {
		const result = await evaluate(() => {
			const node = document.createElement("form")
			node.innerHTML = `
				<select name="animal" multiple>
					<option value="dog" selected>Doggo</option>
					<option value="cat">Kitteh</option>
					<option value="raccoon" selected>Trash Panda</option>
					<option value="possum">Sleepy Boi</option>
				</select>`
			return _hyperscript("x as Values", { locals: { x: node } })
		})
		expect(result.animal[0]).toBe("dog")
		expect(result.animal[1]).toBe("raccoon")
	})

	test("converts a complete form into Values", async ({evaluate}) => {
		const result = await evaluate(() => {
			const node = document.createElement("form")
			node.innerHTML = `
				<div><span><b>
					Catches elements nested deeply within the DOM tree
					<input name="firstName" value="John"><br>
					<input name="lastName" value="Connor"><br>
					<input name="phone" value="555-1212">
				</b></span></div>
				Works with Textareas
				<textarea name="aboutMe">It began on a warm summer day in 1969...</textarea>
				Works with Single Select Boxes
				<select name="animal">
					<option value="dog" selected>Doggo</option>
					<option value="cat">Kitteh</option>
					<option value="raccoon">Trash Panda</option>
					<option value="possum">Sleepy Boi</option>
				</select>
				Works with Multi-Select Boxes
				<select name="spiritAnimal" multiple>
					<option value="dog" selected>Doggo</option>
					<option value="cat">Kitteh</option>
					<option value="raccoon" selected>Trash Panda</option>
					<option value="possum">Sleepy Boi</option>
				</select>
				Works with Radio Buttons
				<input type="radio" name="coolOrNaw" value="Cool" checked>
				<input type="radio" name="coolOrNaw" value="Naw Bruh">
				Works with Checkboxes
				<input type="checkbox" name="gender" value="Male" checked>
				<input type="checkbox" name="gender" value="Female" checked>
				<input type="checkbox" name="gender" value="Other" checked>`
			return _hyperscript("x as Values", { locals: { x: node } })
		})
		expect(result.firstName).toBe("John")
		expect(result.lastName).toBe("Connor")
		expect(result.phone).toBe("555-1212")
		expect(result.aboutMe).toBe("It began on a warm summer day in 1969...")
		expect(result.animal).toBe("dog")
		expect(result.spiritAnimal[0]).toBe("dog")
		expect(result.spiritAnimal[1]).toBe("raccoon")
		expect(result.coolOrNaw).toBe("Cool")
		expect(result.gender[0]).toBe("Male")
		expect(result.gender[1]).toBe("Female")
		expect(result.gender[2]).toBe("Other")
	})

	test("converts an element into HTML", async ({evaluate}) => {
		const result = await evaluate(() => {
			const d1 = document.createElement("div")
			d1.id = "myDiv"
			d1.innerText = "With Text"
			return _hyperscript("d as HTML", { locals: { d: d1 } })
		})
		expect(result).toBe(`<div id="myDiv">With Text</div>`)
	})

	test("converts a NodeList into HTML", async ({evaluate}) => {
		const result = await evaluate(() => {
			const fragment = document.createDocumentFragment()
			let d = document.createElement("div")
			d.id = "first"
			d.innerText = "With Text"
			fragment.appendChild(d)
			d = document.createElement("span")
			d.id = "second"
			fragment.appendChild(d)
			d = document.createElement("i")
			d.id = "third"
			fragment.appendChild(d)
			return _hyperscript("nodeList as HTML", { locals: { nodeList: fragment.childNodes } })
		})
		expect(result).toBe(`<div id="first">With Text</div><span id="second"></span><i id="third"></i>`)
	})

	test("converts an array into HTML", async ({run}) => {
		const result = await run("d as HTML", { locals: { d: ["this-", "is-", "html"] } })
		expect(result).toBe(`this-is-html`)
	})

	test("converts numbers things 'HTML'", async ({run}) => {
		const result = await run("value as HTML", { locals: { value: 123 } })
		expect(result).toBe("123")
	})

	test("converts strings into fragments", async ({evaluate}) => {
		const result = await evaluate(() => {
			const r = _hyperscript("value as Fragment", { locals: { value: "<p></p>" } })
			return { childElementCount: r.childElementCount, firstChildTag: r.firstChild.tagName }
		})
		expect(result.childElementCount).toBe(1)
		expect(result.firstChildTag).toBe("P")
	})

	test("converts elements into fragments", async ({evaluate}) => {
		const result = await evaluate(() => {
			const value = document.createElement("p")
			const r = _hyperscript("value as Fragment", { locals: { value } })
			return { childElementCount: r.childElementCount, firstChildTag: r.firstChild.tagName }
		})
		expect(result.childElementCount).toBe(1)
		expect(result.firstChildTag).toBe("P")
	})

	test("converts arrays into fragments", async ({evaluate}) => {
		const result = await evaluate(() => {
			const value = [document.createElement("p"), "<p></p>"]
			const r = _hyperscript("value as Fragment", { locals: { value } })
			return {
				childElementCount: r.childElementCount,
				firstChildTag: r.firstChild.tagName,
				lastChildTag: r.lastChild.tagName,
			}
		})
		expect(result.childElementCount).toBe(2)
		expect(result.firstChildTag).toBe("P")
		expect(result.lastChildTag).toBe("P")
	})

	test("can accept custom conversions", async ({evaluate}) => {
		const result = await evaluate(() => {
			_hyperscript.config.conversions["Foo"] = function (val) {
				return "foo" + val
			}
			const r = _hyperscript("1 as Foo")
			delete _hyperscript.config.conversions.Foo
			return r
		})
		expect(result).toBe("foo1")
	})

	test("can accept custom dynamic conversions", async ({evaluate}) => {
		const result = await evaluate(() => {
			const myConversion = function (conversion, val) {
				if (conversion.indexOf("Foo:") === 0) {
					const arg = conversion.split(":")[1]
					return arg + val
				}
			}
			_hyperscript.config.conversions.dynamicResolvers.push(myConversion)
			const r = _hyperscript("1 as Foo:Bar")
			_hyperscript.config.conversions.dynamicResolvers.pop()
			return r
		})
		expect(result).toBe("Bar1")
	})

	test("converts a form element into Values JSON", async ({evaluate}) => {
		const result = await evaluate(() => {
			const node = document.createElement("form")
			node.innerHTML = `
				<input name="firstName" value="John"><br>
				<input name="lastName" value="Connor"><br>
				<div>
					<input name="areaCode" value="213">
					<input name="phone" value="555-1212">
				</div>`
			return _hyperscript("x as Values:JSON", { locals: { x: node } })
		})
		expect(result).toBe('{"firstName":"John","lastName":"Connor","areaCode":"213","phone":"555-1212"}')
	})

	test("converts a form element into Values Form Data", async ({evaluate}) => {
		const result = await evaluate(() => {
			const node = document.createElement("form")
			node.innerHTML = `
				<input name="firstName" value="John"><br>
				<input name="lastName" value="Connor"><br>
				<div>
					<input name="areaCode" value="213">
					<input name="phone" value="555-1212">
				</div>`
			return _hyperscript("x as Values:Form", { locals: { x: node } })
		})
		expect(result).toBe('firstName=John&lastName=Connor&areaCode=213&phone=555-1212')
	})
})
