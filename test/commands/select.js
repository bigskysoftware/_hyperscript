import {test, expect} from '../fixtures.js'

test.describe("the select command", () => {

	test("selects text in an input", async ({html, find, evaluate}) => {
		await html(
			"<input id='inp' value='hello world' />" +
			"<button _='on click select #inp'>Select</button>"
		);
		await find('button').click();
		var selected = await evaluate(() => {
			var inp = document.getElementById('inp');
			return inp.value.substring(inp.selectionStart, inp.selectionEnd);
		});
		expect(selected).toBe("hello world");
	});

	test("selects text in a textarea", async ({html, find, evaluate}) => {
		await html(
			"<textarea id='ta'>some text</textarea>" +
			"<button _='on click select #ta'>Select</button>"
		);
		await find('button').click();
		var selected = await evaluate(() => {
			var ta = document.getElementById('ta');
			return ta.value.substring(ta.selectionStart, ta.selectionEnd);
		});
		expect(selected).toBe("some text");
	});

	test("selects implicit me", async ({html, find, evaluate}) => {
		await html("<input id='inp' value='test' _='on click select' />");
		await find('#inp').click();
		var selected = await evaluate(() => {
			var inp = document.getElementById('inp');
			return inp.value.substring(inp.selectionStart, inp.selectionEnd);
		});
		expect(selected).toBe("test");
	});

});

test.describe("the selection symbol", () => {

	test("returns selected text", async ({html, find, evaluate}) => {
		await html(
			"<p id='text'>Hello World</p>" +
			"<button _='on click put the selection into #out'>Get</button>" +
			"<div id='out'></div>"
		);
		// Programmatically select "Hello"
		await evaluate(() => {
			var range = document.createRange();
			var textNode = document.getElementById('text').firstChild;
			range.setStart(textNode, 0);
			range.setEnd(textNode, 5);
			window.getSelection().removeAllRanges();
			window.getSelection().addRange(range);
		});
		await find('button').click();
		await expect(find('#out')).toHaveText("Hello");
	});

});
