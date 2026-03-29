import {test, expect} from '../fixtures.js'

test.describe("the default command", () => {

	test("can default variables", async ({html, find}) => {
		await html("<div id='d1' _='on click default x to \"foo\" then put x into me'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});

	test("can default attributes", async ({html, find}) => {
		await html("<div id='d1' _='on click default @foo to \"foo\" then put @foo into me'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});

	test("can default properties", async ({html, find}) => {
		await html("<div id='d1' _='on click default me.foo to \"foo\" then put me.foo into me'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});

	test("default variables respect existing values", async ({html, find}) => {
		await html("<div id='d1' _='on click set x to \"bar\" then default x to \"foo\" then put x into me'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("bar");
	});

	test("default attributes respect existing values", async ({html, find}) => {
		await html("<div foo='bar' id='d1' _='on click default @foo to \"foo\" then put @foo into me'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("bar");
	});

	test("default properties respect existing values", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click set me.foo to \"bar\" then default me.foo to \"foo\" then put me.foo into me'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("bar");
	});

	test("can default possessive properties", async ({html, find}) => {
		await html(
			"<div id='d1' _=\"on click default #d1's foo to 'bar' then put #d1's foo into me\"></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("bar");
	});

	test("can default of-expression properties", async ({html, find}) => {
		await html(
			"<div id='d1' _=\"on click default foo of me to 'bar' then put my foo into me\"></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("bar");
	});

	test("can default array elements", async ({html, find}) => {
		await html(
			`<div _="on click set arr to [null, null] then default arr[0] to 'yes' then put arr[0] into me"></div>`
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("yes");
	});

	test("default array element respects existing value", async ({html, find}) => {
		await html(
			`<div _="on click set arr to ['existing', null] then default arr[0] to 'new' then put arr[0] into me"></div>`
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("existing");
	});

	test("default preserves zero", async ({html, find}) => {
		await html("<div _='on click set x to 0 then default x to 10 then put x into me'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("0");
	});

	test("default overwrites empty string", async ({html, find}) => {
		await html(`<div _='on click set x to "" then default x to "fallback" then put x into me'></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("fallback");
	});

	test("default preserves false", async ({html, find}) => {
		await html("<div _='on click set x to false then default x to true then put x into me'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("false");
	});

	test("can default style ref when unset", async ({html, find}) => {
		await html(
			`<div _="on click default *background-color to 'red'"></div>`
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('background-color', 'rgb(255, 0, 0)');
	});

	test("default style ref preserves existing value", async ({html, find}) => {
		await html(
			`<div style="color: blue" _="on click default *color to 'red'"></div>`
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(0, 0, 255)');
	});
});
