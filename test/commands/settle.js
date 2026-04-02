import {test, expect} from '../fixtures.js'

test.describe("the settle command", () => {

	test("can settle me no transition", async ({html, find}) => {
		test.setTimeout(5000);
		await html("<div id='d1' _='on click settle then add .foo'></div>");
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveClass(/foo/);
	});

	test("can settle target no transition", async ({html, find}) => {
		test.setTimeout(5000);
		await html("<div id='d1'></div><div _='on click settle #d1 then add .foo to #d1'></div>");
		await find('div:nth-of-type(2)').dispatchEvent('click');
		await expect(find('#d1')).toHaveClass(/foo/);
	});

	test("can settle a collection of elements", async ({html, find}) => {
		test.setTimeout(5000);
		await html(
			"<div class='item'></div><div class='item'></div>" +
			"<div id='trigger' _='on click settle <.item/> then add .done to <.item/>'></div>"
		);
		await find('#trigger').dispatchEvent('click');
		await expect(find('.item').first()).toHaveClass(/done/);
		await expect(find('.item').nth(1)).toHaveClass(/done/);
	});
});
