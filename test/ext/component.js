import {test, expect} from '../fixtures.js'

test.describe('the component extension', () => {

	test('registers a custom element from a template', async ({html, find}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-hello">
				<span>Hello World</span>
			</script>
			<test-hello></test-hello>
		`)
		await expect.poll(() => find('test-hello span').textContent()).toBe('Hello World')
	})

	test('renders template expressions', async ({html, find, run, evaluate}) => {
		await run("set $name to 'hyperscript'")
		await html(`
			<script type="text/hyperscript-template" component="test-greet">
				<span>Hello ${"\x24"}{$name}!</span>
			</script>
			<test-greet></test-greet>
		`)
		await expect.poll(() => find('test-greet span').textContent()).toBe('Hello hyperscript!')
		await evaluate(() => { delete window.$name })
	})

	test('applies _ hyperscript to component instance', async ({html, find}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-init" _="init set ^msg to 'initialized'">
				<span>${"\x24"}{^msg}</span>
			</script>
			<test-init></test-init>
		`)
		await expect.poll(() => find('test-init span').textContent()).toBe('initialized')
	})

	test('processes _ on inner elements', async ({html, find}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-inner" _="init set ^count to 0">
				<button _="on click increment ^count then put ^count into the next <span/>">+</button>
				<span>0</span>
			</script>
			<test-inner></test-inner>
		`)
		await expect.poll(() => find('test-inner span').textContent()).toBe('0')
		await find('test-inner button').click()
		await expect.poll(() => find('test-inner span').textContent()).toBe('1')
	})

	test('reactively updates template expressions', async ({html, find}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-reactive" _="init set ^count to 0">
				<button _="on click increment ^count">+</button>
				<span>Count: ${"\x24"}{^count}</span>
			</script>
			<test-reactive></test-reactive>
		`)
		await expect.poll(() => find('test-reactive span').textContent()).toBe('Count: 0')
		await find('test-reactive button').click()
		await expect.poll(() => find('test-reactive span').textContent()).toBe('Count: 1')
	})

	test('supports multiple independent instances', async ({html, find}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-multi" _="init set ^count to 0">
				<button _="on click increment ^count then put ^count into the next <span/>">+</button>
				<span>0</span>
			</script>
			<test-multi id="a"></test-multi>
			<test-multi id="b"></test-multi>
		`)
		await find('#a button').click()
		await expect.poll(() => find('#a span').textContent()).toBe('1')
		await expect.poll(() => find('#b span').textContent()).toBe('0')
	})

	test('reads attributes via @', async ({html, find}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-attrs" _="init set ^val to @data-start as Int">
				<span>${"\x24"}{^val}</span>
			</script>
			<test-attrs data-start="42"></test-attrs>
		`)
		await expect.poll(() => find('test-attrs span').textContent()).toBe('42')
	})

	test('supports #for loops in template', async ({html, find}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-loop" _="init set ^items to ['a', 'b', 'c']">
				<ul>
				#for item in ^items
					<li>${"\x24"}{item}</li>
				#end
				</ul>
			</script>
			<test-loop></test-loop>
		`)
		await expect.poll(() => find('test-loop li').count()).toBe(3)
		await expect.poll(() => find('test-loop li').first().textContent()).toBe('a')
	})

	test('supports #if conditionals in template', async ({html, find}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-cond" _="init set ^show to true">
				#if ^show
					<span>visible</span>
				#end
			</script>
			<test-cond></test-cond>
		`)
		await expect.poll(() => find('test-cond span').textContent()).toBe('visible')
	})

	test('substitutes slot content into template', async ({html, find}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-card">
				<div class="card"><slot/></div>
			</script>
			<test-card><p>Hello from slot</p></test-card>
		`)
		await expect.poll(() => find('test-card .card p').textContent()).toBe('Hello from slot')
	})

	test('blocks processing of inner hyperscript until render', async ({html, find}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-block" _="init set ^msg to 'ready'">
				<span _="on click put ^msg into me">click me</span>
			</script>
			<test-block></test-block>
		`)
		await expect.poll(() => find('test-block span').textContent()).toBe('click me')
		await find('test-block span').click()
		await expect.poll(() => find('test-block span').textContent()).toBe('ready')
	})

	test('supports named slots', async ({html, find}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-named-slot">
				<header><slot name="title"></slot></header>
				<main><slot/></main>
				<footer><slot name="footer"></slot></footer>
			</script>
			<test-named-slot>
				<h1 slot="title">My Title</h1>
				<p>Default content</p>
				<span slot="footer">Footer text</span>
			</test-named-slot>
		`)
		await expect.poll(() => find('test-named-slot header h1').textContent()).toBe('My Title')
		await expect.poll(() => find('test-named-slot main p').textContent()).toBe('Default content')
		await expect.poll(() => find('test-named-slot footer span').textContent()).toBe('Footer text')
	})

	test('does not process slotted _ attributes prematurely', async ({html, find}) => {
		await html(`
			<div _="init set ^x to 42">
				<script type="text/hyperscript-template" component="test-slot-hs">
					<div class="wrap"><slot/></div>
				</script>
				<test-slot-hs>
					<span _="on click put ^x into me">before</span>
				</test-slot-hs>
			</div>
		`)
		await expect.poll(() => find('test-slot-hs span').textContent()).toBe('before')
		await find('test-slot-hs span').click()
		await expect.poll(() => find('test-slot-hs span').textContent()).toBe('42')
	})

	test('slotted content resolves ^var from outer scope, not component scope', async ({html, find}) => {
		await html(`
			<div _="init set ^outer to 'from-outside'">
				<script type="text/hyperscript-template" component="test-scope-slot" _="init set ^outer to 'from-component'">
					<div class="inner"><slot/></div>
				</script>
				<test-scope-slot>
					<span _="init put ^outer into me">waiting</span>
				</test-scope-slot>
			</div>
		`)
		await expect.poll(() => find('test-scope-slot span').textContent()).toBe('from-outside')
	})

	test('component isolation prevents ^var leaking inward', async ({html, find}) => {
		await html(`
			<div _="init set ^leaked to 'should-not-see'">
				<script type="text/hyperscript-template" component="test-isolated" _="init set ^internal to 'component-only'">
					<span _="init if ^leaked is not undefined put 'leaked!' into me else put ^internal into me">waiting</span>
				</script>
				<test-isolated></test-isolated>
			</div>
		`)
		await expect.poll(() => find('test-isolated span').textContent()).toBe('component-only')
	})

	test('bind keeps ^var in sync with attribute changes', async ({html, find, evaluate}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-bind-attr" _="bind ^count to @data-count">
				<span>${"\x24"}{^count}</span>
			</script>
			<test-bind-attr data-count="5"></test-bind-attr>
		`)
		await expect.poll(() => find('test-bind-attr span').textContent()).toBe('5')
		await evaluate(() => document.querySelector('test-bind-attr').setAttribute('data-count', '99'))
		await expect.poll(() => find('test-bind-attr span').textContent()).toBe('99')
	})

	test('attrs evaluates attribute as hyperscript in parent scope', async ({html, find, run, evaluate}) => {
		await run("set $stuff to ['a', 'b', 'c']")
		await html(`
			<script type="text/hyperscript-template" component="test-args" _="init set ^list to attrs.items">
				<ul>
				#for item in ^list
					<li>${"\x24"}{item}</li>
				#end
				</ul>
			</script>
			<test-args items="$stuff"></test-args>
		`)
		await expect.poll(() => find('test-args li').count()).toBe(3)
		await expect.poll(() => find('test-args li').first().textContent()).toBe('a')
		await evaluate(() => { delete window.$stuff })
	})

	test('attrs works with bind for reactive pass-through', async ({html, find, run}) => {
		await run("set $count to 10")
		await html(`
			<script type="text/hyperscript-template" component="test-args-bind" _="bind ^val to attrs.count">
				<span>${"\x24"}{^val}</span>
			</script>
			<test-args-bind count="$count"></test-args-bind>
			<button _="on click increment $count">+</button>
		`)
		await expect.poll(() => find('test-args-bind span').textContent()).toBe('10')
		await find('button').click()
		await expect.poll(() => find('test-args-bind span').textContent()).toBe('11')
	})

	test('attrs bind is bidirectional - inner changes flow outward', async ({html, find, run, evaluate}) => {
		await run("set $count to 10")
		await html(`
			<script type="text/hyperscript-template" component="test-args-bidir" _="bind ^count to attrs.count">
				<span>${"\x24"}{^count}</span>
				<button _="on click increment ^count">+</button>
			</script>
			<test-args-bidir count="$count"></test-args-bidir>
			<p _="live put $count into me"></p>
		`)
		await expect.poll(() => find('test-args-bidir span').textContent()).toBe('10')
		await expect.poll(() => find('p').textContent()).toBe('10')
		await find('test-args-bidir button').click()
		// Inner ^count should update
		await expect.poll(() => find('test-args-bidir span').textContent()).toBe('11')
		// Outer $count should also update via attrs write-back
		await expect.poll(() => find('p').textContent(), { timeout: 2000 }).toBe('11')
		await evaluate(() => { delete window.$count })
	})

	test('extracts <style> blocks and wraps them in @scope', async ({html, page}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-styled">
				<style>
					:scope { display: block; }
					.inner { color: rgb(11, 22, 33); }
				</style>
				<span class="inner">styled</span>
			</script>
			<test-styled></test-styled>
		`)
		// The wrapped style tag lives in document.head, tagged with
		// data-hyperscript-component so it's findable for cleanup/inspection.
		const styleText = await page.evaluate(() => {
			const s = document.head.querySelector('style[data-hyperscript-component="test-styled"]')
			return s ? s.textContent : null
		})
		expect(styleText).toContain('@scope (test-styled)')
		expect(styleText).toContain('.inner')
		// And the script's text content no longer has a <style>
		const hasStyle = await page.evaluate(() => {
			const tmpl = document.querySelector('script[component="test-styled"]')
			return tmpl.textContent.includes('<style>')
		})
		expect(hasStyle).toBe(false)
		// Style actually applies to the rendered descendant
		await expect.poll(async () => {
			return await page.evaluate(() => {
				const el = document.querySelector('test-styled .inner')
				return el && getComputedStyle(el).color
			})
		}).toBe('rgb(11, 22, 33)')
	})

	test('component reads enclosing scope set by a sibling init on first load', async ({html, find, evaluate}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-user-card" _="init set ^user to attrs.data">
				<h3>${"\x24"}{^user.name}</h3>
				<p>${"\x24"}{^user.email}</p>
			</script>
			<div _="init set $testCurrentUser to { name: 'Carson', email: 'carson@example.com' }">
				<test-user-card data="$testCurrentUser"></test-user-card>
			</div>
		`)
		await expect.poll(() => find('test-user-card h3').textContent()).toBe('Carson')
		await expect.poll(() => find('test-user-card p').textContent()).toBe('carson@example.com')
		await evaluate(() => { delete window.$testCurrentUser })
	})

	test('component reads a feature-level set from an enclosing div on first load', async ({html, find, evaluate}) => {
		await html(`
			<script type="text/hyperscript-template" component="test-plain-card" _="init set ^label to attrs.label">
				<span>${"\x24"}{^label}</span>
			</script>
			<div _="set $testLabel to 'hello'">
				<test-plain-card label="$testLabel"></test-plain-card>
			</div>
		`)
		await expect.poll(() => find('test-plain-card span').textContent()).toBe('hello')
		await evaluate(() => { delete window.$testLabel })
	})

	test('injects a FOUCE-guard style so undefined custom elements are hidden', async ({page, html}) => {
		// The guard is injected lazily on the first processNode call, so
		// triggering any html() is enough to materialize it.
		await html('')
		const guard = await page.evaluate(() => {
			const s = document.head.querySelector('style[data-hyperscript-component="fouce-guard"]')
			return s ? s.textContent : null
		})
		expect(guard).toContain(':not(:defined)')
		expect(guard).toContain('visibility: hidden')
	})

	test('loads components from an external bundle via script[type=text/hyperscript-component]', async ({page, html}) => {
		// Serve a fake bundle containing two component definitions
		await page.route('**/test-bundle.html', route => {
			route.fulfill({
				contentType: 'text/html',
				body: `
					<script type="text/hyperscript-template" component="bundle-greeting"
					        _="init set ^who to attrs.name">
						<span class="g">Hello, ${"\x24"}{^who}!</span>
					</script>
					<script type="text/hyperscript-template" component="bundle-badge">
						<span class="b">BADGE</span>
					</script>
				`
			})
		})

		await html(`
			<script type="text/hyperscript-component" src="/test-bundle.html"></script>
			<div _="init set $bundlePerson to 'Carson'">
				<bundle-greeting name="$bundlePerson"></bundle-greeting>
				<bundle-badge></bundle-badge>
			</div>
		`)

		// Both components should eventually render once the bundle resolves
		await expect.poll(() => page.locator('bundle-greeting .g').textContent()).toBe('Hello, Carson!')
		await expect.poll(() => page.locator('bundle-badge .b').textContent()).toBe('BADGE')
	})

})
