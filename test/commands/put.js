import {test, expect} from '../fixtures.js'

test.describe("the put command", () => {

	test("can set properties", async ({html, find}) => {
		await html("<div id='d1' _='on click put \"foo\" into #d1.innerHTML'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});

	test("can put directly into nodes", async ({html, find}) => {
		await html("<div id='d1' _='on click put \"foo\" into #d1'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});

	test("can put nodes into nodes", async ({html, find, evaluate}) => {
		await html("<div id='d1'></div><div id='d2' _='on click put #d1 into #d2'></div>");
		await find('#d2').dispatchEvent('click');
		const hasChild = await evaluate(() => document.querySelector('#d2').firstChild === document.querySelector('#d1'));
		expect(hasChild).toBe(true);
	});

	test("can put directly into symbols", async ({html, find}) => {
		await html("<div _='on click put \"foo\" into me'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foo");
	});

	test("me symbol doesn't get stomped on direct write", async ({html, find}) => {
		await html('<div _=\'on click put "foo" into me then put "bar" into me\'></div>');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("bar");
	});

	test("can set styles", async ({html, find}) => {
		await html("<div _='on click put \"red\" into my.style.color'>lolwat</div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can set javascript globals", async ({html, find, evaluate}) => {
		await html("<div _='on click put \"red\" into window.temp'>lolwat</div>");
		await find('div').dispatchEvent('click');
		expect(await evaluate(() => window.temp)).toBe("red");
	});

	test("can set into class ref w/ flatmapped property", async ({html, find}) => {
		await html("<div _='on click put \"foo\" into .divs.parentElement.innerHTML'></div>" +
			"<div id='d1'><div class='divs'></div></div><div id='d2'><div class='divs'></div></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
		await expect(find('#d2')).toHaveText("foo");
	});

	test("can set into class ref w/ flatmapped property using of", async ({html, find}) => {
		await html("<div _='on click put \"foo\" into innerHTML of parentElement of .divs'></div>" +
			"<div id='d1'><div class='divs'></div></div><div id='d2'><div class='divs'></div></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
		await expect(find('#d2')).toHaveText("foo");
	});

	test("can set local variables", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click put \"foo\" into newVar then" +
				"                                    put newVar into #d1.innerHTML'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});

	test("can set into id ref", async ({html, find}) => {
		await html("<div id='d1' _='on click put \"foo\" into #d1.innerHTML'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});

	test("can insert before", async ({html, find, evaluate}) => {
		await html("<div id='d2' _='on click put #d1 before #d2'></div><div id='d1'>foo</div>");
		await find('#d2').dispatchEvent('click');
		const prevText = await evaluate(() => document.querySelector('#d2').previousSibling.textContent);
		expect(prevText).toBe("foo");
	});

	test("can insert after", async ({html, find, evaluate}) => {
		await html("<div id='d1'>foo</div><div id='d2' _='on click put #d1 after #d2'></div>");
		await find('#d2').dispatchEvent('click');
		const nextText = await evaluate(() => document.querySelector('#d2').nextSibling.textContent);
		expect(nextText).toBe("foo");
	});

	test("can insert after beginning", async ({html, find}) => {
		await html("<div id='d1' _='on click put \"foo\" at start of #d1'>*</div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo*");
	});

	test("can insert before end", async ({html, find}) => {
		await html("<div id='d1' _='on click put \"foo\" at end of #d1'>*</div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("*foo");
	});

	test("can set into attribute ref", async ({html, find}) => {
		await html("<div class='divs' _='on click put \"foo\" into @bar'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveAttribute('bar', 'foo');
	});

	test("can set into indirect attribute ref", async ({html, find}) => {
		await html("<div class='divs' _='on click put \"foo\" into my @bar'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveAttribute('bar', 'foo');
	});

	test("can set into indirect attribute ref 2", async ({html, find}) => {
		await html("<div class='divs' _=\"on click put 'foo' into #div2's @bar\"></div>" +
			"<div id='div2'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#div2')).toHaveAttribute('bar', 'foo');
	});

	test("can set into indirect attribute ref 3", async ({html, find}) => {
		await html("<div class='divs' _=\"on click put 'foo' into @bar of #div2\"></div>" +
			"<div id='div2'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#div2')).toHaveAttribute('bar', 'foo');
	});

	test("can set into style ref", async ({html, find}) => {
		await html("<div class='divs' _='on click put \"red\" into *color'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can set into indirect style ref", async ({html, find}) => {
		await html("<div class='divs' _='on click put \"red\" into my *color'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can set into indirect style ref 2", async ({html, find}) => {
		await html("<div class='divs' _=\"on click put 'red' into #div2's *color\"></div>" +
			"<div id='div2'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#div2')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can set into indirect style ref 3", async ({html, find}) => {
		await html("<div class='divs' _=\"on click put 'red' into the *color of #div2\"></div>" +
			"<div id='div2'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#div2')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("waits on promises", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.promiseAString = function () {
				return new Promise(function (finish) {
					window.finish = finish;
				});
			};
		});
		await html("<div id='d1' _='on click put promiseAString() into #d1.innerHTML'></div>");
		await find('#d1').dispatchEvent('click');
		await evaluate(() => window.finish("foo"));
		await expect(find('#d1')).toHaveText("foo");
	});

	test("can put properties w/ array access syntax", async ({html, find}) => {
		await html("<div _='on click put \"red\" into my style[\"color\"]'>lolwat</div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can put properties w/ array access syntax and var", async ({html, find}) => {
		await html("<div _='on click set foo to \"color\" then put \"red\" into my style[foo]'>lolwat</div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can put array vals w/ array access syntax", async ({html, find}) => {
		await html("<div _='on click set arr to [1, 2, 3] put \"red\" into arr[0] put arr[0] into my *color'>lolwat</div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can put array vals w/ array access syntax and var", async ({html, find}) => {
		await html("<div _='on click set arr to [1, 2, 3] set idx to 0 put \"red\" into arr[idx] put arr[0] into my *color'>lolwat</div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("properly processes hyperscript in new content in a symbol write", async ({html, find, evaluate}) => {
		await html("<div _='on click put \"<button id=\\\"b1\\\" _=\\\"on click put 42 into me\\\">40</button>\" into me'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('#b1')).toHaveText("40");
		await evaluate(() => {
			const e = new Event('click', {bubbles: false});
			document.querySelector('#b1').dispatchEvent(e);
		});
		await expect(find('#b1')).toHaveText("42");
	});

	test("properly processes hyperscript in new content in a element target", async ({html, find, evaluate}) => {
		await html("<div id='d1' _='on click put \"<button id=\\\"b1\\\" _=\\\"on click put 42 into me\\\">40</button>\" into <div#d1/>'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#b1')).toHaveText("40");
		await evaluate(() => {
			const e = new Event('click', {bubbles: false});
			document.querySelector('#b1').dispatchEvent(e);
		});
		await expect(find('#b1')).toHaveText("42");
	});

	test("properly processes hyperscript in before", async ({html, find, evaluate}) => {
		await html("<div id='d1' _='on click put \"<button id=\\\"b1\\\" _=\\\"on click put 42 into me\\\">40</button>\" before me'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#b1')).toHaveText("40");
		await find('#b1').dispatchEvent('click');
		await expect(find('#b1')).toHaveText("42");
	});

	test("properly processes hyperscript at start of", async ({html, find, evaluate}) => {
		await html("<div id='d1' _='on click put \"<button id=\\\"b1\\\" _=\\\"on click put 42 into me\\\">40</button>\" at the start of me'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#b1')).toHaveText("40");
		await evaluate(() => {
			const e = new Event('click', {bubbles: false});
			document.querySelector('#b1').dispatchEvent(e);
		});
		await expect(find('#b1')).toHaveText("42");
	});

	test("properly processes hyperscript at end of", async ({html, find, evaluate}) => {
		await html("<div id='d1' _='on click put \"<button id=\\\"b1\\\" _=\\\"on click put 42 into me\\\">40</button>\" at the end of me'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#b1')).toHaveText("40");
		await evaluate(() => {
			const e = new Event('click', {bubbles: false});
			document.querySelector('#b1').dispatchEvent(e);
		});
		await expect(find('#b1')).toHaveText("42");
	});

	test("properly processes hyperscript after", async ({html, find, evaluate}) => {
		await html("<div id='d1' _='on click put \"<button id=\\\"b1\\\" _=\\\"on click put 42 into me\\\">40</button>\" after me'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#b1')).toHaveText("40");
		await find('#b1').dispatchEvent('click');
		await expect(find('#b1')).toHaveText("42");
	});

	test("is null tolerant", async ({html, find}) => {
		await html("<div class='divs' _='on click put \"red\" into #a-bad-id-that-does-not-exist'></div>");
		await find('div').dispatchEvent('click');
	});

	test("put null into attribute removes it", async ({html, find}) => {
		await html("<div id='d1' foo='bar' _='on click put null into @foo'></div>");
		await expect(find('#d1')).toHaveAttribute('foo', 'bar');
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).not.toHaveAttribute('foo');
	});

	test("can put at start of an array", async ({html, find}) => {
		await html(`<div _="on click
		                      set :arr to [2,3]
		                      put 1 at start of :arr
		                      put :arr as String into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("1,2,3");
	});

	test("can put at end of an array", async ({html, find}) => {
		await html(`<div _="on click
		                      set :arr to [1,2]
		                      put 3 at end of :arr
		                      put :arr as String into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("1,2,3");
	});

});
