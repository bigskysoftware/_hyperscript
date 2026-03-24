import {test, expect} from '../fixtures.js'

test.describe("the take command", () => {

	test("can take a class from other elements", async ({html, find}) => {
		await html("<div class='div foo'></div><div class='div' _='on click take .foo from .div'></div><div class='div'></div>");
		await find('div').nth(1).dispatchEvent('click');
		await expect(find('div').first()).not.toHaveClass(/foo/);
		await expect(find('div').nth(1)).toHaveClass(/foo/);
		await expect(find('div').nth(2)).not.toHaveClass(/foo/);
	});

	test("can take a class from other forms", async ({html, find}) => {
		await html("<form class='div foo'></form><form class='div' _='on click take .foo from .div'></form><form class='div'></form>");
		await find('form').nth(1).dispatchEvent('click');
		await expect(find('form').first()).not.toHaveClass(/foo/);
		await expect(find('form').nth(1)).toHaveClass(/foo/);
		await expect(find('form').nth(2)).not.toHaveClass(/foo/);
	});

	test("can take a class for other elements", async ({html, find}) => {
		await html("<div class='div foo'></div><div class='div' _='on click take .foo from .div for #d3'></div><div id='d3' class='div'></div>");
		await find('div').nth(1).dispatchEvent('click');
		await expect(find('div').first()).not.toHaveClass(/foo/);
		await expect(find('div').nth(1)).not.toHaveClass(/foo/);
		await expect(find('#d3')).toHaveClass(/foo/);
	});

	test("a parent can take a class for other elements", async ({html, find, evaluate}) => {
		await html(
			"<div _='on click take .foo from .div for event.target'>" +
				"<div id='d1' class='div foo'></div>" +
				"<div id='d2' class='div'></div>" +
				"<div id='d3' class='div'></div>" +
				"</div>"
		);
		await evaluate(() => document.querySelector('#d2').click());
		await expect(find('#d1')).not.toHaveClass(/foo/);
		await expect(find('#d2')).toHaveClass(/foo/);
		await expect(find('#d3')).not.toHaveClass(/foo/);
	});

	test("can take an attribute from other elements", async ({html, find, evaluate}) => {
		await html("<div class='div' data-foo='bar'></div><div class='div' _='on click take @data-foo from .div'></div><div class='div'></div>");
		await expect(find('div').first()).toHaveAttribute('data-foo', 'bar');
		await find('div').nth(1).dispatchEvent('click');
		await expect(find('div').first()).not.toHaveAttribute('data-foo');
		await expect(find('div').nth(1)).toHaveAttribute('data-foo', '');
		await expect(find('div').nth(2)).not.toHaveAttribute('data-foo');
	});

	test("can take an attribute with specific value from other elements", async ({html, find}) => {
		await html("<div class='div' data-foo='bar'></div><div class='div' _='on click take @data-foo=baz from .div'></div><div class='div'></div>");
		await expect(find('div').first()).toHaveAttribute('data-foo', 'bar');
		await find('div').nth(1).dispatchEvent('click');
		await expect(find('div').first()).not.toHaveAttribute('data-foo');
		await expect(find('div').nth(1)).toHaveAttribute('data-foo', 'baz');
		await expect(find('div').nth(2)).not.toHaveAttribute('data-foo');
	});

	test("can take an attribute value from other elements and set specific values instead", async ({html, find}) => {
		await html("<div class='div' data-foo='bar'></div><div class='div' _='on click take @data-foo=baz with \"qux\" from .div'></div><div class='div'></div>");
		await find('div').nth(1).dispatchEvent('click');
		await expect(find('div').first()).toHaveAttribute('data-foo', 'qux');
		await expect(find('div').nth(1)).toHaveAttribute('data-foo', 'baz');
		await expect(find('div').nth(2)).toHaveAttribute('data-foo', 'qux');
	});

	test("can take an attribute value from other elements and set value from an expression instead", async ({html, find}) => {
		await html("<div class='div' data-foo='bar'></div><div class='div' data-foo='qux' _='on click take @data-foo=baz with my @data-foo from .div'></div><div class='div'></div>");
		await find('div').nth(1).dispatchEvent('click');
		await expect(find('div').first()).toHaveAttribute('data-foo', 'qux');
		await expect(find('div').nth(1)).toHaveAttribute('data-foo', 'baz');
		await expect(find('div').nth(2)).toHaveAttribute('data-foo', 'qux');
	});

	test("can take an attribute for other elements", async ({html, find}) => {
		await html("<div class='div' data-foo='bar'></div><div class='div' _='on click take @data-foo from .div for #d3'></div><div id='d3' class='div'></div>");
		await find('div').nth(1).dispatchEvent('click');
		await expect(find('div').first()).not.toHaveAttribute('data-foo');
		await expect(find('div').nth(1)).not.toHaveAttribute('data-foo');
		await expect(find('#d3')).toHaveAttribute('data-foo', '');
	});

	test("a parent can take an attribute for other elements", async ({html, find, evaluate}) => {
		await html(
			"<div _='on click take @data-foo from .div for event.target'>" +
				"<div id='d1' class='div' data-foo='bar'></div>" +
				"<div id='d2' class='div'></div>" +
				"<div id='d3' class='div'></div>" +
			"</div>"
		);
		await evaluate(() => document.querySelector('#d2').click());
		await expect(find('#d1')).not.toHaveAttribute('data-foo');
		await expect(find('#d2')).toHaveAttribute('data-foo', '');
		await expect(find('#d3')).not.toHaveAttribute('data-foo');
	});

	test("can take multiple classes from other elements", async ({html, find}) => {
		await html("<div class='div foo'></div><div class='div' _='on click take .foo .bar'></div><div class='div bar'></div>");
		await find('div').nth(1).dispatchEvent('click');
		await expect(find('div').first()).not.toHaveClass(/foo/);
		await expect(find('div').nth(1)).toHaveClass(/foo/);
		await expect(find('div').nth(1)).toHaveClass(/bar/);
		await expect(find('div').nth(2)).not.toHaveClass(/bar/);
	});

	test("can take multiple classes from specific element", async ({html, find}) => {
		await html("<div class='div1 foo bar'></div><div class='div' _='on click take .foo .bar from .div1'></div><div class='div bar'></div>");
		await find('div').nth(1).dispatchEvent('click');
		await expect(find('div').first()).not.toHaveClass(/foo/);
		await expect(find('div').first()).not.toHaveClass(/bar/);
		await expect(find('div').nth(1)).toHaveClass(/foo/);
		await expect(find('div').nth(1)).toHaveClass(/bar/);
		// third div still has bar since it's .div not .div1
		await expect(find('div').nth(2)).toHaveClass(/bar/);
	});

});
