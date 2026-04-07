import {test, expect} from '../fixtures.js'

test.describe("the transition command", () => {

	// Helper: click an element and synchronously read a style property before
	// the transition progresses. Both happen in a single browser evaluate to
	// avoid IPC latency between the click and the style read.
	async function clickAndReadStyle(evaluate, selector, prop) {
		return evaluate(({selector, prop}) => {
			const el = document.querySelector(selector)
			el.dispatchEvent(new Event('click', {bubbles: true}))
			return el.style[prop]
		}, {selector, prop})
	}

	test("can transition a single property on current element", async ({html, find, evaluate}) => {
		await html("<div _='on click transition *width from 0px to 100px'></div>");
		const fromValue = await clickAndReadStyle(evaluate, '#work-area div', 'width')
		expect(fromValue).toBe('0px');
		await expect(find('div')).toHaveCSS('width', '100px');
	});

	test("can transition with parameterized values", async ({html, find, evaluate}) => {
		await html("<div _='on click " +
			"                               set startWidth to 0" +
			"                               set endWidth to 100" +
			"                               transition *width from (startWidth)px to (endWidth)px'></div>");
		const fromValue = await clickAndReadStyle(evaluate, '#work-area div', 'width')
		expect(fromValue).toBe('0px');
		await expect(find('div')).toHaveCSS('width', '100px');
	});

	test("can transition a single property on form", async ({html, find, evaluate}) => {
		await html("<form _='on click transition *width from 0px to 100px'></form>");
		const fromValue = await clickAndReadStyle(evaluate, '#work-area form', 'width')
		expect(fromValue).toBe('0px');
		await expect(find('form')).toHaveCSS('width', '100px');
	});

	test("can transition a single property on current element with the my prefix", async ({html, find, evaluate}) => {
		await html("<div _='on click transition my *width from 0px to 100px'></div>");
		const fromValue = await clickAndReadStyle(evaluate, '#work-area div', 'width')
		expect(fromValue).toBe('0px');
		await expect(find('div')).toHaveCSS('width', '100px');
	});

	test("can transition two properties on current element", async ({html, find, evaluate}) => {
		await html("<div _='on click transition *width from 0px to 100px *height from 0px to 100px'></div>");
		const fromValues = await evaluate(() => {
			const el = document.querySelector('#work-area div')
			el.dispatchEvent(new Event('click', {bubbles: true}))
			return {width: el.style.width, height: el.style.height}
		})
		expect(fromValues.width).toBe('0px');
		expect(fromValues.height).toBe('0px');
		await expect(find('div')).toHaveCSS('width', '100px');
		await expect(find('div')).toHaveCSS('height', '100px');
	});

	test("can transition on another element", async ({html, find, evaluate}) => {
		await html('<div _="on click transition #foo\'s *width from 0px to 100px"></div><div id="foo"></div>');
		await find('div').first().dispatchEvent('click');
		await expect(find('#foo')).toHaveCSS('width', '100px');
	});

	test("can transition on another element with of syntax", async ({html, find}) => {
		await html('<div _="on click transition *width of #foo from 0px to 100px"></div><div id="foo"></div>');
		await find('div').first().dispatchEvent('click');
		await expect(find('#foo')).toHaveCSS('width', '100px');
	});

	test("can transition on another element with possessive", async ({html, find}) => {
		await html('<div _="on click transition #foo\'s *width from 0px to 100px"></div><div id="foo"></div>');
		await find('div').first().dispatchEvent('click');
		await expect(find('#foo')).toHaveCSS('width', '100px');
	});

	test("can transition on another element with it", async ({html, find}) => {
		await html("<div _='on click get #foo then transition its *width from 0px to 100px'></div><div id='foo'></div>");
		await find('div').first().dispatchEvent('click');
		await expect(find('#foo')).toHaveCSS('width', '100px');
	});

	test("can transition with a custom transition string", async ({html, find}) => {
		await html(
			'<div _="on click transition #foo\'s *width from 0px to 100px using &quot;width 2s ease-in&quot;"></div><div id="foo"></div>'
		);
		await find('div').first().dispatchEvent('click');
		await expect(find('#foo')).toHaveCSS('width', '100px');
	});

	test("can transition with a custom transition time via the over syntax", async ({html, find}) => {
		await html('<div _="on click transition #foo\'s *width from 0px to 100px over 2s"></div><div id="foo"></div>');
		await find('div').first().dispatchEvent('click');
		await expect(find('#foo')).toHaveCSS('width', '100px');
	});

	test("can transition a single property on current element using style ref", async ({html, find, evaluate}) => {
		await html("<div _='on click transition *width from 0px to 100px'></div>");
		const fromValue = await clickAndReadStyle(evaluate, '#work-area div', 'width')
		expect(fromValue).toBe('0px');
		await expect(find('div')).toHaveCSS('width', '100px');
	});

	test("can transition a single property on form using style ref", async ({html, find, evaluate}) => {
		await html("<form _='on click transition *width from 0px to 100px'></form>");
		const fromValue = await clickAndReadStyle(evaluate, '#work-area form', 'width')
		expect(fromValue).toBe('0px');
		await expect(find('form')).toHaveCSS('width', '100px');
	});

	test("can transition a single property on current element with the my prefix using style ref", async ({html, find, evaluate}) => {
		await html("<div _='on click transition my *width from 0px to 100px'></div>");
		const fromValue = await clickAndReadStyle(evaluate, '#work-area div', 'width')
		expect(fromValue).toBe('0px');
		await expect(find('div')).toHaveCSS('width', '100px');
	});

	test("can transition on query ref with possessive", async ({html, find, evaluate}) => {
		await evaluate(() => {
			var wa = document.getElementById('work-area');
			wa.innerHTML = '<div></div><div></div>';
			wa.querySelector('div').setAttribute('_', "on click transition the next <div/>'s *width from 0px to 100px");
			_hyperscript.process(wa);
		});
		await find('div').first().dispatchEvent('click');
		await expect(find('div').nth(1)).toHaveCSS('width', '100px');
	});

	test("can transition on query ref with of syntax", async ({html, find}) => {
		await html("<div _=\"on click transition *width of the next &lt;span/> from 0px to 100px\"></div><span></span>");
		await find('div').dispatchEvent('click');
		await expect(find('span')).toHaveCSS('width', '100px');
	});

	test("can use initial to transition to original value", async ({html, find}) => {
		await html("<div style='width: 10px' _='on click 1 transition my *width to 100px " +
			"                                              on click 2 transition my *width to initial'></div>");
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('width', '100px');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveCSS('width', '10px');
	});

});
