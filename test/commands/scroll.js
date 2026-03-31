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

	test("can scroll down by amount", async ({html, find, evaluate}) => {
		await html(
			"<div style='height: 5000px'></div>" +
			"<div _='on click scroll down by 300px'></div>"
		);
		await find('div:nth-of-type(2)').dispatchEvent('click');
		var scrollY = await evaluate(() => window.scrollY || document.documentElement.scrollTop);
		expect(scrollY).toBeGreaterThanOrEqual(290);
	});

	test("can scroll up by amount", async ({html, find, evaluate}) => {
		await html(
			"<div style='height: 5000px'></div>" +
			"<div _='on click scroll up by 100px'></div>"
		);
		// scroll down first
		await evaluate(() => window.scrollTo(0, 500));
		await find('div:nth-of-type(2)').dispatchEvent('click');
		var scrollY = await evaluate(() => window.scrollY || document.documentElement.scrollTop);
		expect(scrollY).toBeGreaterThanOrEqual(390);
		expect(scrollY).toBeLessThanOrEqual(410);
	});

	test("can scroll by without direction (defaults to down)", async ({html, find, evaluate}) => {
		await html(
			"<div style='height: 5000px'></div>" +
			"<div _='on click scroll by 200px'></div>"
		);
		await find('div:nth-of-type(2)').dispatchEvent('click');
		var scrollY = await evaluate(() => window.scrollY || document.documentElement.scrollTop);
		expect(scrollY).toBeGreaterThanOrEqual(190);
	});

	test("can scroll container by amount", async ({html, find, evaluate}) => {
		await html(
			"<div id='box' style='height: 100px; overflow: auto'>" +
			"  <div style='height: 1000px'>tall</div>" +
			"</div>" +
			"<button id='go' _='on click scroll #box down by 200px'>go</button>"
		);
		await find('#go').dispatchEvent('click');
		var scrollTop = await evaluate(() => document.querySelector('#box').scrollTop);
		expect(scrollTop).toBeGreaterThanOrEqual(190);
	});

	test("can scroll to element in container", async ({html, find, evaluate}) => {
		await html(
			"<div id='box' style='height: 100px; overflow: auto'>" +
			"  <div style='height: 500px'>spacer</div>" +
			"  <div id='item'>target</div>" +
			"</div>" +
			"<button id='go' _='on click scroll to #item in #box'>go</button>"
		);
		await find('#go').dispatchEvent('click');
		var scrollTop = await evaluate(() => document.querySelector('#box').scrollTop);
		expect(scrollTop).toBeGreaterThanOrEqual(400);
	});

	test("can scroll left by amount", async ({html, find, evaluate}) => {
		await html(
			"<div id='box' style='width: 100px; overflow: auto; white-space: nowrap'>" +
			"  <div style='width: 5000px; height: 50px'>wide</div>" +
			"</div>" +
			"<button id='go' _='on click scroll #box right by 300px'>go</button>"
		);
		await find('#go').dispatchEvent('click');
		var scrollLeft = await evaluate(() => document.querySelector('#box').scrollLeft);
		expect(scrollLeft).toBeGreaterThanOrEqual(290);
	});
});
