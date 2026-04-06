import {test, expect} from '../fixtures.js'

test.describe("the append command", () => {

	test("can append a string to another string", async ({html, find}) => {
		await html(`<div _="on click
                            set value to 'Hello there.' then
                            append ' General Kenobi.' to value then
                            set my.innerHTML to value"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("Hello there. General Kenobi.");
	});

	test("can append a value into an array", async ({html, find}) => {
		await html(`<div _="on click
                            set value to [1,2,3]
                            append 4 to value
                            set my.innerHTML to value as String"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("1,2,3,4");
	});

	test("can append a value to 'it'", async ({html, find}) => {
		await html(`<div _="on click
                            set result to [1,2,3]
                            append 4
                            put it as String into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("1,2,3,4");
	});

	test("can append a value to a DOM node", async ({html, find}) => {
		await html(`<div _="on click
                            append '<span>This is my inner HTML</span>' to me
                            append '<b>With Tags</b>' to me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("This is my inner HTMLWith Tags");
	});

	test("can append a value to a DOM element", async ({html, find}) => {
		await html(`<div id="content" _="on click
                            append 'Content' to #content"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("Content");
	});

	test("can append a value to I", async ({html, find}) => {
		await html(`<div _="on click
                            append 'Content' to I"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("Content");
	});

	test("can append a value to an object property", async ({html, find, evaluate}) => {
		await html(`<div id="id" _="on click append '_new' to my id"></div>`);
		await find('div').dispatchEvent('click');
		const id = await evaluate(() => document.querySelector('#work-area div').id);
		expect(id).toBe("id_new");
	});

	test("multiple appends work", async ({html, find}) => {
		await html(`<div id="id" _="on click get 'foo' then append 'bar' then append 'doh' then append it to me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("foobardoh");
	});

	test("append to undefined ignores the undefined", async ({html, find}) => {
		await html(`<div id="id" _="on click append 'bar' then append it to me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("bar");
	});

	test("append preserves existing content rather than overwriting it", async ({html, find, evaluate}) => {
		await html(`<div _="on click append '<a>New Content</a>' to me"><button id="btn1">Click Me</button></div>`);
		await evaluate(() => {
			window.clicks = 0;
			document.querySelector('#btn1').addEventListener('click', () => { window.clicks++; });
		});
		await evaluate(() => document.querySelector('#btn1').click());
		expect(await evaluate(() => window.clicks)).toBe(1);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toContainText("New Content");
		await evaluate(() => document.querySelector('#btn1').click());
		const parentMatch = await evaluate(() => document.querySelector('#btn1').parentNode === document.querySelector('#work-area div'));
		expect(parentMatch).toBe(true);
	});

	test("new content added by append will be live", async ({html, find, evaluate}) => {
		await html("<div _=\"on click append `<button id='b1' _='on click increment window.temp'>Test</button>` to me\"></div>");
		await find('div').dispatchEvent('click');
		await find('#b1').dispatchEvent('click');
		await expect.poll(() => evaluate(() => window.temp)).toBe(1);
	});

	test("new DOM content added by append will be live", async ({html, find, evaluate}) => {
		await html(`<div _="on click make a <span.topping/> then append it to me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('span.topping')).toHaveCount(1);
		await expect(find('span.topping')).toHaveClass(/topping/);
	});

	test("can append a value to a set", async ({html, find}) => {
		await html(`<div _="on click
		                      set :s to [1,2] as Set
		                      append 3 to :s
		                      append 1 to :s
		                      put :s.size into me"></div>`);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("3");
	});

});
