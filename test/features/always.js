import {test, expect} from '../fixtures.js'

test.describe('the always feature', () => {

	// ================================================================
	// Single statement
	// ================================================================

	test('derives a variable from a computed expression', async ({html, find, run, evaluate}) => {
		await run("set $price to 10")
		await run("set $qty to 3")
		await html(
			`<div _="always set $total to ($price * $qty) end
			         when $total changes put it into me"></div>`
		)
		await expect(find('div')).toHaveText('30')

		await run("set $price to 25")
		await expect.poll(() => find('div').textContent()).toBe('75')
		await evaluate(() => { delete window.$price; delete window.$qty; delete window.$total })
	})

	test('updates DOM text reactively with put', async ({html, find, run, evaluate}) => {
		await run("set $greeting to 'world'")
		await html(`<div _="always put 'hello ' + $greeting into me"></div>`)
		await expect.poll(() => find('div').textContent()).toBe('hello world')

		await run("set $greeting to 'there'")
		await expect.poll(() => find('div').textContent()).toBe('hello there')
		await evaluate(() => { delete window.$greeting })
	})

	test('sets an attribute reactively', async ({html, find, run, evaluate}) => {
		await run("set $theme to 'light'")
		await html(`<div _="always set my @data-theme to $theme"></div>`)
		await expect(find('div')).toHaveAttribute('data-theme', 'light')

		await run("set $theme to 'dark'")
		await expect.poll(() => find('div').getAttribute('data-theme')).toBe('dark')
		await evaluate(() => { delete window.$theme })
	})

	test('sets a style reactively', async ({html, find, run, evaluate}) => {
		await run("set $opacity to 1")
		await html(`<div _="always set *opacity to $opacity">visible</div>`)
		await new Promise(r => setTimeout(r, 100))

		await run("set $opacity to 0.5")
		await expect.poll(() =>
			evaluate(() => document.querySelector('#work-area div').style.opacity)
		).toBe('0.5')
		await evaluate(() => { delete window.$opacity })
	})

	test('puts a computed dollar amount into the DOM', async ({html, find, run, evaluate}) => {
		await run("set $price to 10")
		await run("set $qty to 2")
		await html(`<div _="always put '$' + ($price * $qty) into me"></div>`)
		await expect.poll(() => find('div').textContent()).toBe('$20')

		await run("set $qty to 5")
		await expect.poll(() => find('div').textContent()).toBe('$50')
		await evaluate(() => { delete window.$price; delete window.$qty })
	})

	// ================================================================
	// Block form
	// ================================================================

	test('block form re-runs all commands when any dependency changes', async ({html, find, run, evaluate}) => {
		await run("set $width to 100")
		await run("set $height to 200")
		await html(
			`<span id="w" _="when $doubleWidth changes put it into me"></span>` +
			`<span id="h" _="when $doubleHeight changes put it into me"></span>` +
			`<div _="always
			           set $doubleWidth to ($width * 2)
			           set $doubleHeight to ($height * 2)
			         end"></div>`
		)
		await expect.poll(() => find('#w').textContent()).toBe('200')
		await expect.poll(() => find('#h').textContent()).toBe('400')

		// Change $height — both commands re-run, but $doubleWidth stays the same (dedup)
		await run("set $height to 300")
		await expect.poll(() => find('#h').textContent()).toBe('600')
		await expect(find('#w')).toHaveText('200') // unchanged because dedup

		await evaluate(() => {
			delete window.$width; delete window.$height
			delete window.$doubleWidth; delete window.$doubleHeight
		})
	})

	test('separate always statements create independent effects', async ({html, find, run, evaluate}) => {
		await run("set $width to 100")
		await run("set $height to 200")
		await html(
			`<span id="w" _="when $doubleWidth changes put it into me"></span>` +
			`<span id="h" _="when $doubleHeight changes put it into me"></span>` +
			`<div _="always set $doubleWidth to ($width * 2) end
			         always set $doubleHeight to ($height * 2)"></div>`
		)
		await expect.poll(() => find('#w').textContent()).toBe('200')
		await expect.poll(() => find('#h').textContent()).toBe('400')

		// Change only $height — only $doubleHeight updates
		await run("set $height to 300")
		await expect.poll(() => find('#h').textContent()).toBe('600')
		await expect(find('#w')).toHaveText('200')

		await evaluate(() => {
			delete window.$width; delete window.$height
			delete window.$doubleWidth; delete window.$doubleHeight
		})
	})

	test('block form cascades inter-dependent commands', async ({html, find, run, evaluate}) => {
		await run("set $price to 10")
		await run("set $qty to 3")
		await run("set $tax to 5")
		await html(
			`<div _="always
			           set $subtotal to ($price * $qty)
			           set $total to ($subtotal + $tax)
			         end
			         when $total changes put it into me"></div>`
		)
		await expect.poll(() => find('div').textContent()).toBe('35')

		await run("set $price to 20")
		await expect.poll(() => find('div').textContent()).toBe('65')

		await run("set $tax to 10")
		await expect.poll(() => find('div').textContent()).toBe('70')
		await evaluate(() => {
			delete window.$price; delete window.$qty; delete window.$tax
			delete window.$subtotal; delete window.$total
		})
	})

	// ================================================================
	// if/else inside always
	// ================================================================

	test('toggles a class based on a boolean variable', async ({html, find, run, evaluate}) => {
		await run("set $isActive to false")
		await html(
			`<div _="always
			           if $isActive add .active to me else remove .active from me end
			         end">test</div>`
		)
		await new Promise(r => setTimeout(r, 100))
		await expect(find('div')).not.toHaveClass('active')

		await run("set $isActive to true")
		await expect.poll(() => find('div').getAttribute('class')).toContain('active')

		await run("set $isActive to false")
		await expect.poll(() => find('div').getAttribute('class') || '').not.toContain('active')
		await evaluate(() => { delete window.$isActive })
	})

	test('toggles display style based on a boolean variable', async ({html, find, run, evaluate}) => {
		await run("set $isVisible to true")
		await html(
			`<div _="always
			           if $isVisible set *display to 'block' else set *display to 'none' end
			         end">content</div>`
		)
		await expect.poll(() =>
			evaluate(() => document.querySelector('#work-area div').style.display)
		).toBe('block')

		await run("set $isVisible to false")
		await expect.poll(() =>
			evaluate(() => document.querySelector('#work-area div').style.display)
		).toBe('none')

		await run("set $isVisible to true")
		await expect.poll(() =>
			evaluate(() => document.querySelector('#work-area div').style.display)
		).toBe('block')
		await evaluate(() => { delete window.$isVisible })
	})

	// ================================================================
	// Cleanup
	// ================================================================

	test('effects stop when element is removed from DOM', async ({html, find, run, evaluate}) => {
		await run("set $message to 'initial'")
		await html(`<div _="always put $message into me"></div>`)
		await expect.poll(() => find('div').textContent()).toBe('initial')

		await evaluate(() => document.querySelector('#work-area div').remove())
		await run("set $message to 'after removal'")
		await new Promise(r => setTimeout(r, 100))
		await evaluate(() => { delete window.$message })
	})

	// ================================================================
	// Dynamic dependencies
	// ================================================================

	test('conditional branch only tracks the active dependency', async ({html, find, run, evaluate}) => {
		await run("set $showFirst to true")
		await run("set $firstName to 'Alice'")
		await run("set $lastName to 'Smith'")
		await html(
			`<div _="always
			           if $showFirst put $firstName into me else put $lastName into me end
			         end"></div>`
		)
		await expect.poll(() => find('div').textContent()).toBe('Alice')

		// Active branch: $firstName triggers
		await run("set $firstName to 'Bob'")
		await expect.poll(() => find('div').textContent()).toBe('Bob')

		// Inactive branch: $lastName does NOT trigger
		await run("set $lastName to 'Jones'")
		await new Promise(r => setTimeout(r, 100))
		await expect(find('div')).toHaveText('Bob')

		// Flip condition
		await run("set $showFirst to false")
		await expect.poll(() => find('div').textContent()).toBe('Jones')

		// Now $firstName is inactive
		await run("set $firstName to 'Charlie'")
		await new Promise(r => setTimeout(r, 100))
		await expect(find('div')).toHaveText('Jones')

		await evaluate(() => {
			delete window.$showFirst; delete window.$firstName; delete window.$lastName
		})
	})

	// ================================================================
	// Multiple features on same element
	// ================================================================

	test('multiple always on same element work independently', async ({html, find, run, evaluate}) => {
		await run("set $firstName to 'Alice'")
		await run("set $age to 30")
		await html(
			`<div _="always set my @data-name to $firstName end
			         always set my @data-age to $age"></div>`
		)
		await expect(find('div')).toHaveAttribute('data-name', 'Alice')
		await expect(find('div')).toHaveAttribute('data-age', '30')

		await run("set $firstName to 'Bob'")
		await expect.poll(() => find('div').getAttribute('data-name')).toBe('Bob')
		await expect(find('div')).toHaveAttribute('data-age', '30')
		await evaluate(() => { delete window.$firstName; delete window.$age })
	})

	test('always and when on same element do not interfere', async ({html, find, run, evaluate}) => {
		await run("set $status to 'online'")
		await html(
			`<div _="always set my @data-status to $status end
			         when $status changes put 'Status: ' + it into me"></div>`
		)
		await expect(find('div')).toHaveAttribute('data-status', 'online')
		await expect(find('div')).toHaveText('Status: online')

		await run("set $status to 'offline'")
		await expect.poll(() => find('div').getAttribute('data-status')).toBe('offline')
		await expect.poll(() => find('div').textContent()).toBe('Status: offline')
		await evaluate(() => { delete window.$status })
	})

	test('bind and always on same element do not interfere', async ({html, find, run, evaluate}) => {
		await run("set $username to 'alice'")
		await html(
			`<input type="text" value="alice"
			        _="bind $username end
			           always set my @data-mirror to $username" />` +
			`<span _="when $username changes put it into me"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('alice')
		await expect.poll(() => find('input').getAttribute('data-mirror')).toBe('alice')

		await find('input').fill('bob')
		await expect.poll(() => find('span').textContent()).toBe('bob')
		await expect.poll(() => find('input').getAttribute('data-mirror')).toBe('bob')
		await evaluate(() => { delete window.$username })
	})

	test('reactive effects are stopped on cleanup', async ({html, find, run, evaluate}) => {
		await run("set $count to 0")
		await html(`<div id="d1" _="always put $count into me"></div>`)
		await expect.poll(() => find('#d1').textContent()).toBe('0')

		// Clean up the element (but keep it in DOM to detect if effect still fires)
		await evaluate(() => {
			var el = document.querySelector('#work-area #d1')
			_hyperscript.internals.runtime.cleanup(el)
			el.textContent = 'cleaned'
		})

		// Change the variable — the effect should NOT fire since we cleaned up
		await run("set $count to 99")
		await evaluate(() => new Promise(r => setTimeout(r, 50)))

		// If effects were properly stopped, text stays 'cleaned'
		await expect(find('#d1')).toHaveText('cleaned')
		await evaluate(() => { delete window.$count })
	})

})
