import {test, expect} from '../fixtures.js'

test.describe('tailwindcss extensions', () => {

	test('can hide element, with tailwindcss hidden class default strategy', async ({html, find, evaluate}) => {
		await evaluate(() => _hyperscript.config.defaultHideShowStrategy = "twDisplay")
		await html("<div _='on click hide'></div>")
		await expect(find('div')).not.toHaveClass(/hidden/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveClass(/hidden/)
	})

	test('can hide element, with tailwindcss invisible class default strategy', async ({html, find, evaluate}) => {
		await evaluate(() => _hyperscript.config.defaultHideShowStrategy = "twVisibility")
		await html("<div _='on click hide'></div>")
		await expect(find('div')).not.toHaveClass(/invisible/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveClass(/invisible/)
	})

	test('can hide element, with tailwindcss opacity-0 class default strategy', async ({html, find, evaluate}) => {
		await evaluate(() => _hyperscript.config.defaultHideShowStrategy = "twOpacity")
		await html("<div _='on click hide'></div>")
		await expect(find('div')).not.toHaveClass(/opacity-0/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveClass(/opacity-0/)
	})

	test('can hide element, with tailwindcss hidden class', async ({html, find}) => {
		await html("<div _='on click hide with twDisplay'></div>")
		await expect(find('div')).not.toHaveClass(/hidden/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveClass(/hidden/)
	})

	test('can hide element, with tailwindcss invisible class', async ({html, find}) => {
		await html("<div _='on click hide with twVisibility'></div>")
		await expect(find('div')).not.toHaveClass(/invisible/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveClass(/invisible/)
	})

	test('can hide element, with tailwindcss opacity-0 class', async ({html, find}) => {
		await html("<div _='on click hide with twOpacity'></div>")
		await expect(find('div')).not.toHaveClass(/opacity-0/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveClass(/opacity-0/)
	})

	test('can show element, with tailwindcss removing hidden class default strategy', async ({html, find, evaluate}) => {
		await evaluate(() => _hyperscript.config.defaultHideShowStrategy = "twDisplay")
		await html("<div class='hidden' _='on click show'></div>")
		await expect(find('div')).toHaveClass(/hidden/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).not.toHaveClass(/hidden/)
	})

	test('can show element, with tailwindcss removing invisible class default strategy', async ({html, find, evaluate}) => {
		await evaluate(() => _hyperscript.config.defaultHideShowStrategy = "twVisibility")
		await html("<div class='invisible' _='on click show'></div>")
		await expect(find('div')).toHaveClass(/invisible/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).not.toHaveClass(/invisible/)
	})

	test('can show element, with tailwindcss removing opacity-0 class default strategy', async ({html, find, evaluate}) => {
		await evaluate(() => _hyperscript.config.defaultHideShowStrategy = "twOpacity")
		await html("<div class='opacity-0' _='on click show'></div>")
		await expect(find('div')).toHaveClass(/opacity-0/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).not.toHaveClass(/opacity-0/)
	})

	test('can show element, with tailwindcss removing hidden class', async ({html, find}) => {
		await html("<div class='hidden' _='on click show with twDisplay'></div>")
		await expect(find('div')).toHaveClass(/hidden/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).not.toHaveClass(/hidden/)
	})

	test('can show element, with tailwindcss removing invisible class', async ({html, find}) => {
		await html("<div class='invisible' _='on click show with twVisibility'></div>")
		await expect(find('div')).toHaveClass(/invisible/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).not.toHaveClass(/invisible/)
	})

	test('can show element, with tailwindcss removing opacity-0 class', async ({html, find}) => {
		await html("<div class='opacity-0' _='on click show with twOpacity'></div>")
		await expect(find('div')).toHaveClass(/opacity-0/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).not.toHaveClass(/opacity-0/)
	})

})
