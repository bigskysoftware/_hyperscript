import {test, expect} from '../fixtures.js'

test.describe("the morph command", () => {

	test("basic morph updates content", async ({html, find}) => {
		await html(
			"<div id='target'>old</div>" +
			"<button _='on click morph #target to \"<div id=target>new</div>\"'>go</button>"
		);
		await find('button').dispatchEvent('click');
		await expect(find('#target')).toHaveText("new");
	});

	test("morph preserves element identity", async ({html, find, evaluate}) => {
		await html(
			"<div id='target'>old</div>" +
			"<button id='go' _='on click morph #target to \"<div id=target>new</div>\"'>go</button>"
		);
		// Save a reference before morphing
		await evaluate(() => { window._savedRef = document.querySelector('#target'); });
		await find('#go').dispatchEvent('click');
		await expect(find('#target')).toHaveText("new");
		var same = await evaluate(() => document.querySelector('#target') === window._savedRef);
		expect(same).toBe(true);
	});

	test("morph updates attributes", async ({html, find, evaluate}) => {
		await html(
			"<div id='target' class='old'>content</div>" +
			"<button _='on click morph #target to \"<div id=target class=new>content</div>\"'>go</button>"
		);
		await find('button').dispatchEvent('click');
		await expect(find('#target')).toHaveClass("new");
	});

	test("morph adds new children", async ({html, find, evaluate}) => {
		await html(
			"<div id='target'><span>first</span></div>" +
			"<button id='go' _=\"on click morph #target to '<div id=target><span>first</span><span>second</span></div>'\">go</button>"
		);
		await find('#go').dispatchEvent('click');
		var count = await evaluate(() => document.querySelectorAll('#target span').length);
		expect(count).toBe(2);
	});

	test("morph removes old children", async ({html, find, evaluate}) => {
		await html(
			"<div id='target'><span>first</span><span>second</span></div>" +
			"<button id='go' _=\"on click morph #target to '<div id=target><span>first</span></div>'\">go</button>"
		);
		await find('#go').dispatchEvent('click');
		var count = await evaluate(() => document.querySelectorAll('#target span').length);
		expect(count).toBe(1);
	});

	test("morph initializes hyperscript on new elements", async ({html, find, evaluate}) => {
		await html(
			"<div id='target'><p>old</p></div>" +
			"<button id='go' _=\"on click morph #target to '<div id=target><p id=inner _=&#34;on click put `clicked` into me&#34;>new</p></div>'\">go</button>"
		);
		await find('#go').dispatchEvent('click');
		await expect(find('#inner')).toHaveText("new");
		await find('#inner').dispatchEvent('click');
		await expect(find('#inner')).toHaveText("clicked");
	});

	test("morph cleans up removed hyperscript elements", async ({html, find, evaluate}) => {
		await html(
			"<div id='target'>" +
			"  <div id='child' _='on click put \"alive\" into me'>child</div>" +
			"</div>" +
			"<button _='on click morph #target to \"<div id=target><p>replaced</p></div>\"'>go</button>"
		);
		await find('button').dispatchEvent('click');
		var gone = await evaluate(() => document.querySelector('#child'));
		expect(gone).toBeNull();
	});

	test("morph reorders children by id", async ({html, find, evaluate}) => {
		await html(
			"<div id='target'>" +
			"  <div id='a'>A</div>" +
			"  <div id='b'>B</div>" +
			"</div>" +
			"<button _='on click morph #target to \"<div id=target><div id=b>B2</div><div id=a>A2</div></div>\"'>go</button>"
		);
		await find('button').dispatchEvent('click');
		var order = await evaluate(() =>
			Array.from(document.querySelectorAll('#target > div')).map(e => e.id)
		);
		expect(order).toEqual(["b", "a"]);
	});

	test("morph preserves matched child identity", async ({html, find, evaluate}) => {
		await html(
			"<div id='target'><div id='child'>old</div></div>" +
			"<button id='go' _='on click morph #target to \"<div id=target><div id=child>new</div></div>\"'>go</button>"
		);
		await evaluate(() => { window._savedChild = document.querySelector('#child'); });
		await find('#go').dispatchEvent('click');
		var result = await evaluate(() => ({
			same: document.querySelector('#child') === window._savedChild,
			text: document.querySelector('#child').textContent
		}));
		expect(result.same).toBe(true);
		expect(result.text).toBe("new");
	});

	test("morph with variable content", async ({html, find, evaluate}) => {
		await html(
			"<div id='target'>original</div>" +
			"<button id='go' _='on click set content to \"<div id=target>morphed</div>\" then morph #target to content'>go</button>"
		);
		await find('#go').dispatchEvent('click');
		await expect(find('#target')).toHaveText("morphed");
	});
});
