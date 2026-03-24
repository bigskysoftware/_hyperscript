import {test, expect} from '../fixtures.js'

test.describe("the beep! expression", () => {

	test("beeps a basic value", async ({page, html}) => {
		const logs = []
		page.on('console', async msg => {
			if (msg.type() === 'log') {
				logs.push(await Promise.all(msg.args().map(a => a.jsonValue())))
			}
		})
		await html("<div _='on click get beep! 10'></div>")
		await page.locator('#work-area div').dispatchEvent('click')
		await expect.poll(() => logs.length).toBeGreaterThan(0)
		expect(logs[0]).toEqual(['///_ BEEP! The expression (10) evaluates to:', 10, 'of type Number'])
	})

	test("beeps a null value", async ({page, html}) => {
		const logs = []
		page.on('console', async msg => {
			if (msg.type() === 'log') {
				logs.push(await Promise.all(msg.args().map(a => a.jsonValue())))
			}
		})
		await html("<div _='on click get beep! null'></div>")
		await page.locator('#work-area div').dispatchEvent('click')
		await expect.poll(() => logs.length).toBeGreaterThan(0)
		expect(logs[0]).toEqual(['///_ BEEP! The expression (null) evaluates to:', null, 'of type object (null)'])
	})

	test("beeps a formatted string value", async ({page, html}) => {
		const logs = []
		page.on('console', async msg => {
			if (msg.type() === 'log') {
				logs.push(await Promise.all(msg.args().map(a => a.jsonValue())))
			}
		})
		await html("<div _='on click get beep! \"foo\"'></div>")
		await page.locator('#work-area div').dispatchEvent('click')
		await expect.poll(() => logs.length).toBeGreaterThan(0)
		expect(logs[0]).toEqual(['///_ BEEP! The expression ("foo") evaluates to:', '"foo"', 'of type String'])
	})

	test("beeps the result of an ElementCollection", async ({page, html}) => {
		const logs = []
		page.on('console', async msg => {
			if (msg.type() === 'log') {
				logs.push(await Promise.all(msg.args().map(a => a.jsonValue().catch(() => '[Element]'))))
			}
		})
		await html("<div class='foo' _='on click get beep! .foo'></div>")
		await page.locator('#work-area div.foo').dispatchEvent('click')
		await expect.poll(() => logs.length).toBeGreaterThan(0)
		// The first two entries are the message and an element (which serializes as an object)
		expect(logs[0][0]).toBe('///_ BEEP! The expression (.foo) evaluates to:')
		expect(logs[0][2]).toBe('of type ElementCollection')
	})

	test("can be cancelled", async ({page, html}) => {
		const logs = []
		page.on('console', async msg => {
			if (msg.type() === 'log') {
				const text = msg.text()
				if (text.includes('BEEP')) {
					logs.push(text)
				}
			}
		})
		await html("<div _='on hyperscript:beep halt on click get beep! \"foo\"'></div>")
		await page.locator('#work-area div').dispatchEvent('click')
		// Wait a bit to ensure no beep logs appear
		await page.waitForTimeout(100)
		expect(logs.length).toBe(0)
	})

	test("can capture information from event", async ({html, find, evaluate}) => {
		await html("<div id='beepDiv' _='on hyperscript:beep(value) set my @data-value to the value on click get beep! \"foo\"'></div>")
		await find('#beepDiv').dispatchEvent('click')
		await expect.poll(() => evaluate(() => document.getElementById('beepDiv').getAttribute("data-value"))).toBe("foo")
	})
})
