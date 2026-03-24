import {test, expect} from '../fixtures.js'

test.describe("the measure command", () => {

	test("can measure me", async ({html, find, evaluate}) => {
		await html(
			"<div style='all: initial; position: fixed; top: 89px' _='on click " +
				"  measure me then set window.measurement to it'></div> "
		);
		await find('div').dispatchEvent('click');
		const top = await evaluate(() => Math.round(window.measurement.top));
		expect(top).toBe(89);
	});

	test("can measure another element", async ({html, find, evaluate}) => {
		await html("<div id='other' style='all: initial; position: fixed; top: 89px'></div>" +
			"<div _='on click measure #other then set window.measurement to it'></div> ");
		await find('div:nth-of-type(2)').dispatchEvent('click');
		const top = await evaluate(() => Math.round(window.measurement.top));
		expect(top).toBe(89);
	});

	test("can assign measurements to locals", async ({html, find, evaluate}) => {
		await html(
			"<div _='on click measure my x,y,left,top,right,bottom " +
				"        set window.measurement to {left:left,top:top,right:right,bottom:bottom}'></div> "
		);
		await find('div').dispatchEvent('click');
		const hasProps = await evaluate(() => {
			const m = window.measurement;
			return m.hasOwnProperty('top') && m.hasOwnProperty('left') &&
				m.hasOwnProperty('right') && m.hasOwnProperty('bottom');
		});
		expect(hasProps).toBe(true);
	});

	test("can measure all the supported properties", async ({html, find}) => {
		await html(
			"<div _='on click measure x,y,left,top,right,bottom,width,height,bounds,scrollLeft,scrollTop,scrollLeftMax,scrollTopMax,scrollWidth,scrollHeight,scroll'></div>"
		);
		// Should not throw
		await find('div').dispatchEvent('click');
	});
});
