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

	// ================================================================
	// Reactivity with ^var
	// ================================================================

	test('when reacts to ^var changes', async ({html, find}) => {
		await html(
			`<div _="init set ^count to 0">` +
			`  <button _="on click increment ^count">+1</button>` +
			`  <output _="when ^count changes put it into me">0</output>` +
			`</div>`
		)
		await expect(find('output')).toHaveText('0')
		await find('button').click()
		await expect(find('output')).toHaveText('1')
		await find('button').click()
		await expect(find('output')).toHaveText('2')
	})

	test('always reacts to ^var changes', async ({html, find}) => {
		await html(
			`<div _="init set ^name to 'alice'">` +
			`  <button _="on click set ^name to 'bob'">rename</button>` +
			`  <output _="live put 'Hello ' + ^name into me">loading</output>` +
			`</div>`
		)
		await expect.poll(() => find('output').textContent()).toBe('Hello alice')
		await find('button').click()
		await expect.poll(() => find('output').textContent()).toBe('Hello bob')
	})

	test('multiple children react to same ^var', async ({html, find}) => {
		await html(
			`<div _="init set ^color to 'red'">` +
			`  <button _="on click set ^color to 'blue'">change</button>` +
			`  <span id="a" _="when ^color changes put it into me"></span>` +
			`  <span id="b" _="when ^color changes put it into me"></span>` +
			`</div>`
		)
		await expect(find('#a')).toHaveText('red')
		await expect(find('#b')).toHaveText('red')
		await find('button').click()
		await expect(find('#a')).toHaveText('blue')
		await expect(find('#b')).toHaveText('blue')
	})

	test('sibling subtrees react independently with ^var', async ({html, find}) => {
		await html(
			`<div id="a" _="init set ^val to 0">` +
			`  <button _="on click increment ^val">+1</button>` +
			`  <output _="when ^val changes put it into me">0</output>` +
			`</div>` +
			`<div id="b" _="init set ^val to 0">` +
			`  <button _="on click increment ^val">+1</button>` +
			`  <output _="when ^val changes put it into me">0</output>` +
			`</div>`
		)
		await expect(find('#a output')).toHaveText('0')
		await expect(find('#b output')).toHaveText('0')

		await find('#a button').click()
		await find('#a button').click()
		await expect(find('#a output')).toHaveText('2')
		await expect(find('#b output')).toHaveText('0')

		await find('#b button').click()
		await expect(find('#b output')).toHaveText('1')
		await expect(find('#a output')).toHaveText('2')
	})

	test('bind works with ^var', async ({html, find, evaluate}) => {
		await html(
			`<div _="init set ^search to ''">` +
			`  <input type="text" _="bind ^search and my value" />` +
			`  <output _="when ^search changes put it into me"></output>` +
			`</div>`
		)
		await find('input').fill('hello')
		await expect.poll(() => find('output').textContent()).toBe('hello')
	})

	test('derived ^var chains reactively', async ({html, find}) => {
		await html(
			`<div _="init set ^price to 10 then set ^qty to 2 then set ^total to 20">` +
			`  <span _="when ^price changes set ^total to (^price * ^qty)"></span>` +
			`  <span _="when ^qty changes set ^total to (^price * ^qty)"></span>` +
			`  <output _="when ^total changes put it into me"></output>` +
			`  <button id="price-btn" _="on click set ^price to 25">set price</button>` +
			`  <button id="qty-btn" _="on click set ^qty to 5">set qty</button>` +
			`</div>`
		)
		await expect.poll(() => find('output').textContent()).toBe('20')
		await find('#price-btn').click()
		await expect.poll(() => find('output').textContent()).toBe('50')
		await find('#qty-btn').click()
		await expect.poll(() => find('output').textContent()).toBe('125')
	})

	test('effect stops when element is removed', async ({html, find, evaluate}) => {
		await html(
			`<div _="init set ^msg to 'hello'">` +
			`  <output _="when ^msg changes put it into me"></output>` +
			`  <button _="on click set ^msg to 'updated'">update</button>` +
			`</div>`
		)
		await expect(find('output')).toHaveText('hello')
		await evaluate(() => document.querySelector('#work-area output').remove())
		await find('button').click()
		// Output was removed — no error, effect is disposed
		await new Promise(r => setTimeout(r, 100))
	})

	test('dedup prevents re-fire on same ^var value', async ({html, find}) => {
		await html(
			`<div _="init set ^val to 'same'">` +
			`  <output _="when ^val changes increment :runs then put :runs into me"></output>` +
			`  <button _="on click set ^val to 'same'">same</button>` +
			`  <button id="diff" _="on click set ^val to 'different'">diff</button>` +
			`</div>`
		)
		await expect(find('output')).toHaveText('1')
		await find('button:text("same")').click()
		await new Promise(r => setTimeout(r, 100))
		await expect(find('output')).toHaveText('1')
		await find('#diff').click()
		await expect(find('output')).toHaveText('2')
	})

})
