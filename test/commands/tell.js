import {test, expect} from '../fixtures.js'

test.describe("the tell command", () => {

	test("establishes a proper beingTold symbol", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click " +
				"                          add .foo " +
				"                          tell #d2" +
				"                            add .bar'></div>" +
				"<div id='d2'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).not.toHaveClass(/bar/);
		await expect(find('#d1')).toHaveClass(/foo/);
		await expect(find('#d2')).toHaveClass(/bar/);
		await expect(find('#d2')).not.toHaveClass(/foo/);
	});

	test("does not overwrite the me symbol", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click " +
				"                          add .foo " +
				"                          tell #d2" +
				"                            add .bar to me'></div>" +
				"<div id='d2'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveClass(/bar/);
		await expect(find('#d1')).toHaveClass(/foo/);
		await expect(find('#d2')).not.toHaveClass(/bar/);
		await expect(find('#d2')).not.toHaveClass(/foo/);
	});

	test("works with an array", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click " +
				"                          add .foo " +
				"                          tell <p/> in me" +
				"                            add .bar'><p id='p1'></p><p id='p2'></p><div id='d2'></div></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveClass(/foo/);
		await expect(find('#d1')).not.toHaveClass(/bar/);
		await expect(find('#d2')).not.toHaveClass(/bar/);
		await expect(find('#p1')).toHaveClass(/bar/);
		await expect(find('#p2')).toHaveClass(/bar/);
	});

	test("restores a proper implicit me symbol", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click " +
				"                          tell #d2" +
				"                            add .bar" +
				"                          end" +
				"                          add .foo'></div>" +
				"<div id='d2'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).not.toHaveClass(/bar/);
		await expect(find('#d1')).toHaveClass(/foo/);
		await expect(find('#d2')).toHaveClass(/bar/);
		await expect(find('#d2')).not.toHaveClass(/foo/);
	});

	test("ignores null", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click " +
				"                          tell null" +
				"                            add .bar" +
				"                          end" +
				"                          add .foo'></div>" +
				"<div id='d2'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).not.toHaveClass(/bar/);
		await expect(find('#d1')).toHaveClass(/foo/);
		await expect(find('#d2')).not.toHaveClass(/bar/);
	});

	test("you symbol represents the thing being told", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click " +
				"                          tell #d2" +
				"                            add .bar to you'></div>" +
				"<div id='d2'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).not.toHaveClass(/bar/);
		await expect(find('#d2')).toHaveClass(/bar/);
	});

	test("your symbol represents the thing being told", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click " +
				"                          tell #d2" +
				"                            put your innerText into me'></div>" +
				"<div id='d2'>foo</div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("foo");
	});

	test("attributes refer to the thing being told", async ({html, find}) => {
		await html(
			"<div id='d1' _='on click " +
				"                          tell #d2" +
				"                            put @foo into me'></div>" +
				"<div foo='bar' id='d2'></div>"
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("bar");
	});

	test("yourself attribute also works", async ({html, find}) => {
		await html(`<div id="d1" _="on click tell #d2 remove yourself"><div id="d2"></div></div>`);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d2')).toHaveCount(0);
	});

	test("tell terminates with a feature", async ({html, find, evaluate}) => {
		await html(`<div id="d1" _="on click tell #d2 remove yourself on click tell #d3 remove yourself"><div id="d2"></div><div id="d3"></div></div>`);
		await find('#d1').dispatchEvent('click');
		const innerHTML = await evaluate(() => document.querySelector('#d1').innerHTML);
		expect(innerHTML).toBe("");
	});
});
