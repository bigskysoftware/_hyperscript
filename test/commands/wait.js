import {test, expect} from '../fixtures.js'

test.describe("the wait command", () => {

	test("can wait on time", async ({html, find}) => {
		await html(
			"<div _='on click " +
				"                             add .foo then " +
				"                             wait 20ms then " +
				"                             add .bar'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).toHaveClass(/bar/);
	});

	test("can wait on event", async ({html, find, evaluate}) => {
		await html(
			"<div _='on click " +
				"                             add .foo then " +
				"                             wait for foo then " +
				"                             add .bar'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).not.toHaveClass(/bar/);
		await evaluate(() => document.querySelector('#work-area div').dispatchEvent(new CustomEvent("foo")));
		await expect(find('div')).toHaveClass(/bar/);
	});

	test("waiting on an event sets 'it' to the event", async ({html, find, evaluate}) => {
		await html("<div _='on click wait for foo " + "        then put its.detail into me'></div>");
		await find('div').dispatchEvent('click');
		await evaluate(() => document.querySelector('#work-area div').dispatchEvent(new CustomEvent("foo", { detail: "hyperscript is hyper cool" })));
		await expect(find('div')).toHaveText("hyperscript is hyper cool");
	});

	test("can destructure properties in a wait", async ({html, find, evaluate}) => {
		await html("<div _='on click wait for foo(bar) " + "        then put bar into me'></div>");
		await find('div').dispatchEvent('click');
		await evaluate(() => document.querySelector('#work-area div').dispatchEvent(new CustomEvent("foo", { detail: { bar: "bar" } })));
		await expect(find('div')).toHaveText("bar");
	});

	test("can wait on event on another element", async ({html, find, evaluate}) => {
		await html("<div id='d2'></div>" +
			"<div _='on click " +
				"                             add .foo then " +
				"                             wait for foo from #d2 then " +
				"                             add .bar'></div>"
		);
		await find('div:nth-of-type(2)').dispatchEvent('click');
		await expect(find('div:nth-of-type(2)')).toHaveClass(/foo/);
		await expect(find('div:nth-of-type(2)')).not.toHaveClass(/bar/);
		await evaluate(() => document.querySelector('#d2').dispatchEvent(new CustomEvent("foo")));
		await expect(find('div:nth-of-type(2)')).toHaveClass(/bar/);
	});

	test("can wait on event or timeout 1", async ({html, find}) => {
		await html(
			"<div _='on click " +
				"                             add .foo then " +
				"                             wait for foo or 0ms then " +
				"                             add .bar'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).toHaveClass(/bar/);
	});

	test("can wait on event or timeout 2", async ({html, find}) => {
		await html(
			"<div _='on click " +
				"                             add .foo then " +
				"                             wait for foo or 0ms then " +
				"                             add .bar'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).toHaveClass(/bar/);
	});
});
