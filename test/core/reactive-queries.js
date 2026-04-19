import {test, expect} from '../fixtures.js'

test.describe('reactive DOM queries', () => {

	// ================================================================
	// Scoped queries with `in`
	// ================================================================

	test('bind tracks checked count in scoped container', async ({html, find, evaluate}) => {
		await html(
			`<div _="bind $selectedCount to the length of <:checked/> in the next <tbody/>
			         when $selectedCount changes put it into me">0</div>` +
			`<table><tbody>` +
			`  <tr><td><input type="checkbox" class="cb" /></td></tr>` +
			`  <tr><td><input type="checkbox" class="cb" /></td></tr>` +
			`  <tr><td><input type="checkbox" class="cb" /></td></tr>` +
			`</tbody></table>`
		)
		await expect(find('div')).toHaveText('0')

		await find('.cb >> nth=0').check()
		await expect.poll(() => find('div').textContent()).toBe('1')

		await find('.cb >> nth=1').check()
		await expect.poll(() => find('div').textContent()).toBe('2')

		await find('.cb >> nth=0').uncheck()
		await expect.poll(() => find('div').textContent()).toBe('1')

		await evaluate(() => { delete window.$selectedCount })
	})

	test('when tracks query result changes in scope', async ({html, find}) => {
		await html(
			`<div id="container">` +
			`  <input type="checkbox" class="item" />` +
			`  <input type="checkbox" class="item" />` +
			`</div>` +
			`<span _="when (the length of <:checked/> in #container) changes put it into me"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('0')

		await find('.item >> nth=0').check()
		await expect.poll(() => find('span').textContent()).toBe('1')

		await find('.item >> nth=1').check()
		await expect.poll(() => find('span').textContent()).toBe('2')
	})

	test('live tracks query result changes', async ({html, find}) => {
		await html(
			`<div id="box">` +
			`  <input type="checkbox" />` +
			`  <input type="checkbox" />` +
			`</div>` +
			`<span _="live put the length of <:checked/> in #box into me end"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('0')

		await find('#box input >> nth=0').check()
		await expect.poll(() => find('span').textContent()).toBe('1')
	})

	// ================================================================
	// Unscoped queries
	// ================================================================

	test('unscoped query tracks changes across the whole document', async ({html, find, evaluate}) => {
		await evaluate(() => { window.$activeCount = 0 })
		await html(
			`<div class="item" id="a"></div>` +
			`<div class="item" id="b"></div>` +
			`<span _="when (the length of <.active/>) changes put it into me"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('0')

		await evaluate(() => document.getElementById('a').classList.add('active'))
		await expect.poll(() => find('span').textContent()).toBe('1')

		await evaluate(() => document.getElementById('b').classList.add('active'))
		await expect.poll(() => find('span').textContent()).toBe('2')
	})

	// ================================================================
	// Scope isolation
	// ================================================================

	test('changes outside scope do not trigger re-evaluation', async ({html, find, evaluate, run}) => {
		await run("set $scopeRuns to 0")
		await html(
			`<div id="scope">` +
			`  <input type="checkbox" class="inside" />` +
			`</div>` +
			`<input type="checkbox" id="outside" />` +
			`<span _="when (the length of <:checked/> in #scope) changes
			              put it into me then increment $scopeRuns"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('0')
		var initialRuns = await evaluate(() => window.$scopeRuns)

		// Change outside scope — should NOT trigger
		await find('#outside').check()
		await evaluate(() => new Promise(r => setTimeout(r, 100)))
		expect(await evaluate(() => window.$scopeRuns)).toBe(initialRuns)

		// Change inside scope — should trigger
		await find('.inside').check()
		await expect.poll(() => find('span').textContent()).toBe('1')
		expect(await evaluate(() => window.$scopeRuns)).toBe(initialRuns + 1)

		await evaluate(() => { delete window.$scopeRuns })
	})

	// ================================================================
	// childList mutations (adding/removing elements)
	// ================================================================

	test('adding elements updates reactive query count', async ({html, find, evaluate}) => {
		await html(
			`<div id="dynamic-scope">` +
			`  <input type="checkbox" checked />` +
			`</div>` +
			`<span _="when (the length of <:checked/> in #dynamic-scope) changes put it into me"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('1')

		await evaluate(() => {
			var cb = document.createElement('input')
			cb.type = 'checkbox'
			cb.checked = true
			document.getElementById('dynamic-scope').appendChild(cb)
		})
		await expect.poll(() => find('span').textContent()).toBe('2')
	})

	test('removing elements updates reactive query count', async ({html, find, evaluate}) => {
		await html(
			`<div id="remove-scope">` +
			`  <input type="checkbox" class="removable" checked />` +
			`  <input type="checkbox" checked />` +
			`</div>` +
			`<span _="when (the length of <:checked/> in #remove-scope) changes put it into me"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('2')

		await evaluate(() => {
			document.querySelector('#remove-scope .removable').remove()
		})
		await expect.poll(() => find('span').textContent()).toBe('1')
	})

	// ================================================================
	// Different selector types
	// ================================================================

	test('class-based selectors track reactively', async ({html, find, evaluate}) => {
		await html(
			`<div id="class-scope">` +
			`  <div class="item">A</div>` +
			`  <div class="item">B</div>` +
			`  <div class="item">C</div>` +
			`</div>` +
			`<span _="when (the length of <.active/> in #class-scope) changes put it into me"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('0')

		await evaluate(() => {
			document.querySelector('#class-scope .item').classList.add('active')
		})
		await expect.poll(() => find('span').textContent()).toBe('1')

		await evaluate(() => {
			document.querySelectorAll('#class-scope .item').forEach(el => el.classList.add('active'))
		})
		await expect.poll(() => find('span').textContent()).toBe('3')
	})

	test('attribute selectors track reactively', async ({html, find, evaluate}) => {
		await html(
			`<div id="attr-scope">` +
			`  <div class="item">A</div>` +
			`  <div class="item">B</div>` +
			`</div>` +
			`<span _="when (the length of <[data-selected]/> in #attr-scope) changes put it into me"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('0')

		await evaluate(() => {
			document.querySelector('#attr-scope .item').setAttribute('data-selected', '')
		})
		await expect.poll(() => find('span').textContent()).toBe('1')

		await evaluate(() => {
			document.querySelector('#attr-scope .item').removeAttribute('data-selected')
		})
		await expect.poll(() => find('span').textContent()).toBe('0')
	})

	// ================================================================
	// Non-length expressions
	// ================================================================

	test('tracks first matching element reactively', async ({html, find, evaluate}) => {
		await html(
			`<div id="first-scope">` +
			`  <div class="item">A</div>` +
			`  <div class="item">B</div>` +
			`</div>` +
			`<span _="when (the textContent of first <.selected/> in #first-scope) changes put it into me"></span>`
		)

		await evaluate(() => {
			document.querySelector('#first-scope .item').classList.add('selected')
		})
		await expect.poll(() => find('span').textContent()).toBe('A')

		// Change which element is first selected
		await evaluate(() => {
			document.querySelector('#first-scope .item').classList.remove('selected')
			document.querySelectorAll('#first-scope .item')[1].classList.add('selected')
		})
		await expect.poll(() => find('span').textContent()).toBe('B')
	})

	test('tracks the query result set itself, not just its length', async ({html, find, evaluate}) => {
		await html(
			`<ul id="list-scope">` +
			`  <li>apple</li>` +
			`  <li>banana</li>` +
			`</ul>` +
			`<span _="when (the length of <.picked/> in #list-scope) changes
			              set result to it
			              put the textContent of last <.picked/> in #list-scope into me"></span>`
		)

		await evaluate(() => {
			document.querySelector('#list-scope li').classList.add('picked')
		})
		await expect.poll(() => find('span').textContent()).toBe('apple')

		await evaluate(() => {
			document.querySelectorAll('#list-scope li')[1].classList.add('picked')
		})
		await expect.poll(() => find('span').textContent()).toBe('banana')
	})

	// ================================================================
	// Multiple effects on the same root
	// ================================================================

	test('multiple effects watching the same scope work independently', async ({html, find, evaluate}) => {
		await html(
			`<div id="multi-scope">` +
			`  <input type="checkbox" />` +
			`  <div class="item">A</div>` +
			`</div>` +
			`<span id="count-checked" _="when (the length of <:checked/> in #multi-scope) changes put it into me"></span>` +
			`<span id="count-items" _="when (the length of <.active/> in #multi-scope) changes put it into me"></span>`
		)
		await expect.poll(() => find('#count-checked').textContent()).toBe('0')
		await expect.poll(() => find('#count-items').textContent()).toBe('0')

		await find('#multi-scope input').check()
		await expect.poll(() => find('#count-checked').textContent()).toBe('1')
		// items count should not have changed
		await evaluate(() => new Promise(r => setTimeout(r, 50)))
		await expect(find('#count-items')).toHaveText('0')

		await evaluate(() => {
			document.querySelector('#multi-scope .item').classList.add('active')
		})
		await expect.poll(() => find('#count-items').textContent()).toBe('1')
		// checked count should not have changed
		await expect(find('#count-checked')).toHaveText('1')
	})

	// ================================================================
	// Same-value deduplication
	// ================================================================

	test('effect does not fire when query result count is unchanged', async ({html, find, evaluate, run}) => {
		await run("set $dedupRuns to 0")
		await html(
			`<div id="dedup-scope">` +
			`  <input type="checkbox" class="dedup-cb" checked />` +
			`  <div class="unrelated">text</div>` +
			`</div>` +
			`<span _="when (the length of <:checked/> in #dedup-scope) changes
			              put it into me then increment $dedupRuns"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('1')
		var initialRuns = await evaluate(() => window.$dedupRuns)

		// Mutate something unrelated inside the scope
		await evaluate(() => {
			document.querySelector('#dedup-scope .unrelated').textContent = 'changed'
		})
		await evaluate(() => new Promise(r => setTimeout(r, 100)))

		// The query re-evaluates (coarse-grained) but the handler should NOT fire
		// because the length is still 1
		expect(await evaluate(() => window.$dedupRuns)).toBe(initialRuns)

		await evaluate(() => { delete window.$dedupRuns })
	})

	// ================================================================
	// Cleanup on element disconnect
	// ================================================================

	test('query effects stop when owning element disconnects', async ({html, find, evaluate, run}) => {
		await run("set $cleanupRuns to 0")
		await html(
			`<div id="cleanup-scope">` +
			`  <input type="checkbox" />` +
			`</div>` +
			`<span id="cleanup-target" _="when (the length of <:checked/> in #cleanup-scope) changes
			                               put it into me then increment $cleanupRuns"></span>`
		)
		await expect.poll(() => find('span').textContent()).toBe('0')
		var initialRuns = await evaluate(() => window.$cleanupRuns)

		// Remove the span — its effect should stop
		await evaluate(() => {
			document.getElementById('cleanup-target').remove()
		})

		// Check a box — should NOT increment the counter
		await find('#cleanup-scope input').check()
		await evaluate(() => new Promise(r => setTimeout(r, 100)))
		expect(await evaluate(() => window.$cleanupRuns)).toBe(initialRuns)

		await evaluate(() => { delete window.$cleanupRuns })
	})

})
