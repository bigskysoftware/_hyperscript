import {test, expect} from '../fixtures.js'

test.describe("the focus and blur commands", () => {

	test("can focus an element", async ({html, find, evaluate}) => {
		await html("<input id='i1' /><button _='on click focus #i1'></button>");
		await find('button').dispatchEvent('click');
		var focused = await evaluate(() => document.activeElement.id);
		expect(focused).toBe("i1");
	});

	test("focus with no target focuses me", async ({html, find, evaluate}) => {
		await html("<input id='i1' _='on click focus' />");
		await find('#i1').dispatchEvent('click');
		var focused = await evaluate(() => document.activeElement.id);
		expect(focused).toBe("i1");
	});

	test("can blur an element", async ({html, find, evaluate}) => {
		await html("<input id='i1' _='on focus wait 10ms then blur me' />");
		await find('#i1').focus();
		await find('#i1').evaluate(el => new Promise(r => setTimeout(r, 50)));
		var focused = await evaluate(() => document.activeElement.tagName);
		expect(focused).toBe("BODY");
	});
});
