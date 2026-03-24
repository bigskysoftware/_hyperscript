import {test, expect} from '../fixtures.js'

test.describe("the trigger command", () => {

	test("can trigger events", async ({html, find}) => {
		await html(
			"<div _='on click trigger foo end" + "                          on foo add .foo-set end'></div>"
		);
		await expect(find('div')).not.toHaveClass(/foo-set/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo-set/);
	});

	test("can trigger events with args", async ({html, find}) => {
		await html(
			"<div _='on click trigger foo(x:42) end" +
				"                          on foo(x) put x into my.innerHTML'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("42");
	});

	test("can trigger events with dots", async ({html, find}) => {
		await html(
			"<div _='on click trigger foo.bar end" + "                          on foo.bar add .foo-set end'></div>"
		);
		await expect(find('div')).not.toHaveClass(/foo-set/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo-set/);
	});

	test("can trigger events with dots with args", async ({html, find}) => {
		await html(
			"<div _='on click trigger foo.bar(x:42) end" +
				"                          on foo.bar(x) put x into my.innerHTML'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("42");
	});

	test("can trigger events with colons", async ({html, find}) => {
		await html(
			"<div _='on click trigger foo:bar end" + "                          on foo:bar add .foo-set end'></div>"
		);
		await expect(find('div')).not.toHaveClass(/foo-set/);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveClass(/foo-set/);
	});

	test("can trigger events with dots with colons", async ({html, find}) => {
		await html(
			"<div _='on click trigger foo:bar(x:42) end" +
				"                          on foo:bar(x) put x into my.innerHTML'></div>"
		);
		await find('div').dispatchEvent('click');
		await expect(find('div')).toHaveText("42");
	});
});
