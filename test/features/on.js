import {test, expect} from '../fixtures.js'

test.describe('the on feature', () => {

	test('can respond to events with dots in names', async ({html, find}) => {
		await html(
			"<div _='on click send example.event to #d1'></div>" +
			"<div id='d1' _='on example.event add .called'></div>"
		)
		await expect(find('#d1')).not.toHaveClass(/called/)
		await find('div').first().dispatchEvent('click')
		await expect(find('#d1')).toHaveClass(/called/)
	})

	test('can respond to events with colons in names', async ({html, find}) => {
		await html(
			"<div _='on click send example:event to #d1'></div>" +
			"<div id='d1' _='on example:event add .called'></div>"
		)
		await expect(find('#d1')).not.toHaveClass(/called/)
		await find('div').first().dispatchEvent('click')
		await expect(find('#d1')).toHaveClass(/called/)
	})

	test('can respond to events with minus in names', async ({html, find}) => {
		await html(
			"<div _='on click send \"a-b\" to #d1'></div>" +
			"<div id='d1' _='on \"a-b\" add .called'></div>"
		)
		await expect(find('#d1')).not.toHaveClass(/called/)
		await find('div').first().dispatchEvent('click')
		await expect(find('#d1')).toHaveClass(/called/)
	})

	test('can respond to events on other elements', async ({html, find}) => {
		await html(
			"<div id='bar'></div>" +
			"<div _='on click from #bar add .clicked'></div>"
		)
		await expect(find('div').nth(1)).not.toHaveClass(/clicked/)
		await find('#bar').dispatchEvent('click')
		await expect(find('div').nth(1)).toHaveClass(/clicked/)
	})

	test('listeners on other elements are removed when the registering element is removed', async ({html, find, evaluate}) => {
		await html(
			"<div id='bar'></div>" +
			"<div id='listener' _='on click from #bar set #bar.innerHTML to #bar.innerHTML + \"a\"'></div>"
		)
		await expect(find('#bar')).toHaveText('')
		await find('#bar').dispatchEvent('click')
		await expect(find('#bar')).toHaveText('a')
		await evaluate(() => {
			const listener = document.querySelector('#work-area #listener')
			listener.parentElement.removeChild(listener)
		})
		await find('#bar').dispatchEvent('click')
		await expect(find('#bar')).toHaveText('a')
	})

	test('listeners on self are not removed when the element is removed', async ({html, evaluate}) => {
		await html("<div id='selftest' _='on someCustomEvent put 1 into me'></div>")
		const result = await evaluate(() => {
			const div = document.querySelector('#work-area #selftest')
			div.remove()
			div.dispatchEvent(new Event("someCustomEvent"))
			return div.innerHTML
		})
		expect(result).toBe('1')
	})

	test('supports "elsewhere" modifier', async ({html, find, evaluate}) => {
		await html("<div _='on click elsewhere add .clicked'></div>")
		await expect(find('div')).not.toHaveClass(/clicked/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).not.toHaveClass(/clicked/)
		await evaluate(() => document.body.click())
		await expect(find('div')).toHaveClass(/clicked/)
	})

	test('supports "from elsewhere" modifier', async ({html, find, evaluate}) => {
		await html("<div _='on click from elsewhere add .clicked'></div>")
		await expect(find('div')).not.toHaveClass(/clicked/)
		await find('div').dispatchEvent('click')
		await expect(find('div')).not.toHaveClass(/clicked/)
		await evaluate(() => document.body.click())
		await expect(find('div')).toHaveClass(/clicked/)
	})

	test('can pick detail fields out by name', async ({html, find}) => {
		await html(
			"<div id='d1' _='on click send custom(foo:\"fromBar\") to #d2'></div>" +
			"<div id='d2' _='on custom(foo) call me.classList.add(foo)'></div>"
		)
		await expect(find('#d2')).not.toHaveClass(/fromBar/)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d2')).toHaveClass(/fromBar/)
	})

	test('handles custom events with null detail', async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' _='on myEvent(foo) if foo put foo into me else put \"no-detail\" into me'></div>"
		)
		await evaluate(() => {
			document.querySelector('#work-area #d1').dispatchEvent(new CustomEvent("myEvent"))
		})
		await expect(find('#d1')).toHaveText('no-detail')
	})

	test('can pick event properties out by name', async ({html, find}) => {
		await html(
			"<div id='d1' _='on click send fromBar to #d2'></div>" +
			"<div id='d2' _='on fromBar(type) call me.classList.add(type)'></div>"
		)
		await expect(find('#d2')).not.toHaveClass(/fromBar/)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d2')).toHaveClass(/fromBar/)
	})

	test('can fire an event on load', async ({html, find}) => {
		await html("<div id='d1' _='on load put \"Loaded\" into my.innerHTML'></div>")
		await expect(find('#d1')).toHaveText('Loaded')
	})

	test('can be in a top level script tag', async ({html, find, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>on customEvent put \"Loaded\" into #loadedDemo.innerHTML</script>" +
			"<div id='loadedDemo'></div>"
		)
		await evaluate(() => {
			const wa = document.querySelector('#work-area')
			wa.dispatchEvent(new Event('customEvent', {bubbles: true}))
		})
		await expect(find('#loadedDemo')).toHaveText('Loaded')
	})

	test('can have a simple event filter', async ({html, find}) => {
		await html("<div id='d1' _='on click[false] log event then put \"Clicked\" into my.innerHTML'></div>")
		await find('#d1').dispatchEvent('click')
		await expect(find('#d1')).toHaveText('')
	})

	test('can refer to event properties directly in filter', async ({html, find}) => {
		await html("<div id='t1' _='on click[buttons==0] log event then put \"Clicked\" into my.innerHTML'></div>")
		await find('#t1').dispatchEvent('click')
		await expect(find('#t1')).toHaveText('Clicked')

		await html("<div id='t2' _='on click[buttons==1] log event then put \"Clicked\" into my.innerHTML'></div>")
		await find('#t2').dispatchEvent('click')
		await expect(find('#t2')).toHaveText('')

		await html("<div id='t3' _='on click[buttons==1 and buttons==0] log event then put \"Clicked\" into my.innerHTML'></div>")
		await find('#t3').dispatchEvent('click')
		await expect(find('#t3')).toHaveText('')
	})

	test('can refer to event detail properties directly in filter', async ({html, find, evaluate}) => {
		await html("<div id='fd' _='on example[foo] increment @count then put it into me'></div>")

		await evaluate(() => {
			const div = document.querySelector('#work-area #fd')
			const event = new Event('example')
			event.detail = {"foo": true}
			div.dispatchEvent(event)
		})
		await expect(find('#fd')).toHaveText('1')

		await evaluate(() => {
			const div = document.querySelector('#work-area #fd')
			const event = new Event('example')
			event.detail = {"foo": false}
			div.dispatchEvent(event)
		})
		await expect(find('#fd')).toHaveText('1')

		await evaluate(() => {
			const div = document.querySelector('#work-area #fd')
			const event = new Event('example')
			event.detail = {"foo": true}
			div.dispatchEvent(event)
		})
		await expect(find('#fd')).toHaveText('2')
	})

	test('can click after a positive event filter', async ({html, find, evaluate}) => {
		await html("<div id='pf' _='on foo(bar)[bar] put \"triggered\" into my.innerHTML'></div>")

		await evaluate(() => {
			document.querySelector('#work-area #pf').dispatchEvent(new CustomEvent("foo", { detail: { bar: false } }))
		})
		await expect(find('#pf')).toHaveText('')

		await evaluate(() => {
			document.querySelector('#work-area #pf').dispatchEvent(new CustomEvent("foo", { detail: { bar: true } }))
		})
		await expect(find('#pf')).toHaveText('triggered')
	})

	test('multiple event handlers at a time are allowed to execute with the every keyword', async ({html, find, evaluate}) => {
		await evaluate(() => {
			window._i = 1
			window.increment = function() { return window._i++ }
		})
		await html("<div _='on every click put increment() into my.innerHTML then wait for a customEvent'></div>")
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('1')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('2')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('3')
	})

	test('can have multiple event handlers', async ({html, find, evaluate}) => {
		await evaluate(() => {
			window._i = 1
			window.increment = function() { return window._i++ }
		})
		await html(
			"<div _='on foo put increment() into my.innerHTML end" +
			"                          on bar put increment() into my.innerHTML'></div>"
		)
		await evaluate(() => document.querySelector('#work-area div').dispatchEvent(new CustomEvent("foo")))
		await expect(find('div')).toHaveText('1')
		await evaluate(() => document.querySelector('#work-area div').dispatchEvent(new CustomEvent("bar")))
		await expect(find('div')).toHaveText('2')
		await evaluate(() => document.querySelector('#work-area div').dispatchEvent(new CustomEvent("foo")))
		await expect(find('div')).toHaveText('3')
	})

	test('can have multiple event handlers, no end', async ({html, find, evaluate}) => {
		await evaluate(() => {
			window._i = 1
			window.increment = function() { return window._i++ }
		})
		await html(
			"<div _='on foo put increment() into my.innerHTML" +
			"                          on bar put increment() into my.innerHTML'></div>"
		)
		await evaluate(() => document.querySelector('#work-area div').dispatchEvent(new CustomEvent("foo")))
		await expect(find('div')).toHaveText('1')
		await evaluate(() => document.querySelector('#work-area div').dispatchEvent(new CustomEvent("bar")))
		await expect(find('div')).toHaveText('2')
		await evaluate(() => document.querySelector('#work-area div').dispatchEvent(new CustomEvent("foo")))
		await expect(find('div')).toHaveText('3')
	})

	test('can queue events', async ({html, find, evaluate}) => {
		await evaluate(() => {
			window._i = 0
			window.increment = function() { return window._i++ }
		})

		await html("<div id='qe' _='on foo wait for bar then call increment()'></div>")
		// start first event
		await evaluate(() => document.querySelector('#work-area #qe').dispatchEvent(new CustomEvent("foo")))
		expect(await evaluate(() => window._i)).toBe(0)

		// queue next events
		await evaluate(() => document.querySelector('#work-area #qe').dispatchEvent(new CustomEvent("foo")))
		await evaluate(() => document.querySelector('#work-area #qe').dispatchEvent(new CustomEvent("foo")))

		// ungate first event handler
		await evaluate(() => document.querySelector('#work-area #qe').dispatchEvent(new CustomEvent("bar")))
		await expect.poll(() => evaluate(() => window._i)).toBe(1)

		// Wait for queued handler to reach its "wait for bar" state, then dispatch bar
		await evaluate(() => new Promise(resolve => {
			setTimeout(() => {
				document.querySelector('#work-area #qe').dispatchEvent(new CustomEvent("bar"))
				resolve()
			}, 20)
		}))
		await expect.poll(() => evaluate(() => window._i)).toBe(2)

		// Wait again for next potential handler, then dispatch bar
		await evaluate(() => new Promise(resolve => {
			setTimeout(() => {
				document.querySelector('#work-area #qe').dispatchEvent(new CustomEvent("bar"))
				resolve()
			}, 20)
		}))
		// should still be 2 - only one was queued (default queue behavior)
		await expect.poll(() => evaluate(() => window._i)).toBe(2)
	})

	test('can queue first event', async ({html, find, evaluate}) => {
		await evaluate(() => {
			window._i = 0
			window.increment = function() { return window._i++ }
		})

		await html("<div id='qf' _='on foo queue first wait for bar then call increment()'></div>")
		await evaluate(() => document.querySelector('#work-area #qf').dispatchEvent(new CustomEvent("foo")))
		expect(await evaluate(() => window._i)).toBe(0)

		await evaluate(() => document.querySelector('#work-area #qf').dispatchEvent(new CustomEvent("foo")))
		await evaluate(() => document.querySelector('#work-area #qf').dispatchEvent(new CustomEvent("foo")))

		await evaluate(() => document.querySelector('#work-area #qf').dispatchEvent(new CustomEvent("bar")))
		await expect.poll(() => evaluate(() => window._i)).toBe(1)

		await evaluate(() => new Promise(resolve => {
			setTimeout(() => {
				document.querySelector('#work-area #qf').dispatchEvent(new CustomEvent("bar"))
				resolve()
			}, 20)
		}))
		await expect.poll(() => evaluate(() => window._i)).toBe(2)

		await evaluate(() => new Promise(resolve => {
			setTimeout(() => {
				document.querySelector('#work-area #qf').dispatchEvent(new CustomEvent("bar"))
				resolve()
			}, 20)
		}))
		await expect.poll(() => evaluate(() => window._i)).toBe(2)
	})

	test('can queue last event', async ({html, find, evaluate}) => {
		await evaluate(() => {
			window._i = 0
			window.increment = function() { return window._i++ }
		})

		await html("<div id='ql' _='on foo queue last wait for bar then call increment()'></div>")
		await evaluate(() => document.querySelector('#work-area #ql').dispatchEvent(new CustomEvent("foo")))
		expect(await evaluate(() => window._i)).toBe(0)

		await evaluate(() => document.querySelector('#work-area #ql').dispatchEvent(new CustomEvent("foo")))
		await evaluate(() => document.querySelector('#work-area #ql').dispatchEvent(new CustomEvent("foo")))

		await evaluate(() => document.querySelector('#work-area #ql').dispatchEvent(new CustomEvent("bar")))
		await expect.poll(() => evaluate(() => window._i)).toBe(1)

		await evaluate(() => new Promise(resolve => {
			setTimeout(() => {
				document.querySelector('#work-area #ql').dispatchEvent(new CustomEvent("bar"))
				resolve()
			}, 20)
		}))
		await expect.poll(() => evaluate(() => window._i)).toBe(2)

		await evaluate(() => new Promise(resolve => {
			setTimeout(() => {
				document.querySelector('#work-area #ql').dispatchEvent(new CustomEvent("bar"))
				resolve()
			}, 20)
		}))
		await expect.poll(() => evaluate(() => window._i)).toBe(2)
	})

	test('can queue all events', async ({html, find, evaluate}) => {
		await evaluate(() => {
			window._i = 0
			window.increment = function() { return window._i++ }
		})

		await html("<div id='qa' _='on foo queue all wait for bar then call increment()'></div>")
		await evaluate(() => document.querySelector('#work-area #qa').dispatchEvent(new CustomEvent("foo")))
		expect(await evaluate(() => window._i)).toBe(0)

		await evaluate(() => document.querySelector('#work-area #qa').dispatchEvent(new CustomEvent("foo")))
		await evaluate(() => document.querySelector('#work-area #qa').dispatchEvent(new CustomEvent("foo")))

		await evaluate(() => document.querySelector('#work-area #qa').dispatchEvent(new CustomEvent("bar")))
		await expect.poll(() => evaluate(() => window._i)).toBe(1)

		await evaluate(() => new Promise(resolve => {
			setTimeout(() => {
				document.querySelector('#work-area #qa').dispatchEvent(new CustomEvent("bar"))
				resolve()
			}, 20)
		}))
		await expect.poll(() => evaluate(() => window._i)).toBe(2)

		await evaluate(() => new Promise(resolve => {
			setTimeout(() => {
				document.querySelector('#work-area #qa').dispatchEvent(new CustomEvent("bar"))
				resolve()
			}, 20)
		}))
		await expect.poll(() => evaluate(() => window._i)).toBe(3)
	})

	test('queue none does not allow future queued events', async ({html, find, evaluate}) => {
		await evaluate(() => {
			window._i = 1
			window.increment = function() { return window._i++ }
		})

		await html("<div _='on click queue none put increment() into my.innerHTML then wait for a customEvent'></div>")
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('1')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('1')
		await evaluate(() => document.querySelector('#work-area div').dispatchEvent(new CustomEvent("customEvent")))
		// After ungating, the next click should not have been queued
		await expect(find('div')).toHaveText('1')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('2')
	})

	test('can invoke on multiple events', async ({html, find, evaluate}) => {
		await evaluate(() => {
			window._i = 0
			window.increment = function() { return window._i++ }
		})

		await html("<div _='on click or foo call increment()'></div>")
		await find('div').dispatchEvent('click')
		expect(await evaluate(() => window._i)).toBe(1)
		await evaluate(() => document.querySelector('#work-area div').dispatchEvent(new CustomEvent("foo")))
		expect(await evaluate(() => window._i)).toBe(2)
	})

	test('can listen for events in another element (lazy)', async ({html, find, evaluate}) => {
		await html(
			"<div _='on click in #d1 put it into window.tmp'>" +
			"                    <div id='d1'></div>" +
			"                    <div id='d2'></div>" +
			"               </div>"
		)
		await find('#d1').dispatchEvent('click')
		const result = await evaluate(() => window.tmp === document.querySelector('#work-area #d1'))
		expect(result).toBe(true)
	})

	test('can filter events based on count', async ({html, find}) => {
		await html("<div _='on click 1 put 1 + my.innerHTML as Int into my.innerHTML'>0</div>")
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('1')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('1')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('1')
	})

	test('can filter events based on count range', async ({html, find}) => {
		await html("<div _='on click 1 to 2 put 1 + my.innerHTML as Int into my.innerHTML'>0</div>")
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('1')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('2')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('2')
	})

	test('can filter events based on unbounded count range', async ({html, find}) => {
		await html("<div _='on click 2 and on put 1 + my.innerHTML as Int into my.innerHTML'>0</div>")
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('0')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('1')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('2')
	})

	test('can mix ranges', async ({html, find}) => {
		await html(
			'<div _=\'on click 1 put "one" into my.innerHTML ' +
			'                          on click 3 put "three" into my.innerHTML ' +
			'                          on click 2 put "two" into my.innerHTML \'>0</div>'
		)
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('one')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('two')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('three')
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('three')
	})

	test('can listen for general mutations', async ({html, find, evaluate}) => {
		await html("<div _='on mutation put \"Mutated\" into me then wait for hyperscript:mutation'></div>")
		await evaluate(() => document.querySelector('#work-area div').setAttribute("foo", "bar"))
		await expect(find('div')).toHaveText('Mutated')
	})

	test('can listen for attribute mutations', async ({html, find, evaluate}) => {
		await html("<div _='on mutation of attributes put \"Mutated\" into me'></div>")
		await evaluate(() => document.querySelector('#work-area div').setAttribute("foo", "bar"))
		await expect(find('div')).toHaveText('Mutated')
	})

	test('can listen for specific attribute mutations', async ({html, find, evaluate}) => {
		await html("<div _='on mutation of @foo put \"Mutated\" into me'></div>")
		await evaluate(() => document.querySelector('#work-area div').setAttribute("foo", "bar"))
		await expect(find('div')).toHaveText('Mutated')
	})

	test('can listen for specific attribute mutations and filter out other attribute mutations', async ({html, find, evaluate}) => {
		await html("<div _='on mutation of @bar put \"Mutated\" into me'></div>")
		await evaluate(() => document.querySelector('#work-area div').setAttribute("foo", "bar"))
		// Wait a bit and confirm it's still empty
		await expect(find('div')).toHaveText('')
	})

	test('can listen for childList mutations', async ({html, find, evaluate}) => {
		await html("<div _='on mutation of childList put \"Mutated\" into me then wait for hyperscript:mutation'></div>")
		await evaluate(() => document.querySelector('#work-area div').appendChild(document.createElement("P")))
		await expect(find('div')).toHaveText('Mutated')
	})

	test('can listen for childList mutation filter out other mutations', async ({html, find, evaluate}) => {
		await html("<div _='on mutation of childList put \"Mutated\" into me'></div>")
		await evaluate(() => document.querySelector('#work-area div').setAttribute("foo", "bar"))
		await expect(find('div')).toHaveText('')
	})

	test('can listen for characterData mutation filter out other mutations', async ({html, find, evaluate}) => {
		await html("<div _='on mutation of characterData put \"Mutated\" into me'></div>")
		await evaluate(() => document.querySelector('#work-area div').setAttribute("foo", "bar"))
		await expect(find('div')).toHaveText('')
	})

	test('can listen for multiple mutations', async ({html, find, evaluate}) => {
		await html("<div _='on mutation of @foo or @bar put \"Mutated\" into me'></div>")
		await evaluate(() => document.querySelector('#work-area div').setAttribute("foo", "bar"))
		await expect(find('div')).toHaveText('Mutated')
	})

	test('can listen for multiple mutations 2', async ({html, find, evaluate}) => {
		await html("<div _='on mutation of @foo or @bar put \"Mutated\" into me'></div>")
		await evaluate(() => document.querySelector('#work-area div').setAttribute("bar", "bar"))
		await expect(find('div')).toHaveText('Mutated')
	})

	test('can listen for attribute mutations on other elements', async ({html, find, evaluate}) => {
		await html(
			"<div id='d1'></div>" +
			"<div id='d2' _='on mutation of attributes from #d1 put \"Mutated\" into me'></div>"
		)
		await evaluate(() => document.querySelector('#work-area #d1').setAttribute("foo", "bar"))
		await expect(find('#d2')).toHaveText('Mutated')
	})

	test('each behavior installation has its own event queue', async ({html, find, evaluate}) => {
		await html(
			"<script type=text/hyperscript>" +
			"behavior DemoBehavior on foo wait 10ms then set my innerHTML to 'behavior'" +
			"</script>" +
			"<div id='bd1' _='install DemoBehavior'></div>" +
			"<div id='bd2' _='install DemoBehavior'></div>" +
			"<div id='bd3' _='install DemoBehavior'></div>"
		)
		await evaluate(() => {
			document.querySelector('#work-area #bd1').dispatchEvent(new CustomEvent("foo"))
			document.querySelector('#work-area #bd2').dispatchEvent(new CustomEvent("foo"))
			document.querySelector('#work-area #bd3').dispatchEvent(new CustomEvent("foo"))
		})
		await expect(find('#bd1')).toHaveText('behavior')
		await expect(find('#bd2')).toHaveText('behavior')
		await expect(find('#bd3')).toHaveText('behavior')
	})

	test('can catch exceptions thrown in js functions', async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.throwBar = function() { throw "bar" }
		})
		await html("<button _='on click throwBar() catch e put e into me'></button>")
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('bar')
	})

	test('can catch exceptions thrown in hyperscript functions', async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>  def throwBar()    throw 'bar'  end</script>" +
			"<button _='on click throwBar() catch e put e into me'></button>"
		)
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('bar')
	})

	test('can catch top-level exceptions', async ({html, find}) => {
		await html("<button _='on click throw \"bar\" catch e put e into me'></button>")
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('bar')
	})

	test('can catch async top-level exceptions', async ({html, find}) => {
		await html("<button _='on click wait 1ms then throw \"bar\" catch e put e into me'></button>")
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('bar')
	})

	test("async exceptions don't kill the event queue", async ({html, find}) => {
		await html(
			"<button _='on click " +
			"                    increment :x  " +
			"                    if :x is 1 " +
			"                      wait 1ms then throw \"bar\" " +
			"                    otherwise " +
			"                      put \"success\" into me" +
			"                    end " +
			"                    catch e " +
			"                      put e into me'></button>"
		)
		await find('button').dispatchEvent('click')
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('success')
	})

	test("exceptions in catch block don't kill the event queue", async ({html, find}) => {
		await html(
			"<button _='on click " +
			"                    increment :x  " +
			"                    if :x is 1 " +
			"                      throw \"bar\" " +
			"                    otherwise " +
			"                      put \"success\" into me" +
			"                    end " +
			"                  catch e " +
			"                      put e into me then throw e'></button>"
		)
		await find('button').dispatchEvent('click')
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('success')
	})

	test("uncaught exceptions trigger 'exception' event", async ({html, find}) => {
		await html(
			"<button _='on click put \"foo\" into me then throw \"bar\"" +
			"                  on exception(error) put error into me'></button>"
		)
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('bar')
	})

	test("caught exceptions do not trigger 'exception' event", async ({html, find}) => {
		await html(
			"<button _='on click put \"foo\" into me then throw \"bar\"" +
			"                     catch e log e" +
			"                  on exception(error) put error into me'></button>"
		)
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('foo')
	})

	test("rethrown exceptions trigger 'exception' event", async ({html, find}) => {
		await html(
			"<button _='on click put \"foo\" into me then throw \"bar\"" +
			"                     catch e throw e" +
			"                  on exception(error) put error into me'></button>"
		)
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('bar')
	})

	test('basic finally blocks work', async ({html, find}) => {
		await html(
			"<button _='on click throw \"bar\"" +
			"             finally put \"bar\" into me'></button>"
		)
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('bar')
	})

	test('finally blocks work when exception thrown in catch', async ({html, find}) => {
		await html(
			"<button _='on click throw \"bar\"" +
			"            catch e throw e" +
			"            finally put \"bar\" into me'></button>"
		)
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('bar')
	})

	test('async basic finally blocks work', async ({html, find}) => {
		await html(
			"<button _='on click wait a tick then throw \"bar\"" +
			"             finally put \"bar\" into me'></button>"
		)
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('bar')
	})

	test('async finally blocks work when exception thrown in catch', async ({html, find}) => {
		await html(
			"<button _='on click wait a tick then throw \"bar\"" +
			"            catch e set :foo to \"foo\" then throw e" +
			"            finally put :foo + \"bar\" into me'></button>"
		)
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('foobar')
	})

	test("async exceptions in finally block don't kill the event queue", async ({html, find}) => {
		await html(
			"<button _='on click " +
			"                    increment :x" +
			"                  finally  " +
			"                    if :x is 1 " +
			"                      wait 1ms then throw \"bar\" " +
			"                    otherwise " +
			"                      put \"success\" into me" +
			"                    end " +
			"                    '></button>"
		)
		await find('button').dispatchEvent('click')
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('success')
	})

	test("exceptions in finally block don't kill the event queue", async ({html, find}) => {
		await html(
			"<button _='on click " +
			"                    increment :x  " +
			"                  finally  " +
			"                    if :x is 1 " +
			"                      throw \"bar\" " +
			"                    otherwise " +
			"                      put \"success\" into me" +
			"                    end " +
			"                  '></button>"
		)
		await find('button').dispatchEvent('click')
		await find('button').dispatchEvent('click')
		await expect(find('button')).toHaveText('success')
	})

	test('can ignore when target doesn\'t exist', async ({html, find}) => {
		await html(
			"<div _=' " +
			"	on click from #doesntExist " +
			"		throw \"bar\" " +
			"	on click " +
			"		put \"clicked\" into me" +
			"	'></div>"
		)
		await find('div').dispatchEvent('click')
		await expect(find('div')).toHaveText('clicked')
	})

	test('can handle an or after a from clause', async ({html, find}) => {
		await html(
			"<div id='d1'></div>" +
			"<div id='d2'></div>" +
			"<div id='result' _=' " +
			"	on click from #d1 or click from #d2 " +
			"		 increment @count then put @count into me" +
			"	'></div>"
		)
		await find('#d1').dispatchEvent('click')
		await expect(find('#result')).toHaveText('1')
		await find('#d2').dispatchEvent('click')
		await expect(find('#result')).toHaveText('2')
	})

})
