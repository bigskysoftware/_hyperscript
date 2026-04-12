import {test, expect} from '../fixtures.js'

test.describe('live templates', () => {

	test('renders static content after the template', async ({html, find}) => {
		await html(`
			<script type="text/hypertemplate" live>
				<span>Hello World</span>
			</script>
		`)
		await expect.poll(() => find('[data-live-template] span').textContent()).toBe('Hello World')
	})

	test('renders template expressions', async ({html, find, run, evaluate}) => {
		await run("set $ltName to 'hyperscript'")
		await html(`
			<script type="text/hypertemplate" live>
				<span>Hello ${"\x24"}{$ltName}!</span>
			</script>
		`)
		await expect.poll(() => find('[data-live-template] span').textContent()).toBe('Hello hyperscript!')
		await evaluate(() => { delete window.$ltName })
	})

	test('applies init script from _ attribute', async ({html, find}) => {
		await html(`
			<script type="text/hypertemplate" live _="init set ^msg to 'initialized'">
				<span>${"\x24"}{^msg}</span>
			</script>
		`)
		await expect.poll(() => find('[data-live-template] span').textContent()).toBe('initialized')
	})

	test('reactively updates when dependencies change', async ({html, find}) => {
		await html(`
			<script type="text/hypertemplate" live _="init set ^count to 0">
				<button _="on click increment ^count">+</button>
				<span>Count: ${"\x24"}{^count}</span>
			</script>
		`)
		await expect.poll(() => find('[data-live-template] span').textContent()).toBe('Count: 0')
		await find('[data-live-template] button').click()
		await expect.poll(() => find('[data-live-template] span').textContent()).toBe('Count: 1')
	})

	test('processes hyperscript on inner elements', async ({html, find}) => {
		await html(`
			<script type="text/hypertemplate" live _="init set ^val to 0">
				<button _="on click increment ^val then put ^val into the next <output/>">+</button>
				<output>0</output>
			</script>
		`)
		await expect.poll(() => find('[data-live-template] output').textContent()).toBe('0')
		await find('[data-live-template] button').click()
		await expect.poll(() => find('[data-live-template] output').textContent()).toBe('1')
	})

	test('supports #for loops', async ({html, find}) => {
		await html(`
			<script type="text/hypertemplate" live _="init set ^items to ['a', 'b', 'c']">
				<ul>
				#for item in ^items
					<li>${"\x24"}{item}</li>
				#end
				</ul>
			</script>
		`)
		await expect.poll(() => find('[data-live-template] li').count()).toBe(3)
		await expect.poll(() => find('[data-live-template] li').first().textContent()).toBe('a')
	})

	test('supports #if conditionals', async ({html, find}) => {
		await html(`
			<script type="text/hypertemplate" live _="init set ^show to true">
				#if ^show
					<span>visible</span>
				#end
			</script>
		`)
		await expect.poll(() => find('[data-live-template] span').textContent()).toBe('visible')
	})

	test('reacts to global state without init script', async ({html, find, run, evaluate}) => {
		await run("set $ltGlobal to 'World'")
		await html(`
			<script type="text/hypertemplate" live>
				<p>Hello, ${"\x24"}{$ltGlobal}!</p>
			</script>
		`)
		await expect.poll(() => find('[data-live-template] p').textContent()).toBe('Hello, World!')
		await run("set $ltGlobal to 'Carson'")
		await expect.poll(() => find('[data-live-template] p').textContent()).toBe('Hello, Carson!')
		await evaluate(() => { delete window.$ltGlobal })
	})

	test('wrapper has display:contents', async ({html, find, evaluate}) => {
		await html(`
			<script type="text/hypertemplate" live>
				<span>test</span>
			</script>
		`)
		await expect.poll(() => find('[data-live-template] span').textContent()).toBe('test')
		var display = await evaluate(() =>
			document.querySelector('[data-live-template]').style.display
		)
		expect(display).toBe('contents')
	})

	test('multiple live templates are independent', async ({html, find}) => {
		await html(`
			<script type="text/hypertemplate" live _="init set ^x to 'first'">
				<span class="a">${"\x24"}{^x}</span>
			</script>
			<script type="text/hypertemplate" live _="init set ^x to 'second'">
				<span class="b">${"\x24"}{^x}</span>
			</script>
		`)
		await expect.poll(() => find('[data-live-template] .a').textContent()).toBe('first')
		await expect.poll(() => find('[data-live-template] .b').textContent()).toBe('second')
	})

	test('script type="text/hypertemplate" works as a live template source', async ({html, find}) => {
		await html(`
			<script type="text/hypertemplate" live _="init set ^stMsg to 'from script'">
				<span>${"\x24"}{^stMsg}</span>
			</script>
		`)
		await expect.poll(() => find('[data-live-template] span').textContent()).toBe('from script')
	})

	test('script-based live template preserves ${} in bare attribute position', async ({html, find, page}) => {
		await html(`
			<script type="text/hypertemplate" live _="init set ^items to [{text:'A', done:true},{text:'B', done:false}]">
				<ul>
				#for item in ^items
					<li class="${"\x24"}{'done' if item.done}" data-text="${"\x24"}{item.text}">
						<input type="checkbox" ${"\x24"}{'checked' if item.done}>
						<span>${"\x24"}{item.text}</span>
					</li>
				#end
				</ul>
			</script>
		`)
		await expect.poll(() => find('[data-live-template] li').count()).toBe(2)
		var firstChecked = await page.evaluate(() =>
			document.querySelector('[data-live-template] li:nth-child(1) input').checked)
		expect(firstChecked).toBe(true)
		var secondChecked = await page.evaluate(() =>
			document.querySelector('[data-live-template] li:nth-child(2) input').checked)
		expect(secondChecked).toBe(false)
		await expect(find('[data-live-template] li').first()).toHaveClass(/done/)
		await expect(find('[data-live-template] li').last()).not.toHaveClass(/done/)
	})
})
