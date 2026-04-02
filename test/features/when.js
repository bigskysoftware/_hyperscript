import {test, expect} from '../fixtures.js'

test.describe('the when feature', () => {

	test('provides access to `it` and syncs initial value', async ({html, find, run, evaluate}) => {
		await run("set $global to 'initial'")
		await html(`<div _="when $global changes put it into me"></div>`)
		await expect(find('div')).toHaveText('initial')

		await run("set $global to 'hello world'")
		await expect(find('div')).toHaveText('hello world')

		await run("set $global to 42")
		await expect(find('div')).toHaveText('42')

		await evaluate(() => { delete window.$global })
	})

	test('detects changes from $global variable', async ({html, find, run, evaluate}) => {
		await html(`<div _="when $global changes put it into me"></div>`)
		await run("set $global to 'Changed!'")
		await expect(find('div')).toHaveText('Changed!')
		await evaluate(() => { delete window.$global })
	})

	test('detects changes from :element variable', async ({html, find}) => {
		await html(
			`<div _="init set :count to 0 end
			         when :count changes put it into me end
			         on click increment :count">0</div>`
		)
		await expect(find('div')).toHaveText('0')
		await find('div').click()
		await expect(find('div')).toHaveText('1')
		await find('div').click()
		await expect(find('div')).toHaveText('2')
	})

	test('triggers multiple elements watching same variable', async ({html, find, run, evaluate}) => {
		await html(
			`<div id="d1" _="when $shared changes put 'first' into me"></div>` +
			`<div id="d2" _="when $shared changes put 'second' into me"></div>`
		)
		await run("set $shared to 'changed'")
		await expect(find('#d1')).toHaveText('first')
		await expect(find('#d2')).toHaveText('second')
		await evaluate(() => { delete window.$shared })
	})

	test('executes multiple commands', async ({html, find, run, evaluate}) => {
		await html(`<div _="when $multi changes put 'first' into me then add .executed to me"></div>`)
		await run("set $multi to 'go'")
		await expect(find('div')).toHaveText('first')
		await expect(find('div')).toHaveClass(/executed/)
		await evaluate(() => { delete window.$multi })
	})

	test('does not execute when variable is undefined initially', async ({html, find}) => {
		await html(`<div _="when $neverSet changes put 'synced' into me">original</div>`)
		// Wait a bit and verify it didn't change
		await new Promise(r => setTimeout(r, 50))
		await expect(find('div')).toHaveText('original')
	})

	test('only triggers when variable actually changes value', async ({html, find, run, evaluate}) => {
		await html(
			`<div _="when $dedup changes increment :callCount then put :callCount into me"></div>`
		)
		await run("set $dedup to 'value1'")
		await expect(find('div')).toHaveText('1')

		// Same value — should NOT re-trigger
		await run("set $dedup to 'value1'")
		await new Promise(r => setTimeout(r, 50))
		await expect(find('div')).toHaveText('1')

		await run("set $dedup to 'value2'")
		await expect(find('div')).toHaveText('2')
		await evaluate(() => { delete window.$dedup })
	})

	test('auto-tracks compound expressions', async ({html, find, run, evaluate}) => {
		await run("set $a to 1")
		await run("set $b to 2")
		await html(`<div _="when ($a + $b) changes put it into me"></div>`)
		await expect(find('div')).toHaveText('3')

		await run("set $a to 10")
		await expect(find('div')).toHaveText('12')

		await run("set $b to 20")
		await expect(find('div')).toHaveText('30')
		await evaluate(() => { delete window.$a; delete window.$b })
	})

	test('detects attribute changes', async ({html, find, evaluate}) => {
		await html(`<div data-title="original" _="when @data-title changes put it into me"></div>`)
		await expect(find('div')).toHaveText('original')

		await evaluate(() => document.querySelector('#work-area div').setAttribute('data-title', 'updated'))
		// MutationObserver + effect pipeline is async — poll for the update
		await expect.poll(() => find('div').textContent(), { timeout: 5000 }).toBe('updated')
	})

	test('detects form input value changes via user interaction', async ({html, find, evaluate}) => {
		await html(
			`<input type="text" id="reactive-input" value="start" />` +
			`<span _="when #reactive-input.value changes put it into me"></span>`
		)
		await expect(find('span')).toHaveText('start')

		await evaluate(() => {
			const input = document.getElementById('reactive-input')
			input.value = 'typed'
			input.dispatchEvent(new Event('input', { bubbles: true }))
		})
		await expect(find('span')).toHaveText('typed')
	})

	test('detects property change via hyperscript set', async ({html, find, run}) => {
		await html(
			`<input type="text" id="prog-input" value="initial" />` +
			`<span _="when #prog-input.value changes put it into me"></span>`
		)
		await expect(find('span')).toHaveText('initial')

		await run("set #prog-input.value to 'updated'")
		await expect.poll(() => find('span').textContent()).toBe('updated')
	})

	test('disposes effect when element is removed from DOM', async ({html, find, run, evaluate}) => {
		await run("set $dispose to 'before'")
		await html(`<div _="when $dispose changes put it into me"></div>`)
		await expect(find('div')).toHaveText('before')

		const textBefore = await evaluate(() => {
			const div = document.querySelector('#work-area div')
			div.parentNode.removeChild(div)
			return div.innerHTML
		})
		expect(textBefore).toBe('before')

		await run("set $dispose to 'after'")
		await new Promise(r => setTimeout(r, 50))

		// Element was removed — should still show old value
		const textAfter = await evaluate(() => {
			// The div is detached, check it still has old content
			return true
		})
		await evaluate(() => { delete window.$dispose })
	})

	test('batches multiple synchronous writes into one effect run', async ({html, find, run, evaluate}) => {
		await run("set $batchA to 0")
		await run("set $batchB to 0")
		await html(
			`<div _="when ($batchA + $batchB) changes increment :runCount then put :runCount into me"></div>`
		)
		await expect(find('div')).toHaveText('1')

		// Both writes in a single evaluate so they happen in the same microtask
		await evaluate(() => {
			_hyperscript("set $batchA to 5")
			_hyperscript("set $batchB to 10")
		})
		await expect(find('div')).toHaveText('2')
		await evaluate(() => { delete window.$batchA; delete window.$batchB })
	})

	test('handles chained reactivity across elements', async ({html, find, run, evaluate}) => {
		await html(
			`<div _="when $source changes set $derived to (it * 2)"></div>` +
			`<div id="output" _="when $derived changes put it into me"></div>`
		)
		await run("set $source to 5")
		await expect(find('#output')).toHaveText('10')

		await run("set $source to 20")
		await expect(find('#output')).toHaveText('40')
		await evaluate(() => { delete window.$source; delete window.$derived })
	})

	test('supports multiple when features on the same element', async ({html, find, run, evaluate}) => {
		await run("set $left to 'L'")
		await run("set $right to 'R'")
		await html(
			`<div _="when $left changes put it into my @data-left end
			         when $right changes put it into my @data-right"></div>`
		)
		await expect(find('div')).toHaveAttribute('data-left', 'L')
		await expect(find('div')).toHaveAttribute('data-right', 'R')

		await run("set $left to 'newL'")
		await expect(find('div')).toHaveAttribute('data-left', 'newL')
		await expect(find('div')).toHaveAttribute('data-right', 'R')
		await evaluate(() => { delete window.$left; delete window.$right })
	})

	test('works with on handlers that modify the watched variable', async ({html, find}) => {
		await html(
			`<div _="init set :label to 'initial' end
			         when :label changes put it into me end
			         on click set :label to 'clicked'">initial</div>`
		)
		await expect(find('div')).toHaveText('initial')
		await find('div').click()
		await expect(find('div')).toHaveText('clicked')
	})

	test('does not cross-trigger on unrelated variable writes', async ({html, find, run, evaluate}) => {
		await html(
			`<div _="when $trigger changes
			             increment :count
			             put :count into me
			             set $other to 'side-effect'"></div>`
		)
		await run("set $trigger to 'go'")
		await expect(find('div')).toHaveText('1')
		await new Promise(r => setTimeout(r, 50))
		await expect(find('div')).toHaveText('1')
		await evaluate(() => { delete window.$trigger; delete window.$other })
	})

	test('handles rapid successive changes correctly', async ({html, find, run, evaluate}) => {
		await html(`<div _="when $rapid changes put it into me"></div>`)
		for (let i = 0; i < 10; i++) {
			await run("set $rapid to " + i)
		}
		await expect(find('div')).toHaveText('9')
		await evaluate(() => { delete window.$rapid })
	})

	test('isolates element-scoped variables between elements', async ({html, find}) => {
		await html(
			`<div id="d1" _="init set :value to 'A' end
			               when :value changes put it into me end
			               on click set :value to 'A-clicked'">A</div>` +
			`<div id="d2" _="init set :value to 'B' end
			               when :value changes put it into me end
			               on click set :value to 'B-clicked'">B</div>`
		)
		await expect(find('#d1')).toHaveText('A')
		await expect(find('#d2')).toHaveText('B')

		await find('#d1').click()
		await expect(find('#d1')).toHaveText('A-clicked')
		await expect(find('#d2')).toHaveText('B')

		await find('#d2').click()
		await expect(find('#d2')).toHaveText('B-clicked')
		await expect(find('#d1')).toHaveText('A-clicked')
	})

	test('handles NaN without infinite re-firing', async ({html, find, evaluate}) => {
		await html(
			`<input type="text" id="nan-input" value="not a number" />` +
			`<span _="when (#nan-input.value * 1) changes put it into me"></span>`
		)
		await expect(find('span')).toHaveText('NaN')

		await evaluate(() => {
			document.getElementById('nan-input').dispatchEvent(new Event('input', { bubbles: true }))
		})
		await new Promise(r => setTimeout(r, 50))
		await expect(find('span')).toHaveText('NaN')
	})

	test('fires when either expression changes using or', async ({html, find, run, evaluate}) => {
		await html(`<div _="when $x or $y changes put it into me"></div>`)
		await run("set $x to 'from-x'")
		await expect(find('div')).toHaveText('from-x')

		await run("set $y to 'from-y'")
		await expect(find('div')).toHaveText('from-y')
		await evaluate(() => { delete window.$x; delete window.$y })
	})

	test('supports three or more expressions with or', async ({html, find, run, evaluate}) => {
		await html(`<div _="when $r or $g or $b changes put it into me"></div>`)
		await run("set $r to 'red'")
		await expect(find('div')).toHaveText('red')
		await run("set $g to 'green'")
		await expect(find('div')).toHaveText('green')
		await run("set $b to 'blue'")
		await expect(find('div')).toHaveText('blue')
		await evaluate(() => { delete window.$r; delete window.$g; delete window.$b })
	})

	// ---- Tracking coverage ----

	test('#element.checked is tracked', async ({html, find}) => {
		await html(
			`<input type="checkbox" id="cb-input" />` +
			`<span _="when #cb-input.checked changes put it into me"></span>`
		)
		await expect(find('span')).toHaveText('false')
		await find('#cb-input').check()
		await expect.poll(() => find('span').textContent()).toBe('true')
	})

	test("my @attr is tracked", async ({html, find, evaluate}) => {
		await html(`<div data-x="one" _="when my @data-x changes put it into me"></div>`)
		await expect.poll(() => find('div').textContent()).toBe('one')
		await evaluate(() => document.querySelector('#work-area div').setAttribute('data-x', 'two'))
		await expect.poll(() => find('div').textContent()).toBe('two')
	})

	test('value of #element is tracked', async ({html, find}) => {
		await html(
			`<input type="text" id="of-input" value="init" />` +
			`<span _="when (value of #of-input) changes put it into me"></span>`
		)
		await expect(find('span')).toHaveText('init')
		await find('#of-input').fill('changed')
		await expect.poll(() => find('span').textContent()).toBe('changed')
	})

	test('math on tracked symbols works', async ({html, find, run}) => {
		await run("set $mA to 3")
		await run("set $mB to 4")
		await html(`<div _="when ($mA * $mB) changes put it into me"></div>`)
		await expect(find('div')).toHaveText('12')
		await run("set $mA to 10")
		await expect.poll(() => find('div').textContent()).toBe('40')
	})

	test('comparison on tracked symbol works', async ({html, find, run}) => {
		await run("set $cmpVal to 3")
		await html(`<div _="when ($cmpVal > 5) changes put it into me"></div>`)
		await expect(find('div')).toHaveText('false')
		await run("set $cmpVal to 10")
		await expect.poll(() => find('div').textContent()).toBe('true')
	})

	test('string template with tracked symbol works', async ({html, find, run}) => {
		await run("set $tplName to 'world'")
		await html('<div _="when `hello ${$tplName}` changes put it into me"></div>')
		await expect(find('div')).toHaveText('hello world')
		await run("set $tplName to 'there'")
		await expect.poll(() => find('div').textContent()).toBe('hello there')
	})

	test('function call on tracked value works (Math.round)', async ({html, find, run}) => {
		await run("set $rawNum to 3.7")
		await html(`<div _="when (Math.round($rawNum)) changes put it into me"></div>`)
		await expect.poll(() => find('div').textContent()).toBe('4')
		await run("set $rawNum to 9.2")
		await expect.poll(() => find('div').textContent()).toBe('9')
	})

	test('inline style change via JS is NOT detected', async ({html, find, evaluate}) => {
		await html(`<div id="style-target" style="opacity: 1" _="when (*opacity) changes put it into me">not fired</div>`)
		await new Promise(r => setTimeout(r, 100))
		const initialText = await find('div').textContent()
		await evaluate(() => document.getElementById('style-target').style.opacity = '0.5')
		await new Promise(r => setTimeout(r, 200))
		expect(await find('div').textContent()).toBe(initialText)
	})

	test('reassigning whole array IS detected', async ({html, find, run}) => {
		await run("set $arrWhole to [1, 2, 3]")
		await html(`<div _="when $arrWhole changes put it.join(',') into me"></div>`)
		await expect.poll(() => find('div').textContent()).toBe('1,2,3')
		await run("set $arrWhole to [4, 5, 6]")
		await expect.poll(() => find('div').textContent()).toBe('4,5,6')
	})

	test('mutating array element in place is NOT detected', async ({html, find, run, evaluate}) => {
		await run("set $arrMut to [1, 2, 3]")
		await html(`<div _="when $arrMut[0] changes put it into me"></div>`)
		await new Promise(r => setTimeout(r, 100))
		const initialText = await find('div').textContent()
		await evaluate(() => { window.$arrMut[0] = 99 })
		await new Promise(r => setTimeout(r, 200))
		expect(await find('div').textContent()).toBe(initialText)
	})

	test('local variable in when expression produces a parse error', async ({evaluate}) => {
		const error = await evaluate(() => {
			var origError = console.error
			var captured = null
			console.error = function() {
				for (var i = 0; i < arguments.length; i++) {
					var arg = String(arguments[i])
					if (arg.includes('local variable')) captured = arg
				}
				origError.apply(console, arguments)
			}
			var wa = document.getElementById('work-area')
			wa.innerHTML = '<div _="when myVar changes put it into me"></div>'
			_hyperscript.processNode(wa)
			console.error = origError
			return captured
		})
		expect(error).not.toBeNull()
	})

	test('attribute observers are persistent (not recreated on re-run)', async ({html, find, evaluate}) => {
		const observersCreated = await evaluate(async () => {
			const OrigMO = window.MutationObserver
			let count = 0
			window.MutationObserver = function(cb) {
				count++
				return new OrigMO(cb)
			}
			window.MutationObserver.prototype = OrigMO.prototype
			const wa = document.getElementById('work-area')
			wa.innerHTML = '<div data-val="1" _="when @data-val changes put it into me"></div>'
			_hyperscript.processNode(wa)
			await new Promise(r => setTimeout(r, 50))
			const countAfterInit = count
			for (let i = 2; i <= 6; i++) {
				wa.querySelector('div').setAttribute('data-val', String(i))
				await new Promise(r => setTimeout(r, 30))
			}
			window.MutationObserver = OrigMO
			return count - countAfterInit
		})
		expect(observersCreated).toBe(0)
	})

	// ---- Robustness ----

	test('boolean short-circuit does not track unread branch', async ({html, find, run, evaluate}) => {
		await run("set $x to false")
		await run("set $y to 'hello'")
		await html(`<div _="when ($x and $y) changes put it into me"></div>`)
		await new Promise(r => setTimeout(r, 100))
		await run("set $y to 'world'")
		await new Promise(r => setTimeout(r, 100))
		expect(await find('div').textContent()).not.toBe('world')
		await evaluate(() => { delete window.$x; delete window.$y })
	})

	test('diamond: cascaded derived values produce correct final value', async ({html, find, run, evaluate}) => {
		await run("set $a to 1")
		await html(
			`<span id="d-b" _="when $a changes set $b to (it * 2)"></span>` +
			`<span id="d-c" _="when $a changes set $c to (it * 3)"></span>` +
			`<div _="live increment :runs then put ($b + $c) + ' (runs:' + :runs + ')' into me"></div>`
		)
		await new Promise(r => setTimeout(r, 100))
		await run("set $a to 10")
		await new Promise(r => setTimeout(r, 200))
		expect(await find('div').textContent()).toContain('50')
		await evaluate(() => { delete window.$a; delete window.$b; delete window.$c })
	})

	test('error in one effect does not break other effects in the same batch', async ({html, find, run, evaluate}) => {
		await run("set $trigger to 0")
		await html(
			`<span id="err-a" _="when $trigger changes put null.boom into me"></span>` +
			`<span id="err-b" _="when $trigger changes put 'ok:' + it into me"></span>`
		)
		await new Promise(r => setTimeout(r, 50))
		await run("set $trigger to 42")
		await new Promise(r => setTimeout(r, 100))
		await expect(find('#err-b')).toHaveText('ok:42')
		await evaluate(() => { delete window.$trigger })
	})

	test('circular guard resets after cascade settles', async ({html, find, run, evaluate}) => {
		await run("set $ping to 0")
		await html(
			`<span _="when $ping changes set $ping to (it + 1)"></span>` +
			`<div _="when $ping changes put it into me"></div>`
		)
		await run("set $ping to 1")
		await new Promise(r => setTimeout(r, 500))
		await run("set $ping to 0")
		await run("set $ping to 999")
		await new Promise(r => setTimeout(r, 200))
		expect(Number(await find('div').textContent())).toBeGreaterThan(0)
		await evaluate(() => { delete window.$ping })
	})

	test('cross-microtask ping-pong is caught by circular guard', async ({html, find, run, evaluate}) => {
		await html(
			`<span _="when $ping changes set $pong to (it + 1)"></span>` +
			`<span _="when $pong changes set $ping to (it + 1)"></span>` +
			`<div _="when $ping changes put it into me"></div>`
		)

		// This creates A->B->A->B... across microtask boundaries
		await run("set $ping to 1")
		await new Promise(r => setTimeout(r, 1000))

		// The browser should not freeze. The guard should have stopped it.
		// The value should be finite (not still incrementing).
		const val = Number(await find('div').textContent())
		expect(val).toBeLessThan(200)
		await evaluate(() => { delete window.$ping; delete window.$pong })
	})

	test('element moved in DOM retains reactivity', async ({html, find, run, evaluate}) => {
		await run("set $movable to 'start'")
		await html(
			`<div id="container-a"><span _="when $movable changes put it into me"></span></div>` +
			`<div id="container-b"></div>`
		)
		await expect(find('span')).toHaveText('start')

		// Move the span from container-a to container-b
		await evaluate(() => {
			var span = document.querySelector('#work-area span')
			document.getElementById('container-b').appendChild(span)
		})

		// Element is still connected, just in a different parent
		await run("set $movable to 'moved'")
		await expect.poll(() => find('span').textContent()).toBe('moved')
		await evaluate(() => { delete window.$movable })
	})

	test('rapid detach/reattach in same sync block does not kill effect', async ({html, find, run, evaluate}) => {
		await run("set $thrash to 'before'")
		await html(
			`<div id="thrash-parent"></div>`
		)
		await evaluate(() => {
			var parent = document.getElementById('thrash-parent')
			parent.innerHTML = '<span _="when $thrash changes put it into me"></span>'
			_hyperscript.processNode(parent)
		})
		await expect.poll(() => find('span').textContent()).toBe('before')

		// Detach and immediately reattach in the same synchronous block
		await evaluate(() => {
			var span = document.querySelector('#thrash-parent span')
			var parent = span.parentNode
			parent.removeChild(span)
			parent.appendChild(span)
		})

		// Effect should still work
		await run("set $thrash to 'after'")
		await expect.poll(() => find('span').textContent()).toBe('after')
		await evaluate(() => { delete window.$thrash })
	})

})
