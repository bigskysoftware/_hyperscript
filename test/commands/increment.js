import {test, expect} from '../fixtures.js'

test.describe("the increment command", () => {

	test("can increment an empty variable", async ({html, find}) => {
		await html(`<div _="on click increment value then put value into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("1");
	});

	test("can increment a variable", async ({html, find}) => {
		await html(`<div _="on click set value to 20 then increment value by 2 then put value into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("22");
	});

	test("can increment refer to result", async ({html, find}) => {
		await html(`<div _="on click increment value by 2 then put it into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("2");
	});

	test("can increment an attribute", async ({html, find}) => {
		await html(`<div value="5" _="on click increment @value then put @value into me"></div>`);
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("8");
	});

	test("can increment an floating point numbers", async ({html, find}) => {
		await html(
			`<div value="5" _="on click set value to 5.2 then increment value by 6.1 then put value into me"></div>`
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("11.3");
	});

	test("can increment a property", async ({html, find}) => {
		await html(`<div _="on click increment my.innerHTML">3</div>`);
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("6");
	});

	test("can increment by zero", async ({html, find}) => {
		await html(`<div _="on click set value to 20 then increment value by 0 then put value into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("20");
	});

	test("can increment a value multiple times", async ({html, find}) => {
		await html(`<div _="on click increment my.innerHTML"></div>`);
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("5");
	});

	test("can decrement an empty variable", async ({html, find}) => {
		await html(`<div _="on click decrement value then put value into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("-1");
	});

	test("can decrement a variable", async ({html, find}) => {
		await html(`<div _="on click set value to 20 then decrement value by 2 then put value into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("18");
	});

	test("can decrement an attribute", async ({html, find}) => {
		await html(`<div value="5" _="on click decrement @value then put @value into me"></div>`);
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("2");
	});

	test("can decrement an floating point numbers", async ({html, find}) => {
		await html(
			`<div value="5" _="on click set value to 6.1 then decrement value by 5.1 then put value into me"></div>`
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("1");
	});

	test("can decrement a property", async ({html, find}) => {
		await html(`<div _="on click decrement my.innerHTML">3</div>`);
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("0");
	});

	test("can decrement a value multiple times", async ({html, find}) => {
		await html(`<div _="on click decrement my.innerHTML"></div>`);
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("-5");
	});

	test("can decrement by zero", async ({html, find}) => {
		await html(`<div _="on click set value to 20 then decrement value by 0 then put value into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("20");
	});

	test("can increment an array element", async ({html, find}) => {
		await html(`<div _="on click set arr to [10, 20, 30] then increment arr[1] then put arr[1] into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("21");
	});

	test("can decrement an array element", async ({html, find}) => {
		await html(`<div _="on click set arr to [10, 20, 30] then decrement arr[1] then put arr[1] into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("19");
	});

	test("can increment a possessive property", async ({html, find}) => {
		await html(
			`<div id="d1" _="on click increment #d1's innerHTML">5</div>`
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("6");
	});

	test("can increment a property of expression", async ({html, find}) => {
		await html(
			`<div id="d1" _="on click increment innerHTML of #d1">5</div>`
		);
		await find('#d1').dispatchEvent('click');
		await expect(find('#d1')).toHaveText("6");
	});

	test("can increment a style ref", async ({html, find}) => {
		await html(
			`<div _="on click set my *opacity to 0.5 then increment *opacity by 0.25 then put *opacity into me"></div>`
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("0.75");
	});

});
