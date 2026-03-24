import {test, expect} from '../fixtures.js'

test.describe("the call command", () => {

	test("can call javascript instance functions", async ({html, find, evaluate}) => {
		await html(
			"<div id='d1' _='on click call document.getElementById(\"d1\") then" +
				"                                          put it into window.results'></div>"
		);
		await find('#d1').dispatchEvent('click');
		const match = await evaluate(() => window.results === document.querySelector('#d1'));
		expect(match).toBe(true);
	});

	test("can call global javascript functions", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.calledWith = null;
			window.globalFunction = function (val) { window.calledWith = val; };
		});
		await html("<div _='on click call globalFunction(\"foo\")'></div>");
		await find('div').dispatchEvent('click');
		expect(await evaluate(() => window.calledWith)).toBe("foo");
	});

	test("can call no argument functions", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.called = false;
			window.globalFunction = function () { window.called = true; };
		});
		await html("<div _='on click call globalFunction()'></div>");
		await find('div').dispatchEvent('click');
		expect(await evaluate(() => window.called)).toBe(true);
	});

	test("can call functions w/ underscores", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.called = false;
			window.global_function = function () { window.called = true; };
		});
		await html("<div _='on click call global_function()'></div>");
		await find('div').dispatchEvent('click');
		expect(await evaluate(() => window.called)).toBe(true);
	});

	test("can call functions w/ dollar signs", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.called = false;
			window.$ = function () { window.called = true; };
		});
		await html("<div _='on click call $()'></div>");
		await find('div').dispatchEvent('click');
		expect(await evaluate(() => window.called)).toBe(true);
	});

	test("call functions that return promises are waited on", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.promiseAnInt = function () {
				return new Promise(function (finish) {
					window.finish = finish;
				});
			};
		});
		await html("<div _='on click call promiseAnInt() then put it into my.innerHTML'></div>");
		await find('div').dispatchEvent('click');
		await evaluate(() => window.finish(42));
		await expect(find('div')).toHaveText("42");
	});
});
