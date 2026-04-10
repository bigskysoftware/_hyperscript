import {test, expect} from '../fixtures.js'

test.describe("scoping", () => {

	test("locally scoped variables work", async ({html, find}) => {
		await html("<div id='d1' _='on click set x to 10 then set @out to x'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '10');
	});

	test("locally scoped variables don't clash with built-in variables", async ({html, find}) => {
		await html("<div id='d1' _='on click repeat for meta in [1, 2, 3] set @out to meta end'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '[object Object]');
	});

	test("locally scoped variables do not span features", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' _='on click 1 set x to 10 " +
			"                       on click 2 set @out to x'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		const attr = await evaluate(() => document.querySelector('#d1').getAttribute("out"));
		expect(attr).toBeNull();
	});

	test("element scoped variables work", async ({html, find}) => {
		await html("<div id='d1' _='on click set element x to 10 then set @out to x'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '10');
	});

	test("element scoped variables work w/short syntax", async ({html, find}) => {
		await html("<div id='d1' _='on click set :x to 10 then set @out to :x'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '10');
	});

	test("element scoped variables support pseudo-possessive syntax", async ({html, find}) => {
		await html(
			'<div id="d1" _="on click set the element\'s x to 10 then set @out to the element\'s x"></div>'
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '10');
	});

	test("element scoped variables span features", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click 1 set element x to 10 " +
			"                       on click 2 set @out to x'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '10');
	});

	test("element scoped variables span features w/short syntax", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click 1 set :x to 10 " +
			"                       on click 2 set @out to :x'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '10');
	});

	test("element scoped variables are local only to element", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' _='on click set element x to 10'>" +
			"         <div id='d2' _='on click set @out to x'>" +
			"       </div>"
		);
		await find('#d1').dispatchEvent('click');
		await find('#d2').dispatchEvent('click');
		const out1 = await evaluate(() => document.querySelector('#d1').getAttribute("out"));
		const out2 = await evaluate(() => document.querySelector('#d2').getAttribute("out"));
		expect(out1).toBeNull();
		expect(out2).toBeNull();
	});

	test("global scoped variables work", async ({html, find}) => {
		await html("<div id='d1' _='on click set global x to 10 then set @out to x'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '10');
	});

	test("global scoped variables work w/ short syntax", async ({html, find}) => {
		await html("<div id='d1' _='on click set $x to 10 then set @out to $x'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '10');
	});

	test("setting an element scoped variable spans features", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click 1 default element x to 0" +
			"                       on click 2 set element x to 10 " +
			"                       on click 3 set @out to x'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '10');
	});

	test("setting a global scoped variable spans features", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click 1 default global x to 0" +
			"                       on click 2 set global x to 10 " +
			"                       on click 3 set @out to x'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '10');
	});

	test("basic behavior scoping works", async ({html, find}) => {
		await html(
			"<script type=text/hyperscript>" +
			"behavior Behave(foo) on click set @out to foo" +
			"</script>" +
			"<div id='d1' _='install Behave(foo:10)'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '10');
	});

	test("behavior scoping is at the element level", async ({html, find}) => {
		await html(
			"<script type=text/hyperscript>" +
			"behavior Behave(foo) " +
			"  on click 1 set foo to foo + 10" +
			"  on click 2 set @out to foo" +
			"</script>" +
			"<div id='d1' _='install Behave(foo:10)'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '20');
	});

	test("behavior scoping is isolated from the core element scope", async ({html, find}) => {
		await html(
			"<script type=text/hyperscript>" +
			"behavior Behave(foo) " +
			"  on click 1 set foo to foo + 10" +
			"  on click 3 set @out to foo" +
			"</script>" +
			"<div id='d1' _='install Behave(foo:10) on click 2 set element foo to 1 on click 4 set @out2 to foo'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '20');
		await expect(find('#d1')).toHaveAttribute('out2', '1');
	});

	test("behavior scoping is isolated from other behaviors", async ({html, find}) => {
		await html(
			"<script type=text/hyperscript>" +
			"behavior Behave(foo) " +
			"  on click 1 set foo to foo + 10" +
			"  on click 3 set @out to foo" +
			" behavior BehaveTwo(foo) " +
			"  on click 2 set element foo to 1 " +
			"  on click 4 set @out2 to foo" +
			"</script>" +
			"<div id='d1' _='install Behave(foo:10) install BehaveTwo(foo:42)'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '20');
		await expect(find('#d1')).toHaveAttribute('out2', '1');
	});

	test("variables are hoisted", async ({html, find}) => {
		await html("<div id='d1' _='on click if true set foo to 10 end set @out to foo'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '10');
	});

	test("global scoped variables span features", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click 1 set $x to 10 " +
			"                       on click 2 set @out to $x'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '10');
	});

	test("set favors local variables over global variables", async ({html, find, evaluate}) => {
		await evaluate(() => window.foo = 12);
		await html("<div id='d1' _='on click 1 set foo to 20 then set @out to foo'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveAttribute('out', '20');
		expect(await evaluate(() => window.foo)).toBe(12);
	});

});
