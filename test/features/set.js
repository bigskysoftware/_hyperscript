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

	test('rejects bare (local) variables at the feature level', async ({html, page}) => {
		var messages = []
		page.on('console', m => { if (m.type() === 'error') messages.push(m.text()) })
		page.on('pageerror', e => messages.push(e.message))
		await html("<div _='set localAtFeature to 42'></div>")
		expect(messages.join('\n')).toMatch(/cannot be locally scoped/)
	})

	test('can set an attribute at the feature level', async ({html, find}) => {
		await html("<div id='d1' _='set @data-foo to \"bar\"'></div>")
		await expect(find('#d1')).toHaveAttribute('data-foo', 'bar')
	})

	test('can set an attribute from inside a behavior', async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>" +
			"behavior MarkIt set @data-marked to 'yes' end" +
			"</script>" +
			"<div id='d2' _='install MarkIt'></div>"
		)
		await expect(find('#d2')).toHaveAttribute('data-marked', 'yes')
	})

	test('global ($) variables are allowed at the feature level', async ({html, find, evaluate}) => {
		await html("<div _='set $globalAtFeature to 99'></div>")
		expect(await evaluate(() => window.$globalAtFeature)).toBe(99)
		await evaluate(() => { delete window.$globalAtFeature })
	})

})
