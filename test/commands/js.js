import {test, expect} from '../fixtures.js'

test.describe("The (inline) js command", () => {

	test("can run js", async ({html, find, evaluate}) => {
		await evaluate(() => window.testSuccess = false);
		await html('<div _="on click js window.testSuccess = true end"></div>');
		await find('div').dispatchEvent('click');
		expect(await evaluate(() => window.testSuccess)).toBe(true);
	});

	test("can deal with empty input list", async ({html, find, evaluate}) => {
		await evaluate(() => window.testSuccess = false);
		await html('<div _="on click js() window.testSuccess = true end"></div>');
		await find('div').dispatchEvent('click');
		expect(await evaluate(() => window.testSuccess)).toBe(true);
	});

	test("can access values from _hyperscript", async ({html, find, evaluate}) => {
		await evaluate(() => window.testSuccess = false);
		await html("<div _='on click set t to true " + "       then js(t) window.testSuccess = t end'></div>");
		await find('div').dispatchEvent('click');
		expect(await evaluate(() => window.testSuccess)).toBe(true);
	});

	test("can return values to _hyperscript", async ({html, find}) => {
		await html(
			"<div _=\"on click js return 'test success' end " + '        then put it into my.innerHTML"></div>'
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("test success");
	});

	test("can do both of the above", async ({html, find}) => {
		await html(
			'<div _="on click set a to 1 ' +
				"         then js(a) return a + 1 end " +
				'         then put it into my.innerHTML"></div>'
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("2");
	});

	test("handles rejected promises without hanging", async ({html, find}) => {
		await html(
			"<div _='on click js return Promise.reject(\"boom\") end " +
			"catch e put e into my.innerHTML'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("boom");
	});
});
