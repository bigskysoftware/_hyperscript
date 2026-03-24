import {test, expect} from '../fixtures.js'

test.describe("pseudoCommands", () => {

	test("Basic instance function with expression", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' _='on click getElementById(\"d1\") from the document " +
				"                                          put the result into window.results'></div>"
		);
		await find('#d1').dispatchEvent('click');
		const match = await evaluate(() => window.results === document.querySelector('#d1'));
		expect(match).toBe(true);
	});

	test("Basic instance function with expression and with", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' _='on click getElementById(\"d1\") with the document " +
				"                                          put result into window.results'></div>"
		);
		await find('#d1').dispatchEvent('click');
		const match = await evaluate(() => window.results === document.querySelector('#d1'));
		expect(match).toBe(true);
	});

	test("Basic instance function with expression and on", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' _='on click getElementById(\"d1\") on the document " +
				"                                          put result into window.results'></div>"
		);
		await find('#d1').dispatchEvent('click');
		const match = await evaluate(() => window.results === document.querySelector('#d1'));
		expect(match).toBe(true);
	});

	test("Basic instance function with me target", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' _='on click foo() on me " +
				"                                          put result into my bar'></div>"
		);
		await evaluate(() => {
			document.querySelector('#d1').foo = function () { return "foo"; };
		});
		await find('#d1').dispatchEvent('click');
		const bar = await evaluate(() => document.querySelector('#d1').bar);
		expect(bar).toBe("foo");
	});

	test("Can use functions defined outside of the current element", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.foo = function() { return "foo"; };
		});
		await html(
			"<div id='d1' _='on click foo() then" +
				"                                          put result into my bar'></div>"
		);
		await find('#d1').dispatchEvent('click');
		const bar = await evaluate(() => document.querySelector('#d1').bar);
		expect(bar).toBe("foo");
	});

	test("Basic instance function with me target no preposition", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' _='on click foo() me " +
			"                                          put result into my bar'></div>"
		);
		await evaluate(() => {
			document.querySelector('#d1').foo = function () { return "foo"; };
		});
		await find('#d1').dispatchEvent('click');
		const bar = await evaluate(() => document.querySelector('#d1').bar);
		expect(bar).toBe("foo");
	});

	test("functions defined alongside can be invoked", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' _='def foo() return \"foo\" end on click foo() then put result into my bar'></div>"
		);
		await find('#d1').dispatchEvent('click');
		const bar = await evaluate(() => document.querySelector('#d1').bar);
		expect(bar).toBe("foo");
	});

	test("Can use indirect functions with a symbol root", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.bar = { foo: function() { return "foo"; } };
		});
		await html(
			"<div id='d1' _='on click bar.foo() then" +
			"                                          put the result into my bar'></div>"
		);
		await find('#d1').dispatchEvent('click');
		const bar = await evaluate(() => document.querySelector('#d1').bar);
		expect(bar).toBe("foo");
	});

	test("Can use indirect functions with a function root", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.bar = function() {
				return { foo: function() { return "foo"; } };
			};
		});
		await html(
			"<div id='d1' _='on click bar().foo() then" +
			"                                          put the result into my bar'></div>"
		);
		await find('#d1').dispatchEvent('click');
		const bar = await evaluate(() => document.querySelector('#d1').bar);
		expect(bar).toBe("foo");
	});

	test("Can use nested indirect functions with a symbol root", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.bar = function() {
				return { foo: function() { return "foo"; } };
			};
		});
		await html(
			"<div id='d1' _='on click window.bar().foo() then" +
			"                                          put the result into my bar'></div>"
		);
		await find('#d1').dispatchEvent('click');
		const bar = await evaluate(() => document.querySelector('#d1').bar);
		expect(bar).toBe("foo");
	});

	test("non-function pseudo-command is an error", async ({error}) => {
		const msg = await error("on click log me then foo.bar + bar");
		expect(msg).toMatch(/^Pseudo-commands must be function calls/);
	});

});
