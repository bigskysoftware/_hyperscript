import {test, expect} from '../fixtures.js'

test.describe("the no expression", () => {

	test("no returns true for null", async ({run}) => {
		expect(await run("no null")).toBe(true)
	})

	test("no returns false for non-null", async ({run}) => {
		expect(await run("no 'thing'")).toBe(false)
	})

	test("no returns true for empty array", async ({run}) => {
		expect(await run("no []")).toBe(true)
	})

	test("no returns true for empty selector", async ({run}) => {
		expect(await run("no .aClassThatDoesNotExist")).toBe(true)
	})

	test("no returns false for non-empty array", async ({run}) => {
		expect(await run("no ['thing']")).toBe(false)
	})

	test("no with where filters then checks emptiness", async ({run}) => {
		expect(await run("no [1, 2, 3] where it > 5")).toBe(true)
	})

	test("no with where returns false when matches exist", async ({run}) => {
		expect(await run("no [1, 2, 3] where it > 1")).toBe(false)
	})

	test("no with where and is not", async ({run}) => {
		var result = await run("no [1, 2, 3] where it is not 2");
		expect(result).toBe(false)
	})

	test("no with where on DOM elements", async ({html, find}) => {
		await html(
			"<div id='box'><span class='a'>A</span><span class='b'>B</span></div>" +
			"<button _=\"on click if no <span/> in #box where it matches .c then put 'none' into #out else put 'found' into #out\">go</button>" +
			"<div id='out'></div>"
		);
		await find('button').click();
		await expect(find('#out')).toHaveText("none");
	})
})
