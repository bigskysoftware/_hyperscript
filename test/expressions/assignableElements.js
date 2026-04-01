import {test, expect} from '../fixtures.js'

test.describe("assignable element expressions", () => {

	test("set #id replaces element with HTML string", async ({html, find, evaluate}) => {
		await html(
			"<div id='target'>old</div>" +
			"<button _='on click set #target to \"<span id=target>new</span>\"'>go</button>"
		);
		await find('button').dispatchEvent('click');
		await expect(find('#target')).toHaveText("new");
		var tag = await evaluate(() => document.querySelector('#target').tagName);
		expect(tag).toBe("SPAN");
	});

	test("set #id replaces element with another element", async ({html, find, evaluate}) => {
		await html(
			"<div id='target'>old</div>" +
			"<button _='on click make a <span.replaced/> then put \"moved\" into it then set #target to it'>go</button>"
		);
		await find('button').dispatchEvent('click');
		var text = await evaluate(() => document.querySelector('.replaced').textContent);
		expect(text).toBe("moved");
		var gone = await evaluate(() => document.querySelector('#target'));
		expect(gone).toBeNull();
	});

	test("set .class replaces all matching elements", async ({html, find, evaluate}) => {
		await html(
			"<ul id='list'>" +
			"  <li class='item'>a</li>" +
			"  <li class='item'>b</li>" +
			"  <li class='item'>c</li>" +
			"</ul>" +
			"<button _='on click set .item to \"<li class=item>replaced</li>\"'>go</button>"
		);
		await find('button').dispatchEvent('click');
		var count = await evaluate(() => document.querySelectorAll('.item').length);
		expect(count).toBe(3);
		var texts = await evaluate(() => Array.from(document.querySelectorAll('.item')).map(e => e.textContent));
		expect(texts).toEqual(["replaced", "replaced", "replaced"]);
	});

	test("set <query/> replaces all matching elements", async ({html, find, evaluate}) => {
		await html(
			"<div id='box'>" +
			"  <p>one</p>" +
			"  <p>two</p>" +
			"</div>" +
			"<button _='on click set <p/> in #box to \"<p>done</p>\"'>go</button>"
		);
		await find('button').dispatchEvent('click');
		var texts = await evaluate(() => Array.from(document.querySelectorAll('#box p')).map(e => e.textContent));
		expect(texts).toEqual(["done", "done"]);
	});

	test("set closest replaces ancestor", async ({html, find, evaluate}) => {
		await html(
			"<div class='wrapper'><button _='on click set (closest <div/>) to \"<div class=wrapper>replaced</div>\"'>go</button></div>"
		);
		await find('button').dispatchEvent('click');
		await expect(find('.wrapper')).toHaveText("replaced");
	});

	test("hyperscript in replacement content is initialized", async ({html, find, evaluate}) => {
		await html(
			"<div id='target'>old</div>" +
			"<button id='go' _=\"on click set #target to '<div id=target _=&#34;on click put `clicked` into me&#34;>new</div>'\">go</button>"
		);
		await find('#go').dispatchEvent('click');
		await expect(find('#target')).toHaveText("new");
		await find('#target').dispatchEvent('click');
		await expect(find('#target')).toHaveText("clicked");
	});

	test("swap #a with #b swaps DOM positions", async ({html, find, evaluate}) => {
		await html(
			"<div id='container'>" +
			"  <div id='a'>A</div>" +
			"  <div id='b'>B</div>" +
			"</div>" +
			"<button _='on click swap #a with #b'>go</button>"
		);
		await find('button').dispatchEvent('click');
		var order = await evaluate(() =>
			Array.from(document.querySelector('#container').children).map(e => e.textContent.trim())
		);
		expect(order).toEqual(["B", "A"]);
	});

	test("put into still works as innerHTML", async ({html, find}) => {
		await html(
			"<div id='target'>old</div>" +
			"<button _='on click put \"new\" into #target'>go</button>"
		);
		await find('button').dispatchEvent('click');
		await expect(find('#target')).toHaveText("new");
	});

});
