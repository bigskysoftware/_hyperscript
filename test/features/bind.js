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
			`<span _="bind $city to #city-input.value end
			          when $city changes put it into me"></span>`
		)
		await expect(find('span')).toHaveText('Paris')

		await run("set $city to 'London'")
		await expect.poll(() => evaluate(() => document.getElementById('city-input').value)).toBe('London')
		await evaluate(() => { delete window.$city })
	})

	// ================================================================
	// Element auto-detect via 'to me'
	// ================================================================

	test('shorthand on text input binds to value', async ({html, find, run, evaluate}) => {
		await html(
			`<input type="text" value="hello"
			        _="bind $greeting to me end
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
			`<input type="checkbox" _="bind $isDarkMode to me" />` +
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
			`<textarea _="bind $bio to me">Hello world</textarea>` +
			`<span _="when $bio changes put it into me"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('Hello world')

		await find('textarea').fill('New bio')
		await expect.poll(() => find('span').textContent()).toBe('New bio')
		await evaluate(() => { delete window.$bio })
	})

	test('shorthand on select binds to value', async ({html, find, run, evaluate}) => {
		await html(
			`<select _="bind $country to me">
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

	test('unsupported element: bind to plain div errors', async ({html, find, evaluate}) => {
		const error = await evaluate(() => {
			return new Promise(resolve => {
				var origError = console.error
				console.error = function(msg) {
					if (typeof msg === 'string' && msg.includes('bind cannot auto-detect')) {
						resolve(msg)
					}
					origError.apply(console, arguments)
				}
				var wa = document.getElementById('work-area')
				wa.innerHTML = '<div _="bind $nope to me"></div>'
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
			`<input type="number" _="bind $price to me" />` +
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
		await html(`<input type="text" value="hello" _="bind $message to me" />`)
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
			`<input type="text" value="original" _="bind $searchTerm to me" />` +
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
			`  <input type="text" value="default" _="bind $formField to me" />` +
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
			`<input type="radio" name="color" value="red" _="bind $color to me" />` +
			`<input type="radio" name="color" value="blue" _="bind $color to me" />` +
			`<input type="radio" name="color" value="green" _="bind $color to me" />` +
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
			`<input type="radio" name="size" value="small" _="bind $size to me" />` +
			`<input type="radio" name="size" value="medium" _="bind $size to me" />` +
			`<input type="radio" name="size" value="large" _="bind $size to me" />`
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
			`<input type="radio" name="fruit" value="apple" _="bind $fruit to me" />` +
			`<input type="radio" name="fruit" value="banana" _="bind $fruit to me" />` +
			`<input type="radio" name="fruit" value="cherry" _="bind $fruit to me" />`
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

	test('right side wins on class init', async ({html, find, run, evaluate}) => {
		await run("set $highlighted to true")
		await html(`<div _="bind .highlight to $highlighted">test</div>`)
		await new Promise(r => setTimeout(r, 100))
		await expect(find('div')).toHaveClass('highlight')
		await evaluate(() => { delete window.$highlighted })
	})

	// ================================================================
	// Initialization: right side (Y in "bind X to Y") wins
	// ================================================================

	test('init: right side wins - input value (Y) overwrites variable (X)', async ({html, find, run, evaluate}) => {
		await run("set $name to 'Alice'")
		await html(`<input type="text" value="Bob" _="bind $name to my value" />`)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => document.querySelector('#work-area input').value)).toBe('Bob')
		expect(await evaluate(() => window.$name)).toBe('Bob')
		await evaluate(() => { delete window.$name })
	})

	test('init: right side wins - variable (Y) overwrites input value (X)', async ({html, find, run, evaluate}) => {
		await run("set $name to 'Alice'")
		await html(`<input type="text" value="Bob" _="bind my value to $name" />`)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => document.querySelector('#work-area input').value)).toBe('Alice')
		expect(await evaluate(() => window.$name)).toBe('Alice')
		await evaluate(() => { delete window.$name })
	})

	test('init: right side wins - attribute (Y) initializes variable (X)', async ({html, find, run, evaluate}) => {
		await html(`<div data-color="red" _="bind $color to @data-color"></div>`)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => window.$color)).toBe('red')
		await evaluate(() => { delete window.$color })
	})

	test('init: right side wins - variable (Y) initializes attribute (X)', async ({html, find, run, evaluate}) => {
		await run("set $theme to 'dark'")
		await html(`<div _="bind @data-theme to $theme"></div>`)
		await new Promise(r => setTimeout(r, 100))
		await expect(find('div')).toHaveAttribute('data-theme', 'dark')
		await evaluate(() => { delete window.$theme })
	})

	test('init: right side wins - variable (Y) drives class (X)', async ({html, find, run, evaluate}) => {
		await run("set $isDark to true")
		await html(`<div _="bind .dark to $isDark"></div>`)
		await new Promise(r => setTimeout(r, 100))
		await expect.poll(() => find('div').getAttribute('class')).toContain('dark')
		await evaluate(() => { delete window.$isDark })
	})

	test('init: right side wins - class (Y) drives variable (X)', async ({html, find, run, evaluate}) => {
		await run("set $isDark to false")
		await html(`<div class="dark" _="bind $isDark to .dark"></div>`)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => window.$isDark)).toBe(true)
		await evaluate(() => { delete window.$isDark })
	})

	// ================================================================
	// Expression types: possessive, of-expression, attributeRefAccess
	// ================================================================

	test('possessive property: bind $var to my value', async ({html, find, run, evaluate}) => {
		await html(`<input type="text" value="hello" _="bind $myVal to my value" />`)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => window.$myVal)).toBe('hello')

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

	test('of-expression: bind $var to value of #input', async ({html, find, run, evaluate}) => {
		await html(
			`<input type="text" id="of-input" value="initial" />` +
			`<div _="bind $search to value of #of-input"></div>`
		)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => window.$search)).toBe('initial')
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
	// Element auto-detection
	// ================================================================

	test('bind variable to element by id auto-detects value', async ({html, find, run, evaluate}) => {
		await html(
			`<input type="text" id="name-field" value="" />` +
			`<div _="bind $name to #name-field"></div>`
		)
		await run("set $name to 'Alice'")
		await expect.poll(() => evaluate(() => document.getElementById('name-field').value)).toBe('Alice')

		await evaluate(() => {
			var input = document.getElementById('name-field')
			input.value = 'Bob'
			input.dispatchEvent(new Event('input', { bubbles: true }))
		})
		await expect.poll(() => evaluate(() => window.$name)).toBe('Bob')
		await evaluate(() => { delete window.$name })
	})

	test('bind variable to checkbox by id auto-detects checked', async ({html, find, run, evaluate}) => {
		await run("set $agreed to false")
		await html(
			`<input type="checkbox" id="agree-cb" />` +
			`<div _="bind $agreed to #agree-cb"></div>`
		)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => document.getElementById('agree-cb').checked)).toBe(false)

		await run("set $agreed to true")
		await expect.poll(() => evaluate(() => document.getElementById('agree-cb').checked)).toBe(true)
		await evaluate(() => { delete window.$agreed })
	})

	test('bind variable to number input by id auto-detects valueAsNumber', async ({html, find, run, evaluate}) => {
		await run("set $qty to 5")
		await html(
			`<input type="number" id="qty-input" />` +
			`<div _="bind $qty to #qty-input"></div>`
		)
		await expect.poll(() => evaluate(() => document.getElementById('qty-input').valueAsNumber)).toBe(5)
		expect(await evaluate(() => typeof window.$qty)).toBe('number')
		await evaluate(() => { delete window.$qty })
	})

	test('bind element to element: both sides auto-detect', async ({html, find, evaluate}) => {
		await html(
			`<input type="range" id="range-slider" value="50" />` +
			`<input type="number" _="bind me to #range-slider" />`
		)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => document.querySelector('#work-area input[type=number]').valueAsNumber)).toBe(50)

		await evaluate(() => {
			var slider = document.getElementById('range-slider')
			slider.value = '75'
			slider.dispatchEvent(new Event('input', { bubbles: true }))
		})
		await expect.poll(() =>
			evaluate(() => document.querySelector('#work-area input[type=number]').valueAsNumber)
		).toBe(75)
	})

	test('right side wins on init: variable (Y) initializes input (X)', async ({html, find, run, evaluate}) => {
		await run("set $name to 'Alice'")
		await html(`<input type="text" value="Bob" _="bind me to $name" />`)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => window.$name)).toBe('Alice')
		expect(await evaluate(() => document.querySelector('#work-area input').value)).toBe('Alice')
		await evaluate(() => { delete window.$name })
	})

	test('right side wins on init: input (Y) initializes variable (X)', async ({html, find, run, evaluate}) => {
		await html(`<input type="text" value="Bob" _="bind $name to me" />`)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => window.$name)).toBe('Bob')
		expect(await evaluate(() => document.querySelector('#work-area input').value)).toBe('Bob')
		await evaluate(() => { delete window.$name })
	})

	// ================================================================
	// Contenteditable and custom elements
	// ================================================================

	test('bind to contenteditable element auto-detects textContent', async ({html, find, run, evaluate}) => {
		await html(`<div contenteditable="true" _="bind $text to me">initial</div>`)
		await new Promise(r => setTimeout(r, 100))
		expect(await evaluate(() => window.$text)).toBe('initial')

		await run("set $text to 'updated'")
		await expect.poll(() =>
			evaluate(() => document.querySelector('#work-area div[contenteditable]').textContent)
		).toBe('updated')
		await evaluate(() => { delete window.$text })
	})

	test('bind to custom element with value property auto-detects value', async ({html, find, run, evaluate}) => {
		await evaluate(() => {
			if (!customElements.get('test-input')) {
				class TestInput extends HTMLElement {
					constructor() { super(); this._value = ''; }
					get value() { return this._value; }
					set value(v) {
						this._value = v;
						this.dispatchEvent(new Event('input', { bubbles: true }));
					}
				}
				customElements.define('test-input', TestInput);
			}
		})

		await html(`<test-input _="bind $custom to me"></test-input>`)
		await run("set $custom to 'hello'")
		await expect.poll(() => evaluate(() => document.querySelector('#work-area test-input').value)).toBe('hello')
		await evaluate(() => { delete window.$custom })
	})

	// ================================================================
	// Cleanup
	// ================================================================

	test('radio change listener is removed on cleanup', async ({html, evaluate, run}) => {
		await run("set $color to 'red'")
		await html(
			`<input type="radio" name="color" value="red" _="bind $color to me" checked />` +
			`<input type="radio" name="color" value="blue" _="bind $color to me" />`
		)
		await evaluate(() => new Promise(r => setTimeout(r, 50)))

		// Cleanup the blue radio
		var blueRadio = await evaluate(() => {
			var blue = document.querySelector('#work-area input[value=blue]')
			_hyperscript.internals.runtime.cleanup(blue)
			return true
		})

		// Click the cleaned-up blue radio - $color should NOT change
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
			`<input type="text" id="binput" value="initial" _="bind $val to me" />` +
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

		// Reset the form - $val should NOT revert since listener was removed
		await evaluate(() => {
			document.querySelector('#work-area form').reset()
		})
		await evaluate(() => new Promise(r => setTimeout(r, 50)))
		var val = await run("$val")
		expect(val).toBe('changed')
		await evaluate(() => { delete window.$val })
	})

})
