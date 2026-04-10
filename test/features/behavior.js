import {test, expect} from '../fixtures.js'

test.describe('the behavior feature', () => {

	test('can define behaviors', async ({html, evaluate}) => {
		await html(
			"<script type=text/hyperscript>" +
			"behavior TheBehaviorWeAreDefiningForHyperscriptTestingPurposes init log 'foo' end end" +
			"</script>"
		)
		const result = await evaluate(() => 'TheBehaviorWeAreDefiningForHyperscriptTestingPurposes' in window)
		expect(result).toBe(true)
	})

	test('can install behaviors', async ({html, find}) => {
		await html(
			"<script type=text/hyperscript>behavior Behave on click add .foo end end</script>" +
			"<div _='install Behave'></div>"
		)
		await expect(find('div')).not.toHaveClass(/foo/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveClass(/foo/)
	})

	test('can pass arguments to behaviors', async ({html, find}) => {
		await html(
			"<script type=text/hyperscript>" +
			"behavior Behave(foo, bar) on click put foo + bar into me end end" +
			"</script>" +
			"<div _='install Behave(foo: 1, bar: 1)'></div>"
		)
		await expect(find('div')).toHaveText('')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('2')
	})

	test('supports init blocks in behaviors', async ({html, find}) => {
		await html(
			"<script type=text/hyperscript>behavior Behave init add .foo to me end</script>" +
			"<div _='install Behave'></div>"
		)
		await expect(find('div')).toHaveClass(/foo/)
	})

	test('can pass element arguments to listen to in behaviors', async ({html, find}) => {
		await html(
			"<script type=text/hyperscript>" +
			"behavior Behave(elt) on click from elt put 'foo' into me end end" +
			"</script>" +
			"<button id='b1'></button>" +
			"<div _='install Behave(elt: #b1)'></div>"
		)
		await expect(find('div')).toHaveText('')
		await find('#b1').dispatchEvent('click')
		await expect(find('div')).toHaveText('foo')
	})

	test('can refer to arguments in init blocks', async ({html, find}) => {
		await html(
			"<script type=text/hyperscript>" +
			"behavior Behave(elt) init put 'foo' into elt end end" +
			"</script>" +
			"<div id='d1'></div>" +
			"<div _='install Behave(elt: #d1)'></div>"
		)
		await expect(find('#d1')).toHaveText('foo')
	})

	test('can declare variables in init blocks', async ({html, find}) => {
		await html(
			`<script type=text/hyperscript>
				behavior Behave
					init
						set element's foo to 1
						set element's bar to {}
					end
					on click
						increment element's foo
						set element's bar["count"] to element's foo
						put element's bar["count"] into me
					end
				end
			</script>` +
			"<div _='install Behave'></div>"
		)
		await expect(find('div')).toHaveText('')
		// Wait for init to complete
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('2')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('3')
	})

	test('install resolves namespaced behavior paths', async ({html, find}) => {
		await html(
			"<script type=text/hyperscript>behavior App.Widgets.Clickable on click add .clicked end end</script>" +
			"<div _='install App.Widgets.Clickable'></div>"
		)
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveClass(/clicked/)
	})

	test('install throws when the behavior path does not exist', async ({html, page, evaluate}) => {
		var messages = []
		page.on('console', m => { if (m.type() === 'error') messages.push(m.text()) })
		page.on('pageerror', e => messages.push(e.message))
		await html("<div _='install NoSuchBehavior'></div>")
		// install() runs during processNode; errors are surfaced via console.error
		var combined = messages.join('\n')
		expect(combined).toMatch(/No such behavior defined as NoSuchBehavior/)
	})

	test('install throws when the path resolves to a non-function', async ({html, page, evaluate}) => {
		var messages = []
		page.on('console', m => { if (m.type() === 'error') messages.push(m.text()) })
		page.on('pageerror', e => messages.push(e.message))
		await evaluate(() => { window.NotABehavior = { hello: 'world' } })
		await html("<div _='install NotABehavior'></div>")
		var combined = messages.join('\n')
		expect(combined).toMatch(/NotABehavior is not a behavior/)
		await evaluate(() => { delete window.NotABehavior })
	})

})
