import {test, expect} from '../fixtures.js'

test.describe('reactive property tracking', () => {

	test('setting a property on a plain object triggers reactivity', async ({html, find, run, evaluate}) => {
		await run("set $obj to {x: 1, y: 2}")
		await html(`<output _="when ($obj's x + $obj's y) changes put it into me"></output>`)
		await expect(find('output')).toHaveText('3')

		await run("set $obj's x to 10")
		await expect.poll(() => find('output').textContent()).toBe('12')
		await evaluate(() => { delete window.$obj })
	})

	test('nested property chain triggers on intermediate reassignment', async ({html, find, run, evaluate}) => {
		await run("set $data to {inner: {val: 'hello'}}")
		await html(`<output _="when $data's inner's val changes put it into me"></output>`)
		await expect(find('output')).toHaveText('hello')

		await run("set $data's inner to {val: 'world'}")
		await expect.poll(() => find('output').textContent()).toBe('world')
		await evaluate(() => { delete window.$data })
	})

	test('property change on DOM element triggers reactivity via setProperty', async ({html, find, run}) => {
		await html(
			`<input type="text" id="prop-input" value="start" />` +
			`<output _="when #prop-input's value changes put it into me"></output>`
		)
		await expect(find('output')).toHaveText('start')

		await run("set #prop-input's value to 'updated'")
		await expect.poll(() => find('output').textContent()).toBe('updated')
	})

	test('always block tracks property reads on plain objects', async ({html, find, run, evaluate}) => {
		await run("set $config to {label: 'initial'}")
		await html(`<output _="always put $config's label into me"></output>`)
		await expect.poll(() => find('output').textContent()).toBe('initial')

		await run("set $config's label to 'changed'")
		await expect.poll(() => find('output').textContent()).toBe('changed')
		await evaluate(() => { delete window.$config })
	})

})
