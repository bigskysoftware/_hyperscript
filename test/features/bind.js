import {test, expect} from '../fixtures.js'

test.describe('the bind feature', () => {

	// ================================================================
	// Two-way binding
	// ================================================================

	test('syncs variable and input value in both directions', async ({html, find, run, evaluate}) => {
		await html(
			`<input type="text" id="name-input" value="Alice" />` +
			`<span _="bind $name and #name-input.value end
			          when $name changes put it into me"></span>`
		)
		await expect(find('span')).toHaveText('Alice')

		// User types -> variable updates
		await evaluate(() => {
			var input = document.getElementById('name-input')
			input.value = 'Bob'
			input.dispatchEvent(new Event('input', { bubbles: true }))
		})
		await expect(find('span')).toHaveText('Bob')

		// Variable changes -> input updates
		await run("set $name to 'Charlie'")
		await expect.poll(() => evaluate(() => document.getElementById('name-input').value)).toBe('Charlie')
		await evaluate(() => { delete window.$name })
	})

	test('syncs variable and attribute in both directions', async ({html, find, run, evaluate}) => {
		await run("set $theme to 'light'")
		await html(`<div _="bind $theme and @data-theme"></div>`)
		await expect(find('div')).toHaveAttribute('data-theme', 'light')

		await run("set $theme to 'dark'")
		await expect(find('div')).toHaveAttribute('data-theme', 'dark')

		await evaluate(() => document.querySelector('#work-area div').setAttribute('data-theme', 'auto'))
		await expect.poll(() => evaluate(() => window.$theme), { timeout: 5000 }).toBe('auto')
		await evaluate(() => { delete window.$theme })
	})

	test('dedup prevents infinite loop in two-way bind', async ({html, find, run, evaluate}) => {
		await run("set $color to 'red'")
		await html(`<div _="bind $color and @data-color"></div>`)
		await expect(find('div')).toHaveAttribute('data-color', 'red')

		await run("set $color to 'blue'")
		await expect(find('div')).toHaveAttribute('data-color', 'blue')
		await expect.poll(() => evaluate(() => window.$color)).toBe('blue')
		await evaluate(() => { delete window.$color })
	})

	test('"with" is a synonym for "and"', async ({html, find, run, evaluate}) => {
		await html(
			`<input type="text" id="city-input" value="Paris" />` +
			`<span _="bind $city with #city-input.value end
			          when $city changes put it into me"></span>`
		)
		await expect(find('span')).toHaveText('Paris')

		await run("set $city to 'London'")
		await expect.poll(() => evaluate(() => document.getElementById('city-input').value)).toBe('London')
		await evaluate(() => { delete window.$city })
	})

	// ================================================================
	// Shorthand: bind $var
	// ================================================================

	test('shorthand on text input binds to value', async ({html, find, run, evaluate}) => {
		await html(
			`<input type="text" value="hello"
			        _="bind $greeting end
			           when $greeting changes put it into next <span/>"></input>` +
			`<span></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('hello')

		await find('input').fill('goodbye')
		await expect.poll(() => find('span').textContent()).toBe('goodbye')

		await run("set $greeting to 'hey'")
		await expect.poll(() => evaluate(() => document.querySelector('#work-area input').value)).toBe('hey')
		await evaluate(() => { delete window.$greeting })
	})

	test('shorthand on checkbox binds to checked', async ({html, find, run, evaluate}) => {
		await run("set $isDarkMode to false")
		await html(
			`<input type="checkbox" _="bind $isDarkMode" />` +
			`<span _="when $isDarkMode changes put it into me"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('false')

		await find('input').check()
		await expect.poll(() => find('span').textContent()).toBe('true')

		await run("set $isDarkMode to false")
		await expect.poll(() => evaluate(() => document.querySelector('#work-area input').checked)).toBe(false)
		await evaluate(() => { delete window.$isDarkMode })
	})

	test('shorthand on textarea binds to value', async ({html, find, run, evaluate}) => {
		await html(
			`<textarea _="bind $bio">Hello world</textarea>` +
			`<span _="when $bio changes put it into me"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('Hello world')

		await find('textarea').fill('New bio')
		await expect.poll(() => find('span').textContent()).toBe('New bio')
		await evaluate(() => { delete window.$bio })
	})

	test('shorthand on select binds to value', async ({html, find, run, evaluate}) => {
		await html(
			`<select _="bind $country">
			   <option value="us">United States</option>
			   <option value="uk">United Kingdom</option>
			   <option value="fr">France</option>
			 </select>` +
			`<span _="when $country changes put it into me"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('us')

		await find('select').selectOption('uk')
		await expect.poll(() => find('span').textContent()).toBe('uk')
		await evaluate(() => { delete window.$country })
	})

	test('shorthand on unsupported element produces an error', async ({html, find, evaluate}) => {
		const error = await evaluate(() => {
			return new Promise(resolve => {
				var origError = console.error
				console.error = function(msg) {
					if (typeof msg === 'string' && msg.includes('bind shorthand')) {
						resolve(msg)
					}
					origError.apply(console, arguments)
				}
				var wa = document.getElementById('work-area')
				wa.innerHTML = '<div _="bind $nope"></div>'
				_hyperscript.processNode(wa)
				setTimeout(() => { console.error = origError; resolve(null) }, 500)
			})
		})
		expect(await evaluate(() => window.$nope)).toBeUndefined()
	})

	// ================================================================
	// Type coercion
	// ================================================================

	test('shorthand on type=number preserves number type', async ({html, find, run, evaluate}) => {
		await run("set $price to 42")
		await html(
			`<input type="number" _="bind $price" />` +
			`<span _="when $price changes put it into me"></span>`
		)
		await new Promise(r => setTimeout(r, 200))
		expect(await evaluate(() => typeof window.$price)).toBe('number')
		await expect(find('span')).toHaveText('42')
		await evaluate(() => { delete window.$price })
	})

	test('boolean bind to attribute uses presence/absence', async ({html, find, run, evaluate}) => {
		await run("set $isEnabled to true")
		await html(`<div _="bind $isEnabled and @data-active"></div>`)
		await new Promise(r => setTimeout(r, 100))
		await expect(find('div')).toHaveAttribute('data-active', '')

		await run("set $isEnabled to false")
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() =>
			document.querySelector('#work-area div').hasAttribute('data-active')
		)).toBe(false)
		await evaluate(() => { delete window.$isEnabled })
	})

	test('boolean bind to aria-* attribute uses "true"/"false" strings', async ({html, find, run, evaluate}) => {
		await run("set $isHidden to true")
		await html(`<div _="bind $isHidden and @aria-hidden"></div>`)
		await new Promise(r => setTimeout(r, 100))
		await expect(find('div')).toHaveAttribute('aria-hidden', 'true')

		await run("set $isHidden to false")
		await new Promise(r => setTimeout(r, 100))
		await expect(find('div')).toHaveAttribute('aria-hidden', 'false')
		await evaluate(() => { delete window.$isHidden })
	})

	test('style bind is one-way: variable drives style, not vice versa', async ({html, find, run, evaluate}) => {
		await run("set $opacity to 1")
		await html(`<div _="bind $opacity and *opacity">visible</div>`)
		await new Promise(r => setTimeout(r, 100))

		await run("set $opacity to 0.3")
		await expect.poll(() =>
			evaluate(() => document.querySelector('#work-area div').style.opacity)
		).toBe('0.3')

		// Changing style directly does NOT update the variable
		await evaluate(() => document.querySelector('#work-area div').style.opacity = '0.9')
		await new Promise(r => setTimeout(r, 200))
		expect(await evaluate(() => window.$opacity)).toBe(0.3)
		await evaluate(() => { delete window.$opacity })
	})

	// ================================================================
	// Edge cases
	// ================================================================

	test('same value does not re-set input (prevents cursor jump)', async ({html, find, evaluate}) => {
		await html(`<input type="text" value="hello" _="bind $message" />`)
		await new Promise(r => setTimeout(r, 100))

		const setterWasCalled = await evaluate(() => {
			var input = document.querySelector('#work-area input')
			var called = false
			var desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
			Object.defineProperty(input, 'value', {
				get: desc.get,
				set: function(v) { called = true; desc.set.call(this, v) },
				configurable: true
			})
			window.$message = 'hello' // same value
			return new Promise(resolve => {
				setTimeout(() => { delete input.value; resolve(called) }, 100)
			})
		})
		expect(setterWasCalled).toBe(false)
		await evaluate(() => { delete window.$message })
	})

	test('external JS property write does not sync (known limitation)', async ({html, find, run, evaluate}) => {
		await html(
			`<input type="text" value="original" _="bind $searchTerm" />` +
			`<span _="when $searchTerm changes put it into me"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('original')

		await evaluate(() => {
			document.querySelector('#work-area input').value = 'from-javascript'
		})
		await new Promise(r => setTimeout(r, 200))
		expect(await evaluate(() => window.$searchTerm)).toBe('original')
		await evaluate(() => { delete window.$searchTerm })
	})

	test('form.reset() syncs variable back to default value', async ({html, find, run, evaluate}) => {
		await html(
			`<form id="test-form">` +
			`  <input type="text" value="default" _="bind $formField" />` +
			`</form>` +
			`<span _="when $formField changes put it into me"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('default')

		await find('input').fill('user typed this')
		await expect.poll(() => find('span').textContent()).toBe('user typed this')

		await evaluate(() => document.getElementById('test-form').reset())
		await expect.poll(() => find('span').textContent()).toBe('default')
		expect(await evaluate(() => window.$formField)).toBe('default')
		await evaluate(() => { delete window.$formField })
	})

	// ================================================================
	// Radio button groups
	// ================================================================

	test('clicking a radio sets the variable to its value', async ({html, find, run, evaluate}) => {
		await run("set $color to 'red'")
		await html(
			`<input type="radio" name="color" value="red" _="bind $color" />` +
			`<input type="radio" name="color" value="blue" _="bind $color" />` +
			`<input type="radio" name="color" value="green" _="bind $color" />` +
			`<span _="when $color changes put it into me"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('red')

		await find('input[value="blue"]').click()
		await expect.poll(() => find('span').textContent()).toBe('blue')

		await find('input[value="green"]').click()
		await expect.poll(() => find('span').textContent()).toBe('green')
		await evaluate(() => { delete window.$color })
	})

	test('setting variable programmatically checks the matching radio', async ({html, find, run, evaluate}) => {
		await run("set $size to 'small'")
		await html(
			`<input type="radio" name="size" value="small" _="bind $size" />` +
			`<input type="radio" name="size" value="medium" _="bind $size" />` +
			`<input type="radio" name="size" value="large" _="bind $size" />`
		)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => document.querySelector('input[value="small"]').checked)).toBe(true)
		expect(await evaluate(() => document.querySelector('input[value="medium"]').checked)).toBe(false)

		await run("set $size to 'large'")
		await expect.poll(() =>
			evaluate(() => document.querySelector('input[value="large"]').checked)
		).toBe(true)
		expect(await evaluate(() => document.querySelector('input[value="small"]').checked)).toBe(false)
		expect(await evaluate(() => document.querySelector('input[value="medium"]').checked)).toBe(false)
		await evaluate(() => { delete window.$size })
	})

	test('initial value checks the correct radio on load', async ({html, find, run, evaluate}) => {
		await run("set $fruit to 'banana'")
		await html(
			`<input type="radio" name="fruit" value="apple" _="bind $fruit" />` +
			`<input type="radio" name="fruit" value="banana" _="bind $fruit" />` +
			`<input type="radio" name="fruit" value="cherry" _="bind $fruit" />`
		)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => document.querySelector('input[value="apple"]').checked)).toBe(false)
		expect(await evaluate(() => document.querySelector('input[value="banana"]').checked)).toBe(true)
		expect(await evaluate(() => document.querySelector('input[value="cherry"]').checked)).toBe(false)
		await evaluate(() => { delete window.$fruit })
	})

	// ================================================================
	// Class binding
	// ================================================================

	test('variable drives class: setting variable adds/removes class', async ({html, find, run, evaluate}) => {
		await run("set $darkMode to false")
		await html(`<div _="bind .dark and $darkMode">test</div>`)
		await new Promise(r => setTimeout(r, 100))
		await expect(find('div')).not.toHaveClass('dark')

		await run("set $darkMode to true")
		await expect.poll(() => find('div').getAttribute('class')).toContain('dark')

		await run("set $darkMode to false")
		await expect.poll(() => find('div').getAttribute('class') || '').not.toContain('dark')
		await evaluate(() => { delete window.$darkMode })
	})

	test('external class change syncs back to variable', async ({html, find, run, evaluate}) => {
		await run("set $darkMode to false")
		await html(`<div _="bind .dark and $darkMode">test</div>`)
		await new Promise(r => setTimeout(r, 100))

		await evaluate(() => document.querySelector('#work-area div').classList.add('dark'))
		await expect.poll(() => evaluate(() => window.$darkMode)).toBe(true)

		await evaluate(() => document.querySelector('#work-area div').classList.remove('dark'))
		await expect.poll(() => evaluate(() => window.$darkMode)).toBe(false)
		await evaluate(() => { delete window.$darkMode })
	})

	test('variable on left drives class on init', async ({html, find, run, evaluate}) => {
		await run("set $highlighted to true")
		await html(`<div _="bind $highlighted and .highlight">test</div>`)
		await new Promise(r => setTimeout(r, 100))
		await expect(find('div')).toHaveClass('highlight')
		await evaluate(() => { delete window.$highlighted })
	})

	// ================================================================
	// Initialization: left side wins
	// ================================================================

	test('init: variable on left wins over input value on right', async ({html, find, run, evaluate}) => {
		await run("set $name to 'Alice'")
		await html(`<input type="text" value="Bob" _="bind $name and my value" />`)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => document.querySelector('#work-area input').value)).toBe('Alice')
		expect(await evaluate(() => window.$name)).toBe('Alice')
		await evaluate(() => { delete window.$name })
	})

	test('init: input value on left wins over variable on right', async ({html, find, run, evaluate}) => {
		await run("set $name to 'Alice'")
		await html(`<input type="text" value="Bob" _="bind my value and $name" />`)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => document.querySelector('#work-area input').value)).toBe('Bob')
		expect(await evaluate(() => window.$name)).toBe('Bob')
		await evaluate(() => { delete window.$name })
	})

	test('init: undefined left side loses to defined right side', async ({html, find, run, evaluate}) => {
		await html(`<div data-color="red" _="bind $color and @data-color"></div>`)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => window.$color)).toBe('red')
		await evaluate(() => { delete window.$color })
	})

	test('init: defined left side wins over null right side', async ({html, find, run, evaluate}) => {
		await run("set $theme to 'dark'")
		await html(`<div _="bind $theme and @data-theme"></div>`)
		await new Promise(r => setTimeout(r, 100))
		await expect(find('div')).toHaveAttribute('data-theme', 'dark')
		await evaluate(() => { delete window.$theme })
	})

	test('init: present class on left wins over false variable on right', async ({html, find, run, evaluate}) => {
		await run("set $isDark to false")
		await html(`<div class="dark" _="bind .dark and $isDark"></div>`)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => window.$isDark)).toBe(true)
		await evaluate(() => { delete window.$isDark })
	})

	test('init: true variable on left wins over absent class on right', async ({html, find, run, evaluate}) => {
		await run("set $isDark to true")
		await html(`<div _="bind $isDark and .dark"></div>`)
		await new Promise(r => setTimeout(r, 100))
		await expect.poll(() => find('div').getAttribute('class')).toContain('dark')
		await evaluate(() => { delete window.$isDark })
	})

	// ================================================================
	// Expression types: possessive, of-expression, attributeRefAccess
	// ================================================================

	test('possessive property: bind $var and my value', async ({html, find, run, evaluate}) => {
		await run("set $myVal to 'hello'")
		await html(`<input type="text" value="" _="bind $myVal and my value" />`)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => document.querySelector('#work-area input').value)).toBe('hello')

		await find('input').fill('world')
		await expect.poll(() => evaluate(() => window.$myVal)).toBe('world')
		await evaluate(() => { delete window.$myVal })
	})

	test('possessive attribute: bind $var and my @data-label', async ({html, find, run, evaluate}) => {
		await run("set $label to 'important'")
		await html(`<div _="bind $label and my @data-label"></div>`)
		await new Promise(r => setTimeout(r, 100))
		await expect(find('div')).toHaveAttribute('data-label', 'important')

		await run("set $label to 'normal'")
		await expect.poll(() => find('div').getAttribute('data-label')).toBe('normal')
		await evaluate(() => { delete window.$label })
	})

	test('of-expression: bind $var and value of #input', async ({html, find, run, evaluate}) => {
		await run("set $search to 'initial'")
		await html(
			`<input type="text" id="of-input" value="" />` +
			`<div _="bind $search and value of #of-input"></div>`
		)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => document.getElementById('of-input').value)).toBe('initial')
		await evaluate(() => { delete window.$search })
	})

	// ================================================================
	// Cross-element binding
	// ================================================================

	test('class bound to another element checkbox', async ({html, find, evaluate}) => {
		await html(
			`<input type="checkbox" id="dark-toggle" />` +
			`<div _="bind .dark and #dark-toggle's checked">test</div>`
		)
		await new Promise(r => setTimeout(r, 100))
		await expect(find('div')).not.toHaveClass('dark')

		await find('#dark-toggle').check()
		await expect.poll(() => find('div').getAttribute('class')).toContain('dark')

		await find('#dark-toggle').uncheck()
		await expect.poll(() => find('div').getAttribute('class') || '').not.toContain('dark')
	})

	test('attribute bound to another element input value', async ({html, find, evaluate}) => {
		await html(
			`<input type="text" id="title-input" value="Hello" />` +
			`<h1 _="bind @data-title and #title-input's value"></h1>`
		)
		await expect.poll(() => find('h1').getAttribute('data-title')).toBe('Hello')

		await find('#title-input').fill('World')
		await expect.poll(() => find('h1').getAttribute('data-title')).toBe('World')
	})

	test('two inputs synced via bind', async ({html, find, evaluate}) => {
		await html(
			`<input type="range" id="slider" value="50" />` +
			`<input type="number" _="bind my value and #slider's value" />`
		)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => document.querySelector('#work-area input[type=number]').value)).toBe('50')

		await evaluate(() => {
			var slider = document.getElementById('slider')
			slider.value = '75'
			slider.dispatchEvent(new Event('input', {bubbles: true}))
		})
		await expect.poll(() =>
			evaluate(() => document.querySelector('#work-area input[type=number]').value)
		).toBe('75')
	})

	// ================================================================
	// Cleanup
	// ================================================================

	test('radio change listener is removed on cleanup', async ({html, evaluate, run}) => {
		await run("set $color to 'red'")
		await html(
			`<input type="radio" name="color" value="red" _="bind $color" checked />` +
			`<input type="radio" name="color" value="blue" _="bind $color" />`
		)
		await evaluate(() => new Promise(r => setTimeout(r, 50)))

		// Cleanup the blue radio
		var blueRadio = await evaluate(() => {
			var blue = document.querySelector('#work-area input[value=blue]')
			_hyperscript.internals.runtime.cleanup(blue)
			return true
		})

		// Click the cleaned-up blue radio — $color should NOT change
		await evaluate(() => {
			var blue = document.querySelector('#work-area input[value=blue]')
			blue.checked = true
			blue.dispatchEvent(new Event('change'))
		})
		await evaluate(() => new Promise(r => setTimeout(r, 50)))
		var color = await run("$color")
		expect(color).toBe('red')
		await evaluate(() => { delete window.$color })
	})

	test('form reset listener is removed on cleanup', async ({html, evaluate, run}) => {
		await run("set $val to 'initial'")
		await html(
			`<form>` +
			`<input type="text" id="binput" value="initial" _="bind $val" />` +
			`<button type="reset">Reset</button>` +
			`</form>`
		)
		await evaluate(() => new Promise(r => setTimeout(r, 50)))

		// Change value then cleanup the input
		await run("set $val to 'changed'")
		await evaluate(() => new Promise(r => setTimeout(r, 50)))
		await evaluate(() => {
			var input = document.querySelector('#work-area #binput')
			_hyperscript.internals.runtime.cleanup(input)
		})

		// Reset the form — $val should NOT revert since listener was removed
		await evaluate(() => {
			document.querySelector('#work-area form').reset()
		})
		await evaluate(() => new Promise(r => setTimeout(r, 50)))
		var val = await run("$val")
		expect(val).toBe('changed')
		await evaluate(() => { delete window.$val })
	})

})
