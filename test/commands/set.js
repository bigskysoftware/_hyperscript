import {test, expect} from '../fixtures.js'

test.describe("the set command", () => {

	test("can set properties", async ({html, find}) => {
		await html("<div id='d1' _='on click set #d1.innerHTML to \"foo\"'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});

	test("can set indirect properties", async ({html, find}) => {
		await html("<div id='d1' _='on click set innerHTML of #d1 to \"foo\"'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});

	test("can set complex indirect properties lhs", async ({html, find}) => {
		await html("<div _='on click set parentNode.innerHTML of #d1 to \"foo\"'><div id='d1'></div></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('div').first()).toHaveText("foo");
	});

	test("can set complex indirect properties rhs", async ({html, find}) => {
		await html("<div _='on click set innerHTML of #d1.parentNode to \"foo\"'><div id='d1'></div></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('div').first()).toHaveText("foo");
	});

	test("can set chained indirect properties", async ({html, find}) => {
		await html(
			"<div _='on click set the innerHTML of the parentNode of #d1 to \"foo\"'><div id='d1'></div></div>"
		);
		await find('div').first().dispatchEvent('click');
		await expect(find('div').first()).toHaveText("foo");
	});

	test("can set styles", async ({html, find}) => {
		await html("<div _='on click set my.style.color to \"red\"'>lolwat</div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can set javascript globals", async ({html, find, evaluate}) => {
		await html("<div _='on click set window.temp to \"red\"'>lolwat</div>");
		await find('div').dispatchEvent('click');
		expect(await evaluate(() => window.temp)).toBe("red");
	});

	test("can set local variables", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click set newVar to \"foo\" then" +
				"                                    put newVar into #d1.innerHTML'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});

	test("can set into id ref", async ({html, find}) => {
		await html("<div id='d1' _='on click set #d1.innerHTML to \"foo\"'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});

	test("can set into class ref", async ({html, find}) => {
		await html("<div class='divs' _='on click set .divs.innerHTML to \"foo\"'></div>" +
			"<div class='divs'></div>");
		await find('.divs').first().dispatchEvent('click');
		await expect(find('.divs').first()).toHaveText("foo");
		await expect(find('.divs').nth(1)).toHaveText("foo");
	});

	test("can set into attribute ref", async ({html, find}) => {
		await html("<div class='divs' _='on click set @bar to \"foo\"'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveAttribute('bar', 'foo');
	});

	test("can set into indirect attribute ref", async ({html, find}) => {
		await html("<div class='divs' _=\"on click set #div2's @bar to 'foo'\"></div>" +
			"<div id='div2'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#div2')).toHaveAttribute('bar', 'foo');
	});

	test("can set into indirect attribute ref 2", async ({html, find}) => {
		await html("<div class='divs' _=\"on click set #div2's @bar to 'foo'\"></div>" +
			"<div id='div2'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#div2')).toHaveAttribute('bar', 'foo');
	});

	test("can set into indirect attribute ref 3", async ({html, find}) => {
		await html("<div class='divs' _=\"on click set @bar of #div2 to 'foo'\"></div>" +
			"<div id='div2'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#div2')).toHaveAttribute('bar', 'foo');
	});

	test("can set into style ref", async ({html, find}) => {
		await html("<div class='divs' _='on click set *color to \"red\"'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can set into indirect style ref", async ({html, find}) => {
		await html("<div class='divs' _=\"on click set #div2's *color to 'red'\"></div>" +
			"<div id='div2'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#div2')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can set into indirect style ref 2", async ({html, find}) => {
		await html("<div class='divs' _=\"on click set #div2's *color to 'red'\"></div>" +
			"<div id='div2'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#div2')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can set into indirect style ref 3", async ({html, find}) => {
		await html("<div class='divs' _=\"on click set *color of #div2 to 'red'\"></div>" +
			"<div id='div2'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#div2')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("set waits on promises", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.promiseAString = function () {
				return new Promise(function (finish) {
					window.finish = finish;
				});
			};
		});
		await html("<div id='d1' _='on click set #d1.innerHTML to promiseAString()'></div>");
		await find('#d1').dispatchEvent('click');
		await evaluate(() => window.finish("foo"));
		await expect(find('#d1')).toHaveText("foo");
	});

	test("can set many properties at once with object literal", async ({html, find, evaluate}) => {
		await evaluate(() => window.obj = {foo: 1});
		await html("<div _='on click set {bar: 2, baz: 3} on obj'></div>");
		await find('div').dispatchEvent('click');
		const result = await evaluate(() => window.obj);
		expect(result).toEqual({foo: 1, bar: 2, baz: 3});
	});

	test("can set props w/ array access syntax", async ({html, find}) => {
		await html("<div _='on click set my style[\"color\"] to \"red\"'>lolwat</div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can set props w/ array access syntax and var", async ({html, find}) => {
		await html("<div _='on click set foo to \"color\" then set my style[foo] to \"red\"'>lolwat</div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can set arrays w/ array access syntax", async ({html, find}) => {
		await html("<div _='on click set arr to [1, 2, 3] set arr[0] to \"red\" set my *color to arr[0]'>lolwat</div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can set arrays w/ array access syntax and var", async ({html, find}) => {
		await html("<div _='on click set arr to [1, 2, 3] set idx to 0 set arr[idx] to \"red\" set my *color to arr[0]'>lolwat</div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("handles set url regression properly", async ({html, find}) => {
		await html("<div _='" +
			"on click set trackingcode to `foo`" +
			"         set pdfurl to `https://yyy.xxxxxx.com/path/out/${trackingcode}.pdf`" +
			"         put pdfurl into me'>lolwat</div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("https://yyy.xxxxxx.com/path/out/foo.pdf");
	});

});
