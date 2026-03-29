import {test, expect} from '../fixtures.js'

test.describe('the def feature', () => {

	test('can define a basic no arg function', async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>def foo()   add .called to #d1 end</script>" +
			"<div _='on click call foo()'></div>" +
			"<div id='d1'></div>"
		)
		await expect(find('#d1')).not.toHaveClass(/called/)
		await find('div').first().dispatchEvent('click')
		await expect(find('#d1')).toHaveClass(/called/)
	})

	test('can define a basic one arg function', async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>def foo(str) put str into #d1.innerHTML end</script>" +
			"<div _='on click call foo(\"called\")'></div>" +
			"<div id='d1'></div>"
		)
		await expect(find('#d1')).toHaveText('')
		await find('div').first().dispatchEvent('click')
		await expect(find('#d1')).toHaveText('called')
	})

	test('functions can be namespaced', async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>def utils.foo()   add .called to #d1 end</script>" +
			"<div _='on click call utils.foo()'></div>" +
			"<div id='d1'></div>"
		)
		await expect(find('#d1')).not.toHaveClass(/called/)
		await find('div').first().dispatchEvent('click')
		await expect(find('#d1')).toHaveClass(/called/)
	})

	test('is called synchronously', async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>def foo()   log me end</script>" +
			"<div _='on click call foo() then add .called to #d1'></div>" +
			"<div id='d1'></div>"
		)
		await expect(find('#d1')).not.toHaveClass(/called/)
		await find('div').first().dispatchEvent('click')
		await expect(find('#d1')).toHaveClass(/called/)
	})

	test('can call asynchronously', async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>def foo()   wait 1ms  log me end</script>" +
			"<div _='on click call foo() then add .called to #d1'></div>" +
			"<div id='d1'></div>"
		)
		await expect(find('#d1')).not.toHaveClass(/called/)
		await find('div').first().dispatchEvent('click')
		await expect(find('#d1')).toHaveClass(/called/)
	})

	test('can return a value synchronously', async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>def foo()   return \"foo\" end</script>" +
			"<div _='on click call foo() then put it into #d1.innerText'></div>" +
			"<div id='d1'></div>"
		)
		await expect(find('#d1')).toHaveText('')
		await find('div').first().dispatchEvent('click')
		await expect(find('#d1')).toHaveText('foo')
	})

	test('can exit', async ({html, evaluate}) => {
		await html("<script type='text/hyperscript'>def foo()   exit end</script>")
		const result = await evaluate(() => foo())
		expect(result).toBeNull()
	})

	test('can return without a value', async ({html, evaluate}) => {
		await html("<script type='text/hyperscript'>def foo()   return end</script>")
		const result = await evaluate(() => foo())
		expect(result).toBeNull()
	})

	test('can return a value asynchronously', async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>def foo()   wait 1ms  return \"foo\" end</script>" +
			"<div _='on click call foo() then put it into #d1.innerText'></div>" +
			"<div id='d1'></div>"
		)
		await expect(find('#d1')).toHaveText('')
		await find('div').first().dispatchEvent('click')
		await expect(find('#d1')).toHaveText('foo')
	})

	test('can interop with javascript', async ({html, evaluate}) => {
		await html("<script type='text/hyperscript'>def foo()   return \"foo\" end</script>")
		const result = await evaluate(() => foo())
		expect(result).toBe('foo')
	})

	test('can interop with javascript asynchronously', async ({html, evaluate}) => {
		await html("<script type='text/hyperscript'>def foo()   wait 1ms  return \"foo\" end</script>")
		const result = await evaluate(() => foo())
		expect(result).toBe('foo')
	})

	test('can catch exceptions', async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
			"def foo()   throw \"bar\" catch e    set window.bar to e end" +
			"</script>"
		)
		await evaluate(() => foo())
		const result = await evaluate(() => window.bar)
		expect(result).toBe('bar')
	})

	test('can rethrow in catch blocks', async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
			"def foo()   throw \"bar\" catch e    throw e end" +
			"</script>"
		)
		const result = await evaluate(() => {
			try {
				foo()
				return 'no-error'
			} catch (e) {
				return e
			}
		})
		expect(result).toBe('bar')
	})

	test('can return in catch blocks', async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
			"def foo()   throw \"bar\" catch e    return 42 end" +
			"</script>"
		)
		const result = await evaluate(() => foo())
		expect(result).toBe(42)
	})

	test('can catch async exceptions', async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
			"def doh()   wait 10ms  throw \"bar\" end " +
			"def foo()   call doh() catch e    set window.bar to e end" +
			"</script>"
		)
		await evaluate(() => foo())
		await expect.poll(() => evaluate(() => window.bar)).toBe('bar')
	})

	test('can catch nested async exceptions', async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
			"def doh()   wait 10ms  throw \"bar\" end " +
			"def foo()   call doh() catch e    set window.bar to e end" +
			"</script>"
		)
		await evaluate(() => foo())
		await expect.poll(() => evaluate(() => window.bar)).toBe('bar')
	})

	test('can rethrow in async catch blocks', async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
			"def foo()   throw \"bar\" catch e    wait 10ms    throw e end" +
			"</script>"
		)
		const result = await evaluate(() => foo().catch(reason => reason))
		expect(result).toBe('bar')
	})

	test('can return in async catch blocks', async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
			"def foo()   throw \"bar\" catch e    wait 10ms    return 42 end" +
			"</script>"
		)
		const result = await evaluate(() => foo().then(val => val))
		expect(result).toBe(42)
	})

	test('can install a function on an element and use in children w/ no leak', async ({html, find}) => {
		await html(
			"<div _='def func() put 42 into #d3'>" +
			"<div id='d1' _='on click call func()'></div><div id='d2'></div><div id='d3'></div> </div>"
		)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d3')).toHaveText('42')
	})

	test('can install a function on an element and use in children w/ return value', async ({html, find}) => {
		await html(
			"<div _='def func() return 42'>" +
			"<div id='d1' _='on click put func() into me'></div><div id='d2'></div><div id='d3'></div> </div>"
		)
		await find('#d1').dispatchEvent('click')
		await expect(find('#d1')).toHaveText('42')
	})

	test('can install a function on an element and use me symbol correctly', async ({html, find}) => {
		await html(
			"<div id='outer' _='def func() put 42 into me'>" +
			"<div id='d1' _='on click call func()'></div><div id='d2'></div><div id='d3'></div> </div>"
		)
		await find('#d1').dispatchEvent('click')
		await expect(find('#outer')).toHaveText('42')
	})

	test('finally blocks run normally', async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
			"def foo()   set window.bar to 10 finally    set window.bar to 20 end" +
			"</script>"
		)
		await evaluate(() => foo())
		const result = await evaluate(() => window.bar)
		expect(result).toBe(20)
	})

	test('finally blocks run when an exception occurs', async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
			"def foo()   set window.bar to 10  throw \"foo\" finally    set window.bar to 20 end" +
			"</script>"
		)
		await evaluate(() => { try { foo() } catch(e) {} })
		const result = await evaluate(() => window.bar)
		expect(result).toBe(20)
	})

	test('finally blocks run when an exception expr occurs', async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
			"def foo()   set window.bar to 10  call throwsAsyncException() finally    set window.bar to 20 end" +
			"</script>"
		)
		await evaluate(() => {
			window.throwsAsyncException = function() {
				return new Promise(function(resolve, reject) { reject("foo") })
			}
		})
		await evaluate(() => foo())
		await expect.poll(() => evaluate(() => window.bar)).toBe(20)
	})

	test('async finally blocks run normally', async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
			"def foo()   wait a tick then set window.bar to 10 finally    set window.bar to 20 end" +
			"</script>"
		)
		await evaluate(() => foo())
		await expect.poll(() => evaluate(() => window.bar)).toBe(20)
	})

	test('async finally blocks run when an exception occurs', async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
			"def foo()   wait a tick then set window.bar to 10  throw \"foo\" finally    set window.bar to 20 end" +
			"</script>"
		)
		await evaluate(() => foo())
		await expect.poll(() => evaluate(() => window.bar)).toBe(20)
	})

})
