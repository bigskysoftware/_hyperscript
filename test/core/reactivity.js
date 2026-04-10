import {test, expect} from '../fixtures.js'

test.describe('reactivity engine', () => {

	// ================================================================
	// Multi-effect batching and invalidation order
	// ================================================================

	test('multiple effects on the same global fire once per write', async ({html, find, run, evaluate}) => {
		await evaluate(() => { window.$rxCount = 0; window.$rxVal = 'a' })
		await html(
			`<div id="a" _="when $rxVal changes increment $rxCount then put $rxVal into me"></div>` +
			`<div id="b" _="when $rxVal changes put $rxVal into me"></div>`
		)
		await expect(find('#a')).toHaveText('a')
		await expect(find('#b')).toHaveText('a')
		// Snapshot after initial subscribe cascade settles
		var initialCount = await evaluate(() => window.$rxCount)

		await run("set $rxVal to 'b'")
		await expect(find('#a')).toHaveText('b')
		await expect(find('#b')).toHaveText('b')

		// Exactly one invocation of the counting effect for the single write
		expect(await evaluate(() => window.$rxCount)).toBe(initialCount + 1)
		await evaluate(() => { delete window.$rxCount; delete window.$rxVal })
	})

	test('effects fire in source registration order', async ({html, find, run, evaluate}) => {
		await evaluate(() => { window.$rxOrder = []; window.$rxTrigger = 0 })
		await html(
			`<div _="when $rxTrigger changes call $rxOrder.push('first')"></div>` +
			`<div _="when $rxTrigger changes call $rxOrder.push('second')"></div>` +
			`<div _="when $rxTrigger changes call $rxOrder.push('third')"></div>`
		)
		// Clear initial-subscribe firings so we see only the update ordering
		await evaluate(() => { window.$rxOrder.length = 0 })

		await run("set $rxTrigger to 1")
		await expect.poll(() => evaluate(() => window.$rxOrder.length)).toBe(3)
		expect(await evaluate(() => window.$rxOrder.slice())).toEqual(['first', 'second', 'third'])

		await evaluate(() => { delete window.$rxOrder; delete window.$rxTrigger })
	})

	// ================================================================
	// Value equality semantics
	// ================================================================

	test('NaN → NaN does not retrigger handlers (Object.is semantics)', async ({html, find, run, evaluate}) => {
		await evaluate(() => { window.$rxNanCount = 0; window.$rxNanVal = NaN })
		await html(`<div _="when $rxNanVal changes increment $rxNanCount"></div>`)
		// Initial evaluate should not fire handler because NaN is "null-ish" in _lastValue init?
		// It actually DOES fire (initialize sees non-null). Snapshot and compare.
		var initial = await evaluate(() => window.$rxNanCount)

		await run("set $rxNanVal to NaN")
		// Give the microtask a chance to run
		await evaluate(() => new Promise(r => setTimeout(r, 20)))
		expect(await evaluate(() => window.$rxNanCount)).toBe(initial)

		// But changing to a real number should fire
		await run("set $rxNanVal to 42")
		await expect.poll(() => evaluate(() => window.$rxNanCount)).toBe(initial + 1)

		await evaluate(() => { delete window.$rxNanCount; delete window.$rxNanVal })
	})

	test('setting same value does not retrigger handler', async ({html, find, run, evaluate}) => {
		await evaluate(() => { window.$rxSameCount = 0; window.$rxSameVal = 5 })
		await html(`<div _="when $rxSameVal changes increment $rxSameCount"></div>`)
		var initial = await evaluate(() => window.$rxSameCount)

		await run("set $rxSameVal to 5")
		await evaluate(() => new Promise(r => setTimeout(r, 20)))
		expect(await evaluate(() => window.$rxSameCount)).toBe(initial)

		await evaluate(() => { delete window.$rxSameCount; delete window.$rxSameVal })
	})

	// ================================================================
	// Dependency switching (deps change between re-runs)
	// ================================================================

	test('effect switches its dependencies based on control flow', async ({html, find, run, evaluate}) => {
		await evaluate(() => {
			window.$rxCond = true
			window.$rxA = 'from-a'
			window.$rxB = 'from-b'
		})
		await html(
			`<div _="live if $rxCond put $rxA into me else put $rxB into me end end"></div>`
		)
		await expect(find('div')).toHaveText('from-a')

		// While cond is true, changing $rxB should NOT retrigger
		await run("set $rxB to 'ignored'")
		await evaluate(() => new Promise(r => setTimeout(r, 20)))
		await expect(find('div')).toHaveText('from-a')

		// Switch cond → effect now depends on $rxB
		await run("set $rxCond to false")
		await expect.poll(() => find('div').textContent()).toBe('ignored')

		// Now $rxA changes should be ignored, $rxB changes should fire
		await run("set $rxA to 'a-ignored'")
		await evaluate(() => new Promise(r => setTimeout(r, 20)))
		await expect(find('div')).toHaveText('ignored')

		await run("set $rxB to 'new-b'")
		await expect.poll(() => find('div').textContent()).toBe('new-b')

		await evaluate(() => {
			delete window.$rxCond; delete window.$rxA; delete window.$rxB
		})
	})

	// ================================================================
	// Auto-cleanup on element disconnect
	// ================================================================

	test('effects on disconnected elements stop automatically', async ({html, find, run, evaluate}) => {
		await evaluate(() => { window.$rxDcVal = 'x'; window.$rxDcCount = 0 })
		await html(
			`<div id="persist" _="when $rxDcVal changes increment $rxDcCount then put $rxDcVal into me"></div>` +
			`<div id="doomed" _="when $rxDcVal changes increment $rxDcCount"></div>`
		)
		await expect(find('#persist')).toHaveText('x')
		var initialCount = await evaluate(() => window.$rxDcCount)

		// Remove one element
		await evaluate(() => {
			document.querySelector('#work-area #doomed').remove()
		})

		// Trigger a change — only the surviving effect should run
		await run("set $rxDcVal to 'y'")
		await expect(find('#persist')).toHaveText('y')

		// Count advanced by exactly 1 (the surviving handler), not 2
		expect(await evaluate(() => window.$rxDcCount)).toBe(initialCount + 1)

		await evaluate(() => { delete window.$rxDcVal; delete window.$rxDcCount })
	})

	// ================================================================
	// Reactive cycle guard
	// ================================================================

	test('reactive loops are detected and stopped after 100 consecutive triggers', async ({html, page, run, evaluate}) => {
		var errors = []
		page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

		await evaluate(() => { window.$rxLoop = 0 })
		// Handler mutates the variable it watches — cascade must be bounded
		await html(`<div _="when $rxLoop changes increment $rxLoop"></div>`)

		await run("set $rxLoop to 1")
		// Wait for the cascade to burn itself out
		await evaluate(() => new Promise(r => setTimeout(r, 100)))

		var finalVal = await evaluate(() => window.$rxLoop)
		// Loop guard kicks in at 100 consecutive triggers.
		// Not asserting exact value because the initial subscribe run + the
		// `set $rxLoop to 1` trigger contribute variable increments before
		// the guard trips. Just verify it stopped in a bounded way.
		expect(finalVal).toBeGreaterThan(100)
		expect(finalVal).toBeLessThan(200)

		// And the error was reported
		expect(errors.some(e => /Reactivity loop/.test(e))).toBe(true)

		await evaluate(() => { delete window.$rxLoop })
	})

	// ================================================================
	// Element-scoped reactivity
	// ================================================================

	test('element-scoped writes only trigger effects on the same element', async ({html, find, evaluate}) => {
		await html(
			`<div id="a" _="init set :count to 0
			                on click increment :count
			                when :count changes put :count into me"></div>` +
			`<div id="b" _="init set :count to 0
			                when :count changes put :count into me"></div>`
		)
		await expect(find('#a')).toHaveText('0')
		await expect(find('#b')).toHaveText('0')

		// Click a — only #a updates
		await find('#a').dispatchEvent('click')
		await expect(find('#a')).toHaveText('1')
		// b's count is untouched — its effect did not run
		await evaluate(() => new Promise(r => setTimeout(r, 20)))
		await expect(find('#b')).toHaveText('0')
	})
})
