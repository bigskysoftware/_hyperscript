import {test, expect} from '../fixtures.js'

test.describe("_hyperscript regressions", () => {

	test("can pick detail fields out by name", async ({html, find, evaluate}) => {
		await html("<div id='d1'></div>" +
			"<input debug='true' _='on onchange if my.value !== \"\" then trigger customEvt end end " +
				"on customEvt log event then put my.value into #d1.innerHTML'/>"
		);
		await evaluate(() => {
			const input = document.querySelector('#work-area input');
			input.value = "foo";
			input.dispatchEvent(new Event("onchange"));
			input.value = "";
			input.dispatchEvent(new Event("onchange"));
		});
		await expect(find('#d1')).toHaveText("foo");
		await evaluate(() => {
			const input = document.querySelector('#work-area input');
			input.value = "bar";
			input.dispatchEvent(new Event("onchange"));
		});
		await expect(find('#d1')).toHaveText("bar");
	});

	test("can trigger htmx events", async ({html, find}) => {
		await html("<div id='div1' _='on htmx:foo put \"foo\" into my.innerHTML'></div>" +
			"<div _='on click send htmx:foo to #div1'></div>");
		await find('div:nth-of-type(2)').dispatchEvent('click');
		await expect(find('#div1')).toHaveText("foo");
	});

	test("can remove class by id", async ({html, find}) => {
		await html("<form class='hideme' id='email-form'></form>" +
			"<div _='on click remove .hideme from #email-form'></div>");
		await expect(find('#email-form')).toHaveClass(/hideme/);
		await find('div').dispatchEvent('click');
		await expect(find('#email-form')).not.toHaveClass(/hideme/);
	});

	test("can remove by clicks elsewhere", async ({html, find, evaluate}) => {
		await html("<div id='target' _='on click elsewhere remove me'></div><div id='other'></div>");
		await evaluate(() => document.querySelector('#other').click());
		await expect(find('#target')).toHaveCount(0);
	});

	test("me and it is properly set when responding to events", async ({html, find, evaluate}) => {
		await html("<div id='name'></div>" +
			"<div _='on click from #name set window.me to me set window.it to it'></div>");
		await find('#name').dispatchEvent('click');
		const meMatch = await evaluate(() => window.me === document.querySelector('#work-area div:nth-of-type(2)'));
		expect(meMatch).toBe(true);
		const itMatch = await evaluate(() => window.it === document.querySelector('#name'));
		expect(itMatch).toBe(true);
	});

	test("me symbol works in from expressions", async ({html, find}) => {
		await html(
			"<div>" + "<div id='d1' _='on click from closest parent <div/> put \"Foo\" into me'></div>" + "</div>"
		);
		await expect(find('#d1')).toHaveText("");
		await find('div').first().dispatchEvent('click');
		await expect(find('#d1')).toHaveText("Foo");
	});

	test("can refer to function in init blocks", async ({html, find}) => {
		await html(
			"<script type='text/hyperscript'>" +
			"  init " +
			"    call foo() " +
			"  end " +
			"  def foo() " +
			"    put \"here\" into #d1's innerHTML " +
			"  end</script> " +
			"<div id='d1'></div>"
		);
		await expect(find('#d1')).toHaveText("here");
	});

	test("can create a paragraph tag", async ({html, find}) => {
		await html("<input id='i1' value='foo'>" +
			"<div id='d2'></div>" +
			"<div _='on click make a <p/>  put #i1.value into its textContent put it.outerHTML at end of #d2'></div>");
		await find('div:nth-of-type(2)').dispatchEvent('click');
		await expect(find('#d2')).toContainText("foo");
	});

	test("async exception", async ({html, find}) => {
		await html("<div _='on click async transition opacity to 0 log \"hello!\"'></div>");
		await find('div').dispatchEvent('click');
	});

	test("return followed by boundary returns an error", async ({error}) => {
		var msg = await error("return end");
		expect(msg).toMatch(/^'return' commands must return a value/);
	});

	test("extra chars cause error when evaling", async ({error}) => {
		var msg = await error("1!");
		expect(msg).toMatch(/^Unexpected Token : !/);

		msg = await error("return 1!");
		expect(msg).toMatch(/^Unexpected Token : !/);

		msg = await error("init set x to 1!");
		expect(msg).toMatch(/^Unexpected Token : !/);
	});

	test("string literals can dot-invoked against", async ({run}) => {
		expect(await run("'foo'.length")).toBe(3);
		expect(await run("`foo`.length")).toBe(3);
		expect(await run("\"foo\".length")).toBe(3);
	});

	test("button query in form", async ({html, find, evaluate}) => {
		await html("<form _='on click get the <button/> in me then" +
			"                                   set it @disabled to true'>" +
			"  <button id='b1'>Button</button>" +
			"</form>");
		await find('form').dispatchEvent('click');
		const disabled = await evaluate(() => document.querySelector('#b1').disabled);
		expect(disabled).toBe(true);
	});

	test("can invoke functions w/ numbers in name", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.select2 = function(){ return "select2"; };
		});
		await html("<button _='on click put select2() into me'/>");
		await find('button').dispatchEvent('click');
		await expect(find('button')).toHaveText("select2");
	});

	test("properly interpolates values", async ({html, find}) => {
		await html("<button _='on click" +
			"                        set count to 1 " +
			"                        set optName to `options_${count}_value`" +
			"                        put optName into me'></button>");
		await find('button').dispatchEvent('click');
		await expect(find('button')).toHaveText("options_1_value");
	});

	test("properly interpolates values 2", async ({html, find}) => {
		await html("<button _='on click" +
			"                        set trackingcode to `AB123456789KK` " +
			"                        set pdfurl to `https://yyy.xxxxxx.com/path/out/${trackingcode}.pdf`" +
			"                        put pdfurl into me'></button>");
		await find('button').dispatchEvent('click');
		await expect(find('button')).toHaveText("https://yyy.xxxxxx.com/path/out/AB123456789KK.pdf");
	});

	test("listen for event on form", async ({html, find}) => {
		await html("<form>" +
			"  <button id='b1' _='on click from closest <form/> put \"clicked\" into me'>Button</button>" +
			"</form>");
		await find('form').dispatchEvent('click');
		await expect(find('#b1')).toHaveText("clicked");
	});

});
