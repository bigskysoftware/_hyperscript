import {test, expect} from '../fixtures.js'

test.describe("the remove command", () => {

	test("can remove class ref on a single div", async ({html, find}) => {
		await html("<div class='foo' _='on click remove .foo'></div>");
		await expect(find('div')).toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).not.toHaveClass(/foo/);
	});

	test("can remove class ref on a single form", async ({html, find}) => {
		await html("<form class='foo' _='on click remove .foo'></form>");
		await expect(find('form')).toHaveClass(/foo/);
		await find('form').dispatchEvent('click');
		await expect(find('form')).not.toHaveClass(/foo/);
	});

	test("can target another div for class ref", async ({html, find}) => {
		await html("<div class='foo' id='bar'></div><div _='on click remove .foo from #bar'></div>");
		await expect(find('#bar')).toHaveClass(/foo/);
		await find('div:nth-of-type(2)').dispatchEvent('click');
		await expect(find('#bar')).not.toHaveClass(/foo/);
	});

	test("can remove non-class attributes", async ({html, find}) => {
		await html("<div foo='bar' _='on click remove [@foo]'></div>");
		await expect(find('div')).toHaveAttribute('foo', 'bar');
		await find('div').dispatchEvent('click');
		await expect(find('div')).not.toHaveAttribute('foo');
	});

	test("can remove elements", async ({html, find, evaluate}) => {
		await html("<div _='on click remove me'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCount(0);
	});

	test("can remove other elements", async ({html, find}) => {
		await html("<div _='on click remove #that'></div><div id='that'></div>");
		await expect(find('#that')).toHaveCount(1);
		await find('div').first().dispatchEvent('click');
		await expect(find('#that')).toHaveCount(0);
	});

	test("can remove parent element", async ({html, find}) => {
		await html("<div id='p1'><button id='b1' _=\"on click remove my.parentElement\"></button></div>");
		await expect(find('#p1')).toHaveCount(1);
		await find('#b1').dispatchEvent('click');
		await expect(find('#p1')).toHaveCount(0);
	});

	test("can remove multiple class refs", async ({html, find}) => {
		await html("<div class='foo bar doh' _='on click remove .foo .bar'></div>");
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).toHaveClass(/bar/);
		await expect(find('div')).toHaveClass(/doh/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).not.toHaveClass(/foo/);
		await expect(find('div')).not.toHaveClass(/bar/);
		await expect(find('div')).toHaveClass(/doh/);
	});

	test("can filter class removal via the when clause", async ({html, find}) => {
		await html(
			"<div id='trigger' _='on click remove .highlight from .item when it matches .old'></div>" +
			"<div id='d1' class='item old highlight'></div>" +
			"<div id='d2' class='item highlight'></div>"
		);
		await find('#trigger').dispatchEvent('click');
		// d1 matches .old -> remove .highlight
		await expect(find('#d1')).not.toHaveClass(/highlight/);
		// d2 does not match .old -> reverse (add .highlight, but it already has it)
		await expect(find('#d2')).toHaveClass(/highlight/);
	});

	test("can remove CSS properties", async ({html, find, evaluate}) => {
		await html("<div style='color: red; font-weight: bold;' _='on click remove {color} from me'></div>");
		await find('div').dispatchEvent('click');
		var style = await evaluate(() => document.querySelector('#work-area div').style.color);
		expect(style).toBe('');
		// font-weight should remain
		var fw = await evaluate(() => document.querySelector('#work-area div').style.fontWeight);
		expect(fw).toBe('bold');
	});

	test("can remove multiple CSS properties", async ({html, find, evaluate}) => {
		await html("<div style='color: red; font-weight: bold; opacity: 0.5;' _='on click remove {color; font-weight} from me'></div>");
		await find('div').dispatchEvent('click');
		var color = await evaluate(() => document.querySelector('#work-area div').style.color);
		var fw = await evaluate(() => document.querySelector('#work-area div').style.fontWeight);
		var op = await evaluate(() => document.querySelector('#work-area div').style.opacity);
		expect(color).toBe('');
		expect(fw).toBe('');
		expect(op).toBe('0.5');
	});

	test("can remove query refs from specific things", async ({html, find, evaluate}) => {
		await html("<div><div id='d1' _='on click remove <p/> from me'><p>foo</p>bar</div><p>doh</p></div>");
		await find('#d1').dispatchEvent('click');
		const outerHTML = await evaluate(() => document.querySelector('#work-area > div').innerHTML);
		expect(outerHTML).not.toContain("foo");
		expect(outerHTML).toContain("bar");
		expect(outerHTML).toContain("doh");
	});
});
