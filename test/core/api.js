import {test, expect} from '../fixtures.js'

test.describe("_hyperscript API", () => {

	test("processNodes does not reinitialize a node already processed", async ({html, find, evaluate}) => {
		await evaluate(() => window.global_int = 0);
		await html("<div _='on click set window.global_int to window.global_int + 1'></div>");
		expect(await evaluate(() => window.global_int)).toBe(0);
		await find('div').dispatchEvent('click');
		await expect.poll(() => evaluate(() => window.global_int)).toBe(1);
		await evaluate(() => _hyperscript.processNode(document.querySelector('#work-area div')));
		await find('div').dispatchEvent('click');
		await expect.poll(() => evaluate(() => window.global_int)).toBe(2);
	});
});
