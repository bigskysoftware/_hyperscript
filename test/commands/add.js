import {test, expect} from '../fixtures.js'

test.describe("the add command", () => {

	test("can add class ref on a single div", async ({html, find}) => {
		await html("<div _='on click add .foo'></div>");
		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
	});

	test("can add class ref w/ double dash on a single div", async ({html, find}) => {
		await html("<div _='on click add .foo--bar'></div>");
		await expect(find('div')).not.toHaveClass(/foo--bar/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo--bar/);
	});

	test("can add class ref on a single form", async ({html, find}) => {
		await html("<form _='on click add .foo'></form>");
		await expect(find('form')).not.toHaveClass(/foo/);
		await find('form').dispatchEvent('click');
		await expect(find('form')).toHaveClass(/foo/);
	});

	test("can target another div for class ref", async ({html, find}) => {
		await html("<div id='bar'></div><div id='trigger' _='on click add .foo to #bar'></div>");
		await expect(find('#bar')).not.toHaveClass(/foo/);
		await expect(find('#trigger')).not.toHaveClass(/foo/);
		await find('#trigger').dispatchEvent('click');
		await expect(find('#bar')).toHaveClass(/foo/);
		await expect(find('#trigger')).not.toHaveClass(/foo/);
	});

	test("can add to query in me", async ({html, find}) => {
		await html("<div id='outer' _='on click add .foo to <p/> in me'><p id='p1'></p></div>");
		await expect(find('#p1')).not.toHaveClass(/foo/);
		await expect(find('#outer')).not.toHaveClass(/foo/);
		await find('#outer').dispatchEvent('click');
		await expect(find('#p1')).toHaveClass(/foo/);
		await expect(find('#outer')).not.toHaveClass(/foo/);
	});

	test("can add to children", async ({html, find}) => {
		await html("<div id='outer' _='on click add .foo to my children'><p id='p1'></p></div>");
		await expect(find('#p1')).not.toHaveClass(/foo/);
		await expect(find('#outer')).not.toHaveClass(/foo/);
		await find('#outer').dispatchEvent('click');
		await expect(find('#p1')).toHaveClass(/foo/);
		await expect(find('#outer')).not.toHaveClass(/foo/);
	});

	test("can add non-class attributes", async ({html, find}) => {
		await html(`<div _='on click add [@foo="bar"]'></div>`);
		await expect(find('div')).not.toHaveAttribute('foo');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveAttribute('foo', 'bar');
	});

	test("can add css properties", async ({html, find}) => {
		await html("<div style='color: blue' _='on click add {color: red; font-family: monospace}'></div>");
		await expect(find('div')).toHaveCSS('color', 'rgb(0, 0, 255)');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
		await expect(find('div')).toHaveCSS('font-family', 'monospace');
	});

	test("can add templated css properties", async ({html, find}) => {
		await html(`<div style='color: blue' _='on click add {color: ${"$"}{\"red\"};}'></div>`);
		await expect(find('div')).toHaveCSS('color', 'rgb(0, 0, 255)');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test("can add multiple class refs", async ({html, find}) => {
		await html("<div _='on click add .foo .bar'></div>");
		await expect(find('div')).not.toHaveClass(/foo/);
		await expect(find('div')).not.toHaveClass(/bar/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).toHaveClass(/bar/);
	});

	test("can add class refs w/ colons and dashes", async ({html, find}) => {
		await html("<div _='on click add .foo:bar-doh'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo:bar-doh/);
	});

	test("can filter class addition via the when clause", async ({html, find}) => {
		await html(
			"<div id='trigger' _='on click add .rey to .bar when it matches .doh'></div>" +
			"<div id='d2' class='bar'></div>" +
			"<div id='d3' class='bar doh'></div>"
		);
		await find('#trigger').dispatchEvent('click');
		await expect(find('#d2')).not.toHaveClass(/rey/);
		await expect(find('#d3')).toHaveClass(/rey/);
	});

	test("can filter property addition via the when clause", async ({html, find}) => {
		await html(
			"<div id='trigger' _='on click add @rey to .bar when it matches .doh'></div>" +
			"<div id='d2' class='bar'></div>" +
			"<div id='d3' class='bar doh'></div>"
		);
		await find('#trigger').dispatchEvent('click');
		await expect(find('#d2')).not.toHaveAttribute('rey');
		await expect(find('#d3')).toHaveAttribute('rey');
	});

	test("supports async expressions in when clause", async ({html, find, evaluate}) => {
		await evaluate(() => {
			window.asyncCheck = function() {
				return new Promise(r => setTimeout(() => r(true), 10));
			}
		});
		await html(
			"<div id='trigger' _='on click add .foo to #d2 when asyncCheck()'></div>" +
			"<div id='d2'></div>"
		);
		await find('#trigger').dispatchEvent('click');
		await expect(find('#d2')).toHaveClass(/foo/);
	});

	test("can add to an HTMLCollection", async ({html, find}) => {
		await html(
			"<div id='trigger' _='on click add .foo to the children of #bar'></div>" +
			"<div id='bar'><div id='c1'></div><div id='c2'></div></div>"
		);
		await expect(find('#c1')).not.toHaveClass(/foo/);
		await expect(find('#c2')).not.toHaveClass(/foo/);
		await find('#trigger').dispatchEvent('click');
		await expect(find('#c1')).toHaveClass(/foo/);
		await expect(find('#c2')).toHaveClass(/foo/);
	});

	test("when clause sets result to matched elements", async ({html, find}) => {
		await html(
			"<div id='trigger' _='on click add .foo to .item when it matches .yes then if the result is empty show #none else hide #none'></div>" +
			"<div id='d1' class='item yes'></div>" +
			"<div id='d2' class='item'></div>" +
			"<div id='none' style='display:none'></div>"
		);
		await find('#trigger').dispatchEvent('click');
		// d1 matches .yes, so result is not empty -> #none stays hidden
		await expect(find('#none')).toBeHidden();
	});

	test("when clause result is empty when nothing matches", async ({html, find}) => {
		await html(
			"<div id='trigger' _='on click add .foo to .item when it matches .nope then if the result is empty remove @hidden from #none'></div>" +
			"<div id='d1' class='item'></div>" +
			"<div id='none' hidden></div>"
		);
		await find('#trigger').dispatchEvent('click');
		// nothing matches .nope, so result is empty -> #none shown
		await expect(find('#none')).not.toHaveAttribute('hidden');
	});
});
