import {test, expect} from '../fixtures.js'

test.describe('the set feature', () => {

	test('can define variables with let at the element level', async ({html, find}) => {
		await html("<div _='set :foo to 42 on click put :foo into my innerHTML'></div>")
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('42')
	})

	test('supports DOM-scoped (^) variables at the element level', async ({html, find}) => {
		// ^foo is "inherited" (DOM) scope — allowed at feature level
		await html("<div _='set ^foo to 42 on click put ^foo into me'></div>")
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('42')
	})

	test('rejects global-scoped ($) variables at the feature level', async ({html, page}) => {
		var messages = []
		page.on('console', m => { if (m.type() === 'error') messages.push(m.text()) })
		page.on('pageerror', e => messages.push(e.message))
		await html("<div _='set $globalAtFeature to 42'></div>")
		expect(messages.join('\n')).toMatch(/element or DOM scoped/)
	})

	test('rejects bare (local) variables at the feature level', async ({html, page}) => {
		var messages = []
		page.on('console', m => { if (m.type() === 'error') messages.push(m.text()) })
		page.on('pageerror', e => messages.push(e.message))
		await html("<div _='set localAtFeature to 42'></div>")
		expect(messages.join('\n')).toMatch(/element or DOM scoped/)
	})

})
