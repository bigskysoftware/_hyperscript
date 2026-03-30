import {test, expect} from '../fixtures.js'

test.describe("the scroll command", () => {

	test("can scroll to an element", async ({html, find, evaluate}) => {
		await html(
			"<div style='height: 2000px'></div>" +
			"<div id='target'>Target</div>" +
			"<div _='on click scroll to #target'></div>"
		);
		await find('div:nth-of-type(3)').dispatchEvent('click');
		var inView = await evaluate(() => {
			var rect = document.querySelector('#target').getBoundingClientRect();
			return rect.top >= 0 && rect.top < window.innerHeight;
		});
		expect(inView).toBe(true);
	});

	test("can scroll to top of element", async ({html, find, evaluate}) => {
		await html(
			"<div style='height: 2000px'></div>" +
			"<div id='target' style='height: 200px'>Target</div>" +
			"<div _='on click scroll to the top of #target'></div>"
		);
		await find('div:nth-of-type(3)').dispatchEvent('click');
		var inView = await evaluate(() => {
			var rect = document.querySelector('#target').getBoundingClientRect();
			return rect.top >= 0 && rect.top < window.innerHeight;
		});
		expect(inView).toBe(true);
	});
});
