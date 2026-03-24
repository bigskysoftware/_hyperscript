import {test, expect} from '../fixtures.js'

test.describe('the set feature', () => {

	test('can define variables with let at the element level', async ({html, find}) => {
		await html("<div _='set :foo to 42 on click put :foo into my innerHTML'></div>")
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('42')
	})

})
