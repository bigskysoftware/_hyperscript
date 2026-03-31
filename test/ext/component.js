import {test, expect} from '../fixtures.js'

test.describe('the component extension', () => {

	test('registers a custom element from a template', async ({html, find}) => {
		await html(`
			<template hypercomp="test-hello">
				<span>Hello World</span>
			</template>
			<test-hello></test-hello>
		`)
		await expect.poll(() => find('test-hello span').textContent()).toBe('Hello World')
	})

	test('renders template expressions', async ({html, find, run, evaluate}) => {
		await run("set $name to 'hyperscript'")
		await html(`
			<template hypercomp="test-greet">
				<span>Hello ${"\x24"}{$name}!</span>
			</template>
			<test-greet></test-greet>
		`)
		await expect.poll(() => find('test-greet span').textContent()).toBe('Hello hyperscript!')
		await evaluate(() => { delete window.$name })
	})

	test('applies _ hyperscript to component instance', async ({html, find}) => {
		await html(`
			<template hypercomp="test-init" _="init set ^msg to 'initialized'">
				<span>${"\x24"}{^msg}</span>
			</template>
			<test-init></test-init>
		`)
		await expect.poll(() => find('test-init span').textContent()).toBe('initialized')
	})

	test('processes _ on inner elements', async ({html, find}) => {
		await html(`
			<template hypercomp="test-inner" _="init set ^count to 0">
				<button _="on click increment ^count then put ^count into the next <span/>">+</button>
				<span>0</span>
			</template>
			<test-inner></test-inner>
		`)
		await expect.poll(() => find('test-inner span').textContent()).toBe('0')
		await find('test-inner button').click()
		await expect.poll(() => find('test-inner span').textContent()).toBe('1')
	})

	test('reactively updates template expressions', async ({html, find}) => {
		await html(`
			<template hypercomp="test-reactive" _="init set ^count to 0">
				<button _="on click increment ^count">+</button>
				<span>Count: ${"\x24"}{^count}</span>
			</template>
			<test-reactive></test-reactive>
		`)
		await expect.poll(() => find('test-reactive span').textContent()).toBe('Count: 0')
		await find('test-reactive button').click()
		await expect.poll(() => find('test-reactive span').textContent()).toBe('Count: 1')
	})

	test('supports multiple independent instances', async ({html, find}) => {
		await html(`
			<template hypercomp="test-multi" _="init set ^count to 0">
				<button _="on click increment ^count then put ^count into the next <span/>">+</button>
				<span>0</span>
			</template>
			<test-multi id="a"></test-multi>
			<test-multi id="b"></test-multi>
		`)
		await find('#a button').click()
		await expect.poll(() => find('#a span').textContent()).toBe('1')
		await expect.poll(() => find('#b span').textContent()).toBe('0')
	})

	test('reads attributes via @', async ({html, find}) => {
		await html(`
			<template hypercomp="test-attrs" _="init set ^val to @data-start as Int">
				<span>${"\x24"}{^val}</span>
			</template>
			<test-attrs data-start="42"></test-attrs>
		`)
		await expect.poll(() => find('test-attrs span').textContent()).toBe('42')
	})

	test('supports #for loops in template', async ({html, find}) => {
		await html(`
			<template hypercomp="test-loop" _="init set ^items to ['a', 'b', 'c']">
				<ul>
				#for item in ^items
					<li>${"\x24"}{item}</li>
				#end
				</ul>
			</template>
			<test-loop></test-loop>
		`)
		await expect.poll(() => find('test-loop li').count()).toBe(3)
		await expect.poll(() => find('test-loop li').first().textContent()).toBe('a')
	})

	test('supports #if conditionals in template', async ({html, find}) => {
		await html(`
			<template hypercomp="test-cond" _="init set ^show to true">
				#if ^show
					<span>visible</span>
				#end
			</template>
			<test-cond></test-cond>
		`)
		await expect.poll(() => find('test-cond span').textContent()).toBe('visible')
	})

	test('substitutes slot content into template', async ({html, find}) => {
		await html(`
			<template hypercomp="test-card">
				<div class="card"><slot/></div>
			</template>
			<test-card><p>Hello from slot</p></test-card>
		`)
		await expect.poll(() => find('test-card .card p').textContent()).toBe('Hello from slot')
	})

	test('blocks processing of inner hyperscript until render', async ({html, find}) => {
		await html(`
			<template hypercomp="test-block" _="init set ^msg to 'ready'">
				<span _="on click put ^msg into me">click me</span>
			</template>
			<test-block></test-block>
		`)
		await expect.poll(() => find('test-block span').textContent()).toBe('click me')
		await find('test-block span').click()
		await expect.poll(() => find('test-block span').textContent()).toBe('ready')
	})

	test('supports named slots', async ({html, find}) => {
		await html(`
			<template hypercomp="test-named-slot">
				<header><slot name="title"></slot></header>
				<main><slot/></main>
				<footer><slot name="footer"></slot></footer>
			</template>
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
				<template hypercomp="test-slot-hs">
					<div class="wrap"><slot/></div>
				</template>
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
				<template hypercomp="test-scope-slot" _="init set ^outer to 'from-component'">
					<div class="inner"><slot/></div>
				</template>
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
				<template hypercomp="test-isolated" _="init set ^internal to 'component-only'">
					<span _="init if ^leaked is not undefined put 'leaked!' into me else put ^internal into me">waiting</span>
				</template>
				<test-isolated></test-isolated>
			</div>
		`)
		await expect.poll(() => find('test-isolated span').textContent()).toBe('component-only')
	})

	test('bind keeps ^var in sync with attribute changes', async ({html, find, evaluate}) => {
		await html(`
			<template hypercomp="test-bind-attr" _="bind ^count to @data-count">
				<span>${"\x24"}{^count}</span>
			</template>
			<test-bind-attr data-count="5"></test-bind-attr>
		`)
		await expect.poll(() => find('test-bind-attr span').textContent()).toBe('5')
		await evaluate(() => document.querySelector('test-bind-attr').setAttribute('data-count', '99'))
		await expect.poll(() => find('test-bind-attr span').textContent()).toBe('99')
	})

})
