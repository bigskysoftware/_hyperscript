import {test, expect} from '../fixtures.js'

test.describe("the classRef expression", () => {

	test("basic classRef works", async ({html, evaluate}) => {
		await html("<div class='c1'></div>")
		const result = await evaluate(() => {
			const value = _hyperscript(".c1")
			return Array.from(value).length
		})
		expect(result).toBe(1)
	})

	test("basic classRef works w no match", async ({evaluate}) => {
		const result = await evaluate(() => {
			const value = _hyperscript(".badClassThatDoesNotHaveAnyElements")
			return Array.from(value).length
		})
		expect(result).toBe(0)
	})

	test("dashed class ref works", async ({html, evaluate}) => {
		await html("<div class='c1-foo'></div>")
		const result = await evaluate(() => {
			const value = _hyperscript(".c1-foo")
			return Array.from(value).length
		})
		expect(result).toBe(1)
	})

	test("colon class ref works", async ({html, evaluate}) => {
		await html("<div class='c1:foo'></div>")
		const result = await evaluate(() => {
			const value = _hyperscript(".c1:foo")
			return Array.from(value).length
		})
		expect(result).toBe(1)
	})

	test("multiple colon class ref works", async ({html, evaluate}) => {
		await html("<div class='c1:foo:bar'></div>")
		const result = await evaluate(() => {
			const value = _hyperscript(".c1:foo:bar")
			return Array.from(value).length
		})
		expect(result).toBe(1)
	})

	test("template classRef works", async ({html, evaluate}) => {
		await html("<div class='c1'></div>")
		const result = await evaluate(() => {
			const value = _hyperscript(".{'c1'}")
			return Array.from(value).length
		})
		expect(result).toBe(1)
	})

	test("leading minus class ref works", async ({html, evaluate}) => {
		await html("<div class='-c1'></div>")
		const result = await evaluate(() => {
			const value = _hyperscript(".-c1")
			return Array.from(value).length
		})
		expect(result).toBe(1)
	})

	test("slashes in class references work", async ({html, evaluate}) => {
		await html("<div class='-c1/22'></div>")
		const result = await evaluate(() => {
			const value = _hyperscript(".-c1\\/22")
			return Array.from(value).length
		})
		expect(result).toBe(1)
	})

	test("tailwind insanity in class references work", async ({html, evaluate}) => {
		await html("<div class='group-[:nth-of-type(3)_&]:block'></div>")
		const result = await evaluate(() => {
			const value = _hyperscript(".group-\\[:nth-of-type\\(3\\)_\\&\\]:block")
			return Array.from(value).length
		})
		expect(result).toBe(1)
	})
})
