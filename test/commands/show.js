import {test, expect} from '../fixtures.js'

test.describe("the show command", () => {

	test("can show element, with display:block by default", async ({html, find}) => {
		await html("<div style='display:none' _='on click show me'></div>");
		await expect(find('div')).toHaveCSS('display', 'none');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'block');
	});

	test("can show form, with display:block by default", async ({html, find}) => {
		await html("<form style='display:none' _='on click show me'></form>");
		await expect(find('form')).toHaveCSS('display', 'none');
		await find('form').dispatchEvent('click');
		await expect(find('form')).toHaveCSS('display', 'block');
	});

	test("can show element with display:block explicitly", async ({html, find}) => {
		await html("<div style='display:none' _='on click show me with display'></div>");
		await expect(find('div')).toHaveCSS('display', 'none');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'block');
	});

	test("can show element with custom display value", async ({html, find}) => {
		await html("<div style='display:none' _='on click show me with display: flex'></div>");
		await expect(find('div')).toHaveCSS('display', 'none');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'flex');
	});

	test("can show element with inline-block display value", async ({html, find}) => {
		await html("<div style='display:none' _='on click show me with display: inline-block'></div>");
		await expect(find('div')).toHaveCSS('display', 'none');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'inline-block');
	});

	test("can show element with opacity:1", async ({html, find}) => {
		await html("<div style='opacity:0' _='on click show me with opacity'></div>");
		await expect(find('div')).toHaveCSS('opacity', '0');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('opacity', '1');
	});

	test("can show element with opacity style literal", async ({html, find}) => {
		await html("<div style='opacity:0' _='on click show me with *opacity'></div>");
		await expect(find('div')).toHaveCSS('opacity', '0');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('opacity', '1');
	});

	test("can show element, with visibility:visible", async ({html, find}) => {
		await html("<div style='visibility:hidden' _='on click show me with visibility'></div>");
		await expect(find('div')).toHaveCSS('visibility', 'hidden');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('visibility', 'visible');
	});

	test("can show other elements", async ({html, find}) => {
		await html("<div style='display:none' class='showme'></div><div _='on click show .showme'></div>");
		await expect(find('.showme')).toHaveCSS('display', 'none');
		await find('div:nth-of-type(2)').dispatchEvent('click');
		await expect(find('.showme')).toHaveCSS('display', 'block');
	});

	test("can show multiple elements with inline-block display value", async ({html, find}) => {
		await html("<div _='on click show <#d1, #d2/> with display: inline-block'></div>" +
			"<div style='display: none' id='d1'></div>" +
			"<div style='display: none' id='d2'></div>");
		await expect(find('#d1')).toBeHidden();
		await expect(find('#d2')).toBeHidden();
		await find('div').first().dispatchEvent('click');
		await expect(find('#d1')).toHaveCSS('display', 'inline-block');
		await expect(find('#d2')).toHaveCSS('display', 'inline-block');
	});

	test("can show multiple elements as class with inline-block display value", async ({html, find}) => {
		await html("<div _='on click show .c1 with display:inline-block'></div>" +
			"<div style='display: none' id='d1' class='c1'></div>" +
			"<div style='display: none' id='d2' class='c1'></div>");
		await expect(find('#d1')).toBeHidden();
		await expect(find('#d2')).toBeHidden();
		await find('div').first().dispatchEvent('click');
		await expect(find('#d1')).toHaveCSS('display', 'inline-block');
		await expect(find('#d2')).toHaveCSS('display', 'inline-block');
	});

	test("can use a when clause to show or hide an element", async ({html, find}) => {
		await html("<div _='on click " +
			"                              toggle .foo " +
			"                              show when I match .foo'></div>");
		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).toHaveCSS('display', 'block');
		await find('div').dispatchEvent('click');
		await expect(find('div')).not.toHaveClass(/foo/);
		await expect(find('div')).toHaveCSS('display', 'none');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).toHaveCSS('display', 'block');
	});

	test("can use a when clause and a with clause to show or hide an element", async ({html, find}) => {
		await html("<div _='on click " +
			"                              toggle .foo " +
			"                              show with opacity when I match .foo'></div>");
		await expect(find('div')).not.toHaveClass(/foo/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).toHaveCSS('opacity', '1');
		await find('div').dispatchEvent('click');
		await expect(find('div')).not.toHaveClass(/foo/);
		await expect(find('div')).toHaveCSS('opacity', '0');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo/);
		await expect(find('div')).toHaveCSS('opacity', '1');
	});

	test("can filter over a set of elements using the its symbol", async ({html, find}) => {
		await html("<div _='on click show <p/> in me when its innerText contains \"foo\"'>" +
			"<p id='p1'>foo</p>" +
			"<p id='p2'>bar</p>" +
			"<p id='p3'>foo</p>" +
			"<p id='p4'>doh</p>" +
			"</div>");

		await find('div').dispatchEvent('click');

		await expect(find('#p1')).toBeVisible();
		await expect(find('#p2')).toBeHidden();
		await expect(find('#p3')).toBeVisible();
		await expect(find('#p4')).toBeHidden();
	});

	test("the result in a when clause refers to previous command result, not element being tested", async ({html, find}) => {
		await html(
			"<div _=\"on click " +
			"  get 'found' " +
			"  show <span/> in me when the result is 'found'\">" +
			"<span id='s1' style='display:none'>A</span>" +
			"<span id='s2' style='display:none'>B</span>" +
			"</div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('#s1')).toBeVisible();
		await expect(find('#s2')).toBeVisible();
	});

	test("the result after show...when is the matched elements", async ({html, find}) => {
		await html(
			"<div _=\"on click " +
			"  show <p/> in me when its textContent is 'yes' " +
			"  if the result is empty put 'none' into #out " +
			"  else put 'some' into #out\">" +
			"<p style='display:none'>yes</p>" +
			"<p style='display:none'>no</p>" +
			"<span id='out'>--</span>" +
			"</div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('#out')).toHaveText("some");
	});

	test("starting off with display none does not stick", async ({html, find}) => {
		await html("<div style='display: none' _='on click toggle .foo show when I match .foo'></div>");
		await expect(find('div')).toHaveCSS('display', 'none');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'block');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('display', 'none');
	});

});
