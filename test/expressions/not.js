import {test, expect} from '../fixtures.js'

test.describe("the not expression", () => {

	test("not inverts true", async ({run}) => {
		expect(await run("not true")).toBe(false)
	})

	test("not inverts false", async ({run}) => {
		expect(await run("not false")).toBe(true)
	})

	test("two nots make a true", async ({run}) => {
		expect(await run("not not true")).toBe(true)
	})

	test("not with numeric truthy/falsy values", async ({run}) => {
		expect(await run("not 0")).toBe(true)
		expect(await run("not 1")).toBe(false)
		expect(await run("not 42")).toBe(false)
	})

	test("not with string truthy/falsy values", async ({run}) => {
		expect(await run("not ''")).toBe(true)
		expect(await run("not 'hello'")).toBe(false)
	})

	test("not null and not undefined", async ({run}) => {
		expect(await run("not null")).toBe(true)
		expect(await run("not undefined")).toBe(true)
	})

	test("not has higher precedence than and", async ({run}) => {
		// (not false) and true → true and true → true
		expect(await run("not false and true")).toBe(true)
		// (not true) and true → false and true → false
		expect(await run("not true and true")).toBe(false)
	})

	test("not has higher precedence than or", async ({run}) => {
		// (not true) or true → false or true → true
		expect(await run("not true or true")).toBe(true)
		// (not false) or false → true or false → true
		expect(await run("not false or false")).toBe(true)
	})

	test("not inverts equality comparisons", async ({run}) => {
		expect(await run("not (1 is 2)")).toBe(true)
		expect(await run("not (1 is 1)")).toBe(false)
	})
})
