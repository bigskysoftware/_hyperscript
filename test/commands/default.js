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
});
