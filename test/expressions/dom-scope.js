import {test, expect} from '../fixtures.js'

test.describe('the dom scope (^var)', () => {

	test('child reads ^var set by parent', async ({html, find}) => {
		await html(
			`<div _="init set ^count to 42">` +
			`  <span _="on click put ^count into me">0</span>` +
			`</div>`
		)
		await find('span').click()
		await expect(find('span')).toHaveText('42')
	})

	test('child writes ^var and parent sees it', async ({html, find}) => {
		await html(
			`<div _="init set ^count to 0">` +
			`  <button _="on click set ^count to 99">set</button>` +
			`  <span _="on click put ^count into me">0</span>` +
			`</div>`
		)
		await find('button').click()
		await find('span').click()
		await expect(find('span')).toHaveText('99')
	})

	test('deeply nested child reads ^var from grandparent', async ({html, find}) => {
		await html(
			`<div _="init set ^name to 'alice'">` +
			`  <div>` +
			`    <div>` +
			`      <span _="on click put ^name into me">empty</span>` +
			`    </div>` +
			`  </div>` +
			`</div>`
		)
		await find('span').click()
		await expect(find('span')).toHaveText('alice')
	})

	test('closest ancestor wins (shadowing)', async ({html, find}) => {
		await html(
			`<div _="init set ^color to 'red'">` +
			`  <div _="init set ^color to 'blue'">` +
			`    <span _="on click put ^color into me">empty</span>` +
			`  </div>` +
			`</div>`
		)
		await find('span').click()
		await expect(find('span')).toHaveText('blue')
	})

	test('sibling subtrees have independent ^vars', async ({html, find}) => {
		await html(
			`<div id="a" _="init set ^val to 'A'">` +
			`  <span _="on click put ^val into me">empty</span>` +
			`</div>` +
			`<div id="b" _="init set ^val to 'B'">` +
			`  <span _="on click put ^val into me">empty</span>` +
			`</div>`
		)
		await find('#a span').click()
		await expect(find('#a span')).toHaveText('A')
		await find('#b span').click()
		await expect(find('#b span')).toHaveText('B')
	})

	test('write to ^var not found anywhere creates on current element', async ({html, find}) => {
		await html(
			`<div>` +
			`  <button _="on click set ^newvar to 'created' then put ^newvar into next <span/>">go</button>` +
			`  <span>empty</span>` +
			`</div>`
		)
		await find('button').click()
		await expect(find('span')).toHaveText('created')
	})

	test('child write updates the ancestor, not a local copy', async ({html, find}) => {
		await html(
			`<div _="init set ^shared to 0">` +
			`  <button _="on click set ^shared to 10">set</button>` +
			`  <span _="on click put ^shared into me">0</span>` +
			`</div>`
		)
		await find('button').click()
		// read from a sibling — should see the ancestor's updated value
		await find('span').click()
		await expect(find('span')).toHaveText('10')
	})

	test('increment works on inherited var', async ({html, find}) => {
		await html(
			`<div _="init set ^count to 0">` +
			`  <button _="on click increment ^count">+1</button>` +
			`  <span _="on click put ^count into me">0</span>` +
			`</div>`
		)
		await find('button').click()
		await find('button').click()
		await find('button').click()
		await find('span').click()
		await expect(find('span')).toHaveText('3')
	})

	test('dom keyword works as scope modifier', async ({html, find}) => {
		await html(
			`<div _="init set dom count to 42">` +
			`  <span _="on click put dom count into me">0</span>` +
			`</div>`
		)
		await find('span').click()
		await expect(find('span')).toHaveText('42')
	})

	// ================================================================
	// on <expr> clause
	// ================================================================

	test('set ^var on explicit element', async ({html, find}) => {
		await html(
			`<div class="store">` +
			`  <button _="on click set ^data on closest .store to 'hello'">set</button>` +
			`  <span _="on click put ^data on closest .store into me">read</span>` +
			`</div>`
		)
		await find('button').click()
		await find('span').click()
		await expect(find('span')).toHaveText('hello')
	})

	test('on clause targets a specific ancestor', async ({html, find}) => {
		await html(
			`<div class="outer" _="init set ^outerVal to 'outer'">` +
			`  <div class="inner" _="init set ^innerVal to 'inner'">` +
			`    <span _="on click put ^outerVal on closest .outer into me">read</span>` +
			`  </div>` +
			`</div>`
		)
		await find('span').click()
		await expect(find('span')).toHaveText('outer')
	})

	test('on clause with id reference', async ({html, find}) => {
		await html(
			`<div id="state-holder"></div>` +
			`<button _="on click set ^count on #state-holder to 99">set</button>` +
			`<span _="on click put ^count on #state-holder into me">read</span>`
		)
		await find('button').click()
		await find('span').click()
		await expect(find('span')).toHaveText('99')
	})

})
