import {test, expect} from '../fixtures.js'

test.describe("the log command", () => {

	test("can log single item", async ({html, find}) => {
		await html("<div _='on click log me'></div>");
		await find('div').dispatchEvent('click');
	});

	test("can log multiple items", async ({html, find}) => {
		await html("<div _='on click log me, my'></div>");
		await find('div').dispatchEvent('click');
	});

	test("can log multiple items with debug", async ({html, find}) => {
		await html("<div _='on click log me, my with console.debug'></div>");
		await find('div').dispatchEvent('click');
	});

	test("can log multiple items with error", async ({html, find}) => {
		await html("<div _='on click log me, my with console.error'></div>");
		await find('div').dispatchEvent('click');
	});
});
