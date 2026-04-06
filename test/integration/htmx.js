import {test, expect} from '../htmx-fixtures.js'

test.describe('htmx integration', () => {

	test('hyperscript responds to htmx swap events', async ({html, find, mock}) => {
		await mock('GET', '/test1', '<p>loaded</p>')
		await html(`
			<button hx-get="/test1" hx-target="#target1"
			        _="on htmx:after:swap put 'swapped!' into #status1">Load</button>
			<div id="target1"></div>
			<span id="status1"></span>
		`)
		await find('button').click()
		await expect.poll(() => find('#status1').textContent()).toBe('swapped!')
	})

	test('hyperscript can trigger htmx requests via send', async ({html, find, mock}) => {
		await mock('GET', '/test2', '<p>got it</p>')
		await html(`
			<div hx-get="/test2" hx-trigger="doLoad" hx-target="#out2">waiting</div>
			<button _="on click send doLoad to the previous <div/>">Go</button>
			<div id="out2"></div>
		`)
		await find('button').click()
		await expect.poll(() => find('#out2 p').textContent()).toBe('got it')
	})

	test('hyperscript works on htmx-swapped content', async ({html, find, mock}) => {
		await mock('GET', '/test3', '<button id="inner" _="on click put \'clicked\' into me">Click me</button>')
		await html(`
			<button hx-get="/test3" hx-target="#container3">Load</button>
			<div id="container3"></div>
		`)
		await find('button').first().click()
		await expect.poll(() => find('#inner').count()).toBe(1)
		await find('#inner').click()
		await expect.poll(() => find('#inner').textContent()).toBe('clicked')
	})

	test('hyperscript can modify form values before htmx submit', async ({html, find, mock}) => {
		await mock('POST', '/test4', '<span>posted</span>')
		await html(`
			<form hx-post="/test4" hx-target="#result4"
			      _="on submit set #hidden4's value to 'injected'">
				<input type="hidden" id="hidden4" name="data" value="" />
				<button type="submit">Submit</button>
			</form>
			<div id="result4"></div>
		`)
		await find('button').click()
		await expect.poll(() => find('#result4 span').textContent()).toBe('posted')
	})

	test('hyperscript can cancel htmx request via halt', async ({html, find, mock, evaluate}) => {
		await mock('GET', '/test5', '<p>should not appear</p>')
		await html(`
			<button hx-get="/test5" hx-target="#out5"
			        _="on htmx:before:request halt the event">Load</button>
			<div id="out5">original</div>
		`)
		await find('button').click()
		await evaluate(() => new Promise(r => setTimeout(r, 200)))
		await expect(find('#out5')).toHaveText('original')
	})

	test('hyperscript responds to htmx:after:settle on target', async ({html, find, mock}) => {
		await mock('GET', '/test6', '<span class="new">content</span>')
		await html(`
			<button hx-get="/test6" hx-target="#target6">Load</button>
			<div id="target6" _="on htmx:after:settle add .done to me"></div>
		`)
		await find('button').click()
		await expect.poll(() => find('#target6').getAttribute('class')).toContain('done')
	})

	test('hyperscript element-scoped vars persist across htmx swaps', async ({html, find, mock}) => {
		await mock('GET', '/test7', '<span>swapped</span>')
		await html(`
			<div id="outer7" _="set :counter to 0
			        on click from #clicker7 increment :counter then put :counter into #count7">
				<button id="clicker7">Count</button>
				<button id="swapper7" hx-get="/test7" hx-target="#target7" hx-swap="innerHTML">Swap</button>
				<div id="target7">original</div>
				<span id="count7">0</span>
			</div>
		`)
		await find('#clicker7').click()
		await expect.poll(() => find('#count7').textContent()).toBe('1')
		await find('#swapper7').click()
		await expect.poll(() => find('#target7 span').textContent()).toBe('swapped')
		await find('#clicker7').click()
		await expect.poll(() => find('#count7').textContent()).toBe('2')
	})

	test('hyperscript can react to htmx:after:request', async ({html, find, mock}) => {
		await mock('GET', '/test8', '<p>done</p>')
		await html(`
			<button hx-get="/test8" hx-target="#out8"
			        _="on htmx:after:request put 'finished' into #status8">Send</button>
			<div id="out8"></div>
			<span id="status8"></span>
		`)
		await find('button').click()
		await expect.poll(() => find('#status8').textContent()).toBe('finished')
	})

	test('htmx content added by hyperscript is processed and can issue requests', async ({html, find, mock}) => {
		await mock('GET', '/test9', '<span>from server</span>')
		await html(`
			<button _="on click put '<div id=&quot;injected&quot; hx-get=&quot;/test9&quot; hx-trigger=&quot;click&quot; hx-target=&quot;#result9&quot;>Click me</div>' after me">
				Inject
			</button>
			<div id="result9"></div>
		`)
		await find('button').click()
		await expect.poll(() => find('#injected').count()).toBe(1)
		await find('#injected').click()
		await expect.poll(() => find('#result9 span').textContent()).toBe('from server')
	})
})
