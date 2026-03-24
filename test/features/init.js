import {test, expect} from '../fixtures.js'

test.describe('the init feature', () => {

	test('can define an init block inline', async ({html, find}) => {
		await html(
			"<div _='init " +
			"                 set my.foo to 42 " +
			"               end" +
			"               on click put my.foo into my.innerHTML'></div>"
		)
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('42')
	})

	test('can define an init block in a script', async ({html, evaluate}) => {
		await html("<script type='text/hyperscript'>  init    set window.foo to 42  end</script>")
		await expect.poll(() => evaluate(() => window.foo)).toBe(42)
	})

	test('can initialize immediately', async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>init set window.foo to 10 end" +
			"                                init immediately set window.bar to window.foo end</script>"
		)
		await expect.poll(() => evaluate(() => window.foo)).toBe(10)
		const bar = await evaluate(() => window.bar)
		expect(bar).toBeUndefined()
	})

})
