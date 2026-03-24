import {test, expect} from '../fixtures.js'

test.describe("the styleRef expression", () => {

	test("basic style ref works", async ({html, evaluate}) => {
		await html("<div id='sDiv' style='color: red; text-align: center; width: 10px'></div>")

		let value = await evaluate(() => _hyperscript("*color", { me: document.getElementById('sDiv') }))
		expect(value).toBe("red")

		value = await evaluate(() => _hyperscript("*text-align", { me: document.getElementById('sDiv') }))
		expect(value).toBe("center")

		value = await evaluate(() => _hyperscript("*width", { me: document.getElementById('sDiv') }))
		expect(value).toBe("10px")

		value = await evaluate(() => _hyperscript("*height", { me: document.getElementById('sDiv') }))
		expect(value).toBe("")

		value = await evaluate(() => _hyperscript("*bad-prop", { me: document.getElementById('sDiv') }))
		expect(value).toBeUndefined()
	})

	test("calculated style ref works", async ({html, evaluate}) => {
		await html("<div id='sDiv' style='color: red; text-align: center; width: 10px'></div>")

		let value = await evaluate(() => _hyperscript("*computed-color", { me: document.getElementById('sDiv') }))
		expect(value).toBe("rgb(255, 0, 0)")

		value = await evaluate(() => _hyperscript("*computed-text-align", { me: document.getElementById('sDiv') }))
		expect(value).toBe("center")

		value = await evaluate(() => _hyperscript("*computed-width", { me: document.getElementById('sDiv') }))
		expect(value).toBe("10px")

		value = await evaluate(() => _hyperscript("*computed-height", { me: document.getElementById('sDiv') }))
		expect(value).toBe("0px")

		value = await evaluate(() => _hyperscript("*computed-bad-prop", { me: document.getElementById('sDiv') }))
		expect(value).toBe("")
	})

	test("possessive style ref works", async ({html, evaluate}) => {
		await html("<div id='sDiv' style='color: red; text-align: center; width: 10px'></div>")

		let value = await evaluate(() => _hyperscript("my *color", { me: document.getElementById('sDiv') }))
		expect(value).toBe("red")

		value = await evaluate(() => _hyperscript("my *text-align", { me: document.getElementById('sDiv') }))
		expect(value).toBe("center")

		value = await evaluate(() => _hyperscript("my *width", { me: document.getElementById('sDiv') }))
		expect(value).toBe("10px")

		value = await evaluate(() => _hyperscript("its *height", { result: document.getElementById('sDiv') }))
		expect(value).toBe("")

		value = await evaluate(() => _hyperscript("my *bad-prop", { me: document.getElementById('sDiv') }))
		expect(value).toBeUndefined()
	})

	test("of style ref works", async ({html, evaluate}) => {
		await html("<div id='sDiv' style='color: red; text-align: center; width: 10px'></div>")

		let value = await evaluate(() => _hyperscript("*color of me", { me: document.getElementById('sDiv') }))
		expect(value).toBe("red")

		value = await evaluate(() => _hyperscript("*text-align of me", { me: document.getElementById('sDiv') }))
		expect(value).toBe("center")

		value = await evaluate(() => _hyperscript("*width of me", { me: document.getElementById('sDiv') }))
		expect(value).toBe("10px")

		value = await evaluate(() => _hyperscript("*height of it", { result: document.getElementById('sDiv') }))
		expect(value).toBe("")

		value = await evaluate(() => _hyperscript("*bad-prop of me", { me: document.getElementById('sDiv') }))
		expect(value).toBeUndefined()
	})

	test("calculated possessive style ref works", async ({html, evaluate}) => {
		await html("<div id='sDiv' style='color: red; text-align: center; width: 10px'></div>")

		let value = await evaluate(() => _hyperscript("my *computed-color", { me: document.getElementById('sDiv') }))
		expect(value).toBe("rgb(255, 0, 0)")

		value = await evaluate(() => _hyperscript("my *computed-text-align", { me: document.getElementById('sDiv') }))
		expect(value).toBe("center")

		value = await evaluate(() => _hyperscript("my *computed-width", { me: document.getElementById('sDiv') }))
		expect(value).toBe("10px")

		value = await evaluate(() => _hyperscript("its *computed-height", { result: document.getElementById('sDiv') }))
		expect(value).toBe("0px")

		value = await evaluate(() => _hyperscript("my *computed-bad-prop", { me: document.getElementById('sDiv') }))
		expect(value).toBe('')
	})

	test("calculated of style ref works", async ({html, evaluate}) => {
		await html("<div id='sDiv' style='color: red; text-align: center; width: 10px'></div>")

		let value = await evaluate(() => _hyperscript("*computed-color of me", { me: document.getElementById('sDiv') }))
		expect(value).toBe("rgb(255, 0, 0)")

		value = await evaluate(() => _hyperscript("*computed-text-align of me", { me: document.getElementById('sDiv') }))
		expect(value).toBe("center")

		value = await evaluate(() => _hyperscript("*computed-width of me", { me: document.getElementById('sDiv') }))
		expect(value).toBe("10px")

		value = await evaluate(() => _hyperscript("*computed-height of it", { result: document.getElementById('sDiv') }))
		expect(value).toBe("0px")

		value = await evaluate(() => _hyperscript("*computed-bad-prop of me", { me: document.getElementById('sDiv') }))
		expect(value).toBe('')
	})
})
