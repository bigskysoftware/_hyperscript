import {test, expect} from '../fixtures.js'

test.describe("the toggle command", () => {

	test("can toggle class ref on a single div", async ({html, find}) => {
		await html("<div _='on click toggle .foo'></div>");
		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).not.toHaveClass(/foo/);
	});

	test("can toggle class ref on a single form", async ({html, find}) => {
		await html("<form _='on click toggle .foo'></form>");
		await expect(find('form')).not.toHaveClass(/foo/);
		await find('form').dispatchEvent('click');
		await expect(find('form')).toHaveClass(/foo/);
		await find('form').dispatchEvent('click');
		await expect(find('form')).not.toHaveClass(/foo/);
	});

	test("can target another div for class ref toggle", async ({html, find}) => {
		await html("<div id='bar'></div><div _='on click toggle .foo on #bar'></div>");
		await expect(find('#bar')).not.toHaveClass(/foo/);
		await find('div:nth-of-type(2)').dispatchEvent('click');
		await expect(find('#bar')).toHaveClass(/foo/);
		await find('div:nth-of-type(2)').dispatchEvent('click');
		await expect(find('#bar')).not.toHaveClass(/foo/);
	});

	test("can toggle non-class attributes", async ({html, find}) => {
		await html("<div _='on click toggle [@foo=\"bar\"]'></div>");
		await expect(find('div')).not.toHaveAttribute('foo');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveAttribute('foo', 'bar');
		await find('div').dispatchEvent('click');
		await expect(find('div')).not.toHaveAttribute('foo');
	});

	test("can toggle non-class attributes on selects", async ({html, find}) => {
		await html("<select _='on click toggle [@foo=\"bar\"]'></select>");
		await expect(find('select')).not.toHaveAttribute('foo');
		await find('select').dispatchEvent('click');
		await expect(find('select')).toHaveAttribute('foo', 'bar');
		await find('select').dispatchEvent('click');
		await expect(find('select')).not.toHaveAttribute('foo');
	});

	test("can toggle for a fixed amount of time", async ({html, find}) => {
		await html("<div _='on click toggle .foo for 10ms'></div>");
		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).not.toHaveClass(/foo/);
	});

	test("can toggle until an event on another element", async ({html, find, evaluate}) => {
		await html("<div id='d1'></div><div _='on click toggle .foo until foo from #d1'></div>");
		await expect(find('div:nth-of-type(2)')).not.toHaveClass(/foo/);
		await find('div:nth-of-type(2)').dispatchEvent('click');
		await expect(find('div:nth-of-type(2)')).toHaveClass(/foo/);
		await evaluate(() => document.querySelector('#d1').dispatchEvent(new CustomEvent("foo")));
		await expect(find('div:nth-of-type(2)')).not.toHaveClass(/foo/);
	});

	test("can toggle between two classes", async ({html, find}) => {
		await html("<div class='foo' _='on click toggle between .foo and .bar'></div>");
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).not.toHaveClass(/bar/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).not.toHaveClass(/foo/);
		await expect(find('div')).toHaveClass(/bar/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).not.toHaveClass(/bar/);
	});

	test("can toggle multiple class refs", async ({html, find}) => {
		await html("<div class='bar' _='on click toggle .foo .bar'></div>");
		await expect(find('div')).not.toHaveClass(/foo/);
		await expect(find('div')).toHaveClass(/bar/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).not.toHaveClass(/bar/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).not.toHaveClass(/foo/);
		await expect(find('div')).toHaveClass(/bar/);
	});

	test("can toggle display", async ({html, find}) => {
		await html("<div _='on click toggle *display'></div>");
		await expect(find('div')).toHaveCSS('display', 'block');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'none');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'block');
	});

	test("can toggle opacity", async ({html, find}) => {
		await html("<div _='on click toggle *opacity'></div>");
		await expect(find('div')).toHaveCSS('opacity', '1');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('opacity', '0');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('opacity', '1');
	});

	test("can toggle visibility", async ({html, find}) => {
		await html("<div _='on click toggle *visibility'></div>");
		await expect(find('div')).toHaveCSS('visibility', 'visible');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('visibility', 'hidden');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('visibility', 'visible');
	});

	test("can toggle display w/ my", async ({html, find}) => {
		await html("<div _='on click toggle my *display'></div>");
		await expect(find('div')).toHaveCSS('display', 'block');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'none');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'block');
	});

	test("can toggle opacity w/ my", async ({html, find}) => {
		await html("<div _='on click toggle my *opacity'></div>");
		await expect(find('div')).toHaveCSS('opacity', '1');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('opacity', '0');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('opacity', '1');
	});

	test("can toggle visibility w/ my", async ({html, find}) => {
		await html("<div _='on click toggle my *visibility'></div>");
		await expect(find('div')).toHaveCSS('visibility', 'visible');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('visibility', 'hidden');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('visibility', 'visible');
	});

	test("can toggle display on other elt", async ({html, find}) => {
		await html("<div _='on click toggle the *display of #d2'></div><div id='d2'></div>");
		await expect(find('#d2')).toHaveCSS('display', 'block');
		await find('div').first().dispatchEvent('click');
		await expect(find('#d2')).toHaveCSS('display', 'none');
		await find('div').first().dispatchEvent('click');
		await expect(find('#d2')).toHaveCSS('display', 'block');
	});

	test("can toggle opacity on other elt", async ({html, find}) => {
		await html("<div _='on click toggle the *opacity of #d2'></div><div id='d2'></div>");
		await expect(find('#d2')).toHaveCSS('opacity', '1');
		await find('div').first().dispatchEvent('click');
		await expect(find('#d2')).toHaveCSS('opacity', '0');
		await find('div').first().dispatchEvent('click');
		await expect(find('#d2')).toHaveCSS('opacity', '1');
	});

	test("can toggle visibility on other elt", async ({html, find}) => {
		await html("<div _='on click toggle the *visibility of #d2'></div><div id='d2'></div>");
		await expect(find('#d2')).toHaveCSS('visibility', 'visible');
		await find('div').first().dispatchEvent('click');
		await expect(find('#d2')).toHaveCSS('visibility', 'hidden');
		await find('div').first().dispatchEvent('click');
		await expect(find('#d2')).toHaveCSS('visibility', 'visible');
	});

	test("can toggle crazy tailwinds class ref on a single form", async ({html, find, evaluate}) => {
		await html("<form _='on click toggle .group-\\[:nth-of-type\\(3\\)_\\&\\]:block'></form>");
		await find('form').dispatchEvent('click');
		const hasClass = await evaluate(() =>
			document.querySelector('#work-area form').classList.contains("group-[:nth-of-type(3)_&]:block")
		);
		expect(hasClass).toBe(true);
		await find('form').dispatchEvent('click');
		const hasClass2 = await evaluate(() =>
			document.querySelector('#work-area form').classList.contains("group-[:nth-of-type(3)_&]:block")
		);
		expect(hasClass2).toBe(false);
	});
});
