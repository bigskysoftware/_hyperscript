import {test, expect} from '../fixtures.js'

test.describe("the _hyperscript parser", () => {

	test("basic parse error messages work", async ({error}) => {
		var msg = await error("add - to");
		expect(msg).toMatch(/^Expected either a class reference or attribute expression/);
	});

	test("continues initializing elements in the presence of a parse error", async ({html, find}) => {
		await html(
			"<div>" +
				"<div id='d1' _='on click bad'></div>" +
				"<div id='d2' _='on click put \"clicked\" into my.innerHTML'></div>" +
				"</div>"
		);
		await find('#d2').dispatchEvent('click');
		await expect(find('#d2')).toHaveText("clicked");
	});

	test("can have comments in scripts", async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"-- this is a comment\n" +
				"def foo() -- this is another comment\n" +
				'  return "foo"\n' +
				"end -- end with a comment" +
				"--- this is a comment\n" +
				"----this is a comment----\n" +
				"def bar() ---this is another comment\n" +
				'  return "bar"\n' +
				"end --- end with a comment" +
				"</script>"
		);
		expect(await evaluate(() => foo())).toBe("foo");
		expect(await evaluate(() => bar())).toBe("bar");
	});

	test("can have comments in attributes", async ({html, find}) => {
		await html(
			"<div _='on click put \"clicked\" into my.innerHTML -- put some content into the div...'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("clicked");
	});

	test("can have comments in attributes (triple dash)", async ({html, find}) => {
		await html(
			"<div _='on click put \"clicked\" into my.innerHTML ---put some content into the div...'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("clicked");
	});

	test("can have alternate comments in scripts", async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"// this is a comment\n" +
				"def foo() // this is another comment\n" +
				'  return "foo"\n' +
				"end // end with a comment" +
				"</script>"
		);
		expect(await evaluate(() => foo())).toBe("foo");
	});

	test("can have alternate comments in attributes", async ({html, find}) => {
		await html(
			"<div _='on click put \"clicked\" into my.innerHTML // put some content into the div...'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("clicked");
	});

	test("can have alternate multiline comments in scripts", async ({html, evaluate}) => {
		await html(
			"<script type='text/hyperscript'>" +
				"/* this is a comment\n" +
				"this is still a comment */\n" +
				"def foo() /* this is another comment */\n" +
				'  return "foo"\n' +
				"end /* end with a multiline comment \n */" +
				"</script>"
		);
		expect(await evaluate(() => foo())).toBe("foo");
	});

	test("can have multiline comments in attributes", async ({html, find}) => {
		await html(
			"<div _='on click put \"clicked\" into my.innerHTML /* put some content\n into the div... */'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("clicked");
	});

	test("can support parenthesized commands and features", async ({html, find}) => {
		await html(
			"<div _='(on click (log me) (trigger foo))" +
				'                (on foo (put "clicked" into my.innerHTML))\'></div>'
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("clicked");
	});
});
