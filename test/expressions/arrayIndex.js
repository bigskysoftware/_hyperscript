import {test, expect} from '../fixtures.js'

test.describe("array index operator", () => {

	test("can create an array literal", async ({run}) => {
		const result = await run("[1, 2, 3]")
		expect(result).toEqual([1, 2, 3])
	})

	test("can index an array value at the beginning of the array", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click set newVar to [10, 20, 30] then put newVar[0] into #d1.innerHTML'></div>"
		)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d1')).toHaveText("10")
	})

	test("can index an array value in the middle of the array", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click set newVar to [10, 20, 30] then put newVar[1] into #d1.innerHTML'></div>"
		)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d1')).toHaveText("20")
	})

	test("can index an array value at the end of the array", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click set newVar to [10, 20, 30] then put newVar[2] into #d1.innerHTML'></div>"
		)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d1')).toHaveText("30")
	})

	test("can index an array value", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click set newVar to [10, 20, 30] then put newVar[0] into #d1.innerHTML'></div>"
		)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d1')).toHaveText("10")
	})

	test("can index an array value with an expression", async ({html, find}) => {
		await html(
			'<div id=\'d1\' _=\'on click set newVar to ["A", "B", "C"] then put newVar[1+1] into #d1.innerHTML\'></div>'
		)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d1')).toHaveText("C")
	})

	test("can get the range of first values in an array", async ({html, find}) => {
		await html(`<div id="d1" _="on click set var to [0,1,2,3,4,5] then put var[..3] as String into #d1"></div>`)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d1')).toHaveText("0,1,2,3")
	})

	test("can get the range of middle values in an array", async ({html, find}) => {
		await html(
			`<div id="d1" _="on click set var to [0,1,2,3,4,5] then put var[2 .. 3] as String into #d1"></div>`
		)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d1')).toHaveText("2,3")
	})

	test("can get the range of middle values in an array WITHOUT EXTRA SPACES", async ({html, find}) => {
		await html(
			`<div id="d1" _="on click set var to [0,1,2,3,4,5] then put var[2..3] as String into #d1"></div>`
		)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d1')).toHaveText("2,3")
	})

	test("can get the range of middle values in an array using an expression", async ({html, find}) => {
		await html(
			`<div id="d1" _="on click set index to 3 then set var to [0,1,2,3,4,5] then put var[(index-1)..(index+1)] as String into #d1"></div>`
		)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d1')).toHaveText("2,3,4")
	})

	test("can get the range of last values in an array", async ({html, find}) => {
		await html(
			`<div id="d1" _="on click set var to [0,1,2,3,4,5] then put var[3 ..] as String into #d1"></div>`
		)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d1')).toHaveText("3,4,5")
	})

	test("can get the range of last values in an array WITHOUT EXTRA SPACES", async ({html, find}) => {
		await html(`<div id="d1" _="on click set var to [0,1,2,3,4,5] then put var[3..] as String into #d1"></div>`)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d1')).toHaveText("3,4,5")
	})

	test("errors when index exceeds array length", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click set newVar to [10, 20, 30] then put newVar[10] into #d1.innerHTML'></div>"
		)
		// Original test just catches error and logs it; verify no crash
		await find('#d1').dispatchEvent('click')
	})

	test("errors when indexed value is not an array", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click set newVar to \"not-an-array\" then put newVar[0] into #d1.innerHTML'></div>"
		)
		// Original test just catches error and logs it; verify no crash
		await find('#d1').dispatchEvent('click')
	})
})
