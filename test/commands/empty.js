import {test, expect} from '../fixtures.js'

test.describe("the empty command", () => {

	test("can empty an element", async ({html, find}) => {
		await html("<div id='d1'><p>hello</p><p>world</p></div><button _='on click empty #d1'></button>");
		await expect(find('#d1')).toHaveText("helloworld");
		await find('button').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("");
	});

	test("empty with no target empties me", async ({html, find}) => {
		await html("<div _='on click empty'>content</div>");
		await expect(find('div')).toHaveText("content");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("");
	});

	test("can empty multiple elements", async ({html, find}) => {
		await html(
			"<div class='clearme'><p>a</p></div>" +
			"<div class='clearme'><p>b</p></div>" +
			"<button _='on click empty .clearme'></button>"
		);
		await find('button').dispatchEvent('click');
		await expect(find('.clearme').first()).toHaveText("");
		await expect(find('.clearme').last()).toHaveText("");
	});
});
