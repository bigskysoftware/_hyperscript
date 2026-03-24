import {test, expect} from '../fixtures.js'

test.describe("the throw command", () => {

	test("can throw a basic exception", async ({html, find, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>def foo() throw \"foo\" end</script>"
		);
		const result = await evaluate(() => {
			try { foo(); return "no throw"; } catch (e) { return e; }
		});
		expect(result).toBe("foo");
	});

	test("can throw an async exception", async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>def foo() wait 2ms throw \"foo\" end</script>"
		);
		const result = await evaluate(() => foo().catch(e => e));
		expect(result).toBe("foo");
	});

	test("async exceptions propagate properly", async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"def foo() wait 2ms throw \"foo\" end " +
				"def bar() call foo() end" +
				"</script>"
		);
		const result = await evaluate(() => bar().catch(e => e));
		expect(result).toBe("foo");
	});

	test("async exceptions as throws propagate properly", async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>def foo() wait 2ms call bar() end</script>"
		);
		await evaluate(() => {
			window.bar = function () { throw "foo"; };
		});
		const result = await evaluate(() => foo().catch(e => e));
		expect(result).toBe("foo");
	});

	test("can throw inside an event handler", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click throw \"foo\" then" +
				'                                          put "bar" into my.innerHTML\'></div>'
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("");
	});

	test("can respond to exceptions in an event handler with an event handler", async ({html, find}) => {
		await html(
			'<div id=\'d1\' _=\'on click throw "foo" then put "bar" into my.innerHTML end' +
				"                                 on exception(error) put error into my.innerHTML end '></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});

	test("can respond to async exceptions in an event handler with an event handler", async ({html, find}) => {
		await html(
			'<div id=\'d1\' _=\'on click wait 2ms then throw "foo" then put "bar" into my.innerHTML end' +
				"                                 on exception(error) put error into my.innerHTML end '></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});
});
