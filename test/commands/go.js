import {test, expect} from '../fixtures.js'

test.describe("the go command", () => {

	test("can parse go to with string URL", async ({html, find}) => {
		// verify parsing succeeds - go to with a quoted string
		await html("<div _='on click go to \"#test-hash\"'></div>");
		// no error on parse = success
	});

	test("deprecated url keyword still parses", async ({html, find}) => {
		await html("<div _='on click go to url /test'></div>");
		// no error on parse = success
	});

	test("go to naked URL starting with / parses", async ({html, find}) => {
		await html("<div _='on click go to /test/path'></div>");
		// no error on parse = success
	});

	test("go to element scrolls", async ({html, find, evaluate}) => {
		await html(
			"<div style='height: 2000px'></div>" +
			"<div id='target'>Target</div>" +
			"<div _='on click go to #target'></div>"
		);
		await find('div:nth-of-type(3)').dispatchEvent('click');
		var inView = await evaluate(() => {
			var rect = document.querySelector('#target').getBoundingClientRect();
			return rect.top >= 0 && rect.top < window.innerHeight;
		});
		expect(inView).toBe(true);
	});

	test("deprecated scroll form still works", async ({html, find, evaluate}) => {
		await html(
			"<div style='height: 2000px'></div>" +
			"<div id='target'>Target</div>" +
			"<div _='on click go to the top of #target'></div>"
		);
		await find('div:nth-of-type(3)').dispatchEvent('click');
		var inView = await evaluate(() => {
			var rect = document.querySelector('#target').getBoundingClientRect();
			return rect.top >= 0 && rect.top < window.innerHeight;
		});
		expect(inView).toBe(true);
	});
});
