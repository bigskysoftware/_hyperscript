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

	test("can support parenthesized commands and features", async ({html, find}) => {
		await html(
			"<div _='(on click (log me) (trigger foo))" +
				'                (on foo (put "clicked" into my.innerHTML))\'></div>'
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("clicked");
	});

	// ----- Error recovery tests -----

	test("recovers across feature boundaries and reports all errors", async ({html, evaluate}) => {
		await html(
			"<div id='d1' _='on click blargh end on mouseenter put \"hovered\" into my.innerHTML'></div>"
		);
		// Element should not execute at all (no features installed)
		var powered = await evaluate(() => document.querySelector('#d1').hasAttribute('data-hyperscript-powered'));
		expect(powered).toBe(false);
	});

	test("recovers across multiple feature errors", async ({html, evaluate}) => {
		await html(
			"<div id='d1' _='on click blargh end on mouseenter also_bad end on focus put \"focused\" into my.innerHTML'></div>"
		);
		// Element should not execute — errors prevent all features
		var powered = await evaluate(() => document.querySelector('#d1').hasAttribute('data-hyperscript-powered'));
		expect(powered).toBe(false);
	});

	test("fires hyperscript:parse-error event with all errors", async ({evaluate}) => {
		var errorCount = await evaluate(() => {
			var div = document.createElement('div');
			div.setAttribute('_', 'on click blargh end on mouseenter also_bad');
			var count = 0;
			div.addEventListener('hyperscript:parse-error', (e) => {
				count = e.detail.errors.length;
			});
			document.body.appendChild(div);
			_hyperscript.processNode(div);
			return count;
		});
		expect(errorCount).toBe(2);
	});

	test("element-level isolation still works with error recovery", async ({html, find}) => {
		await html(
			"<div>" +
				"<div id='d1' _='on click blargh end on mouseenter also_bad'></div>" +
				"<div id='d2' _='on click put \"clicked\" into my.innerHTML'></div>" +
			"</div>"
		);
		await find('#d2').dispatchEvent('click');
		await expect(find('#d2')).toHaveText("clicked");
	});

	test("_hyperscript() evaluate API still throws on first error", async ({error}) => {
		var msg = await error("add - to");
		expect(msg).toMatch(/^Expected either a class reference or attribute expression/);
	});

	test("parse error at EOF on trailing newline does not crash", async ({evaluate}) => {
		// source ending with \n means last line is empty; EOF token has no .line
		var result = await evaluate((src) => {
			try {
				_hyperscript(src);
				return "no-error";
			} catch (e) {
				if (e instanceof RangeError) return "RangeError: " + e.message;
				return "ok: " + typeof e.message;
			}
		}, "set x to\n");
		expect(result).toMatch(/^ok:/);
	});
});
